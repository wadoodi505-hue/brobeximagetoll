
"use client";

import { useEffect, useRef, useState } from "react";
import {
    UploadCloud,
    Download,
    RotateCcw,
    ShieldCheck,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
    WandSparkles,
    SlidersHorizontal,
    Sparkles,
    ArrowLeftRight,
    Info,
} 
from "lucide-react";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_INPUT_PIXELS = 30_000_000;
const MAX_OUTPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 24_000;

type OutputFormat = "image/webp" | "image/jpeg" | "image/png";

type GradeSettings = {
    brightness: number;
    contrast: number;
    saturation: number;
    vibrance: number;
    warmth: number;
    sharpness: number;
};

type PresetName = "Natural" | "Vivid" | "Portrait" | "Cinematic" | "Custom";

const PRESETS: Record<Exclude<PresetName, "Custom">, GradeSettings> = {
    Natural: {
        brightness: 100,
        contrast: 106,
        saturation: 106,
        vibrance: 12,
        warmth: 0,
        sharpness: 22,
    },
    Vivid: {
        brightness: 101,
        contrast: 114,
        saturation: 119,
        vibrance: 28,
        warmth: 2,
        sharpness: 36,
    },
    Portrait: {
        brightness: 102,
        contrast: 103,
        saturation: 103,
        vibrance: 8,
        warmth: 3,
        sharpness: 12,
    },
    Cinematic: {
        brightness: 98,
        contrast: 118,
        saturation: 94,
        vibrance: 8,
        warmth: 5,
        sharpness: 26,
    },
};

const DEFAULT_GRADE = PRESETS.Natural;

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionFor(type: string): string {
    if (type === "image/jpeg") return "jpg";
    if (type === "image/webp") return "webp";
    return "png";
}

function decodeImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
                new Error(
                    "This image could not be decoded. Try a PNG, JPEG, or WebP image."
                )
            );
        };

        image.src = url;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    format: OutputFormat,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(
                        new Error(
                            "The browser could not export this image. Try a smaller scale or another format."
                        )
                    );
                    return;
                }

                if (format !== "image/png" && blob.type !== format) {
                    reject(
                        new Error(
                            `Your browser could not export ${format}. Choose WebP, JPEG, or PNG as supported by your browser.`
                        )
                    );
                    return;
                }

                resolve(blob);
            },
            format,
            quality
        );
    });
}

function clamp(value: number, min = 0, max = 255): number {
    return Math.max(min, Math.min(max, value));
}

function settingsEqual(a: GradeSettings, b: GradeSettings): boolean {
    return (
        a.brightness === b.brightness &&
        a.contrast === b.contrast &&
        a.saturation === b.saturation &&
        a.vibrance === b.vibrance &&
        a.warmth === b.warmth &&
        a.sharpness === b.sharpness
    );
}

function detectPreset(settings: GradeSettings): PresetName {
    for (const name of ["Natural", "Vivid", "Portrait", "Cinematic"] as const) {
        if (settingsEqual(settings, PRESETS[name])) return name;
    }
    return "Custom";
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Applies real pixel-level color adjustments and cross-kernel sharpening
 * to a working canvas. This is conventional image processing, not AI.
 */
async function applyImageEnhancement(
    source: HTMLImageElement,
    settings: GradeSettings
): Promise<HTMLCanvasElement> {
    const width = source.naturalWidth;
    const height = source.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
        willReadFrequently: true,
    });

    if (!context) {
        throw new Error("Canvas processing is unavailable in this browser.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // Perform tonal and base color adjustments through the browser's
    // optimized canvas rendering pipeline.
    context.filter = [
        `brightness(${settings.brightness}%)`,
        `contrast(${settings.contrast}%)`,
        `saturate(${settings.saturation}%)`,
    ].join(" ");

    context.drawImage(source, 0, 0, width, height);
    context.filter = "none";

    if (
        settings.vibrance === 0 &&
        settings.warmth === 0 &&
        settings.sharpness === 0
    ) {
        return canvas;
    }

    let imageData: ImageData;

    try {
        imageData = context.getImageData(0, 0, width, height);
    } catch {
        canvas.width = 1;
        canvas.height = 1;
        throw new Error(
            "There is not enough browser memory to enhance this image. Try a smaller image."
        );
    }

    const pixels = imageData.data;

    // Keep the original processed pixels intact while sharpening.
    // This avoids feeding already-modified pixels into neighboring calculations.
    let originalPixels: Uint8ClampedArray | null = null;

    if (settings.sharpness > 0) {
        try {
            originalPixels = new Uint8ClampedArray(pixels);
        } catch {
            canvas.width = 1;
            canvas.height = 1;
            throw new Error(
                "There is not enough memory for sharpening. Try a smaller image or set sharpening to 0."
            );
        }
    }

    const vibranceAmount = settings.vibrance / 100;
    const warmthAmount = settings.warmth * 0.35;
    const sharpnessAmount = settings.sharpness / 100;

    // Yield periodically so the browser can keep the interface responsive.
    const rowsPerBatch = 48;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            if (pixels[i + 3] === 0) continue;

            let r = pixels[i];
            let g = pixels[i + 1];
            let b = pixels[i + 2];

            if (originalPixels && sharpnessAmount > 0) {
                const left = (y * width + Math.max(0, x - 1)) * 4;
                const right = (y * width + Math.min(width - 1, x + 1)) * 4;
                const top = (Math.max(0, y - 1) * width + x) * 4;
                const bottom = (Math.min(height - 1, y + 1) * width + x) * 4;

                const sourceR = originalPixels[i];
                const sourceG = originalPixels[i + 1];
                const sourceB = originalPixels[i + 2];

                const neighborR =
                    (originalPixels[left] +
                        originalPixels[right] +
                        originalPixels[top] +
                        originalPixels[bottom]) /
                    4;

                const neighborG =
                    (originalPixels[left + 1] +
                        originalPixels[right + 1] +
                        originalPixels[top + 1] +
                        originalPixels[bottom + 1]) /
                    4;

                const neighborB =
                    (originalPixels[left + 2] +
                        originalPixels[right + 2] +
                        originalPixels[top + 2] +
                        originalPixels[bottom + 2]) /
                    4;

                r = sourceR + (sourceR - neighborR) * sharpnessAmount * 1.6;
                g = sourceG + (sourceG - neighborG) * sharpnessAmount * 1.6;
                b = sourceB + (sourceB - neighborB) * sharpnessAmount * 1.6;
            }

            // Vibrance protects already-saturated colors more than muted colors.
            if (vibranceAmount !== 0) {
                const average = (r + g + b) / 3;
                const maxChannel = Math.max(r, g, b);
                const saturationHeadroom = 255 - maxChannel;
                const vibranceFactor =
                    vibranceAmount *
                    (1 - Math.min(1, saturationHeadroom / 255));

                r += (r - average) * vibranceFactor;
                g += (g - average) * vibranceFactor;
                b += (b - average) * vibranceFactor;
            }

            // Warmth shifts red and blue in opposite directions.
            r += warmthAmount;
            b -= warmthAmount;

            pixels[i] = clamp(r);
            pixels[i + 1] = clamp(g);
            pixels[i + 2] = clamp(b);
        }

        if (y > 0 && y % rowsPerBatch === 0) {
            await nextFrame();
        }
    }

    try {
        context.putImageData(imageData, 0, 0);
    } catch {
        canvas.width = 1;
        canvas.height = 1;
        throw new Error(
            "The browser could not apply the enhancement. Try a smaller image."
        );
    }

    // Release the extra pixel buffer as soon as processing is complete.
    originalPixels = null;

    return canvas;
}

export function UpscaleWorkspace() {
    const inputRef = useRef<HTMLInputElement>(null);
    const originalUrlRef = useRef<string | null>(null);
    const resultUrlRef = useRef<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState("");
    const [resultUrl, setResultUrl] = useState("");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

    const [scale, setScale] = useState(2);
    const [format, setFormat] = useState<OutputFormat>("image/webp");
    const [quality, setQuality] = useState(92);
    const [settings, setSettings] = useState<GradeSettings>(DEFAULT_GRADE);
    const [activePreset, setActivePreset] = useState<PresetName>("Natural");
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [comparePosition, setComparePosition] = useState(50);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        return () => {
            if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
            if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        };
    }, []);

    function clearResult() {
        if (resultUrlRef.current) {
            URL.revokeObjectURL(resultUrlRef.current);
            resultUrlRef.current = null;
        }

        setResultUrl("");
        setResultBlob(null);
        setMessage("");
    }

    function updateSettings(key: keyof GradeSettings, value: number) {
        const nextSettings = { ...settings, [key]: value };
        setSettings(nextSettings);
        setActivePreset(detectPreset(nextSettings));
        clearResult();
        setError("");
    }

    function selectPreset(name: Exclude<PresetName, "Custom">) {
        setActivePreset(name);
        setSettings({ ...PRESETS[name] });
        clearResult();
        setError("");
    }

    function reset() {
        if (originalUrlRef.current) {
            URL.revokeObjectURL(originalUrlRef.current);
            originalUrlRef.current = null;
        }

        clearResult();
        setFile(null);
        setOriginalUrl("");
        setOriginalSize({ width: 0, height: 0 });
        setScale(2);
        setFormat("image/webp");
        setQuality(92);
        setSettings({ ...DEFAULT_GRADE });
        setActivePreset("Natural");
        setComparePosition(50);
        setError("");

        if (inputRef.current) inputRef.current.value = "";
    }

    async function chooseFile(next: File | undefined) {
        setError("");
        setMessage("");
        clearResult();

        if (!next) return;

        if (!next.size) {
            setError("The selected file is empty.");
            return;
        }

        if (next.size > MAX_FILE_BYTES) {
            setError("The maximum input file size is 20 MB.");
            return;
        }

        if (!next.type.startsWith("image/")) {
            setError("Choose a supported image file.");
            return;
        }

        setBusy(true);

        try {
            const image = await decodeImage(next);
            const pixels = image.naturalWidth * image.naturalHeight;

            if (!image.naturalWidth || !image.naturalHeight) {
                throw new Error("The image has invalid dimensions.");
            }

            if (pixels > MAX_INPUT_PIXELS) {
                throw new Error(
                    "This image has too many pixels for safe browser processing. Choose an image under 30 megapixels."
                );
            }

            if (originalUrlRef.current) {
                URL.revokeObjectURL(originalUrlRef.current);
            }

            const url = URL.createObjectURL(next);
            originalUrlRef.current = url;

            setFile(next);
            setOriginalUrl(url);
            setOriginalSize({
                width: image.naturalWidth,
                height: image.naturalHeight,
            });
            setComparePosition(50);
            setMessage("Image loaded. Choose an enhancement preset and upscale.");
        } catch (err) {
            setFile(null);
            setOriginalUrl("");
            setError(
                err instanceof Error ? err.message : "Unable to open this image."
            );
        } finally {
            setBusy(false);
        }
    }

    async function upscale() {
        if (!file || busy) return;

        setBusy(true);
        setError("");
        setMessage("");
        clearResult();

        let outputCanvas: HTMLCanvasElement | null = null;
        let enhancedCanvas: HTMLCanvasElement | null = null;

        try {
            const width = originalSize.width * scale;
            const height = originalSize.height * scale;
            const totalPixels = width * height;

            if (
                width > MAX_OUTPUT_DIMENSION ||
                height > MAX_OUTPUT_DIMENSION ||
                totalPixels > MAX_OUTPUT_PIXELS
            ) {
                throw new Error(
                    `The ${scale}× output would be too large for safe browser processing (${width.toLocaleString()} × ${height.toLocaleString()} px). Choose a lower scale or a smaller original image.`
                );
            }

            const image = await decodeImage(file);

            enhancedCanvas = await applyImageEnhancement(image, settings);

            outputCanvas = document.createElement("canvas");
            outputCanvas.width = width;
            outputCanvas.height = height;

            const context = outputCanvas.getContext("2d", {
                alpha: format === "image/png",
            });

            if (!context) {
                throw new Error("Canvas processing is unavailable in this browser.");
            }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";

            if (format === "image/jpeg") {
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, width, height);
            }

            context.drawImage(enhancedCanvas, 0, 0, width, height);

            const blob = await canvasToBlob(
                outputCanvas,
                format,
                format === "image/png" ? 1 : quality / 100
            );

            const url = URL.createObjectURL(blob);
            resultUrlRef.current = url;

            setResultUrl(url);
            setResultBlob(blob);
            setComparePosition(50);
            setMessage(
                `Enhanced ${width.toLocaleString()} × ${height.toLocaleString()} px image · ${formatBytes(blob.size)} · ${activePreset} grading applied.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Enhancement failed. Try a smaller image or lower scale."
            );
        } finally {
            if (outputCanvas) {
                outputCanvas.width = 1;
                outputCanvas.height = 1;
            }

            if (enhancedCanvas) {
                enhancedCanvas.width = 1;
                enhancedCanvas.height = 1;
            }

            setBusy(false);
        }
    }

    const outputName = `${file?.name.replace(/\.[^.]+$/, "") || "brobex-enhanced"}-${scale}x.${extensionFor(resultBlob?.type || format)}`;
    const outputWidth = originalSize.width * scale;
    const outputHeight = originalSize.height * scale;

    return (
        <section className="workspace upscale-studio">
            <style jsx>{`
        .upscale-studio {
          --studio-accent: var(--accent, #b98a52);
          --studio-line: rgba(148, 163, 184, 0.2);
        }

        .studio-heading {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .studio-subtitle {
          max-width: 660px;
          line-height: 1.7;
          opacity: 0.76;
        }

        .studio-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid var(--studio-line);
          border-radius: 999px;
          font-size: 12px;
          white-space: nowrap;
        }

        .studio-section {
          margin-top: 22px;
          padding: 18px;
          border: 1px solid var(--studio-line);
          border-radius: 16px;
        }

        .studio-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 15px;
          font-size: 15px;
          font-weight: 650;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .preset-button {
          display: flex;
          min-height: 78px;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 6px;
          padding: 12px;
          color: inherit;
          text-align: left;
          border: 1px solid var(--studio-line);
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease,
            transform 160ms ease;
        }

        .preset-button:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: var(--studio-accent);
        }

        .preset-button[aria-pressed="true"] {
          border-color: var(--studio-accent);
          background: color-mix(in srgb, var(--studio-accent) 12%, transparent);
        }

        .preset-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .preset-name {
          font-size: 13px;
          font-weight: 650;
        }

        .preset-description {
          font-size: 11px;
          line-height: 1.4;
          opacity: 0.7;
        }

        .comparison {
          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--studio-line);
          border-radius: 14px;
          background: #101010;
          isolation: isolate;
        }

        .comparison-stage {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          min-height: 220px;
          max-height: 560px;
          overflow: hidden;
          background-image: linear-gradient(45deg, #171717 25%, transparent 25%),
            linear-gradient(-45deg, #171717 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #171717 75%),
            linear-gradient(-45deg, transparent 75%, #171717 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0;
        }

        .comparison-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .comparison-after {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .comparison-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: white;
          transform: translateX(-50%);
          pointer-events: none;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        }

        .comparison-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 50%;
          color: #111;
          background: white;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 14px rgba(0, 0, 0, 0.25);
        }

        .comparison-tag {
          position: absolute;
          top: 12px;
          z-index: 2;
          padding: 6px 9px;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 7px;
          background: rgba(0, 0, 0, 0.66);
          font-size: 11px;
          font-weight: 650;
          pointer-events: none;
        }

        .comparison-tag.left {
          left: 12px;
        }

        .comparison-tag.right {
          right: 12px;
        }

        .comparison-slider {
          width: 100%;
          margin-top: 13px;
        }

        .comparison-caption {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
          font-size: 12px;
          opacity: 0.7;
        }

        .enhancement-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .enhancement-control {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
          font-size: 13px;
        }

        .enhancement-control .control-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .control-value {
          font-variant-numeric: tabular-nums;
          opacity: 0.78;
        }

        .enhancement-control input[type="range"] {
          width: 100%;
          accent-color: var(--studio-accent);
        }

        .control-hint {
          font-size: 11px;
          line-height: 1.5;
          opacity: 0.62;
        }

        .studio-toggle {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0;
          color: inherit;
          border: 0;
          background: transparent;
          font: inherit;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
        }

        .studio-info {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 15px;
          padding: 12px;
          border: 1px solid var(--studio-line);
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.6;
          opacity: 0.82;
        }

        .studio-facts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 16px 0;
        }

        .studio-fact {
          min-width: 0;
          padding: 13px;
          border: 1px solid var(--studio-line);
          border-radius: 12px;
        }

        .studio-fact-label {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          opacity: 0.68;
        }

        .studio-fact-value {
          display: block;
          overflow-wrap: anywhere;
          font-size: 13px;
          font-weight: 650;
        }

        .studio-output {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 14px 0;
        }

        .studio-output label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
        }

        .studio-output select {
          width: 100%;
          min-width: 0;
        }

        .studio-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .studio-actions > * {
          flex: 1 1 150px;
          justify-content: center;
        }

        .studio-download {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 10px;
          text-decoration: none;
        }

        .studio-muted {
          font-size: 12px;
          line-height: 1.65;
          opacity: 0.72;
        }

/* Prevent the workspace and its children from exceeding the viewport */
.upscale-studio,
.upscale-studio * {
  box-sizing: border-box;
}

.upscale-studio {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
}

.upscale-studio .workspace-top,
.upscale-studio .workspace-columns,
.upscale-studio .preview-panel,
.upscale-studio .settings-panel,
.upscale-studio .dropzone,
.upscale-studio .studio-section,
.upscale-studio .metadata-card {
  min-width: 0;
  max-width: 100%;
}

.upscale-studio .workspace-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: clamp(12px, 2vw, 24px);
}

.upscale-studio .preview-canvas {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.upscale-studio .preview-canvas img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 560px;
  object-fit: contain;
}

.upscale-studio input,
.upscale-studio select,
.upscale-studio button,
.upscale-studio a {
  min-width: 0;
  max-width: 100%;
}

.upscale-studio select {
  width: 100%;
}

.upscale-studio .comparison,
.upscale-studio .comparison-stage {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.upscale-studio .comparison-stage {
  height: auto;
  aspect-ratio: 4 / 3;
  min-height: 0;
  max-height: 560px;
}

.upscale-studio .comparison-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upscale-studio .enhancement-grid > *,
.upscale-studio .preset-grid > *,
.upscale-studio .studio-facts > *,
.upscale-studio .studio-output > * {
  min-width: 0;
}

.upscale-studio .studio-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upscale-studio .studio-actions > * {
  flex: 1 1 150px;
  min-width: 0;
}

.upscale-studio .studio-download {
  overflow-wrap: anywhere;
  text-align: center;
}

.upscale-studio .notice {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* Tablet */
@media (max-width: 900px) {
  .upscale-studio .workspace-columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .upscale-studio .preview-panel {
    order: 0;
  }

  .upscale-studio .settings-panel {
    order: 1;
  }

  .upscale-studio .preview-canvas img {
    max-height: 480px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .upscale-studio {
    padding-inline: 0;
  }

  .upscale-studio .workspace-top {
    align-items: flex-start;
    gap: 12px;
  }

  .upscale-studio .studio-heading {
    flex-direction: column;
  }

  .upscale-studio .studio-badge {
    max-width: 100%;
    white-space: normal;
  }

  .upscale-studio .studio-section {
    padding: 12px;
    margin-top: 14px;
    border-radius: 12px;
  }

  .upscale-studio .preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .upscale-studio .preset-button {
    min-height: 74px;
    padding: 10px;
  }

  .upscale-studio .enhancement-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .upscale-studio .studio-facts {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .upscale-studio .studio-output {
    grid-template-columns: minmax(0, 1fr);
  }

  .upscale-studio .comparison-stage {
    aspect-ratio: 4 / 3;
    min-height: 0;
    max-height: 360px;
  }

  .upscale-studio .comparison-tag {
    top: 8px;
    padding: 5px 7px;
    font-size: 10px;
  }

  .upscale-studio .comparison-tag.left {
    left: 8px;
  }

  .upscale-studio .comparison-tag.right {
    right: 8px;
  }

  .upscale-studio .comparison-handle {
    width: 32px;
    height: 32px;
  }

  .upscale-studio .studio-actions {
    flex-direction: column;
  }

  .upscale-studio .studio-actions > * {
    width: 100%;
    flex-basis: auto;
  }

  .upscale-studio .studio-download {
    width: 100%;
    white-space: normal;
  }
}

/* Very narrow phones */
@media (max-width: 360px) {
  .upscale-studio .preset-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .upscale-studio .comparison-caption {
    flex-wrap: wrap;
    font-size: 11px;
  }

  .upscale-studio .workspace-top h2 {
    font-size: clamp(1.35rem, 7vw, 1.8rem);
    overflow-wrap: anywhere;
  }
}

@media (prefers-reduced-motion: reduce) {
  .upscale-studio .preset-button {
    transition: none;
  }
}
.workspace,
.workspace-columns,
.preview-panel,
.settings-panel {
  min-width: 0;
  max-width: 100%;
}

img,
canvas,
video {
  max-width: 100%;
}

      `}</style>

            <div className="workspace-top studio-heading">
                <div>
                    <span className="eyebrow">BROBEX IMAGE STUDIO</span>
                    <h2>Upscale & enhance</h2>
                    <p className="studio-subtitle">
                        Increase resolution, refine color, improve tonal contrast, and
                        sharpen edges. Fine-tune the result before exporting your image.
                    </p>
                </div>

                <span className="privacy-chip studio-badge">
                    <ShieldCheck size={15} />
                    Processed on your device
                </span>
            </div>

            <label
                className={`dropzone ${file ? "has-file" : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault();
                    if (!busy) void chooseFile(event.dataTransfer.files?.[0]);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                    disabled={busy}
                    onChange={(event) => {
                        void chooseFile(event.target.files?.[0]);
                    }}
                />

                {file ? <ImageIcon size={30} /> : <UploadCloud size={30} />}

                <strong>
                    {file ? file.name : "Drop an image here or browse files"}
                </strong>

                <span>
                    {file
                        ? `${formatBytes(file.size)} · ${originalSize.width.toLocaleString()} × ${originalSize.height.toLocaleString()} px`
                        : "PNG, JPEG, WebP, AVIF or GIF where browser decoding is supported · 20 MB maximum"}
                </span>

                <small>
                    <ShieldCheck size={12} /> Your image is processed locally, not
                    uploaded to a server.
                </small>
            </label>

            {file && (
                <>
                    <div className="studio-facts">
                        <div className="studio-fact">
                            <span className="studio-fact-label">Original resolution</span>
                            <span className="studio-fact-value">
                                {originalSize.width.toLocaleString()} ×{" "}
                                {originalSize.height.toLocaleString()}
                            </span>
                        </div>

                        <div className="studio-fact">
                            <span className="studio-fact-label">Target resolution</span>
                            <span className="studio-fact-value">
                                {outputWidth.toLocaleString()} × {outputHeight.toLocaleString()}
                            </span>
                        </div>

                        <div className="studio-fact">
                            <span className="studio-fact-label">Enhancement profile</span>
                            <span className="studio-fact-value">{activePreset}</span>
                        </div>
                    </div>

                    {resultUrl && (
                        <div className="studio-section">
                            <h3 className="studio-section-title">
                                <ArrowLeftRight size={18} />
                                Before & after
                            </h3>

                            <div className="comparison">
                                <div className="comparison-stage">
                                    <img
                                        className="comparison-image"
                                        src={originalUrl}
                                        alt="Original image"
                                    />

                                    <div
                                        className="comparison-after"
                                        style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}
                                    >
                                        <img
                                            className="comparison-image"
                                            src={resultUrl}
                                            alt="Upscaled and color-graded image"
                                        />
                                    </div>

                                    <span className="comparison-tag left">ORIGINAL</span>
                                    <span className="comparison-tag right">ENHANCED</span>

                                    <div
                                        className="comparison-divider"
                                        style={{ left: `${comparePosition}%` }}
                                    >
                                        <span className="comparison-handle">
                                            <ArrowLeftRight size={17} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <input
                                className="comparison-slider"
                                aria-label="Move before and after comparison divider"
                                type="range"
                                min="0"
                                max="100"
                                value={comparePosition}
                                onChange={(event) =>
                                    setComparePosition(Number(event.target.value))
                                }
                            />

                            <div className="comparison-caption">
                                <span>Drag to compare</span>
                                <span>{comparePosition}% comparison position</span>
                            </div>
                        </div>
                    )}

                    <div className="workspace-columns">
                        <div className="preview-panel">
                            <div className="panel-heading">Original image</div>
                            <div className="preview-canvas">
                                <img src={originalUrl} alt="Original image preview" />
                            </div>

                            {resultUrl && (
                                <>
                                    <div className="panel-heading">Enhanced output</div>
                                    <div className="preview-canvas">
                                        <img src={resultUrl} alt="Enhanced output preview" />
                                    </div>
                                    <p className="studio-muted">
                                        This preview shows the actual exported image, including
                                        color grading and sharpening.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="settings-panel">
                            <h3>
                                <WandSparkles size={18} /> Enhancement controls
                            </h3>

                            <div className="studio-section">
                                <h4 className="studio-section-title">
                                    <Sparkles size={17} /> Color grading presets
                                </h4>

                                <div className="preset-grid">
                                    {(
                                        [
                                            ["Natural", "Balanced detail & color"],
                                            ["Vivid", "Punchier color & contrast"],
                                            ["Portrait", "Gentle, warm treatment"],
                                            ["Cinematic", "Deeper tonal contrast"],
                                        ] as const
                                    ).map(([name, description]) => (
                                        <button
                                            key={name}
                                            type="button"
                                            className="preset-button"
                                            aria-pressed={activePreset === name}
                                            disabled={busy}
                                            onClick={() => selectPreset(name)}
                                        >
                                            <span className="preset-name">{name}</span>
                                            <span className="preset-description">{description}</span>
                                        </button>
                                    ))}
                                </div>

                                <p className="studio-muted" style={{ marginTop: 12 }}>
                                    Presets change the actual processing settings. Choose Custom
                                    adjustments below to fine-tune your look.
                                </p>
                            </div>

                            <div className="studio-section">
                                <button
                                    className="studio-toggle"
                                    type="button"
                                    aria-expanded={showAdvanced}
                                    onClick={() => setShowAdvanced((value) => !value)}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 9,
                                        }}
                                    >
                                        <SlidersHorizontal size={18} />
                                        Fine-tune enhancement
                                    </span>
                                    <span>{showAdvanced ? "−" : "+"}</span>
                                </button>

                                {showAdvanced && (
                                    <div className="enhancement-grid" style={{ marginTop: 18 }}>
                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Brightness</span>
                                                <span className="control-value">
                                                    {settings.brightness}%
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="75"
                                                max="125"
                                                step="1"
                                                value={settings.brightness}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings("brightness", Number(event.target.value))
                                                }
                                            />
                                            <span className="control-hint">
                                                Adjust overall image lightness.
                                            </span>
                                        </label>

                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Contrast</span>
                                                <span className="control-value">
                                                    {settings.contrast}%
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="75"
                                                max="140"
                                                step="1"
                                                value={settings.contrast}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings("contrast", Number(event.target.value))
                                                }
                                            />
                                            <span className="control-hint">
                                                Strengthen separation between light and dark tones.
                                            </span>
                                        </label>

                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Saturation</span>
                                                <span className="control-value">
                                                    {settings.saturation}%
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="150"
                                                step="1"
                                                value={settings.saturation}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings(
                                                        "saturation",
                                                        Number(event.target.value)
                                                    )
                                                }
                                            />
                                            <span className="control-hint">
                                                Increase or reduce overall color intensity.
                                            </span>
                                        </label>

                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Vibrance</span>
                                                <span className="control-value">
                                                    {settings.vibrance}
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="80"
                                                step="1"
                                                value={settings.vibrance}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings("vibrance", Number(event.target.value))
                                                }
                                            />
                                            <span className="control-hint">
                                                Add extra color to more muted areas.
                                            </span>
                                        </label>

                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Warmth</span>
                                                <span className="control-value">
                                                    {settings.warmth > 0 ? "+" : ""}
                                                    {settings.warmth}
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="-30"
                                                max="30"
                                                step="1"
                                                value={settings.warmth}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings("warmth", Number(event.target.value))
                                                }
                                            />
                                            <span className="control-hint">
                                                Shift between cooler and warmer tones.
                                            </span>
                                        </label>

                                        <label className="enhancement-control">
                                            <span className="control-label">
                                                <span>Sharpening</span>
                                                <span className="control-value">
                                                    {settings.sharpness}%
                                                </span>
                                            </span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="60"
                                                step="1"
                                                value={settings.sharpness}
                                                disabled={busy}
                                                onChange={(event) =>
                                                    updateSettings("sharpness", Number(event.target.value))
                                                }
                                            />
                                            <span className="control-hint">
                                                Enhance edges. Excessive sharpening may create halos.
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <button
                                    className="button button-light"
                                    type="button"
                                    style={{ marginTop: 16 }}
                                    disabled={busy}
                                    onClick={() => {
                                        setSettings({ ...DEFAULT_GRADE });
                                        setActivePreset("Natural");
                                        clearResult();
                                        setError("");
                                    }}
                                >
                                    <RotateCcw size={14} /> Reset grading
                                </button>
                            </div>

                            <div className="studio-section">
                                <h4 className="studio-section-title">
                                    <ImageIcon size={17} /> Resolution & export
                                </h4>

                                <label>
                                    Upscale factor
                                    <select
                                        value={scale}
                                        disabled={busy}
                                        onChange={(event) => {
                                            setScale(Number(event.target.value));
                                            clearResult();
                                            setError("");
                                        }}
                                    >
                                        <option value={2}>2× — Double resolution</option>
                                        <option value={3}>3× — Triple resolution</option>
                                        <option value={4}>4× — Quadruple resolution</option>
                                    </select>
                                </label>

                                <div className="metadata-card" style={{ marginTop: 12 }}>
                                    <h4>Estimated output</h4>
                                    <p>
                                        Width: <b>{outputWidth.toLocaleString()} px</b>
                                    </p>
                                    <p>
                                        Height: <b>{outputHeight.toLocaleString()} px</b>
                                    </p>
                                    <p>
                                        Total pixels:{" "}
                                        <b>{(outputWidth * outputHeight).toLocaleString()}</b>
                                    </p>
                                </div>

                                <div className="studio-output">
                                    <label>
                                        Output format
                                        <select
                                            value={format}
                                            disabled={busy}
                                            onChange={(event) => {
                                                setFormat(event.target.value as OutputFormat);
                                                clearResult();
                                                setError("");
                                            }}
                                        >
                                            <option value="image/webp">WebP</option>
                                            <option value="image/jpeg">JPEG</option>
                                            <option value="image/png">PNG — Lossless</option>
                                        </select>
                                    </label>

                                    {format !== "image/png" && (
                                        <label>
                                            Export quality: {quality}%
                                            <input
                                                type="range"
                                                min="60"
                                                max="100"
                                                value={quality}
                                                disabled={busy}
                                                onChange={(event) => {
                                                    setQuality(Number(event.target.value));
                                                    clearResult();
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="studio-info">
                                    <Info size={17} />
                                    <span>
                                        Upscaling increases pixel dimensions; color grading and
                                        sharpening adjust the image itself. This browser-based
                                        tool does not use an AI model to reconstruct missing
                                        details. Sharpening cannot restore information that was
                                        never captured.
                                    </span>
                                </div>
                            </div>

                            <div className="studio-actions">
                                <button
                                    className="button button-dark"
                                    type="button"
                                    onClick={() => void upscale()}
                                    disabled={!file || busy}
                                >
                                    <WandSparkles size={16} />
                                    {busy ? "Enhancing image…" : "Enhance & upscale"}
                                </button>

                                <button
                                    className="button button-light"
                                    type="button"
                                    onClick={reset}
                                    disabled={busy}
                                >
                                    <RotateCcw size={15} />
                                    Reset
                                </button>
                            </div>

                            {resultBlob && resultUrl && (
                                <a
                                    className="button button-dark studio-download"
                                    href={resultUrl}
                                    download={outputName}
                                >
                                    <Download size={16} />
                                    Download enhanced image
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
                        </div>
                    </div>
                </>
            )}

            {!file && error && (
                <p className="notice error" role="alert">
                    <AlertCircle size={16} />
                    {error}
                </p>
            )}

            <div className="integration-notice">
                <span className="integration-icon">
                    <WandSparkles size={20} />
                </span>
                <div>
                    <h3>Private image enhancement</h3>
                    <p>
                        BROBEX processes images in your browser. Output limits help protect
                        memory and performance. Very large images may still require a
                        smaller scale or a less demanding device.
                    </p>
                </div>
            </div>
        </section>
    );
}
