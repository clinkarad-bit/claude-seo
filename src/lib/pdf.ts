/**
 * PDF processing utilities using pdf-parse.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues with Next.js server components
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Fehler beim Lesen der PDF-Datei.");
  }
}

export async function processPDFUpload(
  file: File
): Promise<{ text: string; fileName: string; size: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = await extractTextFromPDF(buffer);

  return {
    text,
    fileName: file.name,
    size: file.size,
  };
}

export function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
  folder: string
): string {
  // In production this would use a proper file storage service (S3, etc.)
  // For development, files are stored locally under /public/uploads/
  const path = `/uploads/${folder}/${Date.now()}-${fileName}`;
  // Note: actual file writing is handled in the API route via fs module
  return path;
}
