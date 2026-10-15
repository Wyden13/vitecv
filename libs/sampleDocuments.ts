import {
  DEFAULT_RESUME_TEMPLATE,
  type ResumeDocument,
} from "./resumeSchema";
import { DEFAULT_THEME } from "./templateTheme";

/**
 * Stand-in content for template previews.
 *
 * The gallery has to show what a template looks like before any resume
 * exists, and uploads only store raw text today — nothing populates a
 * document automatically — so without a fixture every thumbnail would be a
 * blank sheet. Fictional throughout.
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
  education: [
    {
      id: "s-edu-1",
      title: "B.S. Computer Science",
      subtitle: "University of Washington",
      meta: "GPA 3.8",
      start: "2014",
      end: "2018",
      bullets: [],
    },
  ],
  skills: [
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
  experience: [
    {
      id: "s-exp-1",
      title: "Senior Frontend Engineer",
      subtitle: "Northwind Labs",
      meta: "React · TypeScript",
      start: "Mar 2021",
      end: "Present",
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
      bullets: [
        "Built the charting layer behind the reporting suite, used daily by 12,000 analysts.",
        "Cut bundle size 38% by replacing the charting dependency with focused D3 modules.",
      ],
    },
  ],
  projects: [
    {
      id: "s-proj-1",
      title: "Tideline",
      subtitle: "Open-source scheduling toolkit",
      meta: "1.2k stars",
      start: "2022",
      end: "",
      bullets: [
        "Timezone-aware recurring event engine with a 60kb runtime footprint.",
      ],
    },
  ],
  certificates: [
    {
      id: "s-cert-1",
      title: "Professional Cloud Architect",
      subtitle: "Google Cloud",
      meta: "",
      start: "2023",
      end: "",
      bullets: [],
    },
  ],
  sectionOrder: [
    "profile",
    "skills",
    "experience",
    "projects",
    "education",
    "certificates",
  ],
  templateId: DEFAULT_RESUME_TEMPLATE,
  theme: { ...DEFAULT_THEME },
};

/**
 * True when nothing has been typed yet. Previews fall back to the sample so a
 * brand-new resume does not show a wall of blank pages.
 */
export function isResumeEmpty(document: ResumeDocument): boolean {
  return (
    !document.profile.name.trim() &&
    !document.profile.title.trim() &&
    document.experience.length === 0 &&
    document.education.length === 0 &&
    document.skills.length === 0 &&
    document.projects.length === 0 &&
    document.certificates.length === 0
  );
}
