/// <reference lib="webworker" />

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";
type RequestMessage = {
  id: number;
  file: File;
  targetBytes: number;
  format: OutputFormat;
  qualityLimit: number;
  allowResize: boolean;
  maxPixels: number;
  maxIterations: number;
};
type ResponseMessage =
  | { id: number; type: "progress"; progress: number; message: string }
  | { id: number; type: "success"; blob: Blob; width: number; height: number; quality: number; format: OutputFormat; metTarget: boolean; durationMs: number }
  | { id: number; type: "error"; error: string };

const scope = self as DedicatedWorkerGlobalScope;

async function validateImageSignature(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));

  const isJpeg = starts(0xff, 0xd8, 0xff);
  const isPng = starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const isGif = ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
  const isWebp = ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
  const isAvif = ascii(4, 4) === "ftyp" &&
    ["avif", "avis"].includes(ascii(8, 4));

  if (!(isJpeg || isPng || isGif || isWebp || isAvif)) {
    throw new Error("The selected file does not contain a valid JPEG, PNG, WebP, GIF, or AVIF signature.");
  }
}

function post(message: ResponseMessage) {
  scope.postMessage(message);
}

function applyPngQuality(
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  quality: number,
) {
  // PNG encoding itself is lossless and ignores the Canvas quality argument.
  // Controlled RGB quantization makes the quality preference meaningful while
  // preserving alpha transparency and the PNG output format.
  const normalized = Math.max(0.4, Math.min(1, quality));
  if (normalized >= 0.999) return;

  const levels = Math.max(16, Math.round(16 + ((normalized - 0.4) / 0.6) * 240));
  const step = 255 / (levels - 1);
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = Math.round(pixels[index] / step) * step;
    pixels[index + 1] = Math.round(pixels[index + 1] / step) * step;
    pixels[index + 2] = Math.round(pixels[index + 2] / step) * step;
  }

  context.putImageData(image, 0, 0);
}

async function encode(canvas: OffscreenCanvas, format: OutputFormat, quality: number) {
  const blob = await canvas.convertToBlob({
    type: format,
    ...(format === "image/png" ? {} : { quality }),
  });
  if (blob.type !== format) {
    throw new Error(`${format.split("/")[1].toUpperCase()} encoding is not supported by this browser. Choose another output format.`);
  }
  return blob;
}

scope.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const request = event.data;
  const startedAt = performance.now();
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;

  try {
    await validateImageSignature(request.file);
    // createImageBitmap uses the image's encoded orientation by default, so EXIF-oriented
    // phone photos are drawn upright before canvas export (EXIF metadata itself is stripped).
    bitmap = await createImageBitmap(request.file, { imageOrientation: "from-image", colorSpaceConversion: "default" });
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!sourceWidth || !sourceHeight || sourceWidth * sourceHeight > request.maxPixels) {
      throw new Error(`This image exceeds the ${Math.round(request.maxPixels / 1_000_000)}-megapixel browser processing limit.`);
    }

    const scales = request.allowResize
      ? [1, ...Array.from({ length: 15 }, (_, index) => Math.pow(0.86, index + 1))]
      : [1];

    let best: { blob: Blob; width: number; height: number; quality: number } | null = null;
    const total = scales.length;

    for (let scaleIndex = 0; scaleIndex < scales.length; scaleIndex++) {
      const scale = scales[scaleIndex];
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      if (Math.max(width, height) < 96 && scale < 1) break;

      canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d", { alpha: request.format !== "image/jpeg", colorSpace: "srgb" });
      if (!context) throw new Error("Your browser could not initialize the image processor.");

      if (request.format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      if (request.format === "image/png") {
        applyPngQuality(context, width, height, request.qualityLimit);
        const blob = await encode(canvas, request.format, 1);
        if (!best || blob.size < best.blob.size) best = { blob, width, height, quality: request.qualityLimit };
        if (blob.size <= request.targetBytes) {
          post({ id: request.id, type: "success", blob, width, height, quality: request.qualityLimit, format: request.format, metTarget: true, durationMs: performance.now() - startedAt });
          return;
        }
      } else {
        let low = 0.06;
        let high = Math.max(0.01, Math.min(1, request.qualityLimit));
        let bestAtScale: Blob | null = null;
        let bestQuality = 0;
        const lowest = await encode(canvas, request.format, low);
        if (lowest.size <= request.targetBytes) {
          bestAtScale = lowest;
          bestQuality = low;
        } else if (!best || lowest.size < best.blob.size) {
          best = { blob: lowest, width, height, quality: low };
        }

        for (let iteration = 0; iteration < request.maxIterations; iteration++) {
          const middle = (low + high) / 2;
          const candidate = await encode(canvas, request.format, middle);
          if (candidate.size <= request.targetBytes) {
            bestAtScale = candidate;
            bestQuality = middle;
            low = middle;
          } else {
            high = middle;
            if (!best || candidate.size < best.blob.size) best = { blob: candidate, width, height, quality: middle };
          }
          const progress = Math.min(96, Math.round(((scaleIndex + (iteration + 1) / request.maxIterations) / total) * 96));
          post({ id: request.id, type: "progress", progress, message: scale < 1 ? "Reducing dimensions and refining quality…" : "Finding the best quality for your target…" });
        }

        if (bestAtScale) {
          post({ id: request.id, type: "success", blob: bestAtScale, width, height, quality: bestQuality, format: request.format, metTarget: true, durationMs: performance.now() - startedAt });
          return;
        }
      }

      canvas.width = 1;
      canvas.height = 1;
      canvas = null;
      post({ id: request.id, type: "progress", progress: Math.round(((scaleIndex + 1) / total) * 96), message: "Checking the next image size…" });
    }

    if (!best) throw new Error("The browser could not create a compressed image. Try another file.");
    post({ id: request.id, type: "success", blob: best.blob, width: best.width, height: best.height, quality: best.quality, format: request.format, metTarget: best.blob.size <= request.targetBytes, durationMs: performance.now() - startedAt });
  } catch (error) {
    post({ id: request.id, type: "error", error: error instanceof Error ? error.message : "Image compression failed." });
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
};

export {};
