
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    UploadCloud,
    Download,
    RotateCcw,
    Image as ImageIcon,
    SlidersHorizontal,
    X,
    AlertCircle,
    CheckCircle2,
    Sun,
    Contrast,
    Palette,
    Focus,
    Sparkles,
    Undo2,
    Redo2,
    Eye,
    Settings2,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PIXELS = 8_000_000;
const PREVIEW_MAX_SIZE = 1600;

type Settings = {
    brightness: number;
    exposure: number;
    contrast: number;
    highlights: number;
    shadows: number;
    saturation: number;
    vibrance: number;
    temperature: number;
    tint: number;
    hue: number;
    sharpness: number;
    clarity: number;
    blur: number;
    noiseReduction: number;
    fade: number;
    vignette: number;
    grain: number;
    sepia: number;
    grayscale: number;
    invert: number;
};

const DEFAULT_SETTINGS: Settings = {
    brightness: 100,
    exposure: 0,
    contrast: 100,
    highlights: 0,
    shadows: 0,
    saturation: 100,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    hue: 0,
    sharpness: 0,
    clarity: 0,
    blur: 0,
    noiseReduction: 0,
    fade: 0,
    vignette: 0,
    grain: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
};

type SettingKey = keyof Settings;

type Control = {
    key: SettingKey;
    label: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description: string;
};

const GROUPS: {
    title: string;
    icon: typeof Sun;
    controls: Control[];
}[] = [
        {
            title: "Light",
            icon: Sun,
            controls: [
                { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%", description: "Overall image brightness." },
                { key: "exposure", label: "Exposure", min: -100, max: 100, description: "Adjust the overall exposure." },
                { key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%", description: "Control the difference between light and dark." },
                { key: "highlights", label: "Highlights", min: -100, max: 100, description: "Recover or emphasize bright areas." },
                { key: "shadows", label: "Shadows", min: -100, max: 100, description: "Lift or deepen dark areas." },
            ],
        },
        {
            title: "Color",
            icon: Palette,
            controls: [
                { key: "saturation", label: "Saturation", min: 0, max: 200, unit: "%", description: "Adjust overall color intensity." },
                { key: "vibrance", label: "Vibrance", min: -100, max: 100, description: "Enhance less-saturated colors selectively." },
                { key: "temperature", label: "Temperature", min: -100, max: 100, description: "Move between cooler and warmer tones." },
                { key: "tint", label: "Tint", min: -100, max: 100, description: "Adjust green and magenta balance." },
                { key: "hue", label: "Hue", min: -180, max: 180, unit: "°", description: "Rotate the image color spectrum." },
            ],
        },
        {
            title: "Detail",
            icon: Focus,
            controls: [
                { key: "sharpness", label: "Sharpness", min: 0, max: 100, description: "Enhance edges and fine details." },
                { key: "clarity", label: "Clarity", min: 0, max: 100, description: "Increase local contrast." },
                { key: "blur", label: "Blur", min: 0, max: 10, step: 0.5, unit: "px", description: "Apply a soft image blur." },
                { key: "noiseReduction", label: "Noise reduction", min: 0, max: 100, description: "Smooth small pixel variations." },
            ],
        },
        {
            title: "Effects",
            icon: Sparkles,
            controls: [
                { key: "fade", label: "Fade", min: 0, max: 100, description: "Create a softer faded appearance." },
                { key: "vignette", label: "Vignette", min: 0, max: 100, description: "Darken the edges of your image." },
                { key: "grain", label: "Grain", min: 0, max: 100, description: "Add a film-like grain texture." },
                { key: "sepia", label: "Sepia", min: 0, max: 100, description: "Apply a warm vintage tone." },
                { key: "grayscale", label: "Grayscale", min: 0, max: 100, description: "Remove color from the image." },
                { key: "invert", label: "Invert", min: 0, max: 100, description: "Invert image colors." },
            ],
        },
    ];

function clamp(value: number, min = 0, max = 255) {
    return Math.max(min, Math.min(max, value));
}

function mix(a: number, b: number, amount: number) {
    return a + (b - a) * amount;
}

function getDimensions(width: number, height: number, maxSize?: number) {
    if (!maxSize || Math.max(width, height) <= maxSize) {
        return { width, height };
    }

    const scale = maxSize / Math.max(width, height);

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

function applyAdjustments(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    settings: Settings,
    maxSize?: number,
) {
    const dimensions = getDimensions(
        image.naturalWidth,
        image.naturalHeight,
        maxSize,
    );

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d", {
        willReadFrequently: true,
    });

    if (!context) {
        throw new Error("Your browser could not create an image editor canvas.");
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.filter = [
        `brightness(${settings.brightness}%)`,
        `contrast(${settings.contrast}%)`,
        `saturate(${settings.saturation}%)`,
        `hue-rotate(${settings.hue}deg)`,
        `blur(${settings.blur}px)`,
    ].join(" ");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.filter = "none";

    if (
        settings.exposure === 0 &&
        settings.highlights === 0 &&
        settings.shadows === 0 &&
        settings.vibrance === 0 &&
        settings.temperature === 0 &&
        settings.tint === 0 &&
        settings.sharpness === 0 &&
        settings.clarity === 0 &&
        settings.noiseReduction === 0 &&
        settings.fade === 0 &&
        settings.vignette === 0 &&
        settings.grain === 0 &&
        settings.sepia === 0 &&
        settings.grayscale === 0 &&
        settings.invert === 0
    ) {
        return;
    }

    const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
    );

    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const sharpness = settings.sharpness / 100;
    const clarity = settings.clarity / 100;
    const denoise = settings.noiseReduction / 100;

    // Preserve a source copy for detail processing.
    const source = new Uint8ClampedArray(pixels);

    // Apply edge-aware smoothing and unsharp detail enhancement.
    if (sharpness > 0 || clarity > 0 || denoise > 0) {
        const blurred = new Uint8ClampedArray(source.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const p = (y * width + x) * 4;

                for (let channel = 0; channel < 3; channel++) {
                    let total = 0;
                    let count = 0;

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;

                            if (
                                nx >= 0 &&
                                nx < width &&
                                ny >= 0 &&
                                ny < height
                            ) {
                                total += source[
                                    (ny * width + nx) * 4 + channel
                                ];
                                count++;
                            }
                        }
                    }

                    blurred[p + channel] = total / count;
                }

                blurred[p + 3] = source[p + 3];
            }
        }

        for (let i = 0; i < pixels.length; i += 4) {
            for (let channel = 0; channel < 3; channel++) {
                const original = source[i + channel];
                const smooth = blurred[i + channel];

                let value = mix(original, smooth, denoise * 0.8);

                const detail = original - smooth;

                value += detail * (sharpness * 1.5 + clarity * 0.9);

                pixels[i + channel] = clamp(value);
            }
        }
    }

    const exposureFactor = Math.pow(2, settings.exposure / 100);
    const fade = settings.fade / 100;
    const temperature = settings.temperature / 100;
    const tint = settings.tint / 100;
    const vibrance = settings.vibrance / 100;
    const highlights = settings.highlights / 100;
    const shadows = settings.shadows / 100;
    const sepia = settings.sepia / 100;
    const grayscale = settings.grayscale / 100;
    const invert = settings.invert / 100;
    const vignette = settings.vignette / 100;
    const grain = settings.grain / 100;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    // Deterministic grain: the same settings produce the same export.
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            let r = pixels[i];
            let g = pixels[i + 1];
            let b = pixels[i + 2];

            r *= exposureFactor;
            g *= exposureFactor;
            b *= exposureFactor;

            const luminance =
                0.2126 * r +
                0.7152 * g +
                0.0722 * b;

            const highlightMask = Math.max(
                0,
                Math.min(1, (luminance - 110) / 145),
            );

            const shadowMask = Math.max(
                0,
                Math.min(1, (145 - luminance) / 145),
            );

            const lightAdjustment =
                highlights * highlightMask * 70 +
                shadows * shadowMask * 70;

            r += lightAdjustment;
            g += lightAdjustment;
            b += lightAdjustment;

            // Temperature and tint.
            r += temperature * 35 + tint * 12;
            g += tint * -22;
            b -= temperature * 35 - tint * 12;

            // Selective vibrance.
            const average = (r + g + b) / 3;
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const currentSaturation =
                maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

            const vibranceAmount =
                vibrance * (1 - currentSaturation) * 0.75;

            r += (r - average) * vibranceAmount;
            g += (g - average) * vibranceAmount;
            b += (b - average) * vibranceAmount;

            // Fade lifts dark values and softens contrast.
            r = mix(r, 220, fade * 0.17);
            g = mix(g, 220, fade * 0.17);
            b = mix(b, 220, fade * 0.17);

            // Sepia blend.
            if (sepia > 0) {
                const sr = r * 0.393 + g * 0.769 + b * 0.189;
                const sg = r * 0.349 + g * 0.686 + b * 0.168;
                const sb = r * 0.272 + g * 0.534 + b * 0.131;

                r = mix(r, sr, sepia);
                g = mix(g, sg, sepia);
                b = mix(b, sb, sepia);
            }

            // Grayscale blend.
            if (grayscale > 0) {
                const gray =
                    0.2126 * r +
                    0.7152 * g +
                    0.0722 * b;

                r = mix(r, gray, grayscale);
                g = mix(g, gray, grayscale);
                b = mix(b, gray, grayscale);
            }

            // Invert blend.
            if (invert > 0) {
                r = mix(r, 255 - r, invert);
                g = mix(g, 255 - g, invert);
                b = mix(b, 255 - b, invert);
            }

            // Vignette.
            if (vignette > 0) {
                const dx = (x - centerX) / maxDistance;
                const dy = (y - centerY) / maxDistance;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const amount = Math.max(
                    0,
                    1 - Math.pow(distance, 1.7) * vignette * 1.15,
                );

                r *= amount;
                g *= amount;
                b *= amount;
            }

            // Film grain.
            if (grain > 0) {
                const seed = Math.sin(
                    x * 12.9898 + y * 78.233,
                ) * 43758.5453;

                const random = (seed - Math.floor(seed) - 0.5) * 2;
                const noise = random * grain * 28;

                r += noise;
                g += noise;
                b += noise;
            }

            pixels[i] = clamp(r);
            pixels[i + 1] = clamp(g);
            pixels[i + 2] = clamp(b);
        }
    }

    context.putImageData(imageData, 0, 0);
}

export function ColorizePhotoWorkspace() {
    const [file, setFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState("");
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [activeGroup, setActiveGroup] = useState("Light");
    const [showOriginal, setShowOriginal] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [format, setFormat] = useState("image/png");
    const [history, setHistory] = useState<Settings[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement | null>(null);
    const objectUrlRef = useRef("");
    const renderFrameRef = useRef<number | null>(null);

    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
    });

    const [previewReady, setPreviewReady] = useState(false);

    const setNewImage = useCallback((nextFile: File) => {
        setError("");
        setStatus("");

        if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) {
            setError("Please upload a JPG, PNG, or WebP image.");
            return;
        }

        if (nextFile.size > MAX_FILE_SIZE) {
            setError("Maximum image size is 20 MB.");
            return;
        }

        const url = URL.createObjectURL(nextFile);
        const image = new window.Image();

        image.onload = () => {
            if (image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
                URL.revokeObjectURL(url);
                setError("This image exceeds the 8-megapixel limit.");
                return;
            }

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            objectUrlRef.current = url;
            originalImageRef.current = image;

            setFile(nextFile);
            setOriginalUrl(url);
            setDimensions({
                width: image.naturalWidth,
                height: image.naturalHeight,
            });
            setSettings(DEFAULT_SETTINGS);
            setHistory([DEFAULT_SETTINGS]);
            setShowOriginal(false);
            setPreviewReady(true);
            setStatus("Image loaded. Your editing studio is ready.");
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            setError("Could not open this image. Please try another file.");
        };

        image.src = url;
    }, []);

    const renderPreview = useCallback(() => {
        const image = originalImageRef.current;
        const canvas = previewCanvasRef.current;

        if (!image || !canvas) return;

        try {
            applyAdjustments(
                canvas,
                image,
                settings,
                PREVIEW_MAX_SIZE,
            );
        } catch (err) {
            console.error("BROBEX preview error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not render the preview.",
            );
        }
    }, [settings]);

    useEffect(() => {
        if (!previewReady) return;

        if (renderFrameRef.current !== null) {
            cancelAnimationFrame(renderFrameRef.current);
        }

        renderFrameRef.current = requestAnimationFrame(() => {
            renderPreview();
            renderFrameRef.current = null;
        });

        return () => {
            if (renderFrameRef.current !== null) {
                cancelAnimationFrame(renderFrameRef.current);
                renderFrameRef.current = null;
            }
        };
    }, [renderPreview, previewReady]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            if (renderFrameRef.current !== null) {
                cancelAnimationFrame(renderFrameRef.current);
            }
        };
    }, []);

    function updateSetting(key: SettingKey, value: number) {
        const next = {
            ...settings,
            [key]: value,
        };

        setSettings(next);
        setHistory((previous) => [
            ...previous.slice(0, historyIndex + 1),
            next,
        ].slice(-31));
        setHistoryIndex((previous) => Math.min(previous + 1, 30));
    }

    function resetAll() {
        setSettings(DEFAULT_SETTINGS);
        setHistory([DEFAULT_SETTINGS]);
        setHistoryIndex(0);
        setStatus("All adjustments have been reset.");
    }

    function resetControl(key: SettingKey) {
        updateSetting(key, DEFAULT_SETTINGS[key]);
    }

    function undo() {
        if (historyIndex <= 0) return;

        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setSettings(history[nextIndex]);
    }

    function redo() {
        if (historyIndex >= history.length - 1) return;

        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setSettings(history[nextIndex]);
    }

    function clearImage() {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = "";
        }

        originalImageRef.current = null;
        setFile(null);
        setOriginalUrl("");
        setSettings(DEFAULT_SETTINGS);
        setHistory([]);
        setHistoryIndex(-1);
        setDimensions({ width: 0, height: 0 });
        setPreviewReady(false);
        setError("");
        setStatus("");
    }

    async function downloadImage() {
        const image = originalImageRef.current;

        if (!image) {
            setError("Upload an image before exporting.");
            return;
        }

        setError("");
        setStatus("Preparing your full-resolution export...");

        try {
            const canvas = document.createElement("canvas");

            // No preview downscaling for the final export.
            applyAdjustments(canvas, image, settings);

            const quality = format === "image/png" ? undefined : 0.94;

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (result) => {
                        if (!result) {
                            reject(new Error("Image export failed."));
                            return;
                        }

                        resolve(result);
                    },
                    format,
                    quality,
                );
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const extension =
                format === "image/jpeg"
                    ? "jpg"
                    : format === "image/webp"
                        ? "webp"
                        : "png";

            link.href = url;
            link.download = `brobex-edited-photo.${extension}`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => URL.revokeObjectURL(url), 2000);

            setStatus("Your edited image has been exported.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not export the image.",
            );
            setStatus("");
        }
    }

    const selectedGroup =
        GROUPS.find((group) => group.title === activeGroup) ?? GROUPS[0];

    const buttonStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 13px",
        border: "1px solid var(--line)",
        borderRadius: 9,
        background: "var(--soft)",
        color: "var(--ink)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 650,
    };

    const panelStyle: React.CSSProperties = {
        border: "1px solid var(--line)",
        borderRadius: 15,
        background: "var(--surface)",
        padding: 18,
        minWidth: 0,
    };

    return (
        <section style={{ display: "grid", gap: 18, width: "100%", minWidth: 0 }}>
            <div style={panelStyle}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                }}>
                    <div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                        }}>
                            <SlidersHorizontal size={21} />
                            <h2 style={{ margin: 0, fontSize: 21 }}>
                                Photo Editing Studio
                            </h2>
                        </div>
                        <p style={{
                            color: "var(--muted)",
                            fontSize: 12,
                            lineHeight: 1.7,
                            margin: "7px 0 0",
                        }}>
                            Professional manual adjustments with instant browser-based previews.
                        </p>
                    </div>

                    <span style={{
                        padding: "7px 10px",
                        borderRadius: 20,
                        background: "rgba(22,163,74,.09)",
                        color: "#16a34a",
                        fontSize: 10,
                        fontWeight: 800,
                    }}>
                        20 EDITING CONTROLS
                    </span>
                </div>

                {!file && (
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Upload an image"
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            const dropped = event.dataTransfer.files?.[0];
                            if (dropped) setNewImage(dropped);
                        }}
                        style={{
                            display: "grid",
                            justifyItems: "center",
                            textAlign: "center",
                            padding: "48px 18px",
                            marginTop: 22,
                            border: `1px dashed ${dragging ? "#16a34a" : "var(--muted)"}`,
                            borderRadius: 13,
                            background: dragging ? "rgba(22,163,74,.07)" : "var(--soft)",
                            cursor: "pointer",
                        }}
                    >
                        <div style={{
                            width: 52,
                            height: 52,
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid var(--line)",
                            borderRadius: 13,
                            background: "var(--surface)",
                            marginBottom: 13,
                        }}>
                            <UploadCloud size={25} />
                        </div>

                        <strong style={{ fontSize: 14 }}>
                            {dragging ? "Drop your image here" : "Upload an image to start editing"}
                        </strong>
                        <span style={{
                            color: "var(--muted)",
                            fontSize: 12,
                            marginTop: 7,
                        }}>
                            Drag and drop or browse · JPG, PNG, WebP · Up to 20 MB
                        </span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(event) => {
                        const selected = event.target.files?.[0];
                        if (selected) setNewImage(selected);
                        event.target.value = "";
                    }}
                />

                {file && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        padding: 12,
                        marginTop: 18,
                        borderRadius: 10,
                        background: "var(--soft)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                        }}>
                            <ImageIcon size={20} />
                            <div style={{ minWidth: 0 }}>
                                <strong style={{
                                    display: "block",
                                    fontSize: 12,
                                    overflowWrap: "anywhere",
                                }}>
                                    {file.name}
                                </strong>
                                <small style={{ color: "var(--muted)" }}>
                                    {dimensions.width} × {dimensions.height} · {(file.size / 1048576).toFixed(2)} MB
                                </small>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={buttonStyle}
                            >
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={clearImage}
                                aria-label="Remove image"
                                style={buttonStyle}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div role="alert" style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        color: "#dc2626",
                        background: "rgba(220,38,38,.07)",
                        padding: 12,
                        borderRadius: 9,
                        marginTop: 14,
                        fontSize: 12,
                    }}>
                        <AlertCircle size={17} />
                        {error}
                    </div>
                )}

                {status && (
                    <p role="status" aria-live="polite" style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        margin: "12px 0 0",
                    }}>
                        {status}
                    </p>
                )}
            </div>

            {file && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.65fr) minmax(280px, .85fr)",
                    gap: 18,
                    alignItems: "start",
                }}>
                    <div style={{ ...panelStyle, overflow: "hidden" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 14,
                        }}>
                            <div>
                                <strong style={{ fontSize: 14 }}>Live preview</strong>
                                <p style={{
                                    color: "var(--muted)",
                                    fontSize: 11,
                                    margin: "4px 0 0",
                                }}>
                                    Changes update automatically
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowOriginal((value) => !value)}
                                style={buttonStyle}
                            >
                                <Eye size={15} />
                                {showOriginal ? "Show edited" : "View original"}
                            </button>
                        </div>

                        <div style={{
                            position: "relative",
                            display: "grid",
                            placeItems: "center",
                            minHeight: 280,
                            maxHeight: 650,
                            overflow: "hidden",
                            borderRadius: 10,
                            background: "var(--soft)",
                        }}>
                            <canvas
                                ref={previewCanvasRef}
                                aria-label="Edited image preview"
                                style={{
                                    display: showOriginal ? "none" : "block",
                                    maxWidth: "100%",
                                    maxHeight: 650,
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "contain",
                                }}
                            />

                            {showOriginal && (
                                <img
                                    src={originalUrl}
                                    alt="Original photograph"
                                    style={{
                                        display: "block",
                                        maxWidth: "100%",
                                        maxHeight: 650,
                                        objectFit: "contain",
                                    }}
                                />
                            )}

                            {!showOriginal && (
                                <span style={{
                                    position: "absolute",
                                    bottom: 12,
                                    left: 12,
                                    background: "rgba(0,0,0,.72)",
                                    color: "white",
                                    padding: "6px 9px",
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    pointerEvents: "none",
                                }}>
                                    EDITED
                                </span>
                            )}
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 12,
                                marginBottom: 8,
                            }}>
                                <strong>Adjustment overview</strong>
                                <span style={{ color: "var(--muted)" }}>
                                    {Object.entries(settings).filter(([key, value]) =>
                                        value !== DEFAULT_SETTINGS[key as SettingKey]
                                    ).length} active
                                </span>
                            </div>

                            <div style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                            }}>
                                <button type="button" onClick={undo} disabled={historyIndex <= 0} style={{
                                    ...buttonStyle,
                                    opacity: historyIndex <= 0 ? .4 : 1,
                                }}>
                                    <Undo2 size={15} /> Undo
                                </button>
                                <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} style={{
                                    ...buttonStyle,
                                    opacity: historyIndex >= history.length - 1 ? .4 : 1,
                                }}>
                                    <Redo2 size={15} /> Redo
                                </button>
                                <button type="button" onClick={resetAll} style={buttonStyle}>
                                    <RotateCcw size={15} /> Reset all
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...panelStyle, display: "grid", gap: 15 }}>
                        <div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}>
                                <Settings2 size={18} />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Adjustments</h3>
                            </div>
                            <p style={{
                                color: "var(--muted)",
                                fontSize: 11,
                                margin: "6px 0 0",
                                lineHeight: 1.6,
                            }}>
                                Select a category and fine-tune your image.
                            </p>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 7,
                        }}>
                            {GROUPS.map((group) => {
                                const Icon = group.icon;
                                const active = activeGroup === group.title;

                                return (
                                    <button
                                        type="button"
                                        key={group.title}
                                        onClick={() => setActiveGroup(group.title)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 7,
                                            padding: "10px 6px",
                                            borderRadius: 8,
                                            border: `1px solid ${active ? "#16a34a" : "var(--line)"}`,
                                            background: active ? "rgba(22,163,74,.09)" : "var(--soft)",
                                            color: "var(--ink)",
                                            cursor: "pointer",
                                            fontSize: 11,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <Icon size={15} />
                                        {group.title}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            paddingBottom: 11,
                            borderBottom: "1px solid var(--line)",
                        }}>
                            <selectedGroup.icon size={17} />
                            <strong style={{ fontSize: 13 }}>{selectedGroup.title} controls</strong>
                        </div>

                        <div style={{ display: "grid", gap: 21 }}>
                            {selectedGroup.controls.map((control) => (
                                <label
                                    key={control.key}
                                    style={{ display: "grid", gap: 8 }}
                                >
                                    <span style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 8,
                                    }}>
                                        <strong style={{ fontSize: 12 }}>
                                            {control.label}
                                        </strong>
                                        <span style={{
                                            color: "var(--muted)",
                                            fontSize: 11,
                                            fontVariantNumeric: "tabular-nums",
                                        }}>
                                            {settings[control.key]}{control.unit ?? ""}
                                        </span>
                                    </span>

                                    <input
                                        type="range"
                                        min={control.min}
                                        max={control.max}
                                        step={control.step ?? 1}
                                        value={settings[control.key]}
                                        onChange={(event) =>
                                            updateSetting(
                                                control.key,
                                                Number(event.target.value),
                                            )
                                        }
                                        aria-label={control.label}
                                        style={{
                                            width: "100%",
                                            accentColor: "#16a34a",
                                            cursor: "pointer",
                                        }}
                                    />

                                    <span style={{
                                        color: "var(--muted)",
                                        fontSize: 10,
                                        lineHeight: 1.5,
                                    }}>
                                        {control.description}
                                    </span>

                                    {settings[control.key] !== DEFAULT_SETTINGS[control.key] && (
                                        <button
                                            type="button"
                                            onClick={() => resetControl(control.key)}
                                            style={{
                                                ...buttonStyle,
                                                justifySelf: "start",
                                                padding: "5px 8px",
                                                fontSize: 10,
                                            }}
                                        >
                                            <RotateCcw size={12} /> Reset {control.label}
                                        </button>
                                    )}
                                </label>
                            ))}
                        </div>

                        <div style={{
                            borderTop: "1px solid var(--line)",
                            paddingTop: 15,
                            display: "grid",
                            gap: 10,
                        }}>
                            <label style={{
                                display: "grid",
                                gap: 7,
                                fontSize: 12,
                                fontWeight: 650,
                            }}>
                                Export format
                                <select
                                    value={format}
                                    onChange={(event) => setFormat(event.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: 10,
                                        borderRadius: 8,
                                        border: "1px solid var(--line)",
                                        background: "var(--soft)",
                                        color: "var(--ink)",
                                    }}
                                >
                                    <option value="image/png">PNG · Lossless</option>
                                    <option value="image/jpeg">JPG · Smaller file</option>
                                    <option value="image/webp">WebP · Modern format</option>
                                </select>
                            </label>

                            <button
                                type="button"
                                onClick={downloadImage}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 9,
                                    padding: 13,
                                    border: "none",
                                    borderRadius: 9,
                                    background: "var(--ink)",
                                    color: "var(--bg)",
                                    cursor: "pointer",
                                    fontWeight: 750,
                                    fontSize: 13,
                                }}
                            >
                                <Download size={17} />
                                Export full-resolution image
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <p style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 11,
                lineHeight: 1.7,
            }}>
                BROBEX Photo Editing Studio processes images locally in your browser.
                Your original file remains unchanged. Preview rendering is optimized
                for responsiveness; exports use the original image dimensions.
            </p>
        </section>
    );
}
