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

function SectionHeading({ children }: { children: string }) {
  if (!children.trim()) return null;

  return (
    <h2 className="border-b border-[color:var(--tpl-accent)] pb-0.5 text-[length:var(--tpl-heading-size)] font-bold text-[color:var(--tpl-accent)] [font-family:var(--tpl-heading)]">
      {children}
    </h2>
  );
}

function TimelineBody({ entries }: { entries: TimelineEntry[] }) {
  return (
    <>
      {visibleEntries(entries).map((entry) => {
        const bullets = visibleBullets(entry);
        const dates = formatDateRange(entry);

        return (
          <div key={entry.id} className="mt-2">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[length:calc(var(--tpl-body-size)_+_1pt)] font-bold text-zinc-900 [font-family:var(--tpl-heading)]">
                {entry.title}
              </h3>
              {dates && (
                <span className="shrink-0 text-[length:var(--tpl-body-size)] text-zinc-700">
                  {dates}
                </span>
              )}
            </div>

            {(entry.subtitle || entry.meta) && (
              <p className="text-[length:var(--tpl-body-size)] text-zinc-800">
                <span className="font-semibold">{entry.subtitle}</span>
                {entry.subtitle && entry.meta && (
                  <span className="text-zinc-500"> | </span>
                )}
                {entry.meta}
              </p>
            )}

            {entry.description.trim() && (
              <p className="mt-0.5 whitespace-pre-line text-[length:var(--tpl-body-size)] leading-snug text-zinc-800">
                {entry.description}
              </p>
            )}

            {entry.url.trim() && (
              <p className="break-all text-[length:var(--tpl-body-size)]">
                <a
                  href={urlHref(entry.url)}
                  className="text-[color:var(--tpl-accent)] underline"
                >
                  {urlText(entry.url)}
                </a>
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-[length:var(--tpl-body-size)] leading-snug text-zinc-800">
                {bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
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
        <p key={group.id} className="mt-1 text-[length:var(--tpl-body-size)] text-zinc-800">
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
        <p className="mt-1 whitespace-pre-line text-[length:var(--tpl-body-size)] leading-snug text-zinc-800">
          {section.body}
        </p>
      );

    case "list":
      return (
        <ul className="mt-1 list-disc pl-5 text-[length:var(--tpl-body-size)] leading-snug text-zinc-800">
          {visibleListItems(section.items).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
  }
}

export interface ClassicProps {
  document: ResumeDocument;
}

export default function Classic({ document }: ClassicProps) {
  const { profile } = document;
  const contact = contactLines(profile);
  const links = visibleLinks(profile);

  return (
    <>
      <header>
        <h1 className="text-[length:calc(var(--tpl-heading-size)_+_9pt)] font-bold leading-tight text-zinc-900 [font-family:var(--tpl-heading)]">
          {profile.name || "Your name"}
        </h1>
        {profile.title && (
          <p className="text-[length:calc(var(--tpl-body-size)_+_2pt)] text-zinc-700">{profile.title}</p>
        )}

        {contact.length > 0 && (
          <div className="mt-1 text-[length:var(--tpl-body-size)] italic text-zinc-700">
            {contact.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-0.5 text-[length:var(--tpl-body-size)]">
            {links.map((link) => (
              <div key={link.id}>
                <a
                  href={urlHref(link.url)}
                  className="text-[color:var(--tpl-accent)] underline"
                >
                  {linkText(link)}
                </a>
              </div>
            ))}
          </div>
        )}
      </header>

      {visibleSections(document.sections).map((section) => (
        <section key={section.id} className="mt-4">
          <SectionHeading>{section.heading}</SectionHeading>
          <SectionBody section={section} />
        </section>
      ))}
    </>
  );
}
