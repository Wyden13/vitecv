import type {
  ResumeDocument,
  ResumeSection,
  SkillsSection,
  TimelineEntry,
} from "@/libs/resume/resumeSchema";
import {
  contactLines,
  formatDateRange,
  linkText,
  skillItems,
  urlHref,
  urlText,
  visibleBullets,
  visibleEntries,
  visibleLinks,
  visibleListItems,
  visibleSections,
  visibleSkillGroups,
} from "./shared";

/**
 * Modern — tinted sidebar for identity and skills, main column for history.
 *
 * The sidebar runs full-bleed to the paper edge, so the registry entry zeroes
 * `.doc-page`'s padding (`--page-pad-*`) and this supplies its own insets per
 * column. `print-color-adjust` keeps the tint from being dropped by browsers
 * that strip backgrounds when printing.
 *
 * The split is by layout, not by heading: the sidebar takes every `skills`
 * section — so an added "Languages" lands there without this file knowing the
 * heading exists — and the main column takes everything else in document
 * order.
 */

function MainHeading({ children }: { children: string }) {
  if (!children.trim()) return null;

  return (
    <>
      <h2 className="text-[length:calc(var(--tpl-heading-size)_-_2pt)] font-bold uppercase tracking-[0.12em] text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
        {children}
      </h2>
      <div className="mt-1 h-px bg-zinc-200" />
    </>
  );
}

function TimelineBody({ entries }: { entries: TimelineEntry[] }) {
  return (
    <>
      {visibleEntries(entries).map((entry) => {
        const bullets = visibleBullets(entry);
        const dates = formatDateRange(entry);

        return (
          <div key={entry.id} className="mt-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[length:calc(var(--tpl-body-size)_+_1pt)] font-semibold text-zinc-900 [font-family:var(--tpl-heading)]">
                {entry.title}
              </h3>
              {dates && (
                <span className="shrink-0 text-[length:calc(var(--tpl-body-size)_-_1pt)] tabular-nums text-zinc-500">
                  {dates}
                </span>
              )}
            </div>

            {(entry.subtitle || entry.meta) && (
              <p className="text-[length:calc(var(--tpl-body-size)_-_0.5pt)] text-zinc-600">
                {entry.subtitle}
                {entry.subtitle && entry.meta && " · "}
                {entry.meta}
              </p>
            )}

            {entry.description.trim() && (
              <p className="mt-1 whitespace-pre-line text-[length:calc(var(--tpl-body-size)_-_0.5pt)] leading-snug text-zinc-800">
                {entry.description}
              </p>
            )}

            {entry.url.trim() && (
              <p className="break-all text-[length:calc(var(--tpl-body-size)_-_0.5pt)]">
                <a
                  href={urlHref(entry.url)}
                  className="text-[color:var(--tpl-accent)] underline"
                >
                  {urlText(entry.url)}
                </a>
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1 text-[length:calc(var(--tpl-body-size)_-_0.5pt)] leading-snug text-zinc-800">
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
    </>
  );
}

/** Bulleted list, sharing the accent dot the timeline bullets use. */
function ListBody({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-[length:calc(var(--tpl-body-size)_-_0.5pt)] leading-snug text-zinc-800">
      {visibleListItems(items).map((item, index) => (
        <li key={index} className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[0.45em] size-[3px] shrink-0 rounded-full bg-[color:var(--tpl-accent)]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MainSection({ section }: { section: ResumeSection }) {
  return (
    <section className="mt-5 first:mt-0">
      <MainHeading>{section.heading}</MainHeading>

      {section.layout === "timeline" && (
        <TimelineBody entries={section.entries} />
      )}
      {section.layout === "list" && <ListBody items={section.items} />}
      {section.layout === "text" && (
        <p className="mt-2 whitespace-pre-line text-[length:calc(var(--tpl-body-size)_-_0.5pt)] leading-snug text-zinc-800">
          {section.body}
        </p>
      )}
    </section>
  );
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-5 text-[length:calc(var(--tpl-heading-size)_-_4pt)] font-bold uppercase tracking-[0.14em] text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
      {children}
    </h2>
  );
}

function SidebarSkills({ section }: { section: SkillsSection }) {
  return (
    <>
      {section.heading.trim() && (
        <SidebarHeading>{section.heading}</SidebarHeading>
      )}
      <div className="mt-1 space-y-2">
        {visibleSkillGroups(section.groups).map((group) => (
          <div key={group.id} className="text-[length:calc(var(--tpl-body-size)_-_1pt)] leading-snug">
            {group.group && (
              <p className="font-semibold text-zinc-900">{group.group}</p>
            )}
            <p className="text-zinc-700">{skillItems(group)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export interface ModernProps {
  document: ResumeDocument;
}

export default function Modern({ document }: ModernProps) {
  const { profile } = document;
  const contact = contactLines(profile);
  const links = visibleLinks(profile);

  const sections = visibleSections(document.sections);
  const sidebarSections = sections.filter(
    (section): section is SkillsSection => section.layout === "skills",
  );
  const mainSections = sections.filter(
    (section) => section.layout !== "skills",
  );

  return (
    <div className="flex min-h-[11in]">
      <aside
        className="w-[2.5in] shrink-0 bg-[color:var(--tpl-accent-soft)] px-[0.4in] py-[0.5in]"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <h1 className="text-[length:calc(var(--tpl-heading-size)_+_4pt)] font-bold leading-tight text-zinc-900 [font-family:var(--tpl-heading)]">
          {profile.name || "Your name"}
        </h1>
        {profile.title && (
          <p className="mt-0.5 text-[length:var(--tpl-body-size)] leading-snug text-[color:var(--tpl-accent)]">
            {profile.title}
          </p>
        )}

        {contact.length > 0 && (
          <>
            <SidebarHeading>Contact</SidebarHeading>
            <div className="mt-1 space-y-0.5 text-[length:calc(var(--tpl-body-size)_-_1pt)] leading-snug text-zinc-700">
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
            <div className="mt-1 space-y-0.5 text-[length:calc(var(--tpl-body-size)_-_1pt)] leading-snug">
              {links.map((link) => (
                <div key={link.id} className="break-words">
                  <a href={urlHref(link.url)} className="text-zinc-700 underline">
                    {linkText(link)}
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {sidebarSections.map((section) => (
          <SidebarSkills key={section.id} section={section} />
        ))}
      </aside>

      <div className="min-w-0 flex-1 px-[0.5in] py-[0.5in]">
        {mainSections.map((section) => (
          <MainSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
