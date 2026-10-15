export async function extractFileText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return extractPDF(file);
  }

  if (extension === "docx") {
    return extractDOCX(file);
  }

  throw new Error("Unsupported file format");
}

async function extractPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
  });

  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pages.push(text);
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages.join("\n\n");
}

async function extractDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");

  const buffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({
    arrayBuffer: buffer,
  });

  return result.value;
}
