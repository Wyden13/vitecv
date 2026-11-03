export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export const JOB_STATUSES: JobApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export const DEFAULT_JOB_STATUS: JobApplicationStatus = "saved";

export const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export interface JobApplication {
  id: string;
  company: string;
  jobTitle: string;
  location: string;
  salary: string;
  url: string;
  appliedDate: string | null;
  status: JobApplicationStatus;
  matchScore: number | null;
  nextAction: string;
  updatedAt: Date | null;
  notes: string;

  /**
   * Filled in by the browser extension. `datePosted` is when the employer
   * posted the job, which is not `appliedDate` — that one means when *you*
   * applied, and nothing should ever infer it from a posting.
   */
  description: string;
  employmentType: string | null;
  datePosted: string | null;
  source: string;
}

export type JobApplicationInput = Omit<JobApplication, "id" | "updatedAt">;

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function asStatus(value: unknown): JobApplicationStatus {
  return (
    JOB_STATUSES.find((candidate) => candidate === value) ?? DEFAULT_JOB_STATUS
  );
}

export function createEmptyJobApplication(): JobApplicationInput {
  return {
    company: "",
    jobTitle: "",
    location: "",
    salary: "",
    url:"",
    appliedDate: null,
    status: DEFAULT_JOB_STATUS,
    matchScore: null,
    nextAction: "",
    notes: "",
    description: "",
    employmentType: null,
    datePosted: null,
    source: "",
  };
}

export function normalizeJobApplication(
  id: string,
  value: unknown,
  updatedAt: Date | null,
): JobApplication {
  const raw = (value ?? {}) as Record<string, unknown>;
  const score = num(raw.matchScore);

  return {
    id,
    company: text(raw.company),
    jobTitle: text(raw.jobTitle),
    location: text(raw.location),
    salary: text(raw.salary),
    url: text(raw.url),
    appliedDate: text(raw.appliedDate) || null,
    status: asStatus(raw.status),
    matchScore: score === null ? null : clamp(score, 0, 100),
    nextAction: text(raw.nextAction),
    notes: text(raw.notes),
    updatedAt,
    description: text(raw.description),
    employmentType: text(raw.employmentType) || null,
    datePosted: text(raw.datePosted) || null,
    source: text(raw.source),
  };
}

export type JobApplicationField = keyof JobApplicationInput;
export type JobApplicationErrors = Partial<Record<JobApplicationField, string>>;
export function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function cleanJobApplicationInput(
  input: JobApplicationInput,
): JobApplicationInput {
  return {
    ...input,
    company: text(input.company),
    jobTitle: text(input.jobTitle),
    location: text(input.location),
    salary: text(input.salary),
    url: text(input.url),
    appliedDate: text(input.appliedDate) || null,
    nextAction: text(input.nextAction),
    notes: text(input.notes),
    description: text(input.description),
    employmentType: text(input.employmentType) || null,
    datePosted: text(input.datePosted) || null,
    source: text(input.source),
  };
}
export function validateJobApplication(input: JobApplicationInput): JobApplicationErrors{
  const errors: JobApplicationErrors = {};
  if (!input.company.trim()) {
    errors.company = "Company is required.";
  }
  const url = input.url.trim();
  if (url && !isHttpUrl(url)) {
    errors.url = "Must start with http:// or https://";
  }
  if (isFuture(input.appliedDate)) {
    errors.appliedDate = "You cannot have applied in the future.";
  }

  if (isFuture(input.datePosted)) {
    errors.datePosted = "A posting cannot be dated in the future.";
  }
  return errors;
}

export function hasErrors(errors: JobApplicationErrors): boolean {
  return Object.keys(errors).length > 0;
}
function isFuture(value: string | null): boolean {
  return value !== null && value > todayISO();
}
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}
