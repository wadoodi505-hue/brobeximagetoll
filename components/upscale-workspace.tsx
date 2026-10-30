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
    ArrowLeftRight,
    Info,
} from "lucide-react";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_INPUT_PIXELS = 30_000_000;
const MAX_OUTPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 7680;

type OutputFormat = "image/webp" | "image/jpeg" | "image/png";

type ResolutionPreset = {
    id: string;
    label: string;
    description: string;
    longEdge: number;
};

const RESOLUTIONS: ResolutionPreset[] = [
    { id: "720p", label: "HD · 720p", description: "1280 px", longEdge: 1280 },
    { id: "1080p", label: "Full HD · 1080p", description: "1920 px", longEdge: 1920 },
    { id: "1440p", label: "QHD · 1440p", description: "2560 px", longEdge: 2560 },
    { id: "4k", label: "4K UHD", description: "3840 px", longEdge: 3840 },
    { id: "8k", label: "8K UHD", description: "7680 px", longEdge: 7680 },
];

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
            reject(new Error("This image could not be decoded. Try a PNG, JPEG, WebP, or AVIF image."));
        };

        image.src = url;
    });
}

function getOutputDimensions(
    width: number,
    height: number,
    longEdge: number
) {
    if (!width || !height) return { width: 0, height: 0 };

    const ratio = longEdge / Math.max(width, height);

    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
    };
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
                    reject(new Error("The browser could not export this image. Try a lower resolution."));
                    return;
                }

                if (format !== "image/png" && blob.type !== format) {
                    reject(new Error(`Your browser could not export ${format}. Choose another format.`));
                    return;
                }

                resolve(blob);
            },
            format,
            quality
        );
    });
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

    const [resolution, setResolution] = useState("1080p");
    const [format, setFormat] = useState<OutputFormat>("image/webp");
    const [quality, setQuality] = useState(92);
    const [comparePosition, setComparePosition] = useState(50);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const selectedPreset =
        RESOLUTIONS.find((item) => item.id === resolution) ?? RESOLUTIONS[1];

    const outputSize = getOutputDimensions(
        originalSize.width,
        originalSize.height,
        selectedPreset.longEdge
    );

    const outputPixels = outputSize.width * outputSize.height;
    const outputIsValid =
        outputSize.width <= MAX_OUTPUT_DIMENSION &&
        outputSize.height <= MAX_OUTPUT_DIMENSION &&
        outputPixels <= MAX_OUTPUT_PIXELS;

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

    function reset() {
        if (originalUrlRef.current) {
            URL.revokeObjectURL(originalUrlRef.current);
            originalUrlRef.current = null;
        }

        clearResult();
        setFile(null);
        setOriginalUrl("");
        setOriginalSize({ width: 0, height: 0 });
        setResolution("1080p");
        setFormat("image/webp");
        setQuality(92);
        setComparePosition(50);
        setError("");

        if (inputRef.current) inputRef.current.value = "";
    }

    async function chooseFile(next: File | undefined) {
        if (busy) return;

        setError("");
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

        const supportedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif",
        ];

        if (!supportedTypes.includes(next.type)) {
            setError("Choose a PNG, JPEG, WebP, AVIF, or GIF image.");
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
                throw new Error("This image exceeds the 30-megapixel input limit. Choose a smaller image.");
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
            setMessage("Image loaded. Select your target resolution.");
        } catch (err) {
            setFile(null);
            setOriginalUrl("");
            setError(err instanceof Error ? err.message : "Unable to open this image.");
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

        let canvas: HTMLCanvasElement | null = null;

        try {
            const dimensions = getOutputDimensions(
                originalSize.width,
                originalSize.height,
                selectedPreset.longEdge
            );

            const { width, height } = dimensions;
            const totalPixels = width * height;

            if (
                width > MAX_OUTPUT_DIMENSION ||
                height > MAX_OUTPUT_DIMENSION ||
                totalPixels > MAX_OUTPUT_PIXELS
            ) {
                throw new Error(
                    `This output would be too large (${width.toLocaleString()} × ${height.toLocaleString()} px). Choose a lower resolution.`
                );
            }

            const image = await decodeImage(file);

            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d", {
                alpha: format !== "image/jpeg",
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

            context.drawImage(image, 0, 0, width, height);

            const blob = await canvasToBlob(
                canvas,
                format,
                format === "image/png" ? 1 : quality / 100
            );

            const url = URL.createObjectURL(blob);
            resultUrlRef.current = url;

            setResultUrl(url);
            setResultBlob(blob);
            setComparePosition(50);
            setMessage(
                `Export completed · ${width.toLocaleString()} × ${height.toLocaleString()} px · ${formatBytes(blob.size)}`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Upscaling failed. Try a lower resolution."
            );
        } finally {
            if (canvas) {
                canvas.width = 1;
                canvas.height = 1;
            }

            setBusy(false);
        }
    }

    const outputName = `${file?.name.replace(/\.[^.]+$/, "") || "brobex-upscaled"}-${resolution}.${extensionFor(resultBlob?.type || format)}`;

    return (
        <section className="workspace upscale-studio">
            <style jsx>{`
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
                    opacity: .76;
                }

                .studio-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 9px 12px;
                    border: 1px solid var(--border, rgba(148,163,184,.2));
                    border-radius: 999px;
                    font-size: 12px;
                }

                .studio-section {
                    margin-top: 20px;
                    padding: 18px;
                    border: 1px solid var(--border, rgba(148,163,184,.2));
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

                .resolution-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }

                .resolution-option {
                    display: flex;
                    min-width: 0;
                    flex-direction: column;
                    gap: 7px;
                    padding: 15px;
                    color: inherit;
                    text-align: left;
                    border: 1px solid var(--border, rgba(148,163,184,.2));
                    border-radius: 12px;
                    background: transparent;
                    cursor: pointer;
                    transition: border-color .16s ease, background .16s ease;
                }

                .resolution-option:hover:not(:disabled) {
                    border-color: var(--accent, #b98a52);
                }

                .resolution-option[aria-pressed="true"] {
                    border-color: var(--accent, #b98a52);
                    background: color-mix(in srgb, var(--accent, #b98a52) 12%, transparent);
                }

                .resolution-option:disabled {
                    opacity: .4;
                    cursor: not-allowed;
                }

                .resolution-name {
                    font-size: 14px;
                    font-weight: 700;
                }

                .resolution-description {
                    font-size: 11px;
                    opacity: .68;
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
                    border: 1px solid var(--border, rgba(148,163,184,.2));
                    border-radius: 12px;
                }

                .studio-fact-label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 11px;
                    opacity: .68;
                }

                .studio-fact-value {
                    display: block;
                    font-size: 13px;
                    font-weight: 650;
                    overflow-wrap: anywhere;
                }

                .studio-output {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                }

                .studio-output label {
                    display: flex;
                    min-width: 0;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 13px;
                }

                .studio-output select {
                    width: 100%;
                    min-width: 0;
                }

                .comparison {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                    border: 1px solid var(--border, rgba(148,163,184,.2));
                    border-radius: 14px;
                    background: #101010;
                }

                .comparison-stage {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 4 / 3;
                    max-height: 560px;
                    overflow: hidden;
                    background-color: #171717;
                    background-image:
                        linear-gradient(45deg,#222 25%,transparent 25%),
                        linear-gradient(-45deg,#222 25%,transparent 25%),
                        linear-gradient(45deg,transparent 75%,#222 75%),
                        linear-gradient(-45deg,transparent 75%,#222 75%);
                    background-size: 20px 20px;
                    background-position: 0 0,0 10px,10px -10px,-10px 0;
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
                }

                .comparison-handle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    display: grid;
                    width: 38px;
                    height: 38px;
                    place-items: center;
                    border: 1px solid rgba(255,255,255,.75);
                    border-radius: 50%;
                    color: #111;
                    background: white;
                    transform: translate(-50%,-50%);
                }

                .comparison-tag {
                    position: absolute;
                    top: 12px;
                    z-index: 2;
                    padding: 6px 9px;
                    color: white;
                    border: 1px solid rgba(255,255,255,.22);
                    border-radius: 7px;
                    background: rgba(0,0,0,.66);
                    font-size: 11px;
                    font-weight: 650;
                    pointer-events: none;
                }

                .comparison-tag.left { left: 12px; }
                .comparison-tag.right { right: 12px; }

                .comparison-slider {
                    width: 100%;
                    margin-top: 13px;
                    accent-color: var(--accent, #b98a52);
                }

                .comparison-caption {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin-top: 5px;
                    font-size: 12px;
                    opacity: .7;
                }

                .studio-info {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    margin-top: 15px;
                    padding: 12px;
                    border: 1px solid var(--border, rgba(148,163,184,.2));
                    border-radius: 10px;
                    font-size: 12px;
                    line-height: 1.6;
                    opacity: .82;
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
                    opacity: .72;
                }

                .workspace-columns {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    align-items: start;
                    gap: clamp(12px, 2vw, 24px);
                }

                .preview-panel,
                .settings-panel {
                    min-width: 0;
                    max-width: 100%;
                }

                .preview-canvas {
                    width: 100%;
                    max-width: 100%;
                    overflow: hidden;
                    border-radius: 12px;
                }

                .preview-canvas img {
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

                @media (max-width: 900px) {
                    .workspace-columns {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }

                @media (max-width: 600px) {
                    .studio-heading { flex-direction: column; }
                    .studio-section { padding: 12px; margin-top: 14px; }
                    .studio-facts { grid-template-columns: 1fr; }
                    .studio-output { grid-template-columns: 1fr; }
                    .resolution-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
                    .studio-actions { flex-direction: column; }
                    .studio-actions > * { width: 100%; flex-basis: auto; }
                    .comparison-stage { max-height: 360px; }
                    .comparison-handle { width: 32px; height: 32px; }
                }

                @media (max-width: 360px) {
                    .resolution-grid { grid-template-columns: 1fr; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .resolution-option { transition: none; }
                }
            `}</style>

            <div className="workspace-top studio-heading">
                <div>
                    <span className="eyebrow">BROBEX IMAGE STUDIO</span>
                    <h2>Image Upscaler</h2>
                    <p className="studio-subtitle">
                        Increase your image resolution up to 8K. Choose an output quality,
                        preview the dimensions, and export your resized image.
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
                    onChange={(event) => void chooseFile(event.target.files?.[0])}
                />

                {file ? <ImageIcon size={30} /> : <UploadCloud size={30} />}

                <strong>{file ? file.name : "Drop an image here or browse files"}</strong>

                <span>
                    {file
                        ? `${formatBytes(file.size)} · ${originalSize.width.toLocaleString()} × ${originalSize.height.toLocaleString()} px`
                        : "PNG, JPEG, WebP, AVIF or GIF · Maximum file size 20 MB"}
                </span>

                <small>
                    <ShieldCheck size={12} /> Your image stays on your device.
                </small>
            </label>

            {file && (
                <>
                    <div className="studio-facts">
                        <div className="studio-fact">
                            <span className="studio-fact-label">Original dimensions</span>
                            <span className="studio-fact-value">
                                {originalSize.width.toLocaleString()} × {originalSize.height.toLocaleString()} px
                            </span>
                        </div>

                        <div className="studio-fact">
                            <span className="studio-fact-label">Output dimensions</span>
                            <span className="studio-fact-value">
                                {outputSize.width.toLocaleString()} × {outputSize.height.toLocaleString()} px
                            </span>
                        </div>

                        <div className="studio-fact">
                            <span className="studio-fact-label">Selected quality</span>
                            <span className="studio-fact-value">{selectedPreset.label}</span>
                        </div>
                    </div>

                    <div className="workspace-columns">
                        <div className="preview-panel">
                            <div className="panel-heading">Original image</div>
                            <div className="preview-canvas">
                                <img src={originalUrl} alt="Original image preview" />
                            </div>

                            {resultUrl && (
                                <>
                                    <div className="panel-heading">Upscaled output</div>
                                    <div className="preview-canvas">
                                        <img src={resultUrl} alt="Upscaled image preview" />
                                    </div>
                                    <p className="studio-muted">
                                        Preview of the actual exported image.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="settings-panel">
                            <div className="studio-section">
                                <h3 className="studio-section-title">
                                    <ImageIcon size={18} />
                                    Choose output resolution
                                </h3>

                                <div className="resolution-grid">
                                    {RESOLUTIONS.map((item) => {
                                        const dimensions = getOutputDimensions(
                                            originalSize.width,
                                            originalSize.height,
                                            item.longEdge
                                        );

                                        const valid =
                                            dimensions.width <= MAX_OUTPUT_DIMENSION &&
                                            dimensions.height <= MAX_OUTPUT_DIMENSION &&
                                            dimensions.width * dimensions.height <= MAX_OUTPUT_PIXELS;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className="resolution-option"
                                                aria-pressed={resolution === item.id}
                                                disabled={busy || !valid}
                                                onClick={() => {
                                                    setResolution(item.id);
                                                    clearResult();
                                                    setError("");
                                                }}
                                                title={
                                                    valid
                                                        ? `${dimensions.width.toLocaleString()} × ${dimensions.height.toLocaleString()} px`
                                                        : "This resolution exceeds the safe browser processing limit for this image."
                                                }
                                            >
                                                <span className="resolution-name">{item.label}</span>
                                                <span className="resolution-description">
                                                    {valid
                                                        ? `${item.description} · ${dimensions.width.toLocaleString()} × ${dimensions.height.toLocaleString()}`
                                                        : "Exceeds safe output limit"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="studio-info">
                                    <Info size={17} />
                                    <span>
                                        Dimensions preserve your original image&apos;s aspect ratio.
                                        This browser-based tool uses high-quality resampling;
                                        it does not use AI to invent missing image details.
                                        Some very large aspect ratios may exceed the safe 8K output limit.
                                    </span>
                                </div>
                            </div>

                            <div className="studio-section">
                                <h3 className="studio-section-title">
                                    <Download size={18} />
                                    Export settings
                                </h3>

                                <div className="studio-output">
                                    <label>
                                        File format
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
                                            <option value="image/png">PNG · Lossless</option>
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

                                <div className="studio-actions">
                                    <button
                                        className="button button-dark"
                                        type="button"
                                        onClick={() => void upscale()}
                                        disabled={!file || busy || !outputIsValid}
                                    >
                                        <ImageIcon size={16} />
                                        {busy ? "Processing image…" : `Export ${selectedPreset.label}`}
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
                                        Download upscaled image
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
                    </div>

                    {resultUrl && (
                        <div className="studio-section">
                            <h3 className="studio-section-title">
                                <ArrowLeftRight size={18} />
                                Before & after comparison
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
                                        style={{
                                            clipPath: `inset(0 0 0 ${comparePosition}%)`,
                                        }}
                                    >
                                        <img
                                            className="comparison-image"
                                            src={resultUrl}
                                            alt="Upscaled image"
                                        />
                                    </div>

                                    <span className="comparison-tag left">ORIGINAL</span>
                                    <span className="comparison-tag right">UPSCALED</span>

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
                    <ImageIcon size={20} />
                </span>
                <div>
                    <h3>Private resolution processing</h3>
                    <p>
                        BROBEX resizes images locally in your browser. Output limits
                        protect device memory. The tool preserves aspect ratio and
                        supports resolutions up to 8K when the image dimensions allow it.
                    </p>
                </div>
            </div>
        </section>
    );
}

