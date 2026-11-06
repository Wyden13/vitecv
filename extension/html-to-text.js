globalThis.jobTrackerHtmlToText = function htmlToText(html) {
  if (!html || typeof html !== "string") {
    return "";
  }

  let doc = new DOMParser().parseFromString(html, "text/html");

  for (let i = 0; i < 4 && !doc.body.querySelector("*"); i++) {
    const decoded = doc.body.textContent || "";
    if (decoded === html) break;
    html = decoded;
    doc = new DOMParser().parseFromString(html, "text/html");
  }

  doc.querySelectorAll(
    "script, style, iframe, svg, noscript"
  ).forEach((element) => element.remove());

  const BLOCK_TAGS = new Set([
    "P", "DIV", "SECTION", "ARTICLE",
    "H1", "H2", "H3", "H4", "H5", "H6",
    "UL", "OL", "BLOCKQUOTE", "TABLE", "TR",
  ]);

  function extract(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode?.tagName;
      if ((parent === "UL" || parent === "OL") &&
          !node.textContent.trim()) {
        return "";
      }
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName;

    if (tag === "BR") {
      return "\n";
    }

    if (tag === "LI") {
      const content = Array.from(node.childNodes)
        .map(extract)
        .join("")
        .trim();

      return content ? `\n• ${content}` : "";
    }

    const content = Array.from(node.childNodes)
      .map(extract)
      .join("");

    if (BLOCK_TAGS.has(tag)) {
      return `\n\n${content}\n`;
    }

    return content;
  }

  return extract(doc.body)
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
