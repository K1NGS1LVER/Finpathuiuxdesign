import { captureNodeToPng, downloadBlob } from "./share-card";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

export const PDF_PAGE_SLOTS = ["cover", "health", "sankey", "insights"] as const;
export type PdfPageSlot = (typeof PDF_PAGE_SLOTS)[number];

const SLOT_LABELS: Record<PdfPageSlot, string> = {
  cover: "Cover",
  health: "Health Score",
  sankey: "Cashflow",
  insights: "Insights",
};

export interface PdfProgress {
  step: "rendering" | "capturing" | "assembling" | "saving" | "done";
  pageIndex?: number;
  pageLabel?: string;
  totalPages: number;
}

export interface GeneratePdfOptions {
  container: HTMLElement;
  signal?: AbortSignal;
  onProgress?: (p: PdfProgress) => void;
}

export class PdfExportAbortedError extends Error {
  constructor() {
    super("PDF export aborted");
    this.name = "PdfExportAbortedError";
  }
}

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new PdfExportAbortedError();
}

async function nextPaintFrame(): Promise<void> {
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );
}

export async function generatePlanPdf(
  opts: GeneratePdfOptions,
): Promise<Blob> {
  const { container, signal, onProgress } = opts;
  const total = PDF_PAGE_SLOTS.length;

  onProgress?.({ step: "rendering", totalPages: total });
  await nextPaintFrame();
  checkAborted(signal);

  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`FinPath Plan · ${new Date().toISOString().slice(0, 10)}`);
  doc.setAuthor("FinPath");
  doc.setCreator("FinPath");
  doc.setProducer("FinPath");
  doc.setCreationDate(new Date());

  for (let i = 0; i < PDF_PAGE_SLOTS.length; i++) {
    const slot = PDF_PAGE_SLOTS[i];
    checkAborted(signal);
    onProgress?.({
      step: "capturing",
      pageIndex: i,
      pageLabel: SLOT_LABELS[slot],
      totalPages: total,
    });

    const node = container.querySelector<HTMLElement>(
      `[data-pdf-page="${slot}"]`,
    );
    if (!node) {
      throw new Error(`Missing PDF page slot: ${slot}`);
    }

    const blob = await captureNodeToPng(node, { pixelRatio: 2 });
    checkAborted(signal);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const png = await doc.embedPng(bytes);

    const page = doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    page.drawImage(png, {
      x: 0,
      y: 0,
      width: A4_WIDTH_PT,
      height: A4_HEIGHT_PT,
    });
  }

  onProgress?.({ step: "assembling", totalPages: total });
  checkAborted(signal);
  const pdfBytes = await doc.save();
  const pdfBlob = new Blob([pdfBytes as BlobPart], {
    type: "application/pdf",
  });
  onProgress?.({ step: "done", totalPages: total });
  return pdfBlob;
}

export function defaultPdfFilename(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `finpath-plan-${iso}.pdf`;
}

export async function downloadPlanPdf(
  opts: GeneratePdfOptions & { filename?: string },
): Promise<void> {
  const blob = await generatePlanPdf(opts);
  opts.onProgress?.({ step: "saving", totalPages: PDF_PAGE_SLOTS.length });
  downloadBlob(blob, opts.filename ?? defaultPdfFilename());
}
