(() => {
  const text = (value) => {
    if (typeof value !== "string") return null;
    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned || null;
  };

  const firstText = (selectors, root = document) => {
    for (const selector of selectors) {
      try {
        const node = root.querySelector(selector);
        const value = text(node?.innerText || node?.textContent);
        if (value) return value;
      } catch {
        // Ignore invalid or unsupported selectors and try the next one.
      }
    }
    return null;
  };

  const firstHtml = (selectors, root = document) => {
    for (const selector of selectors) {
      try {
        const node = root.querySelector(selector);
        const html = node?.innerHTML?.trim();
        if (html) return html;
      } catch {
        // Ignore invalid or unsupported selectors and try the next one.
      }
    }
    return null;
  };

  const meta = (key) => {
    try {
      return text(document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.content);
    } catch {
      return null;
    }
  };

  function findJobs(data, found = []) {
    if (!data || typeof data !== "object") return found;
    if (Array.isArray(data)) {
      for (const item of data) findJobs(item, found);
      return found;
    }
    const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
    if (types.some((type) => typeof type === "string" && type.toLowerCase() === "jobposting")) {
      found.push(data);
    }
    for (const value of Object.values(data)) {
      if (value && typeof value === "object") findJobs(value, found);
    }
    return found;
  }

  function getJsonLdJobs() {
    const jobs = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        findJobs(JSON.parse(script.textContent || ""), jobs);
      } catch {
        // Some pages include unrelated or invalid JSON-LD blocks.
      }
    }
    return jobs;
  }

  function valueText(value) {
    if (typeof value === "string") return text(value);
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ") || null;
    if (value && typeof value === "object") return text(value.name || value.value || value.text);
    return null;
  }

  function jsonLocation(value) {
    const places = Array.isArray(value) ? value : value ? [value] : [];
    const result = places.map((place) => {
      if (typeof place === "string") return text(place);
      const address = place?.address;
      if (typeof address === "string") return text(address);
      if (address && typeof address === "object") {
        const country = typeof address.addressCountry === "object"
          ? address.addressCountry?.name
          : address.addressCountry;
        return [address.addressLocality, address.addressRegion, country]
          .map(valueText).filter(Boolean).join(", ") || text(place?.name);
      }
      return text(place?.name);
    }).filter(Boolean);
    return [...new Set(result)].join(" | ") || null;
  }

  function indeedMetadata() {
    const wrapper = document.querySelector('[data-testid="company-info-metadata"]');
    const company = firstText([
      '[data-testid="inlineHeader-companyName"]',
      '[data-testid="company-name"]',
    ]) || text(wrapper?.querySelector("a")?.innerText);

    let location = firstText([
      '[data-testid="inlineHeader-companyLocation"]',
      '[data-testid="job-location"]',
      '[data-testid="text-location"]',
    ]);

    if (!location && wrapper) {
      // Indeed's mobile layout renders location and Remote as plain nested div text.
      const values = [...wrapper.querySelectorAll('div[dir="ltr"]')]
        .map((node) => text(node.innerText || node.textContent))
        .filter(Boolean)
        .filter((value) => value !== "·" && value !== company)
        .filter((value) => !/^\d+(\.\d+)?$/.test(value) && !/\d+(\.\d+)?\s*out of 5 stars/i.test(value));
      location = [...new Set(values)].join(", ") || null;
    }

    return { company, location };
  }

  function cleanDescriptionHtml(html) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, iframe, svg, noscript, button").forEach((node) => node.remove());
    return doc.body.innerHTML.trim();
  }

  function labeledDescriptionValue(html, label) {
    if (!html) return null;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const lines = (doc.body.innerText || doc.body.textContent || "")
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const prefix = new RegExp(`^${label}\\s*:\\s*(.*)$`, "i");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(prefix);
      if (match?.[1]) return match[1].trim();
      if (new RegExp(`^${label}\\s*:$`, "i").test(lines[i])) return lines[i + 1] || null;
    }
    return null;
  }

  function getIndeedSummary() {
    const summary = document.querySelector('[data-testid="structured-job-summary"]');
    if (!summary) return { salary: null, salaryBase: null, employmentType: null, location: null };

    const lines = (summary.innerText || summary.textContent || "")
      .split(/\n+/)
      .map((line) => text(line))
      .filter(Boolean)
      .filter((line) => !/^job details$/i.test(line));

    const salaryNode = [...summary.querySelectorAll("[aria-label]")].find((node) =>
      /\$|\b(?:USD|CAD|GBP|EUR)\b|\bper\s+(?:hour|year|week|month)\b/i.test(node.getAttribute("aria-label") || "")
    );
    const salary = text(salaryNode?.getAttribute("aria-label")) ||
      lines.find((line) => /\$|\b(?:USD|CAD|GBP|EUR)\b|\bper\s+(?:hour|year|week|month)\b/i.test(line)) || null;
    const salaryBase = salary?.match(/\b(?:per\s+)?(?:an?\s+)?(hour|day|week|month|year)\b/i)?.[1]?.toLowerCase() || null;

    const employmentType = lines.find((line) =>
      /\b(full[ -]?time|part[ -]?time|permanent|temporary|contract|casual|internship|apprentice(?:ship)?)\b/i.test(line)
    ) || null;

    const summaryLocation = lines.find((line) =>
      /\b(remote|hybrid|on[ -]?site|in\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)\b/i.test(line)
    ) || null;

    return { salary, salaryBase, employmentType, location: summaryLocation };
  }

  const isIndeed = /(^|\.)indeed\./i.test(location.hostname);
  const indeedHeader = document.querySelector('[data-testid="desktop-job-header"]');
  const indeedSections = [...document.querySelectorAll('[data-testid="viewjob-main-content"]')];
  const indeedDetails = indeedSections.find((section) =>
    section.querySelector('[data-testid="structured-job-summary"], [data-testid="vjj-job-description-heading"], .simple-job-description-html')
  ) || indeedSections.at(-1) || document;
  const jobs = getJsonLdJobs();
  const posting = jobs.find((job) => {
    const url = text(job.url || job.mainEntityOfPage?.["@id"] || job.mainEntityOfPage);
    return url && (url === location.href || url.split("?")[0] === location.href.split("?")[0]);
  }) || (!isIndeed ? jobs[0] : null) || null;
  const indeed = isIndeed ? indeedMetadata() : {};
  const indeedSummary = isIndeed ? getIndeedSummary() : {};

  const title = valueText(posting?.title) || firstText([
    '[data-testid="vjj-job-title"]',
    '[data-testid="vj-job-title"]',
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '[data-testid="job-title"]',
    "h1.jobsearch-JobInfoHeader-title",
    "h1[class*='JobInfoHeader']",
    "main h1",
    "h1",
  ], isIndeed ? (indeedHeader || document) : document) || meta("og:title") || text(document.title);

  const jsonCompany = valueText(posting?.hiringOrganization) && typeof posting?.hiringOrganization === "object"
    ? valueText(posting.hiringOrganization.name)
    : valueText(posting?.hiringOrganization);
  const company = isIndeed
    ? indeed.company || jsonCompany
    : jsonCompany || indeed.company;

  const domDescriptionHtml = firstHtml([
    '.simple-job-description-html',
    "#jobDescriptionText",
    '[data-testid="jobDescriptionText"]',
    '[data-testid*="jobDescription"]',
    "[class*='jobDescriptionText']",
    "[class*='JobDescription']",
  ], isIndeed ? indeedDetails : document);
  const descriptionHtml = (isIndeed ? domDescriptionHtml : null) || text(posting?.description) ||
    domDescriptionHtml || meta("og:description") || meta("description") || "";

  const locationType = posting?.jobLocationType;
  const remote = (Array.isArray(locationType) ? locationType : [locationType])
    .some((type) => typeof type === "string" && type.toUpperCase() === "TELECOMMUTE");

  const salary = posting?.baseSalary;
  const salaryValue = salary?.value;
  const salaryText = salaryValue && typeof salaryValue === "object"
    ? [salaryValue.minValue, salaryValue.maxValue].filter((value) => value != null).join(" - ")
    : valueText(salaryValue) || valueText(salary);
  const salaryBase = valueText(salaryValue?.unitText) ||
    valueText(salary?.value?.unitText) ||
    indeedSummary.salaryBase ||
    labeledDescriptionValue(descriptionHtml, "Salary")?.match(/\b(?:per\s+)?(?:an?\s+)?(hour|day|week|month|year)\b/i)?.[1]?.toLowerCase() ||
    null;

  const employmentType = (isIndeed ? indeedSummary.employmentType : null) || valueText(posting?.employmentType) || firstText([
    '[data-testid="jobsearch-JobMetadataHeader-item"]',
    '[data-testid*="employment"]',
    "#salaryInfoAndJobType",
  ]);

  const indeedSalary = isIndeed ? firstText([
    '[data-testid="structured-job-summary"] [data-testid*="salary"]',
    "#salaryInfoAndJobType",
    '[data-testid*="salary"]',
    '[data-testid*="pay"]',
  ], indeedDetails) : null;
  const descriptionSalary = labeledDescriptionValue(descriptionHtml, "Salary");
  const salaryOutput = (isIndeed ? indeedSummary.salary : null) || salaryText || indeedSalary || descriptionSalary;

  return {
    title,
    company: company || indeed.company || meta("og:site_name"),
    location: (isIndeed ? indeedSummary.location || indeed.location : null) || jsonLocation(posting?.jobLocation) || (remote ? "Remote" : null),
    employmentType,
    salary: salaryOutput,
    salaryBase,
    descriptionHtml: cleanDescriptionHtml(descriptionHtml),
    datePosted: valueText(posting?.datePosted) || firstText([
      '[data-testid*="datePosted"]',
      '[data-testid*="posted"]',
    ]),
    url: window.location.href,
    extractionMethod: posting ? (isIndeed ? "indeed-dom+json-ld" : "json-ld") : (isIndeed ? "indeed-dom" : "metadata+dom"),
  };
})();
