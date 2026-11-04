"use client";

import { useCallback, useState } from "react";

import { useToast } from "@/components/Toast";
import {
  downloadPdf,
  formatTypstError,
  pdfFileName,
  type TypstKind,
} from "@/libs/typst/client";

/**
 * Typesets a document with the same Typst engine as the preview and saves it
 * as a real PDF (selectable text, clickable links). Failures surface as a
 * toast; `downloading` drives the button's busy state.
 */
export function usePdfDownload() {
  const { notify } = useToast();
  const [downloading, setDownloading] = useState(false);

  const download = useCallback(
    async (
      kind: TypstKind,
      template: string,
      doc: unknown,
      names: string[],
    ) => {
      setDownloading(true);
      try {
        await downloadPdf(kind, template, JSON.stringify(doc), pdfFileName(...names));
      } catch (caught) {
        notify({
          variant: "error",
          message: `Could not create the PDF. ${formatTypstError(caught)}`,
        });
      } finally {
        setDownloading(false);
      }
    },
    [notify],
  );

  return { download, downloading };
}
