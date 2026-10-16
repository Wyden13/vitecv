import { sectionHasContent } from "@/components/resume/templates/shared";
import {
  DEFAULT_COVER_LETTER_TEMPLATE,
  type CoverLetterDocument,
} from "@/libs/coverletter/coverLetterSchema";
import {
  DEFAULT_RESUME_TEMPLATE,
  type ResumeDocument,
} from "../libs/resume/resumeSchema";
import { DEFAULT_THEME } from "../libs/templateTheme";

/**
 * Stand-in content for template previews.
 *
 * The gallery has to show what a template looks like before any resume
 * exists, and uploads only store raw text today — nothing populates a
 * document automatically — so without a fixture every thumbnail would be a
 * blank sheet. Fictional throughout.
 *
 * It carries one section of every layout, so a thumbnail exercises all four
 * rather than only the dated kind.
 */

export const SAMPLE_RESUME: ResumeDocument = {
  profile: {
    name: "Avery Lin",
    title: "Senior Frontend Engineer",
    email: "avery.lin@example.com",
    phone: "(415) 555-0132",
    location: "San Francisco, CA",
    links: [
      { id: "s-link-1", label: "averylin.dev", url: "https://averylin.dev" },
      {
        id: "s-link-2",
        label: "github.com/averylin",
        url: "https://github.com/averylin",
      },
    ],
  },
  sections: [
    {
      id: "s-sec-summary",
      presetId: "summary",
      heading: "Summary",
      layout: "text",
      body: "Frontend engineer with seven years on data-heavy products, happiest where design systems meet performance work.",
    },
    {
      id: "s-sec-skills",
      presetId: "technical-skills",
      heading: "Technical Skills",
      layout: "skills",
      groups: [
        {
          id: "s-skill-1",
          group: "Languages",
          items: ["TypeScript", "JavaScript", "Python", "SQL"],
        },
        {
          id: "s-skill-2",
          group: "Frameworks",
          items: ["React", "Next.js", "Node.js", "Tailwind CSS"],
        },
        {
          id: "s-skill-3",
          group: "Tooling",
          items: ["Playwright", "Vitest", "Figma", "Firebase"],
        },
      ],
    },
    {
      id: "s-sec-experience",
      presetId: "experience",
      heading: "Experience",
      layout: "timeline",
      entries: [
        {
          id: "s-exp-1",
          title: "Senior Frontend Engineer",
          subtitle: "Northwind Labs",
          meta: "React · TypeScript",
          start: "Mar 2021",
          end: "Present",
          description: "",
          url: "",
          bullets: [
            "Led the rebuild of the customer dashboard, cutting time-to-interactive from 4.2s to 1.1s.",
            "Introduced a shared component library now used by four product teams.",
            "Mentored three engineers through promotion to mid-level.",
          ],
        },
        {
          id: "s-exp-2",
          title: "Frontend Engineer",
          subtitle: "Harbor Analytics",
          meta: "Vue · D3",
          start: "Jul 2018",
          end: "Feb 2021",
          description: "",
          url: "",
          bullets: [
            "Built the charting layer behind the reporting suite, used daily by 12,000 analysts.",
            "Cut bundle size 38% by replacing the charting dependency with focused D3 modules.",
          ],
        },
      ],
    },
    {
      id: "s-sec-projects",
      presetId: "projects",
      heading: "Projects",
      layout: "timeline",
      entries: [
        {
          id: "s-proj-1",
          title: "Tideline",
          subtitle: "Open-source scheduling toolkit",
          meta: "",
          start: "2022",
          end: "",
          description:
            "TypeScript, Vite and Playwright. 1.2k stars and 40 contributors.",
          url: "https://github.com/avery-lin/tideline",
          bullets: [
            "Timezone-aware recurring event engine with a 60kb runtime footprint.",
          ],
        },
      ],
    },
    {
      id: "s-sec-education",
      presetId: "education",
      heading: "Education",
      layout: "timeline",
      entries: [
        {
          id: "s-edu-1",
          title: "B.S. Computer Science",
          subtitle: "University of Washington",
          meta: "GPA 3.8",
          start: "2014",
          end: "2018",
          description: "",
          url: "",
          bullets: [],
        },
      ],
    },
    {
      id: "s-sec-certificates",
      presetId: "certificates",
      heading: "Certificates",
      layout: "timeline",
      entries: [
        {
          id: "s-cert-1",
          title: "Professional Cloud Architect",
          subtitle: "Google Cloud",
          meta: "",
          start: "2023",
          end: "",
          description: "",
          url: "https://credential.net/avery-lin-pca",
          bullets: [],
        },
      ],
    },
    {
      id: "s-sec-interests",
      presetId: "interests",
      heading: "Interests",
      layout: "list",
      items: ["Trail running", "Film photography", "Teaching Python to kids"],
    },
  ],
  templateId: DEFAULT_RESUME_TEMPLATE,
  theme: { ...DEFAULT_THEME },
};

/**
 * True when nothing has been typed yet. Previews fall back to the sample so a
 * brand-new resume does not show a wall of blank pages.
 *
 * A new resume starts with empty Education, Experience and Skills sections, so
 * this has to judge content rather than count sections — `sectionHasContent`
 * is the same test the templates use to decide what to print.
 */
export function isResumeEmpty(document: ResumeDocument): boolean {
  return (
    !document.profile.name.trim() &&
    !document.profile.title.trim() &&
    !document.sections.some(sectionHasContent)
  );
}

export const SAMPLE_COVER_LETTER: CoverLetterDocument = {
  sender: {
    name: "Avery Lin",
    title: "Senior Frontend Engineer",
    email: "avery.lin@example.com",
    phone: "(415) 555-0132",
    location: "San Francisco, CA",
  },
  recipient: {
    name: "Dana Okonjo",
    title: "Engineering Manager",
    company: "Meridian Software",
    address: "480 Bryant Street\nSan Francisco, CA 94107",
  },
  date: "14 October 2026",
  subject: "Application for Senior Frontend Engineer",
  salutation: "Dear Ms. Okonjo,",
  body: [
    "I am writing to apply for the Senior Frontend Engineer role at Meridian Software. Over the past five years I have specialised in making large React applications fast enough that people stop noticing them, and your recent work on collaborative editing is exactly the kind of problem I want to be close to.",
    "At Northwind Labs I led the rebuild of our customer dashboard, bringing time-to-interactive from 4.2 seconds to 1.1 and holding it there with budgets enforced in CI. That work meant shipping a shared component library now used by four product teams, which taught me as much about writing documentation other engineers will actually read as it did about rendering performance.",
    "What draws me to Meridian specifically is the decision to treat the editor as a product surface rather than a feature. I would welcome the chance to talk about how I could help.",
  ],
  closing: "Sincerely,",
  signature: "Avery Lin",
  templateId: DEFAULT_COVER_LETTER_TEMPLATE,
  theme: { ...DEFAULT_THEME },
};

/** Letter counterpart to `isResumeEmpty`. */
export function isCoverLetterEmpty(document: CoverLetterDocument): boolean {
  return (
    !document.sender.name.trim() &&
    !document.recipient.company.trim() &&
    !document.subject.trim() &&
    document.body.length === 0
  );
}
