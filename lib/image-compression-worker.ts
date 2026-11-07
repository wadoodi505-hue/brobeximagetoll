export type CompressionFormat = "image/jpeg" | "image/webp" | "image/png";

export type WorkerCompressionResult = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  format: CompressionFormat;
  metTarget: boolean;
  durationMs: number;
};

type Options = {
  file: File;
  targetBytes: number;
  format: CompressionFormat;
  qualityLimit: number;
  allowResize: boolean;
  maxPixels?: number;
  maxIterations?: number;
  onProgress?: (progress: number, message: string) => void;
};

let requestId = 0;

export function startImageCompression(options: Options) {
  const id = ++requestId;
  const worker = new Worker(new URL("../workers/image-compression.worker.ts", import.meta.url), { type: "module", name: "brobex-image-compression" });

  let settled = false;
  let rejectPromise: ((reason?: unknown) => void) | null = null;
  const promise = new Promise<WorkerCompressionResult>((resolve, reject) => {
    rejectPromise = reject;
    worker.onmessage = (event: MessageEvent<Record<string, unknown>>) => {
      const message = event.data;
      if (message.id !== id) return;
      if (message.type === "progress") {
        options.onProgress?.(Number(message.progress) || 0, String(message.message || "Processing image…"));
      } else if (message.type === "success") {
        settled = true;
        resolve({
          blob: message.blob as Blob,
          width: Number(message.width),
          height: Number(message.height),
          quality: Number(message.quality),
          format: message.format as CompressionFormat,
          metTarget: Boolean(message.metTarget),
          durationMs: Number(message.durationMs) || 0,
        });
        worker.terminate();
      } else if (message.type === "error") {
        settled = true;
        reject(new Error(String(message.error || "Image compression failed.")));
        worker.terminate();
      }
    };
    worker.onerror = () => {
      if (settled) return;
      settled = true;
      reject(new Error("The image processor stopped unexpectedly. Please try again."));
      worker.terminate();
    };
    worker.postMessage({
      id,
      file: options.file,
      targetBytes: options.targetBytes,
      format: options.format,
      qualityLimit: options.qualityLimit,
      allowResize: options.allowResize,
      maxPixels: options.maxPixels ?? 40_000_000,
      maxIterations: options.maxIterations ?? 12,
    });
  });

  const cancel = () => {
    if (settled) return;
    settled = true;
    worker.terminate();
    rejectPromise?.(new Error("Compression was cancelled."));
  };

  return { worker, promise, cancel };
}
