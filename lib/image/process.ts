
export type ImageOperation =
  | "png-to-svg"
  | "resize"
  | "compress"
  | "crop"
  | "flip"
  | "grayscale"
  | "pixelate"
  | "text"
  | "border"
  | "combine"
  | "circle"
  | "metadata"
  | "blur"
  | "convert"
  | "rotate"
  | "unblur" | "square-crop" | "triangle-crop" | "shape-crop" | "aspect-ratio-crop";

export type ProcessSettings = {
  operation: ImageOperation;
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  aspectRatio?: number;
  flipX?: boolean;
  flipY?: boolean;
  rotation?: number;
  pixelSize?: number;
  text?: string;
  textSize?: number;
  textColor?: string;
  textX?: number;
  textY?: number;
  textFont?: string;
  textAlign?: "left" | "center" | "right";
  borderWidth?: number;
  borderColor?: string;
  blurAmount?: number;
  sharpness?: number;
  detailStrength?: number;
  noiseReduction?: number;
};

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 80_000_000;
const MAX_IMAGE_DIMENSION = 12_000;

async function validateImageFile(file: File): Promise<void> {
  if (!(file instanceof File)) {
    throw new Error("Choose an image file to continue.");
  }
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("The image exceeds the 50 MB browser-processing limit.");
  }
  if (!file.type || !file.type.toLowerCase().startsWith("image/")) {
    throw new Error("The selected file is not a supported image.");
  }

  // Validate file content instead of trusting the filename or browser MIME header.
  const header = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...header.slice(start, start + length));
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((value, index) => header[index] === value);
  const gif = ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
  const webp = ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
  const bmp = ascii(0, 2) === "BM";
  const tiff = (header[0] === 0x49 && header[1] === 0x49 && header[2] === 0x2a && header[3] === 0x00) || (header[0] === 0x4d && header[1] === 0x4d && header[2] === 0x00 && header[3] === 0x2a);
  const avif = ascii(4, 4) === "ftyp" &&
    ["avif", "avis", "heic", "heix", "mif1", "msf1"].includes(ascii(8, 4));
  const textHeader = new TextDecoder().decode(header).trimStart().toLowerCase();
  const svg = textHeader.startsWith("<svg") ||
    (textHeader.startsWith("<?xml") && textHeader.includes("<svg"));
  if (!(jpeg || png || gif || webp || bmp || tiff || avif || svg)) {
    throw new Error("The file content is not a recognized image format. Choose a genuine image file.");
  }
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  try {
    await validateImageFile(file);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let url: string;
    try {
      url = URL.createObjectURL(file);
    } catch {
      reject(new Error("The browser could not create an image preview."));
      return;
    }

    const image = new Image();
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
    };

    image.onload = () => {
      cleanup();
      if (
        !Number.isFinite(image.naturalWidth) ||
        !Number.isFinite(image.naturalHeight) ||
        image.naturalWidth < 1 ||
        image.naturalHeight < 1
      ) {
        reject(new Error("The selected file has invalid image dimensions."));
        return;
      }
      if (
        image.naturalWidth > MAX_IMAGE_DIMENSION ||
        image.naturalHeight > MAX_IMAGE_DIMENSION ||
        image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS
      ) {
        reject(
          new Error("This image is too large to process safely in your browser. Resize it or choose an image under 80 megapixels."),
        );
        return;
      }
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(
        new Error("This file could not be decoded as a supported image. Check that it is a genuine, uncorrupted image file."),
      );
    };

    image.src = url;
  });
}

function applyPngQuality(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  quality: number,
): void {
  // Canvas PNG encoding is lossless and ignores its quality argument. Apply
  // controlled RGB quantization so the shared quality slider also works for PNG.
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

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              `This browser cannot export ${type}. Try PNG or JPEG.`,
            ),
          );
          return;
        }

        if (blob.type && blob.type !== type) {
          reject(
            new Error(
              `This browser cannot export ${type}. It returned ${blob.type} instead. Choose a different output format.`,
            ),
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/**
 * Browser-side unsharp masking.
 * This improves perceived clarity but cannot recreate detail
 * that was never captured in the original image.
 */
export function sharpenImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sharpness: number,
  detailStrength: number,
  noiseReduction: number,
): void {
  if (width < 3 || height < 3) return;

  const image = ctx.getImageData(0, 0, width, height);
  const source = image.data;
  const output = new Uint8ClampedArray(source);

  const amount = Math.max(0, Math.min(2.5, sharpness));
  const detail = Math.max(0, Math.min(1.5, detailStrength));
  const denoise = Math.max(0, Math.min(0.8, noiseReduction));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const north = i - width * 4;
      const south = i + width * 4;

      for (let c = 0; c < 3; c++) {
        const center = source[i + c];
        const n = source[north + c];
        const s = source[south + c];
        const w = source[i - 4 + c];
        const e = source[i + 4 + c];

        const nw = source[north - 4 + c];
        const ne = source[north + 4 + c];
        const sw = source[south - 4 + c];
        const se = source[south + 4 + c];

        const average = (n + s + w + e + nw + ne + sw + se) / 8;
        const smoothed = center * (1 - denoise) + average * denoise;

        const lowPass =
          (center * 4 + n * 2 + s * 2 + w * 2 + e * 2 +
            nw + ne + sw + se) / 16;

        const edge = smoothed - lowPass;

        output[i + c] = Math.max(
          0,
          Math.min(255, smoothed + edge * (amount + detail)),
        );
      }

      output[i + 3] = source[i + 3];
    }
  }

  image.data.set(output);
  ctx.putImageData(image, 0, 0);
}

export async function processImage(
  file: File,
  settings: ProcessSettings,
): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  validateImageFile(file);

  // Export a PNG inside a standards-compatible SVG document.
  if (settings.operation === "png-to-svg") {
    if (file.type !== "image/png") {
      throw new Error("Please upload a valid PNG image.");
    }

    const image = await loadImage(file);

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Could not read the PNG image."));
          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => reject(
        new Error("Failed to read the PNG image."),
      );

      reader.readAsDataURL(file);
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${image.naturalWidth}"
     height="${image.naturalHeight}"
     viewBox="0 0 ${image.naturalWidth} ${image.naturalHeight}">
  <image
    width="${image.naturalWidth}"
    height="${image.naturalHeight}"
    href="${dataUrl}"
    xlink:href="${dataUrl}"
    preserveAspectRatio="none"
  />
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });

    return {
      blob,
      width: image.naturalWidth,
      height: image.naturalHeight,
      mime: "image/svg+xml",
    };
  }

  const image = await loadImage(file);
  const maxDimension = 12000;
  const srcW = image.naturalWidth;
  const srcH = image.naturalHeight;

  if (
    settings.operation === "unblur" &&
    srcW * srcH > 12_000_000
  ) {
    throw new Error(
      "This image exceeds 12 megapixels. Resize it before sharpening to protect browser memory.",
    );
  }

  let width = Math.max(
    1,
    Math.min(maxDimension, Math.round(settings.width || srcW)),
  );
  let height = Math.max(
    1,
    Math.min(maxDimension, Math.round(settings.height || srcH)),
  );

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  const cropOperations = [
    "crop",
    "square-crop",
    "aspect-ratio-crop",
    "triangle-crop",
    "shape-crop",
    "circle",
  ];

  if (cropOperations.includes(settings.operation)) {
    sx = Math.max(0, Math.min(srcW - 1, Math.round(settings.cropX ?? 0)));
    sy = Math.max(0, Math.min(srcH - 1, Math.round(settings.cropY ?? 0)));
    sw = Math.max(1, Math.min(srcW - sx, Math.round(settings.cropWidth || srcW)));
    sh = Math.max(1, Math.min(srcH - sy, Math.round(settings.cropHeight || srcH)));

    if (
      settings.operation === "square-crop" ||
      settings.operation === "circle" ||
      settings.operation === "triangle-crop" ||
      settings.operation === "shape-crop"
    ) {
      const side = Math.min(sw, sh);

      sx += Math.floor((sw - side) / 2);
      sy += Math.floor((sh - side) / 2);

      sw = side;
      sh = side;
    }
    if (settings.operation === "aspect-ratio-crop") {
      const ratio = Number.isFinite(settings.aspectRatio) && (settings.aspectRatio || 0) > 0
        ? settings.aspectRatio!
        : 16 / 9;

      if (sw / sh > ratio) {
        const adjustedWidth = Math.max(1, Math.round(sh * ratio));
        sx += Math.floor((sw - adjustedWidth) / 2);
        sw = adjustedWidth;
      } else {
        const adjustedHeight = Math.max(1, Math.round(sw / ratio));
        sy += Math.floor((sh - adjustedHeight) / 2);
        sh = adjustedHeight;
      }
    }

    width = sw;
    height = sh;
  }

  if (settings.operation === "rotate" &&
    Math.abs(settings.rotation || 0) % 180 === 90
  ) {
    [width, height] = [height, width];
  }

  if (settings.operation === "flip") {
    const angle = ((settings.rotation || 0) * Math.PI) / 180;
    const cosine = Math.abs(Math.cos(angle));
    const sine = Math.abs(Math.sin(angle));

    width = Math.max(1, Math.ceil(srcW * cosine + srcH * sine));
    height = Math.max(1, Math.ceil(srcW * sine + srcH * cosine));
  }


  const border = settings.operation === "border"
    ? Math.max(0, settings.borderWidth || 0)
    : 0;

  const outputWidth = width + border * 2;
  const outputHeight = height + border * 2;
  if (
    !Number.isSafeInteger(outputWidth) ||
    !Number.isSafeInteger(outputHeight) ||
    outputWidth < 1 ||
    outputHeight < 1 ||
    outputWidth > MAX_IMAGE_DIMENSION ||
    outputHeight > MAX_IMAGE_DIMENSION ||
    outputWidth * outputHeight > MAX_IMAGE_PIXELS
  ) {
    throw new Error("The requested output dimensions are too large for safe browser processing.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d", { alpha: true, colorSpace: "srgb" });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  // Shape cropping: pixels outside the selected shape stay transparent.
  if (
    settings.operation === "circle" ||
    settings.operation === "triangle-crop" ||
    settings.operation === "shape-crop"
  ) {
    ctx.beginPath();

    if (settings.operation === "circle") {
      const radius = Math.min(width, height) / 2;

      ctx.arc(
        width / 2,
        height / 2,
        radius,
        0,
        Math.PI * 2,
      );

      ctx.closePath();
    }

    if (settings.operation === "triangle-crop") {
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
    }

    if (settings.operation === "shape-crop") {
      ctx.moveTo(width * 0.25, 0);
      ctx.lineTo(width * 0.75, 0);
      ctx.lineTo(width, height * 0.5);
      ctx.lineTo(width * 0.75, height);
      ctx.lineTo(width * 0.25, height);
      ctx.lineTo(0, height * 0.5);
      ctx.closePath();
    }

    ctx.clip();
  }

  if (settings.operation === "border") {
    ctx.fillStyle = settings.borderColor || "#171717";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (settings.operation === "blur") {
    ctx.filter = `blur(${Math.max(
      0,
      Math.min(30, settings.blurAmount || 4),
    )}px)`;
  }

  if (settings.operation === "grayscale") {
    ctx.filter = "grayscale(1)";
  }

  if (settings.operation === "flip") {
    const angle = ((settings.rotation || 0) * Math.PI) / 180;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.scale(
      settings.flipX ? -1 : 1,
      settings.flipY ? -1 : 1,
    );
  }

  if (settings.operation === "rotate") {
    const angle = ((settings.rotation ?? 90) * Math.PI) / 180;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
  }

  if (settings.operation === "pixelate") {
    const small = document.createElement("canvas");
    const size = Math.max(2, Math.min(80, settings.pixelSize || 12));

    small.width = Math.max(1, Math.ceil(width / size));
    small.height = Math.max(1, Math.ceil(height / size));

    const smallCtx = small.getContext("2d", { colorSpace: "srgb" });
    if (!smallCtx) throw new Error("Canvas is unavailable.");

    smallCtx.drawImage(
      image, sx, sy, sw, sh, 0, 0, small.width, small.height,
    );

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  } else {
    const offset = border;

  if (
      settings.operation === "rotate" ||
      settings.operation === "flip"
    ) {
      ctx.drawImage(image, -srcW / 2, -srcH / 2, srcW, srcH);
    } else {
      ctx.drawImage(
        image, sx, sy, sw, sh,
        offset, offset, width, height,
      );
    }
  }

  if (settings.operation === "unblur") {
    sharpenImage(
      ctx,
      canvas.width,
      canvas.height,
      settings.sharpness ?? 1.2,
      settings.detailStrength ?? 0.25,
      settings.noiseReduction ?? 0.1,
    );
  }

  if (settings.operation === "text" && settings.text) {
    ctx.filter = "none";
    ctx.font = `600 ${Math.max(
      8,
      Math.min(240, settings.textSize || 36),
    )}px ${settings.textFont || "Arial"}`;
    ctx.fillStyle = settings.textColor || "#ffffff";
    ctx.textAlign = settings.textAlign || "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 3;
    ctx.fillText(
      settings.text,
      Math.max(0, Math.min(width, settings.textX ?? 24)),
      Math.max(0, Math.min(height, settings.textY ?? 24)),
      width,
    );
  }

  const exportCropOperations = [
    "crop",
    "square-crop",
    "aspect-ratio-crop",
    "triangle-crop",
    "shape-crop",
    "circle",
  ];
  const isTransparentShape = ["circle", "triangle-crop", "shape-crop"].includes(settings.operation);
  const type = isTransparentShape
    ? "image/png"
    : cropOperations.includes(settings.operation)
      ? settings.format || "image/png"
      : settings.operation === "compress" || settings.operation === "convert"
        ? settings.format || "image/webp"
        : "image/png";

  // JPEG has no alpha channel. Use a clean white matte rather than allowing
  // transparent canvas pixels to become browser-dependent black pixels.
  if (exportCropOperations.includes(settings.operation) && type === "image/jpeg") {
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  if (
    type === "image/png" &&
    (settings.operation === "compress" || settings.operation === "convert")
  ) {
    applyPngQuality(ctx, canvas.width, canvas.height, settings.quality ?? 0.82);
  }

  const blob = await canvasBlob(
    canvas,
    type,
    Math.max(0.1, Math.min(1, settings.quality ?? 0.82)),
  );

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    mime: blob.type || type,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Compose multiple images into a single PNG without uploading them anywhere. */
export async function processImages(
  files: File[],
  layout: "horizontal" | "vertical" = "horizontal",
): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error("Choose at least two images to combine.");
  }
  if (files.length > 20) {
    throw new Error("Choose no more than 20 images at once.");
  }
  files.forEach(validateImageFile);

  const images = await Promise.all(files.map(loadImage));
  const maxDimension = 12000;

  const scale = Math.min(
    1,
    maxDimension /
      Math.max(
        ...images.map((i) =>
          layout === "horizontal" ? i.naturalWidth : i.naturalHeight,
        ),
      ),
  );

  const dims = images.map((i) => ({
    w: Math.max(1, Math.round(i.naturalWidth * scale)),
    h: Math.max(1, Math.round(i.naturalHeight * scale)),
  }));

  const width =
    layout === "horizontal"
      ? dims.reduce((sum, d) => sum + d.w, 0)
      : Math.max(...dims.map((d) => d.w));

  const height =
    layout === "vertical"
      ? dims.reduce((sum, d) => sum + d.h, 0)
      : Math.max(...dims.map((d) => d.h));

  if (
    width > maxDimension ||
    height > maxDimension ||
    width * height > 80_000_000
  ) {
    throw new Error(
      "The combined image would be too large. Choose smaller images.",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { colorSpace: "srgb" });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let x = 0;
  let y = 0;

  images.forEach((image, index) => {
    const d = dims[index];
    ctx.drawImage(image, x, y, d.w, d.h);

    if (layout === "horizontal") x += d.w;
    else y += d.h;
  });

  const blob = await canvasBlob(canvas, "image/png", 1);

  return { blob, width, height, mime: blob.type || "image/png" };
}
