
"use client";

import { removeBackground } from "@imgly/background-removal";

export type BackgroundRemovalProgress = {
  stage: string;
  current: number;
  total: number;
};

export type BackgroundRemovalOptions = {
  onProgress?: (progress: BackgroundRemovalProgress) => void;
};

const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB
const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 40_000_000;

const MODEL = "isnet_quint8" as const;

function reportProgress(
  options: BackgroundRemovalOptions,
  stage: string,
  current: number,
): void {
  options.onProgress?.({
    stage,
    current: Math.max(0, Math.min(100, Math.round(current))),
    total: 100,
  });
}

function getFriendlyError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("err_connection_reset")
  ) {
    return new Error(
      "The AI model or its resources could not be loaded. Check your internet connection and try again.",
    );
  }

  if (
    normalized.includes("out of memory") ||
    normalized.includes("memory allocation") ||
    normalized.includes("allocation failed")
  ) {
    return new Error(
      "Your browser ran out of memory while processing this image. Try a smaller image or close other tabs.",
    );
  }

  if (
    normalized.includes("unsupported") ||
    normalized.includes("decode") ||
    normalized.includes("invalid image")
  ) {
    return new Error(
      "This image could not be decoded. Please try a valid PNG, JPEG, or WebP image.",
    );
  }

  return new Error(
    "Background removal could not be completed. Please try again with another image.",
  );
}

async function validateImage(file: File): Promise<void> {
  if (!(file instanceof File)) {
    throw new Error("Please select an image file.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a valid image.");
  }

  if (file.size === 0) {
    throw new Error("The selected image is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Please choose an image smaller than 12 MB.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "This image could not be opened. Please try a valid PNG, JPEG, or WebP image.",
    );
  }

  try {
    const { width, height } = bitmap;

    if (width <= 0 || height <= 0) {
      throw new Error("The selected image has invalid dimensions.");
    }

    if (
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION
    ) {
      throw new Error(
        `Image dimensions are too large. The maximum supported dimension is ${MAX_IMAGE_DIMENSION.toLocaleString()} pixels per side.`,
      );
    }

    if (width * height > MAX_IMAGE_PIXELS) {
      throw new Error(
        "This image has too many pixels for reliable browser processing. Please resize it and try again.",
      );
    }
  } finally {
    bitmap.close();
  }
}

function getStageLabel(stage: string): string {
  const normalized = stage.toLowerCase();

  if (
    normalized.includes("fetch") ||
    normalized.includes("download") ||
    normalized.includes("model")
  ) {
    return "Loading AI model";
  }

  if (
    normalized.includes("decode") ||
    normalized.includes("image")
  ) {
    return "Preparing image";
  }

  if (
    normalized.includes("inference") ||
    normalized.includes("segment") ||
    normalized.includes("process")
  ) {
    return "Detecting foreground";
  }

  return stage
    .replace(/[-_:/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase()) ||
    "Processing image";
}

export async function removeImageBackground(
  file: File,
  options: BackgroundRemovalOptions = {},
): Promise<Blob> {
  reportProgress(options, "Validating image", 1);

  await validateImage(file);

  reportProgress(options, "Preparing AI engine", 3);

  let lastProgress = 3;

  try {
    const result = await removeBackground(file, {
      model: MODEL,
      device: "cpu",
      proxyToWorker: true,

      output: {
        format: "image/png",
        quality: 1,
      },

      progress: (stage, current, total) => {
        const stageProgress =
          total > 0 && Number.isFinite(current) && Number.isFinite(total)
            ? Math.max(0, Math.min(100, (current / total) * 100))
            : 0;

        // Keep the UI progress stable when the engine reports
        // separate loading and processing stages.
        const overallProgress = Math.max(
          lastProgress,
          Math.min(95, 5 + stageProgress * 0.9),
        );

        lastProgress = overallProgress;

        reportProgress(
          options,
          getStageLabel(stage),
          overallProgress,
        );
      },
    });

    if (!(result instanceof Blob) || result.size === 0) {
      throw new Error("The AI engine returned an empty result.");
    }

    if (result.type && result.type !== "image/png") {
      throw new Error("The AI engine did not return a PNG image.");
    }

    reportProgress(options, "Finalizing transparent image", 98);
    reportProgress(options, "Complete", 100);

    return result;
  } catch (error) {
    // Preserve validation and explicit engine-result errors.
    if (
      error instanceof Error &&
      (error.message.includes("AI engine returned") ||
        error.message.includes("did not return a PNG"))
    ) {
      throw error;
    }

    throw getFriendlyError(error);
  }
}
