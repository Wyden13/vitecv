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
  appliedDate: string | null;
  status: JobApplicationStatus;
  matchScore: number | null;
  nextAction: string;
  updatedAt: Date | null;
  url: string;
}

export type JobApplicationInput = Omit<JobApplication, "id" | "updatedAt">;

function text(value: unknown): string {
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

function asStatus(value: unknown): JobApplicationStatus {
  return (
    JOB_STATUSES.find((candidate) => candidate === value) ?? DEFAULT_JOB_STATUS
  );
}

export function createEmptyJobApplication(): JobApplicationInput {
  return {
    company: "",
    jobTitle: "",
    location: "",
    appliedDate: null,
    status: DEFAULT_JOB_STATUS,
    matchScore: null,
    nextAction: "",
    url:"",
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
    appliedDate: text(raw.appliedDate) || null,
    status: asStatus(raw.status),
    matchScore: score === null ? null : clamp(score, 0, 100),
    nextAction: text(raw.nextAction),
    updatedAt,
    url: text(raw.url),
  };
}
