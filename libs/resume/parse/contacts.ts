import { createId, type ProfileLink } from "@/libs/resume/resumeSchema";

/**
 * Finds contact details locally and swaps them for placeholder tokens before
 * any text leaves the browser for GLM — the same rule `resumeText.ts` follows
 * for Insights: there is no reason to send contact details to a third party.
 *
 * Tokens are numbered and reversible (`restoreTokens`), so a referee's email
 * copied into a References section comes back verbatim after structuring.
 */

export interface Contacts {
  email: string;
  phone: string;
  links: ProfileLink[];
}

export interface RedactedText {
  text: string;
  contacts: Contacts;
  /** Token → original string, e.g. "[EMAIL1]" → "jane@example.com". */
  tokens: Map<string, string>;
}

/** Lines counted as the resume's header, where profile links live. */
const HEADER_LINES = 10;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Loose on purpose; `isPhone` does the real filtering by digit count.
const PHONE = /\+?\(?\d[\d\s().-]{7,}\d/g;

const PROFILE_DOMAINS =
  "linkedin\\.com|github\\.com|gitlab\\.com|github\\.io|behance\\.net|dribbble\\.com|medium\\.com|stackoverflow\\.com|kaggle\\.com|twitter\\.com|x\\.com|vercel\\.app|netlify\\.app";

const URL = new RegExp(
  // The lookbehind stops "x.com" matching inside "netflix.com".
  `(?<![\\w.@-])(?:https?:\\/\\/[^\\s|,;()<>]+|www\\.[^\\s|,;()<>]+|(?:[\\w-]+\\.)*(?:${PROFILE_DOMAINS})(?:\\/[^\\s|,;()<>]*)?)`,
  "gi",
);

export const TOKEN = /\[(?:EMAIL|PHONE|LINK)\d+\]/g;

function isPhone(candidate: string, inHeader: boolean): boolean {
  const digits = candidate.replace(/\D/g, "").length;
  if (digits < 9 || digits > 15) return false;

  // Outside the header a bare digit run is more likely an ID or a credential
  // number than a phone, so only an unmistakable format counts there.
  return inHeader || /^[+(]/.test(candidate.trim());
}

/** "linkedin.com/in/jane" → "LinkedIn"; unknown hosts fall back to "Website". */
function labelFor(url: string): string {
  const host = url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();

  const known: Record<string, string> = {
    "linkedin.com": "LinkedIn",
    "github.com": "GitHub",
    "gitlab.com": "GitLab",
    "behance.net": "Behance",
    "dribbble.com": "Dribbble",
    "medium.com": "Medium",
    "stackoverflow.com": "Stack Overflow",
    "kaggle.com": "Kaggle",
    "twitter.com": "Twitter",
    "x.com": "X",
  };

  const match = Object.keys(known).find(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );

  return match ? known[match] : "Website";
}

export function redactContacts(source: string): RedactedText {
  const tokens = new Map<string, string>();
  const contacts: Contacts = { email: "", phone: "", links: [] };
  const counters = { EMAIL: 0, PHONE: 0, LINK: 0 };

  const tokenFor = (kind: keyof typeof counters, value: string) => {
    for (const [token, original] of tokens) {
      if (original === value && token.startsWith(`[${kind}`)) return token;
    }
    counters[kind] += 1;
    const token = `[${kind}${counters[kind]}]`;
    tokens.set(token, value);
    return token;
  };

  let seen = 0;
  const lines = source.split("\n").map((line) => {
    const inHeader = line.trim() ? seen++ < HEADER_LINES : seen <= HEADER_LINES;

    // Emails first: their domains would otherwise be read as URLs.
    let next = line.replace(EMAIL, (email) => {
      if (!contacts.email) contacts.email = email;
      return tokenFor("EMAIL", email);
    });

    if (inHeader) {
      next = next.replace(URL, (raw) => {
        const url = raw.replace(/[.,;:]+$/, "");
        const trailing = raw.slice(url.length);

        if (!contacts.links.some((link) => link.url === url)) {
          contacts.links.push({ id: createId(), label: labelFor(url), url });
        }
        return tokenFor("LINK", url) + trailing;
      });
    }

    return next.replace(PHONE, (raw) => {
      if (!isPhone(raw, inHeader)) return raw;

      // The loose pattern can swallow a trailing space or bracket; keep those.
      const phone = raw.trim();
      if (!contacts.phone) contacts.phone = phone;
      return raw.replace(phone, tokenFor("PHONE", phone));
    });
  });

  return { text: lines.join("\n"), contacts, tokens };
}

export function restoreTokens(value: string, tokens: Map<string, string>): string {
  return value.replace(TOKEN, (token) => tokens.get(token) ?? token);
}
