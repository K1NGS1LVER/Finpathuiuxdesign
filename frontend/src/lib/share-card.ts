import { toBlob } from "html-to-image";

export interface CaptureOptions {
  pixelRatio?: number;
  backgroundColor?: string | null;
}

export async function captureNodeToPng(
  node: HTMLElement,
  opts: CaptureOptions = {},
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // fonts.ready can reject in rare edge cases; capture anyway
    }
  }

  const blob = await toBlob(node, {
    pixelRatio: opts.pixelRatio ?? 2,
    backgroundColor: opts.backgroundColor ?? undefined,
    cacheBust: true,
    skipFonts: false,
  });

  if (!blob) {
    throw new Error("html-to-image returned no blob");
  }
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ShareOutcome = "shared" | "copied" | "downloaded";

export interface ShareImageOptions {
  title: string;
  text: string;
  filename: string;
}

export async function tryShareImage(
  blob: Blob,
  opts: ShareImageOptions,
): Promise<ShareOutcome> {
  const file = new File([blob], opts.filename, { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ title: opts.title, text: opts.text, files: [file] });
      return "shared";
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "AbortError") {
        return "shared";
      }
    }
  }

  let copied = false;
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined"
  ) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({ "image/png": blob }),
      ]);
      copied = true;
    } catch {
      // clipboard write can fail without user gesture or permission; fall through
    }
  }

  downloadBlob(blob, opts.filename);
  return copied ? "copied" : "downloaded";
}
