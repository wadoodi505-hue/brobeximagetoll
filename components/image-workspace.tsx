
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Download,
  RotateCcw,
  ShieldCheck,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  WandSparkles,
  Maximize2,
} from "lucide-react";
import type { ToolDefinition } from "@/types/tools";
import { removeImageBackground } from "@/lib/ai/remove-background";
import {
  formatBytes,
  processImage,
  processImages,
} from "@/lib/image/process";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 20;
const MAX_OUTPUT_PIXELS = 8_294_400;

// Fit the image inside a UHD 4K frame without stretching or cropping.
// Portrait images use the portrait equivalent of the same UHD frame.
function getUhdDimensions(sourceWidth: number, sourceHeight: number) {
  const portrait = sourceHeight > sourceWidth;
  const maxWidth = portrait ? 2160 : 3840;
  const maxHeight = portrait ? 3840 : 2160;

  const scale = Math.min(
    maxWidth / sourceWidth,
    maxHeight / sourceHeight,
    Math.sqrt(MAX_OUTPUT_PIXELS / (sourceWidth * sourceHeight)),
  );

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

type Metadata = {
  width: number;
  height: number;
  type: string;
  size: number;
};

type PreviewMode = "compare" | "original" | "enhanced";
export function ImageWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lock, setLock] = useState(true);
  const [quality, setQuality] = useState(tool.slug === "compress-image-size" ? 82 : 82);
  const [format, setFormat] = useState(tool.slug === "compress-image-size" ? "image/jpeg" : tool.outputMime || "image/webp");

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(800);
  const [cropH, setCropH] = useState(600);
  type CropMode = "crop" | "square-crop" | "aspect-ratio-crop" | "triangle-crop" | "shape-crop" | "circle";
  const [cropMode, setCropMode] = useState<CropMode>("crop");
  const [cropAspectRatio, setCropAspectRatio] = useState(16 / 9);
  const [cropFormat, setCropFormat] = useState("image/png");
  const [cropQuality, setCropQuality] = useState(92);
  const cropStageRef = useRef<HTMLDivElement>(null);

  const cropDragRef = useRef<{
    mode: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  function selectCropMode(next: CropMode, ratio = 16 / 9) {
    setCropMode(next);
    if (next === "aspect-ratio-crop") setCropAspectRatio(ratio);
    if (["circle", "triangle-crop", "shape-crop"].includes(next)) setCropFormat("image/png");
    if (width < 1 || height < 1) return;

    let nextW = width;
    let nextH = height;

    if (
      next === "square-crop" ||
      next === "circle" ||
      next === "triangle-crop" ||
      next === "shape-crop"
    ) {
      nextW = Math.min(width, height);
      nextH = nextW;
    } else if (next === "aspect-ratio-crop") {
      if (width / height > ratio) {
        nextH = height;
        nextW = Math.round(height * ratio);
      } else {
        nextW = width;
        nextH = Math.round(width / ratio);
      }
    }

    setCropW(nextW);
    setCropH(nextH);
    setCropX(Math.floor((width - nextW) / 2));
    setCropY(Math.floor((height - nextH) / 2));
  }

  function updateCropField(field: "x" | "y" | "width" | "height", rawValue: number) {
    if (!Number.isFinite(rawValue)) return;
    const value = Math.floor(rawValue);
    const ratio = cropMode === "aspect-ratio-crop" ? cropAspectRatio :
      ["square-crop", "circle", "triangle-crop", "shape-crop"].includes(cropMode) ? 1 : null;

    if (field === "x") {
      setCropX(Math.max(0, Math.min(Math.max(0, width - cropW), value)));
      return;
    }
    if (field === "y") {
      setCropY(Math.max(0, Math.min(Math.max(0, height - cropH), value)));
      return;
    }
    if (field === "width") {
      const maxWidth = Math.max(1, width - cropX);
      const maxByHeight = ratio ? Math.floor((height - cropY) * ratio) : maxWidth;
      const nextWidth = Math.max(1, Math.min(maxWidth, maxByHeight, value));
      setCropW(nextWidth);
      if (ratio) setCropH(Math.max(1, Math.min(height - cropY, Math.round(nextWidth / ratio))));
      return;
    }
    const maxHeight = Math.max(1, height - cropY);
    const maxByWidth = ratio ? Math.floor((width - cropX) / ratio) : maxHeight;
    const nextHeight = Math.max(1, Math.min(maxHeight, maxByWidth, value));
    setCropH(nextHeight);
    if (ratio) setCropW(Math.max(1, Math.min(width - cropX, Math.round(nextHeight * ratio))));
  }

  function beginCropDrag(
    event: React.PointerEvent,
    mode: string,
  ) {
    if (busy || !cropStageRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    cropDragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: cropX,
      y: cropY,
      w: cropW,
      h: cropH,
    };

    cropStageRef.current.setPointerCapture(event.pointerId);
  }

  function updateCropDrag(event: React.PointerEvent) {
    const drag = cropDragRef.current;
    const stage = cropStageRef.current;

    if (!drag || !stage || width < 1 || height < 1) return;

    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = ((event.clientX - drag.startX) / rect.width) * width;
    const dy = ((event.clientY - drag.startY) / rect.height) * height;
    const mode = drag.mode;

    if (mode === "move") {
      const x = Math.max(0, Math.min(width - drag.w, drag.x + dx));
      const y = Math.max(0, Math.min(height - drag.h, drag.y + dy));
      setCropX(Math.round(x));
      setCropY(Math.round(y));
      return;
    }

    const lockedRatio =
      cropMode === "square-crop" ||
      cropMode === "circle" ||
      cropMode === "triangle-crop" ||
      cropMode === "shape-crop"
        ? 1
        : cropMode === "aspect-ratio-crop"
          ? cropAspectRatio
          : null;

    let x = drag.x;
    let y = drag.y;
    let w = drag.w;
    let h = drag.h;

    if (!lockedRatio) {
      if (mode.includes("w")) {
        const right = drag.x + drag.w;
        x = Math.max(0, Math.min(right - 1, drag.x + dx));
        w = right - x;
      }
      if (mode.includes("e")) {
        w = Math.max(1, Math.min(width - drag.x, drag.w + dx));
      }
      if (mode.includes("n")) {
        const bottom = drag.y + drag.h;
        y = Math.max(0, Math.min(bottom - 1, drag.y + dy));
        h = bottom - y;
      }
      if (mode.includes("s")) {
        h = Math.max(1, Math.min(height - drag.y, drag.h + dy));
      }
    } else {
      const hasWest = mode.includes("w");
      const hasEast = mode.includes("e");
      const hasNorth = mode.includes("n");
      const hasSouth = mode.includes("s");
      const isCorner = (hasWest || hasEast) && (hasNorth || hasSouth);

      // Keep the opposite edge/corner anchored while resizing. Side handles
      // resize around the opposite side's center; corner handles keep the
      // opposite corner fixed.
      const anchorX = hasWest
        ? drag.x + drag.w
        : hasEast
          ? drag.x
          : drag.x + drag.w / 2;
      const anchorY = hasNorth
        ? drag.y + drag.h
        : hasSouth
          ? drag.y
          : drag.y + drag.h / 2;

      let targetW = drag.w;
      if (hasWest) targetW = drag.w - dx;
      if (hasEast) targetW = drag.w + dx;

      if (!hasWest && !hasEast) {
        const targetH = hasNorth ? drag.h - dy : drag.h + dy;
        targetW = targetH * lockedRatio;
      } else if (isCorner) {
        const targetH = hasNorth ? drag.h - dy : drag.h + dy;
        const widthFromHeight = targetH * lockedRatio;
        // Use the pointer's strongest movement so diagonal dragging feels
        // predictable without ever changing the selected aspect ratio.
        if (Math.abs(widthFromHeight - drag.w) > Math.abs(targetW - drag.w)) {
          targetW = widthFromHeight;
        }
      }

      const maxW = Math.min(
        hasWest ? anchorX : hasEast ? width - anchorX : 2 * Math.min(anchorX, width - anchorX),
        (hasNorth ? anchorY : hasSouth ? height - anchorY : 2 * Math.min(anchorY, height - anchorY)) * lockedRatio,
      );
      const minW = Math.min(24, maxW);
      targetW = Math.max(minW, Math.min(maxW, targetW));
      w = targetW;
      h = w / lockedRatio;

      if (hasWest) x = anchorX - w;
      else if (hasEast) x = anchorX;
      else x = anchorX - w / 2;

      if (hasNorth) y = anchorY - h;
      else if (hasSouth) y = anchorY;
      else y = anchorY - h / 2;
    }

    setCropX(Math.round(Math.max(0, Math.min(width - w, x))));
    setCropY(Math.round(Math.max(0, Math.min(height - h, y))));
    setCropW(Math.round(Math.max(1, Math.min(width, w))));
    setCropH(Math.round(Math.max(1, Math.min(height, h))));
  }
  function endCropDrag() {
    cropDragRef.current = null;
  }

  const [flipX, setFlipX] = useState(true);
  const [flipY, setFlipY] = useState(false);
  const [text, setText] = useState("");
  const [textSize, setTextSize] = useState(36);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textX, setTextX] = useState(24);
  const [textY, setTextY] = useState(24);
  const [textFont, setTextFont] = useState("Arial");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const textDragRef = useRef(false);
  const [borderWidth, setBorderWidth] = useState(12);
  const [borderColor, setBorderColor] = useState("#171717");
  const [pixelSize, setPixelSize] = useState(12);
  const [rotation, setRotation] = useState(0);
  const [blurAmount, setBlurAmount] = useState(4);

  // Automatic enhancement defaults: restrained sharpening and noise reduction.
  const [sharpness, setSharpness] = useState(1.25);
  const [detailStrength, setDetailStrength] = useState(0.3);
  const [noiseReduction, setNoiseReduction] = useState(0.12);

  // Professional before/after comparison.
  const [comparison, setComparison] = useState(50);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("compare");

  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const operationId = useRef(0);
  const autoCompressFileRef = useRef<File | null>(null);
  const compressionSettingsRef = useRef({ format, quality });

  const op = tool.slug === "crop-image" ? cropMode : (["blur-image", "blur-background", "remove-background-from-image", "make-background-transparent"].includes(tool.slug) ? "blur" : tool.operation);

  useEffect(() => {
    if (op !== "text" || !preview || !textCanvasRef.current) return;

    const canvas = textCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      if (!text) return;

      ctx.filter = "none";
      ctx.font = `600 ${Math.max(8, Math.min(240, textSize || 36))}px ${textFont}`;
      ctx.fillStyle = textColor || "#ffffff";
      ctx.textAlign = textAlign;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 3;

      ctx.fillText(
        text,
        Math.max(0, Math.min(width, textX)),
        Math.max(0, Math.min(height, textY)),
        width,
      );
    };

    image.src = preview;

    return () => {
      image.onload = null;
    };
  }, [
    op, preview, text, textSize, textColor, textFont,
    textAlign, textX, textY, width, height,
  ]);

  const rotationCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (op !== "flip" || !preview || !rotationCanvasRef.current) return;

    const canvas = rotationCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();

    image.onload = () => {
      const angle = ((rotation % 360) * Math.PI) / 180;
      const cosine = Math.abs(Math.cos(angle));
      const sine = Math.abs(Math.sin(angle));

      canvas.width = Math.max(
        1,
        Math.ceil(image.naturalWidth * cosine + image.naturalHeight * sine),
      );
      canvas.height = Math.max(
        1,
        Math.ceil(image.naturalWidth * sine + image.naturalHeight * cosine),
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

      ctx.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
        image.naturalWidth,
        image.naturalHeight,
      );
    };

    image.src = preview;

    return () => {
      image.onload = null;
    };
  }, [op, preview, rotation, flipX, flipY]);

  function beginTextDrag(event: React.PointerEvent<HTMLCanvasElement>) {
    if (busy || op !== "text" || !width || !height) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    event.preventDefault();

    const x = Math.round(((event.clientX - rect.left) / rect.width) * width);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * height);

    setTextX(Math.max(0, Math.min(width, x)));
    setTextY(Math.max(0, Math.min(height, y)));

    textDragRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateTextDrag(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!textDragRef.current || !width || !height) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.round(((event.clientX - rect.left) / rect.width) * width);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * height);

    setTextX(Math.max(0, Math.min(width, x)));
    setTextY(Math.max(0, Math.min(height, y)));
  }

  function endTextDrag() {
    textDragRef.current = false;
  }

  const canProcess = tool.status === "browser" && (!!op || ["blur-background", "remove-background-from-image", "make-background-transparent"].includes(tool.slug));

  // Revoke the previous preview/result URL whenever it changes or the
  // workspace unmounts. This also covers reset and replacement uploads.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result);
  }, [result]);

  function clearOutput() {
    operationId.current += 1;
    setResult("");
    setResultBlob(null);
    setError("");
    setMessage("");
    setMetadata(null);
    setPreviewMode("compare");
  }

  function validateImage(next: File): string | null {
    if (!next.size) return "The selected file is empty.";
    if (next.size > MAX_BYTES) {
      return "Maximum file size is 20 MB per image.";
    }
    if (!next.type.startsWith("image/")) {
      return "Choose a supported image file.";
    }
    return null;
  }

  function inspectImage(next: File) {
    const url = URL.createObjectURL(next);
    const image = new Image();

    image.onload = () => {
      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);
      setCropX(0);
      setCropY(0);
      setCropW(image.naturalWidth);
      setCropH(image.naturalHeight);
      setCropMode("crop");
      setCropAspectRatio(16 / 9);
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError(
        "The browser could not decode this image. Try PNG, JPEG or WebP.",
      );
    };

    image.src = url;
  }

  function selectFile(next: File | null) {
    if (busy) return;

    clearOutput();

    if (!next) {
      setFile(null);
      setFiles([]);
      setPreview("");
      return;
    }

    const validationError = validateImage(next);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setFile(next);
    setFiles([next]);
    setPreview(URL.createObjectURL(next));
    inspectImage(next);
  }

  function selectMultipleFiles(chosen: File[]) {
    if (busy) return;

    clearOutput();

    if (chosen.length > MAX_FILES) {
      setError(`Choose no more than ${MAX_FILES} images at once.`);
      return;
    }

    if (chosen.length === 0) return;

    const invalid = chosen.find((item) => validateImage(item));

    if (invalid) {
      setError(
        `${invalid.name}: every image must be a supported image no larger than 20 MB.`,
      );
      return;
    }

    setError("");
    setFiles(chosen);
    setFile(chosen[0]);
    setPreview(URL.createObjectURL(chosen[0]));
    inspectImage(chosen[0]);
  }

  function reset() {
    if (busy) return;

    clearOutput();
    setFiles([]);
    setFile(null);
    setPreview("");
    setError("");
    setMessage("");
    setComparison(50);
  }

  async function run() {
    if (!file || busy) return;

    const currentOperation = ++operationId.current;

    setBusy(true);
    setError("");
    setMessage("");
    setMetadata(null);

    try {
      if (op === "combine") {
        if (files.length < 2) {
          throw new Error("Choose at least two images to combine.");
        }

        const output = await processImages(
          files,
          tool.slug === "collage-maker" ? "vertical" : "horizontal",
        );

        if (currentOperation !== operationId.current) return;

        const nextUrl = URL.createObjectURL(output.blob);
        setResult(nextUrl);
        setResultBlob(output.blob);
        setMessage(
          `Combined ${files.length} images into ${output.width} × ${output.height} pixels.`,
        );
        return;
      }

      if (op === "metadata") {
        const image = new Image();
        image.src = preview;
        await image.decode();

        if (currentOperation !== operationId.current) return;

        setMetadata({
          width: image.naturalWidth,
          height: image.naturalHeight,
          type: file.type || "Unknown",
          size: file.size,
        });

        setMessage("Image properties read successfully.");
        return;
      }

            // Dedicated image-size compressor. It preserves the
      // original image dimensions and never crops or resizes.
      if (tool.slug === "compress-image-size") {
        const image = new Image();
        image.src = preview;
        await image.decode();

        if (currentOperation !== operationId.current) return;

        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        if (!naturalWidth || !naturalHeight) {
          throw new Error("Could not read the original image dimensions.");
        }

        if (naturalWidth * naturalHeight > 40000000) {
          throw new Error("This image is too large to process safely in your browser. Try an image under 40 megapixels.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Your browser could not create an image processing canvas.");
        }

        // JPEG has no transparency. Use white behind transparent pixels.
        if (format === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, naturalWidth, naturalHeight);
        }

        context.drawImage(image, 0, 0, naturalWidth, naturalHeight);

        const outputBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Image export failed. Try another format."));
                return;
              }

              if (blob.type !== format) {
                reject(new Error("Your browser could not export the selected format. Try another browser or format."));
                return;
              }

              resolve(blob);
            },
            format,
            format === "image/jpeg" ? quality / 100 : undefined,
          );
        });

        if (currentOperation !== operationId.current) return;

        const nextUrl = URL.createObjectURL(outputBlob);

        setResult(nextUrl);
        setResultBlob(outputBlob);
        setPreviewMode("compare");

        const savedPercent = Math.round(
          ((file.size - outputBlob.size) / file.size) * 100,
        );

        setMessage(
          `${format === "image/jpeg" ? "JPG" : "PNG"} export complete. ${formatBytes(outputBlob.size)} output at ${naturalWidth} × ${naturalHeight}px. ${savedPercent >= 0 ? `${savedPercent}% smaller` : `${Math.abs(savedPercent)}% larger`}.`,
        );

        return;
      }
// Browser AI segmentation powers transparent cutouts and background blur.
      if (["remove-background-from-image", "make-background-transparent", "blur-background"].includes(tool.slug)) {
        const cutout = await removeImageBackground(file);
        if (currentOperation !== operationId.current) return;
        let outputBlob: Blob = cutout;
        if (tool.slug === "blur-background") {
          const source = await createImageBitmap(file);
          const foreground = await createImageBitmap(cutout);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = source.width; canvas.height = source.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas is unavailable in this browser.");
            ctx.save(); ctx.filter = `blur(${Math.max(2, Math.min(40, blurAmount * 2))}px)`;
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height); ctx.restore();
            const subject = document.createElement("canvas");
            subject.width = canvas.width; subject.height = canvas.height;
            const subjectCtx = subject.getContext("2d");
            if (!subjectCtx) throw new Error("Could not create the subject layer.");
            subjectCtx.drawImage(source, 0, 0, subject.width, subject.height);
            subjectCtx.globalCompositeOperation = "destination-in";
            subjectCtx.drawImage(foreground, 0, 0, subject.width, subject.height);
            ctx.drawImage(subject, 0, 0);
            outputBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Background blur export failed.")), format, quality / 100));
          } finally { source.close(); foreground.close(); }
        }
        if (currentOperation !== operationId.current) return;
        const nextUrl = URL.createObjectURL(outputBlob);
        setResult(nextUrl); setResultBlob(outputBlob); setPreviewMode("compare");
        setMessage(tool.slug === "blur-background" ? `Background blurred and foreground preserved. Output: ${formatBytes(outputBlob.size)}.` : `Background removed. Transparent cutout created (${formatBytes(outputBlob.size)}).`);
        return;
      }

      if (!canProcess || !op) {
        throw new Error(
          "This tool does not have a browser operation configured.",
        );
      }

      let outputWidth = width;
      let outputHeight = height;

      // One-click UHD enhancement: upscale and sharpen in the same operation.
      if (op === "unblur") {
        const dimensions = getUhdDimensions(width, height);
        outputWidth = dimensions.width;
        outputHeight = dimensions.height;
      }

      const settings: Parameters<typeof processImage>[1] = {
        operation: op,
        width: outputWidth,
        height: outputHeight,
        quality: tool.slug === "crop-image" ? cropQuality / 100 : quality / 100,
        format: tool.slug === "crop-image" && ["circle", "triangle-crop", "shape-crop"].includes(cropMode) ? "image/png" : tool.slug === "crop-image" ? cropFormat : format,
        cropX,
        cropY,
        cropWidth: cropW,
        cropHeight: cropH,
        aspectRatio: cropAspectRatio,
        flipX,
        flipY,
        text,
        textSize,
        textColor,
        textX,
        textY,
        textFont,
        textAlign,
        borderWidth,
        borderColor,
        pixelSize,
        rotation,
        blurAmount,
        sharpness,
        detailStrength,
        noiseReduction,
      };

      const output = await processImage(file, settings);

      if (currentOperation !== operationId.current) return;

      const nextUrl = URL.createObjectURL(output.blob);
      setResult(nextUrl);
      setResultBlob(output.blob);
      setPreviewMode("compare");

      if (op === "unblur") {
        setMessage(
          `Enhancement complete: ${output.width} × ${output.height} pixels. PNG output · ${formatBytes(output.blob.size)}. Your image was processed locally.`,
        );
      } else if (tool.slug === "crop-image") {
        const outputFormat = output.mime === "image/jpeg" ? "JPG" : output.mime === "image/webp" ? "WebP" : "PNG";
        setMessage(
          `Crop complete · ${output.width} × ${output.height} px · ${outputFormat} · ${formatBytes(output.blob.size)}. Your original image is unchanged.`,
        );
      } else {
        setMessage(
          `Processed ${output.width} × ${output.height} pixels. Output: ${formatBytes(output.blob.size)}.`,
        );
      }
    } catch (e) {
      if (currentOperation !== operationId.current) return;

      setError(
        e instanceof Error
          ? e.message
          : "Processing failed. Try another image.",
      );
    } finally {
      if (currentOperation === operationId.current) {
        setBusy(false);
      }
    }
  }


  // Automatically compress uploaded images on the target-size tool.
  useEffect(() => {
    if (tool.slug !== "compress-image-size") return;

    if (!file) {
      autoCompressFileRef.current = null;
      return;
    }

    if (autoCompressFileRef.current === file) return;

    autoCompressFileRef.current = file;
    void run();
  }, [file, op, tool.slug]);
  // Re-run compression whenever the user changes JPG/PNG or quality.
  useEffect(() => {
    if (tool.slug !== "compress-image-size" || !file) return;

    const previous = compressionSettingsRef.current;

    if (previous.format === format && previous.quality === quality) return;

    compressionSettingsRef.current = { format, quality };

    clearOutput();
    void run();
  }, [format, quality]);
  const outputName = useMemo(() => {
    const mime = op === "unblur" ? "image/png" : resultBlob?.type || format;

    const extension =
      mime === "image/svg+xml"
        ? "svg"
        : mime === "image/jpeg"
          ? "jpg"
          : mime === "image/png"
            ? "png"
            : mime === "image/webp"
              ? "webp"
              : mime.split("/")[1] || "png";

    const baseName =
      file?.name.replace(/\.[^.]+$/, "") || "brobex-image";

    const suffix =
      tool.slug === "compress-image-size"
        ? "-compressed"
        : tool.slug === "crop-image"
          ? "-cropped"
          : op === "unblur"
            ? "-enhanced-4k"
            : "-processed";

    return `${baseName}${suffix}.${extension}`;
  }, [file, resultBlob, format, op, tool.slug]);

  const uhdDimensions = useMemo(
    () => (file ? getUhdDimensions(width, height) : null),
    [file, width, height],
  );

  return (
    <div className="workspace">
      <div className="workspace-top">
        <div>
          <span className="eyebrow">
            {op === "unblur" ? "BROBEX CLARITY STUDIO" : "BROWSER WORKSPACE"}
          </span>

          <h2>
            {op === "unblur"
              ? "Unblur & enhance to 4K"
              : tool.slug === "crop-image"
                ? "Upload an image to crop"
                : "Upload and process"}
          </h2>

          <p>
            {op === "unblur"
              ? "One-click sharpening, controlled noise reduction and UHD-sized export in your browser."
              : tool.slug === "crop-image"
                ? "Frame your image precisely with drag handles, aspect-ratio presets and pixel-level controls."
                : "Your image stays in this browser for supported operations."}
          </p>
        </div>

        <span className="privacy-chip">
          <ShieldCheck size={15} />
          Local processing
        </span>
      </div>

      <label
        className={`dropzone ${file ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (busy) return;

          const chosen = Array.from(event.dataTransfer.files);

          if (op === "combine") {
            selectMultipleFiles(chosen);
          } else {
            selectFile(chosen[0] || null);
          }
        }}
      >
        <input
          type="file"
          disabled={busy}
          multiple={op === "combine"}
          accept={tool.acceptedTypes.join(",")}
          onChange={(event) => {
            const chosen = Array.from(event.target.files || []);

            if (op === "combine") {
              selectMultipleFiles(chosen);
            } else {
              selectFile(chosen[0] || null);
            }

            event.currentTarget.value = "";
          }}
        />

        {file ? (
          <>
            <ImageIcon size={28} />
            <strong>
              {op === "combine"
                ? `${files.length} images selected`
                : file.name}
            </strong>
            <span>
              {op === "combine"
                ? files.map((item) => item.name).join(" · ")
                : `${formatBytes(file.size)} · ${file.type || "Unknown MIME type"}`}
            </span>
            <small>Click to choose another image</small>
          </>
        ) : (
          <>
            <UploadCloud size={30} />
            <strong>Drop an image here or browse files</strong>
            <span>Supported image formats · 20 MB maximum per image</span>
            <small>Your image is not uploaded to a server.</small>
          </>
        )}
      </label>

      {file && (
        <div className="file-facts">
          <span>
            Original: <b>{file.name}</b>
          </span>
          <span>
            Size: <b>{formatBytes(file.size)}</b>
          </span>
          <span>
            Type: <b>{file.type || "Unknown"}</b>
          </span>
        </div>
      )}
      {file && tool.slug === "compress-image-size" && (
        <section className="brobex-compressor">
          <div className="brobex-compressor-heading">
            <div>
              <span className="eyebrow">BROBEX IMAGE ENGINE</span>
              <h2>Image compression studio</h2>
              <p>Reduce image file size while preserving its original dimensions.</p>
            </div>
            <span className={`brobex-compressor-status ${busy ? "is-processing" : result ? "is-complete" : ""}`}>
              <span />
              {busy ? "Processing" : result ? "Completed" : "Ready"}
            </span>
          </div>

          <div className="brobex-compressor-controls">
            <label>
              <span>Output format</span>
              <select
                value={format}
                disabled={busy}
                onChange={(event) => setFormat(event.target.value)}
              >
                <option value="image/jpeg">JPG — Smaller file size</option>
                <option value="image/png">PNG — Preserve transparency</option>
              </select>
            </label>

            <label className="brobex-quality-control">
              <span>
                Image quality
                <strong>{`${quality}%`}</strong>
              </span>
              <input
                type="range"
                min="20"
                max="100"
                step="1"
                value={quality}
                disabled={busy}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
              <small>
                {format === "image/png" ? "PNG remains lossless as a file format; lower settings apply controlled color reduction while preserving transparency." : "Higher quality keeps more image detail and may produce a larger file."}
              </small>
            </label>
          </div>

          <div className="brobex-compressor-previews">
            <article className="brobex-compressor-image">
              <div className="brobex-compressor-image-heading">
                <span>ORIGINAL IMAGE</span>
                <strong>{formatBytes(file.size)}</strong>
              </div>
              <div className="brobex-compressor-image-stage">
                <img src={preview} alt="Original uploaded image" />
              </div>
              <div className="brobex-compressor-image-footer">
                <span>{width} × {height} px</span>
                <span>{file.type || "Original format"}</span>
              </div>
            </article>

            <article className="brobex-compressor-image">
              <div className="brobex-compressor-image-heading">
                <span>COMPRESSED IMAGE</span>
                <strong>{resultBlob ? formatBytes(resultBlob.size) : "Waiting..."}</strong>
              </div>
              <div className="brobex-compressor-image-stage">
                {result ? (
                  <img src={result} alt="Compressed image preview" />
                ) : (
                  <div className="brobex-compressor-placeholder">
                    <ImageIcon size={34} />
                    <strong>{busy ? "Compressing image..." : "Your result will appear here"}</strong>
                    <span>Choose a format to generate your preview.</span>
                  </div>
                )}
              </div>
              <div className="brobex-compressor-image-footer">
                <span>{resultBlob ? `${width} × ${height} px` : "Original dimensions preserved"}</span>
                <span>{resultBlob ? (format === "image/jpeg" ? "JPG" : "PNG") : "No output yet"}</span>
              </div>
            </article>
          </div>

          <div className="brobex-compressor-metrics">
            <div>
              <span>Original size</span>
              <strong>{formatBytes(file.size)}</strong>
            </div>
            <div>
              <span>Compressed size</span>
              <strong>{resultBlob ? formatBytes(resultBlob.size) : "—"}</strong>
            </div>
            <div>
              <span>Space saved</span>
              <strong>
                {resultBlob
                  ? `${Math.round(((file.size - resultBlob.size) / file.size) * 100)}%`
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="brobex-compressor-actions">
            {resultBlob && result && (
              <a
                className="button button-dark download-button"
                href={result}
                download={outputName}
              >
                <Download size={16} />
                Download {format === "image/jpeg" ? "JPG" : "PNG"}
              </a>
            )}
            {busy && <span className="brobex-compressor-progress">Please keep this tab open while processing.</span>}
          </div>

          {message && (
            <p className="notice success" role="status">
              <CheckCircle2 size={16} />
              {message}
            </p>
          )}

          {error && (
            <p className="notice error" role="alert">
              <AlertCircle size={16} />
              {error}
            </p>
          )}

          <p className="brobex-compressor-privacy">
            <ShieldCheck size={15} />
            Processed locally in your browser. Your image is not uploaded to a server.
          </p>
        </section>
      )}

      {file && tool.slug !== "compress-image-size" && (
        <div className="workspace-columns">
          <div
            className={`preview-panel ${op === "unblur" ? "unblur-preview-panel" : ""}`}
          >
            {op === "unblur" ? (
              <>
                <div className="preview-sticky-region unblur-sticky-region">
                <div className="unblur-preview-header">
                  <div>
                    <span className="eyebrow">IMAGE RESTORATION STUDIO</span>
                    <h3>Clarity preview</h3>
                    <p>
                      Review the original and enhanced image before downloading.
                    </p>
                  </div>

                  <span className="unblur-status">
                    <span className="unblur-status-dot" />
                    {busy ? "Enhancing" : result ? "Enhanced" : "Ready"}
                  </span>
                </div>

                <div
                  className="unblur-mode-switch"
                  role="group"
                  aria-label="Image preview mode"
                >
                  {(
                    [
                      ["compare", "Compare"],
                      ["original", "Original"],
                      ["enhanced", "Enhanced"],
                    ] as [PreviewMode, string][]
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      className={previewMode === mode ? "active" : ""}
                      aria-pressed={previewMode === mode}
                      disabled={mode === "enhanced" && !result}
                      onClick={() => setPreviewMode(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="unblur-comparison">
                  {previewMode === "original" || !result ? (
                    <img src={preview} alt="Original image preview" />
                  ) : previewMode === "enhanced" ? (
                    <img src={result} alt="Enhanced image preview" />
                  ) : (
                    <>
                      <img src={preview} alt="Original image comparison" />

                      <div
                        className="unblur-comparison-result"
                        style={{
                          clipPath: `inset(0 0 0 ${comparison}%)`,
                        }}
                      >
                        <img src={result} alt="Enhanced image comparison" />
                      </div>

                      <div
                        className="unblur-comparison-divider"
                        style={{ left: `${comparison}%` }}
                        aria-hidden="true"
                      >
                        <span>↔</span>
                      </div>
                    </>
                  )}

                  </div>

                {previewMode === "compare" && result && (
                    <>
                      <span className="unblur-image-label original-label">
                        ORIGINAL
                      </span>
                      <span className="unblur-image-label enhanced-label">
                        ENHANCED
                      </span>
                    </>
                  )}

                  {busy && (
                    <div className="unblur-processing-overlay" role="status">
                      <span className="unblur-spinner" />
                      <strong>Enhancing image…</strong>
                      <span>Keep this tab open until processing finishes.</span>
                    </div>
                  )}
                </div>

                {previewMode === "compare" && result && (
                  <label className="unblur-comparison-control">
                    <span>Comparison position</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={comparison}
                      onChange={(event) =>
                        setComparison(Number(event.target.value))
                      }
                      aria-label="Move comparison divider"
                    />
                  </label>
                )}

                <div className="unblur-preview-footer">
                  <span>{formatBytes(file.size)} original</span>
                  <span>
                    {resultBlob
                      ? `${formatBytes(resultBlob.size)} enhanced`
                      : "Enhance to compare results"}
                  </span>
                </div>

                {resultBlob && uhdDimensions && (
                  <div className="unblur-output-specs">
                    <div>
                      <Maximize2 size={16} />
                      <span>
                        <strong>
                          {uhdDimensions.width} × {uhdDimensions.height}
                        </strong>
                        <small>UHD-frame output dimensions</small>
                      </span>
                    </div>
                    <div>
                      <ShieldCheck size={16} />
                      <span>
                        <strong>PNG export</strong>
                        <small>Lossless output encoding</small>
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="preview-sticky-region">
                  {tool.slug === "crop-image" && (
                    <div className="crop-mode-selector" aria-label="Choose crop shape">
                      {[
                        { key: "free", mode: "crop" as CropMode, label: "Free", icon: "free" },
                        { key: "square", mode: "square-crop" as CropMode, label: "1:1 Square", icon: "square" },
                        { key: "16-9", mode: "aspect-ratio-crop" as CropMode, ratio: 16 / 9, label: "16:9", icon: "wide" },
                        { key: "9-16", mode: "aspect-ratio-crop" as CropMode, ratio: 9 / 16, label: "9:16", icon: "tall" },
                        { key: "4-5", mode: "aspect-ratio-crop" as CropMode, ratio: 4 / 5, label: "4:5", icon: "tall" },
                        { key: "4-3", mode: "aspect-ratio-crop" as CropMode, ratio: 4 / 3, label: "4:3", icon: "wide" },
                        { key: "3-2", mode: "aspect-ratio-crop" as CropMode, ratio: 3 / 2, label: "3:2", icon: "wide" },
                        { key: "triangle", mode: "triangle-crop" as CropMode, label: "Triangle", icon: "triangle" },
                        { key: "hexagon", mode: "shape-crop" as CropMode, label: "Hexagon", icon: "hexagon" },
                        { key: "circle", mode: "circle" as CropMode, label: "Circle", icon: "circle" },
                      ].map((preset) => {
                        const active = cropMode === preset.mode && (preset.mode !== "aspect-ratio-crop" || cropAspectRatio === preset.ratio);
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            className={`crop-mode-button ${active ? "active" : ""}`}
                            disabled={busy}
                            aria-pressed={active}
                            onClick={() => selectCropMode(preset.mode, preset.ratio)}
                          >
                            <svg viewBox="0 0 32 32" aria-hidden="true">
                              {preset.icon === "circle" ? <circle cx="16" cy="16" r="11" /> :
                               preset.icon === "triangle" ? <polygon points="16,4 28,27 4,27" /> :
                               preset.icon === "hexagon" ? <polygon points="9,4 23,4 30,16 23,28 9,28 2,16" /> :
                               preset.icon === "square" ? <rect x="5" y="5" width="22" height="22" rx="2" /> :
                               preset.icon === "tall" ? <rect x="8" y="3" width="16" height="26" rx="2" /> :
                               preset.icon === "wide" ? <rect x="3" y="8" width="26" height="16" rx="2" /> :
                               <rect x="3" y="3" width="26" height="26" rx="2" />}
                            </svg>
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="panel-heading">
                    {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop", "circle"].includes(op || "") ? "Interactive crop editor" : "Original preview"}
                  </div>

                  {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop", "circle"].includes(op || "") && preview ? (
                    <>
                      <div className="crop-editor-viewport">
                        <div
                          ref={cropStageRef}
                          className="crop-editor-stage"
                          onPointerMove={updateCropDrag}
                          onPointerUp={endCropDrag}
                          onPointerCancel={endCropDrag}
                          onLostPointerCapture={endCropDrag}
                        >
                          <img
                            src={preview}
                            alt="Drag the crop frame to select the image area"
                            draggable={false}
                          />

                          <div
                            className={`crop-selection crop-selection-${cropMode}`}
                            data-crop-mode={cropMode}
                            role="group"
                            tabIndex={0}
                            aria-label="Crop selection. Use arrow keys to move the crop area; hold Shift to move faster."
                            onKeyDown={(event) => {
                              const step = event.shiftKey ? 10 : 1;
                              if (event.key === "ArrowLeft") { event.preventDefault(); setCropX((value) => Math.max(0, value - step)); }
                              if (event.key === "ArrowRight") { event.preventDefault(); setCropX((value) => Math.min(width - cropW, value + step)); }
                              if (event.key === "ArrowUp") { event.preventDefault(); setCropY((value) => Math.max(0, value - step)); }
                              if (event.key === "ArrowDown") { event.preventDefault(); setCropY((value) => Math.min(height - cropH, value + step)); }
                            }}
                            style={{
                              clipPath: cropMode === "circle" ? "circle(50%)" : cropMode === "triangle-crop" ? "polygon(50% 0%, 100% 100%, 0% 100%)" : cropMode === "shape-crop" ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" : "none",
                              left: `${(cropX / Math.max(1, width)) * 100}%`,
                              top: `${(cropY / Math.max(1, height)) * 100}%`,
                              width: `${(cropW / Math.max(1, width)) * 100}%`,
                              height: `${(cropH / Math.max(1, height)) * 100}%`,
                            }}
                            onPointerDown={(event) => beginCropDrag(event, "move")}
                          >
                            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(
                              (handle) => (
                                <span
                                  key={handle}
                                  className={`crop-handle crop-handle-${handle}`}
                                  onPointerDown={(event) => beginCropDrag(event, handle)}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="crop-dimensions">
                        <span>Selected area</span>
                        <strong>{cropW} × {cropH} px</strong>
                        <span>
                          Position: {cropX}, {cropY}
                        </span>
                      </div>

                      <p className="hint">
                        Drag inside the frame to move it; drag an edge or corner to resize. Focus the frame and use arrow keys to nudge 1 px, or Shift + arrow for 10 px.
                      </p>
                    </>
                  ) : (
                    <div className="preview-canvas">
                      {op === "text" && preview ? (
                          <canvas
                            ref={textCanvasRef}
                            className="text-editor-canvas"
                            aria-label="Live text editor preview. Click or drag to position text."
                            onPointerDown={beginTextDrag}
                            onPointerMove={updateTextDrag}
                            onPointerUp={endTextDrag}
                            onPointerCancel={endTextDrag}
                            onLostPointerCapture={endTextDrag}
                          />
                        ) : op === "flip" && preview ? (
                          <canvas
                            ref={rotationCanvasRef}
                            className="flip-rotation-canvas"
                            aria-label="Live rotated and flipped image preview"
                          />
                        ) : (
                          <img src={preview} alt="Original selected image" />
                        )}
                    </div>
                  )}
                  {!(["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop", "circle"].includes(op || "")) && (
                    <div className={`preview-canvas ${op === "text" || op === "flip" ? "text-editor-hidden-preview" : ""}`}>
                      {preview && (
                        <div className="crop-preview-stage">
                          <img src={preview} alt="Live image preview" />
                        </div>
                      )}
                    </div>
                  )}

                </div>

                  {op === "flip" && (
                    <section className="flip-rotation-controls">
                      <div className="flip-rotation-heading">
                        <div>
                          <span className="eyebrow">TRANSFORM CONTROLS</span>
                          <strong>Rotate image</strong>
                          <small>Adjust the angle and preview your changes instantly.</small>
                        </div>
                        <output>{rotation}°</output>
                      </div>

                      <input
                        className="flip-rotation-slider"
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={rotation}
                        disabled={busy}
                        onChange={(event) => setRotation(Number(event.target.value))}
                        aria-label="Image rotation angle"
                      />

                      <div className="flip-rotation-scale">
                        <span>0°</span>
                        <span>90°</span>
                        <span>180°</span>
                        <span>270°</span>
                        <span>360°</span>
                      </div>

                      <div className="flip-rotation-presets">
                        {[0, 90, 180, 270, 360].map((angle) => (
                          <button
                            key={angle}
                            type="button"
                            className={rotation === angle ? "active" : ""}
                            aria-pressed={rotation === angle}
                            disabled={busy}
                            onClick={() => setRotation(angle)}
                          >
                            {angle}°
                          </button>
                        ))}

                        <button
                          type="button"
                          className="flip-rotation-reset"
                          disabled={busy}
                          onClick={() => {
                            setRotation(0);
                            setFlipX(false);
                            setFlipY(false);
                          }}
                        >
                          <RotateCcw size={14} />
                          Reset
                        </button>
                      </div>
                    </section>
                  )}



              </>
            )}
          </div>

          <div className="settings-panel">
            {tool.slug !== "compress-image-size" && <h3>{op === "unblur" ? "Enhancement settings" : "Settings"}</h3>}

            {op === "unblur" && (
              <div className="unblur-settings">
                <div className="unblur-heading">
                  <Sparkles size={18} />
                  <div>
                    <strong>Automatic clarity enhancement</strong>
                    <p className="hint">
                      Recommended values are selected for a balanced first pass.
                    </p>
                  </div>
                </div>

                <div className="unblur-quick-preset">
                  <span>Processing preset</span>
                  <strong>Balanced · UHD frame</strong>
                  <small>
                    Sharpening and noise reduction run together in one action.
                  </small>
                </div>

                <label>
                  Sharpness: {sharpness.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.05"
                    value={sharpness}
                    disabled={busy}
                    onChange={(event) =>
                      setSharpness(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Detail enhancement: {detailStrength.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={detailStrength}
                    disabled={busy}
                    onChange={(event) =>
                      setDetailStrength(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Noise reduction: {noiseReduction.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.02"
                    value={noiseReduction}
                    disabled={busy}
                    onChange={(event) =>
                      setNoiseReduction(Number(event.target.value))
                    }
                  />
                </label>

                <p className="hint">
                  More sharpening can create halos around edges. Strong noise
                  reduction can remove fine texture. Adjust the controls and
                  run enhancement again to apply changes.
                </p>

                {uhdDimensions && (
                  <div className="unblur-target">
                    <span>Target output</span>
                    <strong>
                      {uhdDimensions.width} × {uhdDimensions.height} px
                    </strong>
                    <small>
                      Aspect ratio preserved · Maximum 3840 × 2160 landscape
                      frame or 2160 × 3840 portrait frame
                    </small>
                  </div>
                )}
              </div>
            )}

            {op === "resize" && (
              <>
                <label>
                  Width (px)
                  <input
                    type="number"
                    min="1"
                    max="12000"
                    value={width}
                    onChange={(event) => {
                      const nextWidth = Number(event.target.value);

                      if (!Number.isFinite(nextWidth)) return;

                      if (lock && width > 0) {
                        setHeight(
                          Math.max(
                            1,
                            Math.round(nextWidth * (height / width)),
                          ),
                        );
                      }

                      setWidth(nextWidth);
                    }}
                  />
                </label>

                <label>
                  Height (px)
                  <input
                    type="number"
                    min="1"
                    max="12000"
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value))}
                  />
                </label>

                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={lock}
                    onChange={(event) => setLock(event.target.checked)}
                  />
                  Keep proportions
                </label>
              </>
            )}

            {op === "compress" && tool.slug !== "compress-image-size" && (
              <>
                <label>
                  Output format
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value)}
                  >
                    <option value="image/webp">WebP</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                  </select>
                </label>

                <label>
                  Quality: {quality}%
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                  />
                </label>
              </>
            )}

            {op === "convert" && (
              <label>
                Output format
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </label>
            )}


            {tool.slug === "crop-image" && (
              <section className="crop-controls" aria-labelledby="crop-settings-title">
                <div className="crop-controls-heading">
                  <span className="eyebrow">PRECISE FRAMING</span>
                  <strong id="crop-settings-title">Crop dimensions</strong>
                  <span>Fine-tune the selection using exact source-image pixels.</span>
                </div>

                <div className="crop-coordinate-grid">
                  {[
                    { label: "X position", value: cropX, max: Math.max(0, width - cropW) },
                    { label: "Y position", value: cropY, max: Math.max(0, height - cropH) },
                    { label: "Width", value: cropW, max: Math.max(1, width - cropX) },
                    { label: "Height", value: cropH, max: Math.max(1, height - cropY) },
                  ].map((field) => (
                    <label key={field.label}>
                      <span>{field.label}</span>
                      <div className="crop-number-field">
                        <input
                          type="number"
                          min={field.label.includes("position") ? 0 : 1}
                          max={field.max}
                          step="1"
                          value={field.value}
                          disabled={busy}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            if (!Number.isFinite(parsed)) return;
                            const key = field.label === "X position" ? "x" : field.label === "Y position" ? "y" : field.label === "Width" ? "width" : "height";
                            updateCropField(key, parsed);
                          }}
                        />
                        <small>px</small>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="crop-output-summary">
                  <span>Output dimensions</span>
                  <strong>{cropW} × {cropH} px</strong>
                  <span>Source: {width} × {height} px</span>
                </div>

                <div className="crop-export-settings">
                  <label>
                    <span>Export format</span>
                    <select
                      value={cropFormat}
                      onChange={(event) => setCropFormat(event.target.value)}
                      disabled={busy || ["circle", "triangle-crop", "shape-crop"].includes(cropMode)}
                    >
                      <option value="image/png">PNG · Lossless</option>
                      <option value="image/jpeg">JPG · Smaller file</option>
                      <option value="image/webp">WebP · Efficient</option>
                    </select>
                  </label>
                  {!["circle", "triangle-crop", "shape-crop"].includes(cropMode) && cropFormat !== "image/png" && (
                    <label className="crop-quality-control">
                      <span>Quality <strong>{cropQuality}%</strong></span>
                      <input type="range" min="50" max="100" step="1" value={cropQuality} onChange={(event) => setCropQuality(Number(event.target.value))} disabled={busy} />
                    </label>
                  )}
                  {["circle", "triangle-crop", "shape-crop"].includes(cropMode) && (
                    <p className="crop-transparency-note">Shaped crops are exported as PNG to preserve transparent corners.</p>
                  )}
                </div>

                <div className="crop-actions">
                  <button
                    type="button"
                    className="button button-light"
                    disabled={busy}
                    onClick={() => {
                      setCropX(0);
                      setCropY(0);
                      setCropW(width);
                      setCropH(height);
                      setCropMode("crop");
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset crop
                  </button>
                  <span>Drag the frame to reposition it</span>
                </div>
              </section>
            )}

            {op === "flip" && (
              <>
                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={flipX}
                    onChange={(event) => setFlipX(event.target.checked)}
                  />
                  Flip horizontally
                </label>

                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={flipY}
                    onChange={(event) => setFlipY(event.target.checked)}
                  />
                  Flip vertically
                </label>
              </>
            )}



            {op === "pixelate" && (
              <label>
                Pixel block size: {pixelSize}px
                <input
                  type="range"
                  min="2"
                  max="80"
                  value={pixelSize}
                  onChange={(event) =>
                    setPixelSize(Number(event.target.value))
                  }
                />
              </label>
            )}

            {op === "text" && (
              <>
                <label>
                  Overlay text
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={120}
                  />
                </label>

                <label>
                  Text size
                  <input
                    type="number"
                    min="8"
                    max="240"
                    value={textSize}
                    onChange={(event) =>
                      setTextSize(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Text color
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                  />
                </label>

                <label>
                  Font family
                  <select
                    value={textFont}
                    onChange={(event) => setTextFont(event.target.value)}
                    disabled={busy}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                  </select>
                </label>

                <label>
                  Text alignment
                  <select
                    value={textAlign}
                    onChange={(event) =>
                      setTextAlign(event.target.value as "left" | "center" | "right")
                    }
                    disabled={busy}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>

                <div className="settings-grid text-position-controls">
                  <label>
                    Horizontal position (X)
                    <input
                      type="number"
                      min="0"
                      max={width}
                      value={textX}
                      disabled={busy}
                      onChange={(event) =>
                        setTextX(Math.max(0, Math.min(width, Number(event.target.value) || 0)))
                      }
                    />
                  </label>

                  <label>
                    Vertical position (Y)
                    <input
                      type="number"
                      min="0"
                      max={height}
                      value={textY}
                      disabled={busy}
                      onChange={(event) =>
                        setTextY(Math.max(0, Math.min(height, Number(event.target.value) || 0)))
                      }
                    />
                  </label>
                </div>

                <p className="hint">
                  Click anywhere on the image to position your text, then drag to fine-tune it.
                  Coordinates are measured in original image pixels.
                </p>
              </>
            )}

            {op === "border" && (
              <>
                <label>
                  Border width
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={borderWidth}
                    onChange={(event) =>
                      setBorderWidth(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Border color
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(event) => setBorderColor(event.target.value)}
                  />
                </label>
              </>
            )}

            {op === "blur" && tool.slug !== "remove-background-from-image" && tool.slug !== "make-background-transparent" && (
              <label>
                Blur amount: {blurAmount}px
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={blurAmount}
                  onChange={(event) =>
                    setBlurAmount(Number(event.target.value))
                  }
                />
              </label>
            )}

            {op === "metadata" && (
              <p className="hint">
                Reads image dimensions, MIME type and file size. Full EXIF
                metadata is not available through every browser.
              </p>
            )}

            {!op && (
              <p className="hint">
                This tool does not have a browser operation configured.
              </p>
            )}

            <div className="workspace-actions">
              <button
                type="button"
                className={`button button-dark ${tool.slug === "compress-image-size" ? "auto-compress-hidden" : ""}`}
                onClick={run}
                disabled={
                  busy ||
                  !file ||
                  (op === "combine" && files.length < 2) ||
                  !canProcess
                }
              >
                {busy ? (
                  "Processing…"
                ) : op === "metadata" ? (
                  "Read metadata"
                ) : op === "combine" ? (
                  "Combine images"
                ) : op === "unblur" ? (
                  <>
                    <WandSparkles size={16} />
                    Enhance to 4K
                  </>
                ) : tool.slug === "crop-image" ? (
                  "Crop image"
                ) : (
                  "Process image"
                )}
              </button>

              <button
                type="button"
                className="button button-light"
                onClick={reset}
                disabled={busy}
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>

            {resultBlob && result && (
              <a
                className="button button-dark download-button"
                href={result}
                download={outputName}
              >
                <Download size={16} />
                {op === "png-to-svg"
                  ? "Download SVG file"
                  : tool.slug === "crop-image"
                    ? "Download cropped image"
                    : tool.slug === "compress-image-size"
                      ? "Download compressed image"
                      : "Download processed image"}
              </a>
            )}

            {message && (
              <p className="notice success" role="status">
                <CheckCircle2 size={16} />
                {message}
              </p>
            )}

            {error && (
              <p className="notice error" role="alert">
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {metadata && (
              <div className="metadata-card">
                <h4>Image properties</h4>
                <p>
                  Dimensions: {metadata.width} × {metadata.height}px
                </p>
                <p>MIME type: {metadata.type}</p>
                <p>File size: {formatBytes(metadata.size)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tool.status === "integration" && (
        <div className="integration-notice">
          <span className="integration-icon">
            <WandIcon />
          </span>

          <div>
            <h3>Integration Required</h3>
            <p>
              This tool needs a provider or specialist codec that is not
              configured. No fake processing result will be generated.
            </p>
            <p className="hint">
              Required path: <code>{tool.method}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function WandIcon() {
  return <span aria-hidden="true">✳</span>;
}






