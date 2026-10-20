/**
 * A one-shot, in-memory baton for text that is too large for a query param —
 * a pasted job posting routed from the dashboard composer to `/job-match`.
 *
 * Module state rather than `sessionStorage` on purpose. The receiving page can
 * read it inside a `useState` initialiser, which avoids both a `useEffect`
 * that calls `setState` and any hydration mismatch: during a client-side
 * navigation the initialiser runs only on the client, and on a hard load the
 * module is fresh so server and client both see `null`.
 *
 * The trade is that a handoff does not survive a refresh — which is what you
 * want. A dropped draft is better than one that reappears days later.
 */

export interface Handoff {
  jobDescription?: string;
  role?: string;
}

let pending: Handoff | null = null;

export function setHandoff(next: Handoff | null): void {
  pending = next;
}

/** Reads once and clears, so a handoff can never replay on a later visit. */
export function takeHandoff(): Handoff | null {
  const value = pending;
  pending = null;
  return value;
}
