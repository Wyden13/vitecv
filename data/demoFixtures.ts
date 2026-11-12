/**
 * Fixtures for the screenshot demo (app/demo). Fictional people and
 * companies only; nothing here is read by the real app.
 */
import type {
  Keyword,
  RoleGap,
  RoleGapItem,
  JobMatchPayload,
} from "@/libs/insights/insightSchema";
import type {
  JobApplication,
  JobApplicationStatus,
} from "@/libs/jobtracker/jobTrackerSchema";

/** A fixed clock so relative times ("2 days ago") never change between shots. */
export const DEMO_NOW = Date.parse("2026-11-12T17:00:00Z");

const daysAgo = (days: number) => new Date(DEMO_NOW - days * 86_400_000);

function application(
  id: string,
  company: string,
  jobTitle: string,
  status: JobApplicationStatus,
  extra: Partial<JobApplication> = {},
): JobApplication {
  return {
    id,
    company,
    jobTitle,
    location: "Calgary, AB",
    salary: "",
    url: "",
    appliedDate: null,
    status,
    matchScore: null,
    nextAction: "",
    updatedAt: daysAgo(1),
    notes: "",
    description: "",
    employmentType: "Full-time",
    datePosted: null,
    source: "",
    ...extra,
  };
}

export const DEMO_APPLICATIONS: JobApplication[] = [
  application("a1", "Northwind Labs", "Frontend Engineer", "saved", {
    location: "Remote · Canada",
    matchScore: 82,
    nextAction: "Tailor resume",
    source: "LinkedIn",
    updatedAt: daysAgo(0),
  }),
  application("a2", "Lumen Analytics", "Software Developer, Data Products", "saved", {
    matchScore: 74,
    nextAction: "Read the posting again",
    source: "Indeed",
    updatedAt: daysAgo(2),
  }),
  application("a3", "Cobalt Systems", "Full Stack Developer", "applied", {
    location: "Vancouver, BC",
    salary: "$95k–$115k",
    appliedDate: "2026-11-06",
    matchScore: 88,
    nextAction: "Follow up on Nov 20",
    source: "LinkedIn",
    updatedAt: daysAgo(6),
  }),
  application("a4", "Harbor & Pine", "React Developer", "applied", {
    location: "Toronto, ON · Hybrid",
    appliedDate: "2026-11-03",
    matchScore: 79,
    updatedAt: daysAgo(9),
  }),
  application("a5", "Fieldstone Health", "Software Engineer I", "interview", {
    salary: "$85k–$100k",
    appliedDate: "2026-10-24",
    matchScore: 86,
    nextAction: "Technical interview Thu 10:00",
    source: "Company site",
    updatedAt: daysAgo(1),
  }),
  application("a6", "Tandem Studio", "UI Engineer", "interview", {
    location: "Remote · Canada",
    appliedDate: "2026-10-20",
    matchScore: 81,
    nextAction: "Send portfolio links",
    updatedAt: daysAgo(3),
  }),
  application("a7", "Arcadia Robotics", "Junior Web Developer", "offer", {
    location: "Edmonton, AB",
    salary: "$78k",
    appliedDate: "2026-10-02",
    matchScore: 91,
    nextAction: "Reply by Nov 18",
    updatedAt: daysAgo(2),
  }),
  application("a8", "Bluewater Bank", "Developer, Digital Channels", "rejected", {
    appliedDate: "2026-09-28",
    matchScore: 62,
    updatedAt: daysAgo(12),
  }),
];

function item(
  term: string,
  category: RoleGapItem["category"],
  importance: number,
  present: boolean,
): RoleGapItem {
  return { term, category, importance, present };
}

const MATCH_ITEMS: RoleGapItem[] = [
  item("React", "technical", 5, true),
  item("TypeScript", "technical", 5, true),
  item("Next.js", "technical", 4, true),
  item("REST APIs", "technical", 4, true),
  item("Accessibility (WCAG)", "methods", 4, true),
  item("Testing (Jest / Playwright)", "tools", 4, true),
  item("GraphQL", "technical", 3, false),
  item("Design systems", "methods", 3, true),
  item("CI/CD", "tools", 3, true),
  item("Azure", "tools", 2, false),
  item("Mentoring", "soft", 2, true),
];

export const DEMO_MATCH: JobMatchPayload = {
  items: MATCH_ITEMS,
  job: {
    title: "Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote · Canada",
    employmentType: "Full-time",
    postedAt: "2026-11-08",
    salary: "$100k–$120k",
  },
  sections: {
    responsibilities: [
      "Build and ship features across our customer dashboard in React and TypeScript.",
      "Own accessibility and performance for the components you touch.",
      "Work with design to grow the shared component library.",
    ],
    qualifications: [
      "2+ years building production web apps with React.",
      "Comfortable with TypeScript, REST APIs and automated testing.",
      "Care for accessible, well-tested UI.",
    ],
    niceToHave: ["GraphQL", "Experience on Azure"],
    benefits: ["Remote-first", "Learning budget", "Health and dental"],
  },
};

export const DEMO_MATCH_DESCRIPTION = [
  "Frontend Engineer · Northwind Labs · Remote, Canada",
  "",
  "You will build and ship features across our customer dashboard in React and TypeScript, own accessibility and performance for the components you touch, and work with design to grow the shared component library.",
].join("\n");

export const DEMO_ROLE_GAP: RoleGap = {
  role: "Frontend Engineer",
  model: "demo",
  sourceHash: "demo",
  createdAt: daysAgo(0),
  items: MATCH_ITEMS,
};

function keyword(
  term: string,
  category: Keyword["category"],
  weight: number,
  count: number,
): Keyword {
  return { term, category, weight, count, blockIds: [] };
}

export const DEMO_KEYWORDS: Keyword[] = [
  keyword("React", "technical", 5, 6),
  keyword("TypeScript", "technical", 5, 5),
  keyword("Next.js", "technical", 4, 3),
  keyword("Accessibility", "methods", 4, 3),
  keyword("Design systems", "methods", 4, 2),
  keyword("Performance", "methods", 3, 3),
  keyword("Playwright", "tools", 3, 2),
  keyword("Firebase", "tools", 3, 2),
  keyword("Figma", "tools", 2, 1),
  keyword("Node.js", "technical", 3, 2),
  keyword("REST APIs", "technical", 3, 2),
  keyword("Mentoring", "soft", 2, 1),
  keyword("Fintech", "domain", 2, 1),
  keyword("Frontend Engineer", "titles", 3, 2),
];
