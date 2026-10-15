import type {
  ResumeDocument,
  SectionKind,
  TimelineEntry,
} from "@/libs/resumeSchema";
import { SECTION_LABELS } from "@/libs/resumeSchema";
import {
  contactLines,
  formatDateRange,
  linkText,
  skillItems,
  visibleBullets,
  visibleEntries,
  visibleLinks,
  visibleSkillGroups,
} from "./shared";

/**
 * Modern — tinted sidebar for identity and skills, main column for history.
 *
 * The sidebar runs full-bleed to the paper edge, so the registry entry zeroes
 * `.doc-page`'s padding (`--page-pad-*`) and this supplies its own insets per
 * column. `print-color-adjust` keeps the tint from being dropped by browsers
 * that strip backgrounds when printing.
 */

function MainSection({
  heading,
  entries,
}: {
  heading: string;
  entries: TimelineEntry[];
}) {
  const visible = visibleEntries(entries);
  if (visible.length === 0) return null;

  return (
    <section className="mt-5 first:mt-0">
      <h2 className="text-[11pt] font-bold uppercase tracking-[0.12em] text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
        {heading}
      </h2>
      <div className="mt-1 h-px bg-zinc-200" />

      {visible.map((entry) => {
        const bullets = visibleBullets(entry);
        const dates = formatDateRange(entry);

        return (
          <div key={entry.id} className="mt-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[11pt] font-semibold text-zinc-900 [font-family:var(--tpl-heading)]">
                {entry.title}
              </h3>
              {dates && (
                <span className="shrink-0 text-[9pt] tabular-nums text-zinc-500">
                  {dates}
                </span>
              )}
            </div>

            {(entry.subtitle || entry.meta) && (
              <p className="text-[9.5pt] text-zinc-600">
                {entry.subtitle}
                {entry.subtitle && entry.meta && " · "}
                {entry.meta}
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1 text-[9.5pt] leading-snug text-zinc-800">
                {bullets.map((bullet, index) => (
                  <li key={index} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-[0.45em] size-[3px] shrink-0 rounded-full bg-[color:var(--tpl-accent)]"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-5 text-[9pt] font-bold uppercase tracking-[0.14em] text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
      {children}
    </h2>
  );
}

export interface ModernProps {
  document: ResumeDocument;
}

export default function Modern({ document }: ModernProps) {
  const { profile, skills } = document;
  const contact = contactLines(profile);
  const links = visibleLinks(profile);
  const skillGroups = visibleSkillGroups(skills);

  // The sidebar owns identity and skills; the main column takes the rest in
  // whatever order the editor put them.
  const mainOrder = document.sectionOrder.filter(
    (kind): kind is Exclude<SectionKind, "profile" | "skills"> =>
      kind !== "profile" && kind !== "skills",
  );

  return (
    <div className="flex min-h-[11in]">
      <aside
        className="w-[2.5in] shrink-0 bg-[color:var(--tpl-accent-soft)] px-[0.4in] py-[0.5in]"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <h1 className="text-[17pt] font-bold leading-tight text-zinc-900 [font-family:var(--tpl-heading)]">
          {profile.name || "Your name"}
        </h1>
        {profile.title && (
          <p className="mt-0.5 text-[10pt] leading-snug text-[color:var(--tpl-accent)]">
            {profile.title}
          </p>
        )}

        {contact.length > 0 && (
          <>
            <SidebarHeading>Contact</SidebarHeading>
            <div className="mt-1 space-y-0.5 text-[9pt] leading-snug text-zinc-700">
              {contact.map((item) => (
                <div key={item} className="break-words">
                  {item}
                </div>
              ))}
            </div>
          </>
        )}

        {links.length > 0 && (
          <>
            <SidebarHeading>Links</SidebarHeading>
            <div className="mt-1 space-y-0.5 text-[9pt] leading-snug">
              {links.map((link) => (
                <div key={link.id} className="break-words">
                  <a href={link.url} className="text-zinc-700 underline">
                    {linkText(link)}
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {skillGroups.length > 0 && (
          <>
            <SidebarHeading>{SECTION_LABELS.skills.title}</SidebarHeading>
            <div className="mt-1 space-y-2">
              {skillGroups.map((group) => (
                <div key={group.id} className="text-[9pt] leading-snug">
                  {group.group && (
                    <p className="font-semibold text-zinc-900">{group.group}</p>
                  )}
                  <p className="text-zinc-700">{skillItems(group)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      <div className="min-w-0 flex-1 px-[0.5in] py-[0.5in]">
        {mainOrder.map((kind) => (
          <MainSection
            key={kind}
            heading={SECTION_LABELS[kind].title}
            entries={document[kind]}
          />
        ))}
      </div>
    </div>
  );
}
