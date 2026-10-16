import type {
  ResumeDocument,
  ResumeSection,
  SkillGroup,
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

const SEPARATOR = " • ";

function SectionHeading({ children }: { children: string }) {
  // A blank heading is a valid choice — print the content without one.
  if (!children.trim()) return null;

  return (
    <h2 className="text-center text-[length:var(--tpl-heading-size)] font-bold text-zinc-900 [font-family:var(--tpl-heading)]">
      {children}
    </h2>
  );
}

/**
 * Organisation and place on one baseline, role and dates on the next, matching
 * the timeline presets: `title` is the company or school, `meta` the location,
 * `subtitle` the role or programme.
 *
 * An entry with no role — a certificate is just a name and a date — collapses
 * to a single row instead of stranding the date on a line of its own.
 */
function TimelineBody({ entries }: { entries: TimelineEntry[] }) {
  return (
    <>
      {visibleEntries(entries).map((entry) => {
        const bullets = visibleBullets(entry);
        const dates = formatDateRange(entry);
        const subtitle = entry.subtitle.trim();
        const url = entry.url.trim();
        // With no second row to carry them, the dates join `meta` on the first.
        const aside = subtitle
          ? entry.meta
          : [entry.meta, dates].filter(Boolean).join(SEPARATOR);

        return (
          <div key={entry.id} className="mt-2.5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="min-w-0 text-[length:calc(var(--tpl-body-size)_+_1pt)] font-bold text-zinc-900 [font-family:var(--tpl-heading)]">
                {entry.title}
              </h3>
              {aside && (
                // Wraps rather than shrink-0: a tech stack in this slot would
                // otherwise run straight off the right edge of the page.
                <span className="max-w-[55%] text-right text-[length:var(--tpl-body-size)] text-zinc-900">
                  {aside}
                </span>
              )}
            </div>

            {subtitle && (
              <div className="flex items-baseline justify-between gap-4">
                <p className="min-w-0 text-[length:var(--tpl-body-size)] font-bold text-zinc-900">
                  {subtitle}
                </p>
                {dates && (
                  <span className="shrink-0 whitespace-nowrap text-[length:var(--tpl-body-size)] text-zinc-900">
                    {dates}
                  </span>
                )}
              </div>
            )}

            {entry.description.trim() && (
              <p className="mt-0.5 whitespace-pre-line text-justify text-[length:var(--tpl-body-size)] leading-snug text-zinc-900">
                {entry.description}
              </p>
            )}

            {url && (
              <p className="break-all text-[length:var(--tpl-body-size)] text-zinc-900">
                <a
                  href={urlHref(url)}
                  className="text-[color:var(--tpl-accent)] underline"
                >
                  {urlText(url)}
                </a>
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-0.5 list-disc pl-5 text-[length:var(--tpl-body-size)] leading-snug text-zinc-900">
                {bullets.map((bullet, index) => (
                  <li key={index} className="text-justify">
                    {bullet}
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

function SkillsBody({ groups }: { groups: SkillGroup[] }) {
  return (
    <>
      {visibleSkillGroups(groups).map((group) => (
        <p
          key={group.id}
          className="mt-0.5 text-[length:var(--tpl-body-size)] text-zinc-900"
        >
          {group.group && <span className="font-bold">{group.group}: </span>}
          {skillItems(group)}
        </p>
      ))}
    </>
  );
}

function SectionBody({ section }: { section: ResumeSection }) {
  switch (section.layout) {
    case "timeline":
      return <TimelineBody entries={section.entries} />;

    case "skills":
      return <SkillsBody groups={section.groups} />;

    case "text":
      return (
        <p className="mt-1 whitespace-pre-line text-justify text-[length:var(--tpl-body-size)] leading-snug text-zinc-900">
          {section.body}
        </p>
      );

    case "list":
      return (
        <ul className="mt-1 list-disc pl-5 text-[length:var(--tpl-body-size)] leading-snug text-zinc-900">
          {visibleListItems(section.items).map((item, index) => (
            <li key={index} className="text-justify">
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

export interface HarvardProps {
  document: ResumeDocument;
}

export default function Harvard({ document }: HarvardProps) {
  const { profile } = document;
  const contact = [
    ...contactLines(profile),
    ...visibleLinks(profile).map(linkText),
  ];

  return (
    <>
      <header className="text-center">
        <h1 className="text-[length:var(--tpl-heading-size)] font-bold leading-tight text-zinc-900 [font-family:var(--tpl-heading)]">
          {profile.name || "Your name"}
        </h1>
        {profile.title && (
          <p className="text-[length:var(--tpl-body-size)] text-zinc-900">
            {profile.title}
          </p>
        )}

        <hr className="mt-1 border-t border-[color:var(--tpl-accent)]" />

        {contact.length > 0 && (
          <p className="mt-2 text-[length:var(--tpl-body-size)] text-zinc-900">
            {contact.join(SEPARATOR)}
          </p>
        )}
      </header>

      {visibleSections(document.sections).map((section) => (
        <section key={section.id} className="mt-5">
          <SectionHeading>{section.heading}</SectionHeading>
          <SectionBody section={section} />
        </section>
      ))}
    </>
  );
}
