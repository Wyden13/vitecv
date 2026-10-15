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
 * Classic — single column, rules under headings, no graphics.
 *
 * The conservative, ATS-safe default. Type sizes are in points because the
 * page is a real 8.5×11in sheet, so they mean the same thing on screen and on
 * paper. Colour is confined to the heading rules and links, which keeps the
 * layout readable when an accent is printed in greyscale.
 */

function TimelineSection({
  heading,
  entries,
}: {
  heading: string;
  entries: TimelineEntry[];
}) {
  const visible = visibleEntries(entries);
  if (visible.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="border-b border-[color:var(--tpl-accent)] pb-0.5 text-[13pt] font-bold text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
        {heading}
      </h2>

      {visible.map((entry) => {
        const bullets = visibleBullets(entry);
        const dates = formatDateRange(entry);

        return (
          <div key={entry.id} className="mt-2">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[11pt] font-bold text-zinc-900 [font-family:var(--tpl-heading)]">
                {entry.title}
              </h3>
              {dates && (
                <span className="shrink-0 text-[10pt] text-zinc-700">
                  {dates}
                </span>
              )}
            </div>

            {(entry.subtitle || entry.meta) && (
              <p className="text-[10pt] text-zinc-800">
                <span className="font-semibold">{entry.subtitle}</span>
                {entry.subtitle && entry.meta && (
                  <span className="text-zinc-500"> | </span>
                )}
                {entry.meta}
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-[10pt] leading-snug text-zinc-800">
                {bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

export interface ClassicProps {
  document: ResumeDocument;
}

export default function Classic({ document }: ClassicProps) {
  const { profile, skills } = document;
  const contact = contactLines(profile);
  const links = visibleLinks(profile);

  const renderSection = (kind: SectionKind) => {
    const heading = SECTION_LABELS[kind].title;

    switch (kind) {
      case "profile":
        return (
          <header key={kind}>
            <h1 className="text-[22pt] font-bold leading-tight text-zinc-900 [font-family:var(--tpl-heading)]">
              {profile.name || "Your name"}
            </h1>
            {profile.title && (
              <p className="text-[12pt] text-zinc-700">{profile.title}</p>
            )}

            {contact.length > 0 && (
              <div className="mt-1 text-[10pt] italic text-zinc-700">
                {contact.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-0.5 text-[10pt]">
                {links.map((link) => (
                  <div key={link.id}>
                    <a
                      href={link.url}
                      className="text-[color:var(--tpl-accent)] underline"
                    >
                      {linkText(link)}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </header>
        );

      case "skills": {
        const groups = visibleSkillGroups(skills);
        if (groups.length === 0) return null;

        return (
          <section key={kind} className="mt-4">
            <h2 className="border-b border-[color:var(--tpl-accent)] pb-0.5 text-[13pt] font-bold text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
              {heading}
            </h2>
            {groups.map((group) => (
              <p key={group.id} className="mt-1 text-[10pt] text-zinc-800">
                {group.group && (
                  <span className="font-bold">{group.group}: </span>
                )}
                {skillItems(group)}
              </p>
            ))}
          </section>
        );
      }

      default:
        return (
          <TimelineSection
            key={kind}
            heading={heading}
            entries={document[kind]}
          />
        );
    }
  };

  return <>{document.sectionOrder.map(renderSection)}</>;
}
