/**
 * Shared constraints for the three upload surfaces — the resume importer, the
 * job-description drop zone, and the dashboard composer's attach button. They
 * each used to carry their own copy of this.
 */

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const UPLOAD_HINT = "PDF or DOCX, up to 5 MB";

/** Returns a user-facing sentence, or null when the file is acceptable. */
export function validateUpload(file: File): string | null {
  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Only PDF and DOCX files are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5 MB.";
  }

  return null;
}
