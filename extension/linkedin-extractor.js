// Synchronous on purpose: an injected file that returns a Promise
// relies on the browser settling it before handing back a result,
// which is not something to depend on. The background worker re-injects this
// file while it reports { retry: true } instead.
(() => {
  const params = new URLSearchParams(location.search);
  const selectedId = params.get("currentJobId");

  const clean = (value) =>
    typeof value === "string"
      ? value.replace(/\s+/g, " ").trim()
      : "";

  function firstText(root, selectors) {
    for (const selector of selectors) {
      const element = root.querySelector(selector);

      const value = clean(element?.textContent);
      if (value) return value;
    }

    return null;
  }

  // Candidate selectors: inspect the live page if
  // LinkedIn has changed its markup.
  const PANEL_SELECTORS = [
    ".jobs-search__job-details--container",
    ".jobs-search__job-details",
    ".job-view-layout",
    ".jobs-details",
    ".scaffold-layout__detail"
  ];

  const TITLE_SELECTORS = [
    ".job-details-jobs-unified-top-card__job-title",
    ".job-details-jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title",
    ".jobs-details-top-card__job-title",
    "h1"
  ];

  const COMPANY_SELECTORS = [
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".jobs-details-top-card__company-url",
    ".job-details-jobs-unified-top-card__primary-description-container a"
  ];

  const DESCRIPTION_SELECTORS = [
    "#job-details",
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
    ".jobs-description"
  ];

  const INSIGHT_SELECTORS = [
    ".job-details-fit-level-preferences",
    ".job-details-jobs-unified-top-card__job-insight",
    ".jobs-unified-top-card__job-insight"
  ];

  function findPanel() {
    for (const selector of PANEL_SELECTORS) {
      const candidate = document.querySelector(selector);
      if (candidate) return candidate;
    }
    return null;
  }

  // Pick the first description container that actually has text; an
  // empty placeholder often exists before LinkedIn fills the panel in.
  // #job-details is an id and sometimes sits outside the matched panel.
  function findDescription(panel) {
    for (const selector of DESCRIPTION_SELECTORS) {
      const element =
        panel.querySelector(selector) ||
        document.querySelector(selector);

      if (clean(element?.textContent)) return element;
    }

    return null;
  }

  const panel = findPanel();

  if (!panel) {
    return {
      error: "No LinkedIn job detail panel found.",
      retry: true,
      jobId: selectedId
    };
  }

  // The title and the description render separately, so both have to
  // be present before reading, or a job that needed one more frame
  // looks permanently incomplete.
  const title = firstText(panel, TITLE_SELECTORS);
  const descriptionElement = findDescription(panel);

  if (!title || !descriptionElement) {
    return {
      error: "Selected job details are still loading.",
      retry: true,
      jobId: selectedId,
      title,
      descriptionFound: Boolean(descriptionElement)
    };
  }

  const company = firstText(panel, COMPANY_SELECTORS);

  const primaryText = firstText(panel, [
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__primary-description",
    ".jobs-details-top-card__primary-description"
  ]);

  // LinkedIn packs company, location, posting age and applicant count
  // into one bulleted line. Take the segment that is none of those,
  // and report nothing rather than guessing when none qualifies.
  const parts = (primaryText || "")
    .split(/[·•|]/)
    .map(clean)
    .filter(Boolean);

  const locationText =
    parts.find(
      (part) =>
        part !== company &&
        !/\b(ago|reposted|applicants?|views?|promoted|easy apply)\b/i
          .test(part) &&
        !/^\d/.test(part)
    ) ?? null;

  // The insight pills also carry Remote/Hybrid/On-site, which are
  // workplace types, not employment types. Match only the latter and
  // return LinkedIn's own label; popup.js normalizes it.
  const insightText = INSIGHT_SELECTORS
    .flatMap((selector) => Array.from(panel.querySelectorAll(selector)))
    .map((element) => clean(element.textContent))
    .join(" ");

  const employmentType =
    insightText.match(
      /full[- ]time|part[- ]time|contract|internship|intern|temporary/i
    )?.[0] ?? null;

  // Prefer the canonical job URL over the long search URL.
  const url = selectedId
    ? `https://www.linkedin.com/jobs/view/${encodeURIComponent(selectedId)}/`
    : location.href;

  return {
    title,
    company,
    location: locationText,
    employmentType,
    descriptionHtml: descriptionElement.innerHTML || "",
    datePosted: null,
    url,
    jobId: selectedId,
    extractionMethod: "linkedin-dom"
  };
})()
