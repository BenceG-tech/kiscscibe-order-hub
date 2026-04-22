import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfInvoiceExtraction {
  text: string;
  firstPageImage?: string;
  source: "pdf_text" | "pdf_image" | "pdf_empty";
}

const normalizePdfText = (text: string) => text.replace(/\s+/g, " ").trim();

export const extractInvoicePdfContent = async (file: File): Promise<PdfInvoiceExtraction> => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const maxPages = Math.min(pdf.numPages, 3);
  const parts: string[] = [];

  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    if (pageText.trim()) parts.push(pageText);
  }

  const text = normalizePdfText(parts.join("\n"));
  if (text.length >= 80) {
    return { text: text.slice(0, 18000), source: "pdf_text" };
  }

  const firstPage = await pdf.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.8 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return { text, source: "pdf_empty" };

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await firstPage.render({ canvasContext: context, viewport }).promise;

  return {
    text,
    firstPageImage: canvas.toDataURL("image/jpeg", 0.86),
    source: "pdf_image",
  };
};