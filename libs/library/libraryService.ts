import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/libs/firebase/firebase";
import {
  createEmptyProfile,
  normalizeProfile,
  type ResumeDocument,
  type ResumeProfile,
} from "@/libs/resume/resumeSchema";
import {
  libraryItemHasContent,
  libraryKeyForPreset,
  normalizeLibraryItem,
  normalizeLibrarySection,
  type LibraryItem,
  type LibraryItemInput,
  type LibrarySectionInput,
  type LibrarySectionMeta,
} from "./librarySchema";

/**
 * The library spans three paths, all under the signed-in user and all read and
 * written straight from the browser like every other document in this app:
 *
 *   users/{uid}/library/profile        the single profile document
 *   users/{uid}/librarySections/{id}   user-defined sections (built-ins are config)
 *   users/{uid}/libraryItems/{id}      every item, tagged with its sectionKey
 *
 * The recursive `users/{uid}/{document=**}` rule in `firestore.rules` already
 * covers all three, so there is nothing to add there. Items are ordered by a
 * single `order` field, which Firestore indexes automatically — no composite
 * index, and nothing to add to `firestore.indexes.json` either.
 */

function profileDoc(userId: string) {
  return doc(db, "users", userId, "library", "profile");
}

function sectionsCollection(userId: string) {
  return collection(db, "users", userId, "librarySections");
}

function sectionDoc(userId: string, sectionId: string) {
  return doc(db, "users", userId, "librarySections", sectionId);
}

function itemsCollection(userId: string) {
  return collection(db, "users", userId, "libraryItems");
}

function itemDoc(userId: string, itemId: string) {
  return doc(db, "users", userId, "libraryItems", itemId);
}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | null | undefined)?.toDate() ?? null;
}

/* profile -- */

export function subscribeToLibraryProfile(
  userId: string,
  handlers: {
    onData: (profile: ResumeProfile) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    profileDoc(userId),
    (snapshot) => {
      handlers.onData(
        snapshot.exists()
          ? normalizeProfile(snapshot.data())
          : createEmptyProfile(),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function saveLibraryProfile(
  userId: string,
  profile: ResumeProfile,
): Promise<void> {
  await setDoc(
    profileDoc(userId),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * the resume editor use "use library profile" action to read and fill the profile once.
 * The subscription stays for the library page which wants live update.
 *
 */
export async function getLibraryProfile(
  userId: string,
): Promise<ResumeProfile | null> {
  const snapshot = await getDoc(profileDoc(userId));

  return snapshot.exists() ? normalizeProfile(snapshot.data()) : null;
}

/* -- sections -- */

export function subscribeToLibrarySections(
  userId: string,
  handlers: {
    onData: (sections: LibrarySectionMeta[]) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    query(sectionsCollection(userId), orderBy("order")),
    (snapshot) => {
      handlers.onData(
        snapshot.docs
          .map((entry) => normalizeLibrarySection(entry.id, entry.data()))
          .filter((section): section is LibrarySectionMeta => section !== null),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function createLibrarySection(
  userId: string,
  input: LibrarySectionInput,
): Promise<string> {
  const created = await addDoc(sectionsCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function updateLibrarySection(
  userId: string,
  sectionId: string,
  patch: Partial<LibrarySectionInput>,
): Promise<void> {
  await updateDoc(sectionDoc(userId, sectionId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Takes the section's items with it — an orphaned item is unreachable. */
export async function deleteLibrarySection(
  userId: string,
  sectionId: string,
): Promise<void> {
  const owned = await getDocs(
    query(itemsCollection(userId), where("sectionKey", "==", sectionId)),
  );

  const batch = writeBatch(db);
  owned.docs.forEach((entry) => batch.delete(entry.ref));
  batch.delete(sectionDoc(userId, sectionId));
  await batch.commit();
}

/* ---------------------------------------------------------------- items -- */

export function subscribeToLibraryItems(
  userId: string,
  handlers: {
    onData: (items: LibraryItem[]) => void;
    onError: (error: Error) => void;
  },
): Unsubscribe {
  return onSnapshot(
    query(itemsCollection(userId), orderBy("order")),
    (snapshot) => {
      handlers.onData(
        snapshot.docs
          .map((entry) => {
            const data = entry.data({ serverTimestamps: "estimate" });

            return normalizeLibraryItem(
              entry.id,
              data,
              toDate(data.updatedAt),
            );
          })
          .filter((item): item is LibraryItem => item !== null),
      );
    },
    (error) => handlers.onError(error),
  );
}

export async function createLibraryItem(
  userId: string,
  input: LibraryItemInput,
): Promise<string> {
  const created = await addDoc(itemsCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function updateLibraryItem(
  userId: string,
  itemId: string,
  input: LibraryItemInput,
): Promise<void> {
  await updateDoc(itemDoc(userId, itemId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLibraryItem(
  userId: string,
  itemId: string,
): Promise<void> {
  await deleteDoc(itemDoc(userId, itemId));
}

/**
 * Rewrites `order` for one section's items after a drag. No optimistic state is
 * needed to keep the row from snapping back: the Firestore client SDK applies
 * local writes immediately and `onSnapshot` fires with them still pending, so
 * the subscription stays the only source of truth — as everywhere else here.
 */
export async function reorderLibraryItems(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  const batch = writeBatch(db);

  orderedIds.forEach((id, index) => {
    batch.update(itemDoc(userId, id), { order: index });
  });

  await batch.commit();
}

/* --------------------------------------------------------------- import -- */

/**
 * A recognised preset with no built-in library section — Projects, Awards,
 * Languages — becomes a section of its own that keeps its preset id, so it
 * still edits with the right field labels instead of collapsing into a
 * generic custom block.
 */

function itemsFromSection(
  section: ResumeDocument["sections"][number],
  sectionKey: string,
): LibraryItemInput[] {
  switch (section.layout) {
    case "timeline":
      return section.entries.map((entry) => ({
        sectionKey,
        order: 0,
        layout: "timeline" as const,
        entry,
      }));

    case "skills":
      return section.groups.map((group) => ({
        sectionKey,
        order: 0,
        layout: "skills" as const,
        group,
      }));

    case "text":
      return [
        { sectionKey, order: 0, layout: "text" as const, body: section.body },
      ];

    case "list":
      return [
        { sectionKey, order: 0, layout: "list" as const, items: section.items },
      ];
  }
}

function profileHasContent(profile: ResumeProfile): boolean {
  return Boolean(
    profile.name.trim() ||
      profile.title.trim() ||
      profile.email.trim() ||
      profile.phone.trim() ||
      profile.location.trim() ||
      profile.links.length,
  );
}

export interface LibraryImportResult {
  items: number;
  sections: number;
}

/**
 * Copies a resume into the library, appending rather than replacing: existing
 * items keep their place and imported ones are ordered after them. One batch,
 * so a half-finished import cannot be left behind. A resume large enough to
 * exceed the 500-write batch limit would need chunking, which no realistic
 * document comes close to.
 */
export async function importLibraryFromResume(
  userId: string,
  document: ResumeDocument,
  options: { sections: LibrarySectionMeta[] },
): Promise<LibraryImportResult> {
  const existing = await getDocs(itemsCollection(userId));

  // Where each section's run of imported items should start.
  const nextOrder = new Map<string, number>();
  existing.docs.forEach((entry) => {
    const data = entry.data();
    const key = typeof data.sectionKey === "string" ? data.sectionKey : "";
    const order = typeof data.order === "number" ? data.order : 0;
    if (key) nextOrder.set(key, Math.max(nextOrder.get(key) ?? 0, order + 1));
  });

  const batch = writeBatch(db);
  let createdItems = 0;
  let createdSections = 0;
  let sectionOrder = options.sections.length;

  if (profileHasContent(document.profile)) {
    batch.set(
      profileDoc(userId),
      { ...document.profile, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  for (const section of document.sections) {
    let sectionKey = libraryKeyForPreset(section.presetId);

    if (!sectionKey) {
      // Reuse a custom section the user already has for this preset rather
      // than stacking up duplicates when the import is run twice.
      const reusable = options.sections.find(
        (candidate) =>
          candidate.presetId === section.presetId &&
          candidate.layout === section.layout,
      );

      if (reusable) {
        sectionKey = reusable.id;
      } else {
        const created = doc(sectionsCollection(userId));
        batch.set(created, {
          heading: section.heading,
          presetId: section.presetId,
          layout: section.layout,
          order: sectionOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        sectionKey = created.id;
        sectionOrder += 1;
        createdSections += 1;
      }
    }

    for (const input of itemsFromSection(section, sectionKey)) {
      if (!libraryItemHasContent(input)) continue;

      const order = nextOrder.get(sectionKey) ?? 0;
      nextOrder.set(sectionKey, order + 1);

      batch.set(doc(itemsCollection(userId)), {
        ...input,
        order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdItems += 1;
    }
  }

  await batch.commit();

  return { items: createdItems, sections: createdSections };
}
