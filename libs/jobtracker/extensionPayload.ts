/**
 * Maps the browser extension's payload onto a `JobApplicationInput`.
 *
 * Kept free of `server-only` imports so it can be exercised directly: this is
 * the only place that knows the extension's field names and its upper-case
 * status values, and getting that mapping wrong is silent data loss.
 */

import {
  DEFAULT_JOB_STATUS,
  asStatus,
  text,
  type JobApplicationInput,
  type JobApplicationStatus,
} from "./jobTrackerSchema";

/** The extension's `<select>` values, which are not the stored ones. */
const STATUS_FROM_EXTENSION: Record<string, JobApplicationStatus> = {
  SAVED: "saved",
  APPLIED: "applied",
  INTERVIEWING: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
};

/**
 * Query parameters that identify where a link was clicked rather than which
 * job it points at. Stripping them keeps one posting from being saved twice;
 * everything else in the query string is load-bearing (Greenhouse puts the
 * job id in `gh_jid`, Workday in `jobId`), so the rest is preserved.
 */
const TRACKING_PARAMS = [
  "refid",
  "trackingid",
  "trk",
  "source",
  "src",
  "position",
  "pagenum",
  "origin",
  "savedsearchid",
];

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAMS.includes(lower);
}

/**
 * A stable identity for a posting URL, used to derive the document id so
 * re-saving the same job updates it instead of duplicating it.
 */
export function canonicalJobUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return value.trim();
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const name of [...url.searchParams.keys()]) {
    if (isTrackingParam(name)) url.searchParams.delete(name);
  }

  // A trailing slash is not a different job.
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

function statusFromExtension(value: unknown): JobApplicationStatus {
  const raw = text(value).toUpperCase();

  // Fall back to asStatus so an already-stored value ("interview") also works.
  return STATUS_FROM_EXTENSION[raw] ?? asStatus(text(value).toLowerCase());
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export type ParseResult =
  | { ok: true; value: JobApplicationInput }
  | { ok: false; error: string };

export function parseExtensionJob(payload: unknown): ParseResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Expected a job object." };
  }

  const raw = payload as Record<string, unknown>;

  const company = text(raw.company);
  if (!company) {
    return { ok: false, error: "company is required." };
  }

  const url = text(raw.url);
  if (url && !isHttpUrl(url)) {
    return { ok: false, error: "url must be an http(s) address." };
  }

  return {
    ok: true,
    value: {
      company,
      jobTitle: text(raw.title),
      location: text(raw.location),
      url,
      description: text(raw.description),
      employmentType: text(raw.employmentType) || null,
      datePosted: text(raw.datePosted) || null,
      source: text(raw.extractionMethod),
      status: raw.status === undefined
        ? DEFAULT_JOB_STATUS
        : statusFromExtension(raw.status),

      // Owned by the tracker, never by a posting.
      appliedDate: null,
      matchScore: null,
      nextAction: "",
    },
  };
}

/** Posting facts the extension may refresh on a re-save. */
export const REFRESHABLE_FIELDS = [
  "jobTitle",
  "company",
  "location",
  "url",
  "description",
  "employmentType",
  "datePosted",
  "source",
] as const satisfies readonly (keyof JobApplicationInput)[];
