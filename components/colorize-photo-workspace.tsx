
"use client";

import { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";
import {
    UploadCloud,
    Download,
    Sparkles,
    RotateCcw,
    Image as ImageIcon,
    Loader2,
    SlidersHorizontal,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

const MODEL_URL =
    "https://huggingface.co/edgetools/ddcolor/resolve/main/ddcolor-tiny-fp16.onnx";

const MODEL_SIZE = 512;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_PIXELS = 8_000_000;

type Settings = {
    saturation: number;
    brightness: number;
    contrast: number;
    warmth: number;
};

const DEFAULT_SETTINGS: Settings = {
    saturation: 100,
    brightness: 100,
    contrast: 100,
    warmth: 0,
};

type ModelSession = ort.InferenceSession;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function rgbToLabL(r: number, g: number, b: number): number {
    const linear = (value: number) => {
        value /= 255;

        return value <= 0.04045
            ? value / 12.92
            : Math.pow((value + 0.055) / 1.055, 2.4);
    };

    const red = linear(r);
    const green = linear(g);
    const blue = linear(b);

    const y =
        red * 0.2126729 +
        green * 0.7151522 +
        blue * 0.072175;

    const fy =
        y > 0.008856451679
            ? Math.cbrt(y)
            : 7.787037 * y + 16 / 116;

    return 116 * fy - 16;
}

function labToRgb(
    L: number,
    a: number,
    b: number,
): [number, number, number] {
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;

    const inverse = (value: number) => {
        const cube = value * value * value;

        return cube > 0.008856451679
            ? cube
            : (value - 16 / 116) / 7.787037;
    };

    const x = 0.95047 * inverse(fx);
    const y = inverse(fy);
    const z = 1.08883 * inverse(fz);

    const linearRed =
        x * 3.2404542 -
        y * 1.5371385 -
        z * 0.4985314;

    const linearGreen =
        -x * 0.969266 +
        y * 1.8760108 +
        z * 0.041556;

    const linearBlue =
        x * 0.0556434 -
        y * 0.2040259 +
        z * 1.0572252;

    const gamma = (value: number) => {
        const normalized = clamp(value, 0, 1);

        const converted =
            normalized <= 0.0031308
                ? normalized * 12.92
                : 1.055 * Math.pow(normalized, 1 / 2.4) - 0.055;

        return clamp(Math.round(converted * 255), 0, 255);
    };

    return [
        gamma(linearRed),
        gamma(linearGreen),
        gamma(linearBlue),
    ];
}


function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Could not export the processed image."));
                    return;
                }

                resolve(blob);
            },
            "image/png",
        );
    });
}

function getFilter(settings: Settings) {
    return [
        `saturate(${settings.saturation}%)`,
        `brightness(${settings.brightness}%)`,
        `contrast(${settings.contrast}%)`,
    ].join(" ");
}

export function ColorizePhotoWorkspace() {
    const [file, setFile] = useState<File | null>(null);
    const [original, setOriginal] = useState("");
    const [result, setResult] = useState("");
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [comparison, setComparison] = useState(50);
    const [modelReady, setModelReady] = useState(false);
    const [modelProgress, setModelProgress] = useState(0);
    const [imageDimensions, setImageDimensions] = useState({
        width: 0,
        height: 0,
    });

    const sessionRef = useRef<ModelSession | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const originalUrlRef = useRef("");
    const resultUrlRef = useRef("");
    const downloadImageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        return () => {
            if (originalUrlRef.current) {
                URL.revokeObjectURL(originalUrlRef.current);
            }

            if (resultUrlRef.current) {
                URL.revokeObjectURL(resultUrlRef.current);
            }

            if (sessionRef.current) {
                void sessionRef.current.release();
            }
        };
    }, []);

    function setOriginalUrl(url: string) {
        if (originalUrlRef.current) {
            URL.revokeObjectURL(originalUrlRef.current);
        }

        originalUrlRef.current = url;
        setOriginal(url);
    }

    function setResultUrl(url: string) {
        if (resultUrlRef.current) {
            URL.revokeObjectURL(resultUrlRef.current);
        }

        resultUrlRef.current = url;
        setResult(url);
    }

    function updateSetting(key: keyof Settings, value: number) {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function loadImage(nextFile: File) {
        setError("");
        setStatus("");

        const supportedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!supportedTypes.includes(nextFile.type)) {
            setError("Please select a JPG, PNG, or WebP photograph.");
            return;
        }

        if (nextFile.size > MAX_FILE_SIZE) {
            setError("The maximum upload size is 12 MB.");
            return;
        }

        const url = URL.createObjectURL(nextFile);
        const image = new window.Image();

        image.onload = () => {
            if (
                image.naturalWidth * image.naturalHeight > MAX_PIXELS
            ) {
                URL.revokeObjectURL(url);

                setError(
                    "This photograph exceeds 8 megapixels. Resize it before uploading to protect your browser's memory.",
                );

                return;
            }

            setFile(nextFile);
            setOriginalUrl(url);
            setResultUrl("");
            setSettings(DEFAULT_SETTINGS);
            setComparison(50);

            setImageDimensions({
                width: image.naturalWidth,
                height: image.naturalHeight,
            });

            setStatus("Photograph loaded successfully.");
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            setError("This image could not be decoded. Try another file.");
        };

        image.src = url;
    }

    async function getModel(): Promise<ModelSession> {
        if (sessionRef.current) {
            return sessionRef.current;
        }

        setStatus("Downloading the AI colorization model...");
        setModelProgress(0);

        // One thread provides the most compatible browser WASM setup.
        ort.env.wasm.numThreads = 1;

        const response = await fetch(MODEL_URL);

        if (!response.ok) {
            throw new Error(
                `Model download failed (${response.status}). Please try again.`,
            );
        }

        if (!response.body) {
            throw new Error(
                "Your browser could not stream the AI model download.",
            );
        }

        const total = Number(
            response.headers.get("content-length") || 0,
        );

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                received += value.byteLength;

                if (total > 0) {
                    setModelProgress(
                        Math.min(100, Math.round((received / total) * 100)),
                    );
                }
            }
        } finally {
            reader.releaseLock();
        }

        const bytes = new Uint8Array(received);
        let offset = 0;

        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
        }

        setStatus("Initializing the AI engine...");

        const session = await ort.InferenceSession.create(bytes, {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all",
        });

        if (
            !session.inputNames.length ||
            !session.outputNames.length
        ) {
            await session.release();
            throw new Error("The downloaded model has invalid input or output names.");
        }

        sessionRef.current = session;
        setModelReady(true);
        setModelProgress(100);

        return session;
    }

    async function colorize() {
        if (!original || !file || busy) return;

        setBusy(true);
        setError("");
        setStatus("Preparing your photograph...");

        try {
            const session = await getModel();

            const image = new window.Image();
            image.src = original;
            await image.decode();

            const width = image.naturalWidth;
            const height = image.naturalHeight;

            if (
                !width ||
                !height ||
                width * height > MAX_PIXELS
            ) {
                throw new Error("The image dimensions are not supported.");
            }

            // Prepare the model's fixed 512 x 512 input.
            const inputCanvas = document.createElement("canvas");
            inputCanvas.width = MODEL_SIZE;
            inputCanvas.height = MODEL_SIZE;

            const inputContext = inputCanvas.getContext("2d", {
                willReadFrequently: true,
            });

            if (!inputContext) {
                throw new Error("Could not prepare the model input.");
            }

            inputContext.drawImage(
                image,
                0,
                0,
                MODEL_SIZE,
                MODEL_SIZE,
            );

            const inputPixels = inputContext.getImageData(
                0,
                0,
                MODEL_SIZE,
                MODEL_SIZE,
            );

            const plane = MODEL_SIZE * MODEL_SIZE;
            const input = new Float32Array(3 * plane);

            // Convert the source into grayscale RGB using CIE Lab luminance.
            for (let i = 0; i < plane; i++) {
                const p = i * 4;

                const L = rgbToLabL(
                    inputPixels.data[p],
                    inputPixels.data[p + 1],
                    inputPixels.data[p + 2],
                );

                const [r, g, b] = labToRgb(L, 0, 0);

                input[i] = r / 255;
                input[plane + i] = g / 255;
                input[plane * 2 + i] = b / 255;
            }

            setStatus("AI is analyzing and colorizing your photograph...");

            const tensor = new ort.Tensor(
                "float32",
                input,
                [1, 3, MODEL_SIZE, MODEL_SIZE],
            );

            const outputs = await session.run({
                [session.inputNames[0]]: tensor,
            });

            const output = outputs[session.outputNames[0]];

            if (!output) {
                throw new Error("The AI model returned no color data.");
            }

            const outputShape = Array.from(output.dims);

            const expectedShape = [
                1,
                2,
                MODEL_SIZE,
                MODEL_SIZE,
            ];

            if (
                outputShape.length !== 4 ||
                !expectedShape.every(
                    (dimension, index) => outputShape[index] === dimension,
                ) ||
                output.data.length !== 2 * plane
            ) {
                throw new Error(
                    "The AI model returned an unexpected output shape.",
                );
            }

            // Convert the two predicted Lab chroma channels into an image
            // so the browser can resize them to the original dimensions.
            const abCanvas = document.createElement("canvas");
            abCanvas.width = MODEL_SIZE;
            abCanvas.height = MODEL_SIZE;

            const abContext = abCanvas.getContext("2d", {
                willReadFrequently: true,
            });

            if (!abContext) {
                throw new Error("Could not prepare the predicted color channels.");
            }

            const abImage = abContext.createImageData(
                MODEL_SIZE,
                MODEL_SIZE,
            );

            for (let i = 0; i < plane; i++) {
                const a = Number(output.data[i]);
                const b = Number(output.data[plane + i]);

                if (!Number.isFinite(a) || !Number.isFinite(b)) {
                    throw new Error("The AI model returned invalid color values.");
                }

                abImage.data[i * 4] = clamp(
                    Math.round(a + 128),
                    0,
                    255,
                );

                abImage.data[i * 4 + 1] = clamp(
                    Math.round(b + 128),
                    0,
                    255,
                );

                abImage.data[i * 4 + 2] = 0;
                abImage.data[i * 4 + 3] = 255;
            }

            abContext.putImageData(abImage, 0, 0);

            setStatus("Rebuilding the full-resolution photograph...");

            // Preserve original luminance and resize only the predicted
            // chroma channels to the original image dimensions.
            const sourceCanvas = document.createElement("canvas");
            sourceCanvas.width = width;
            sourceCanvas.height = height;

            const sourceContext = sourceCanvas.getContext("2d", {
                willReadFrequently: true,
            });

            if (!sourceContext) {
                throw new Error("Could not prepare the original photograph.");
            }

            sourceContext.drawImage(image, 0, 0);

            const sourcePixels = sourceContext.getImageData(
                0,
                0,
                width,
                height,
            );

            const resizedAb = document.createElement("canvas");
            resizedAb.width = width;
            resizedAb.height = height;

            const resizedContext = resizedAb.getContext("2d", {
                willReadFrequently: true,
            });

            if (!resizedContext) {
                throw new Error("Could not resize the color channels.");
            }

            resizedContext.imageSmoothingEnabled = true;
            resizedContext.imageSmoothingQuality = "high";

            resizedContext.drawImage(
                abCanvas,
                0,
                0,
                width,
                height,
            );

            const colorPixels = resizedContext.getImageData(
                0,
                0,
                width,
                height,
            );

            const finalPixels = sourceContext.createImageData(
                width,
                height,
            );

            const pixelCount = width * height;

            for (let i = 0; i < pixelCount; i++) {
                const p = i * 4;

                const L = rgbToLabL(
                    sourcePixels.data[p],
                    sourcePixels.data[p + 1],
                    sourcePixels.data[p + 2],
                );

                const a = colorPixels.data[p] - 128;
                const b = colorPixels.data[p + 1] - 128;

                const [r, g, blue] = labToRgb(L, a, b);

                finalPixels.data[p] = r;
                finalPixels.data[p + 1] = g;
                finalPixels.data[p + 2] = blue;
                finalPixels.data[p + 3] = sourcePixels.data[p + 3];
            }

            sourceContext.putImageData(finalPixels, 0, 0);

            const blob = await canvasToBlob(sourceCanvas);
            const url = URL.createObjectURL(blob);

            setResultUrl(url);
            setComparison(50);
            setStatus("Colorization complete. Your photograph is ready.");
        } catch (err) {
            console.error("BROBEX Colorize Photo error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Colorization failed. Please try again.",
            );

            setStatus("");
        } finally {
            setBusy(false);
        }
    }

    async function download() {
        if (!result || !downloadImageRef.current) return;

        try {
            setError("");

            const image = downloadImageRef.current;
            await image.decode();

            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const context = canvas.getContext("2d", {
                willReadFrequently: true,
            });

            if (!context) {
                throw new Error("Could not prepare the download.");
            }

            // Apply the same live adjustments shown in the preview.
            context.filter = getFilter(settings);
            context.drawImage(image, 0, 0);
            context.filter = "none";

            if (settings.warmth !== 0) {
                const amount = Math.abs(settings.warmth) / 100;
                const isWarm = settings.warmth > 0;

                context.globalCompositeOperation = "soft-light";

                context.fillStyle = isWarm
                    ? `rgba(255, 145, 65, ${amount * 0.45})`
                    : `rgba(75, 145, 255, ${amount * 0.45})`;

                context.fillRect(0, 0, canvas.width, canvas.height);
                context.globalCompositeOperation = "source-over";
            }

            const blob = await canvasToBlob(canvas);
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "brobex-colorized-photo.png";
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not download the photograph.",
            );
        }
    }

    function reset() {
        setSettings(DEFAULT_SETTINGS);
        setComparison(50);
    }

    function clearImage() {
        setFile(null);
        setOriginalUrl("");
        setResultUrl("");
        setError("");
        setStatus("");
        setSettings(DEFAULT_SETTINGS);
        setImageDimensions({ width: 0, height: 0 });
    }

    const warmthAmount = Math.abs(settings.warmth) / 100;
    const warmthColor =
        settings.warmth > 0
            ? `rgba(255, 145, 65, ${warmthAmount * 0.45})`
            : `rgba(75, 145, 255, ${warmthAmount * 0.45})`;

    const imageFilter = getFilter(settings);

    const panelStyle: React.CSSProperties = {
        padding: 22,
        border: "1px solid var(--line)",
        borderRadius: 16,
        background: "var(--surface)",
        minWidth: 0,
    };

    const primaryButtonStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        width: "100%",
        padding: "14px 18px",
        border: "none",
        borderRadius: 10,
        background: "var(--ink)",
        color: "var(--bg)",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 14,
    };

    const secondaryButtonStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 14px",
        border: "1px solid var(--line)",
        borderRadius: 9,
        background: "var(--soft)",
        color: "var(--ink)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
    };

    return (
        <section
            style={{
                display: "grid",
                gap: 22,
                width: "100%",
                minWidth: 0,
            }}
        >
            {/* Upload and AI controls */}
            <div style={panelStyle}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 14,
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                marginBottom: 7,
                            }}
                        >
                            <Sparkles size={21} />
                            <h2 style={{ margin: 0, fontSize: 21 }}>
                                AI Photo Colorization
                            </h2>
                        </div>

                        <p
                            style={{
                                color: "var(--muted)",
                                margin: 0,
                                fontSize: 13,
                                lineHeight: 1.7,
                            }}
                        >
                            Transform black-and-white photographs with locally
                            running artificial intelligence.
                        </p>
                    </div>

                    <span
                        style={{
                            color: "#16a34a",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.7,
                            padding: "7px 10px",
                            borderRadius: 20,
                            background: "rgba(22, 163, 74, 0.09)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        FREE Â· ON-DEVICE AI
                    </span>
                </div>

                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Choose or drop an image"
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
                    onDragLeave={(event) => {
                        event.preventDefault();
                        setDragging(false);
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);

                        const droppedFile = event.dataTransfer.files?.[0];

                        if (droppedFile) {
                            loadImage(droppedFile);
                        }
                    }}
                    style={{
                        display: "grid",
                        justifyItems: "center",
                        textAlign: "center",
                        padding: "34px 18px",
                        marginTop: 22,
                        border: `1px dashed ${dragging ? "#16a34a" : "var(--muted)"
                            }`,
                        borderRadius: 13,
                        background: dragging
                            ? "rgba(22, 163, 74, 0.07)"
                            : "var(--soft)",
                        cursor: "pointer",
                        outline: "none",
                        transition: "border-color 160ms ease, background 160ms ease",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            placeItems: "center",
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: "var(--surface)",
                            border: "1px solid var(--line)",
                            marginBottom: 12,
                        }}
                    >
                        <UploadCloud size={23} />
                    </div>

                    <strong style={{ fontSize: 14 }}>
                        {dragging
                            ? "Drop your photograph here"
                            : file
                                ? file.name
                                : "Choose or drop a photograph"}
                    </strong>

                    <span
                        style={{
                            color: "var(--muted)",
                            fontSize: 12,
                            marginTop: 7,
                        }}
                    >
                        JPG, PNG or WebP Â· Maximum 12 MB
                    </span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                        const selected = event.target.files?.[0];

                        if (selected) {
                            loadImage(selected);
                        }

                        event.target.value = "";
                    }}
                />

                {file && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginTop: 12,
                            padding: 12,
                            background: "var(--soft)",
                            borderRadius: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 0,
                            }}
                        >
                            <ImageIcon size={19} />
                            <div style={{ minWidth: 0 }}>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: 12,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {file.name}
                                </strong>

                                <small style={{ color: "var(--muted)" }}>
                                    {imageDimensions.width} Ã— {imageDimensions.height}
                                    {" Â· "}
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </small>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={clearImage}
                            aria-label="Remove image"
                            style={{
                                ...secondaryButtonStyle,
                                padding: 8,
                                flexShrink: 0,
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            color: "#dc2626",
                            background: "rgba(220,38,38,0.07)",
                            borderRadius: 9,
                            padding: 12,
                            marginTop: 14,
                            fontSize: 13,
                        }}
                    >
                        <AlertCircle size={17} />
                        <span>{error}</span>
                    </div>
                )}

                {status && (
                    <p
                        role="status"
                        aria-live="polite"
                        style={{
                            color: "var(--muted)",
                            fontSize: 13,
                            margin: "14px 0 0",
                        }}
                    >
                        {status}
                    </p>
                )}

                {busy && status.toLowerCase().includes("downloading") && (
                    <div style={{ marginTop: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                marginBottom: 7,
                            }}
                        >
                            <span>AI model download</span>
                            <strong>{modelProgress}%</strong>
                        </div>

                        <div
                            style={{
                                height: 7,
                                borderRadius: 10,
                                background: "var(--soft)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${modelProgress}%`,
                                    height: "100%",
                                    borderRadius: 10,
                                    background: "#16a34a",
                                    transition: "width 150ms ease",
                                }}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    disabled={!file || busy}
                    onClick={colorize}
                    style={{
                        ...primaryButtonStyle,
                        marginTop: 16,
                        opacity: !file || busy ? 0.55 : 1,
                        cursor: !file || busy ? "not-allowed" : "pointer",
                    }}
                >
                    {busy ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing photograph...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            {result ? "Colorize Again" : "Colorize Photograph"}
                        </>
                    )}
                </button>

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        marginTop: 13,
                        color: "var(--muted)",
                        fontSize: 11,
                        lineHeight: 1.65,
                    }}
                >
                    <CheckCircle2
                        size={15}
                        color="#16a34a"
                        style={{ flexShrink: 0, marginTop: 1 }}
                    />

                    <span>
                        {modelReady
                            ? "AI model is ready in this session. Your photographs are processed locally."
                            : "The AI model downloads on first use. Your photograph is processed in your browser, not uploaded to a colorization API."}
                    </span>
                </div>
            </div>

            {/* Result and customization */}
            {result && (
                <div style={panelStyle}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18 }}>
                                Your colorized photograph
                            </h3>

                            <p
                                style={{
                                    color: "var(--muted)",
                                    fontSize: 12,
                                    margin: "5px 0 0",
                                }}
                            >
                                Adjust the preview and compare it with the original.
                            </p>
                        </div>

                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                color: "#16a34a",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            <CheckCircle2 size={15} />
                            Completed
                        </span>
                    </div>

                    {/* Before / after comparison */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
                            maxHeight: 520,
                            marginTop: 20,
                            overflow: "hidden",
                            borderRadius: 12,
                            background: "var(--soft)",
                            isolation: "isolate",
                        }}
                    >
                        <img
                            src={result}
                            alt="AI colorized photograph"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                filter: imageFilter,
                            }}
                        />

                        {settings.warmth !== 0 && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: warmthColor,
                                    mixBlendMode: "soft-light",
                                    pointerEvents: "none",
                                }}
                            />
                        )}

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: `${comparison}%`,
                                overflow: "hidden",
                                borderRight: "2px solid white",
                                boxSizing: "border-box",
                                pointerEvents: "none",
                            }}
                        >
                            <img
                                src={original}
                                alt="Original black-and-white photograph"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${10000 / Math.max(comparison, 0.01)}%`,
                                    height: "100%",
                                    maxWidth: "none",
                                    objectFit: "contain",
                                }}
                            />
                        </div>

                        <span
                            style={{
                                position: "absolute",
                                left: 12,
                                top: 12,
                                zIndex: 2,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.7)",
                                color: "white",
                                fontSize: 10,
                                fontWeight: 700,
                            }}
                        >
                            ORIGINAL
                        </span>

                        <span
                            style={{
                                position: "absolute",
                                right: 12,
                                top: 12,
                                zIndex: 2,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.7)",
                                color: "white",
                                fontSize: 10,
                                fontWeight: 700,
                            }}
                        >
                            COLORIZED
                        </span>
                    </div>

                    <div style={{ marginTop: 15 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 12,
                                marginBottom: 8,
                            }}
                        >
                            <strong>Before / after comparison</strong>
                            <span style={{ color: "var(--muted)" }}>
                                {comparison}% original
                            </span>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={comparison}
                            onChange={(event) =>
                                setComparison(Number(event.target.value))
                            }
                            aria-label="Before and after comparison"
                            style={{ width: "100%", accentColor: "#16a34a" }}
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "var(--muted)",
                                fontSize: 11,
                            }}
                        >
                            <span>Original</span>
                            <span>Colorized</span>
                        </div>
                    </div>

                    {/* Adjustment controls */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            marginTop: 27,
                            paddingBottom: 13,
                            borderBottom: "1px solid var(--line)",
                        }}
                    >
                        <SlidersHorizontal size={19} />
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                            Fine-tune your photograph
                        </h3>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 19,
                            marginTop: 20,
                        }}
                    >
                        {(
                            [
                                {
                                    key: "saturation",
                                    label: "Color intensity",
                                    min: 0,
                                    max: 200,
                                    unit: "%",
                                },
                                {
                                    key: "brightness",
                                    label: "Brightness",
                                    min: 50,
                                    max: 150,
                                    unit: "%",
                                },
                                {
                                    key: "contrast",
                                    label: "Contrast",
                                    min: 50,
                                    max: 150,
                                    unit: "%",
                                },
                                {
                                    key: "warmth",
                                    label: "Color temperature",
                                    min: -100,
                                    max: 100,
                                    unit: "",
                                },
                            ] as const
                        ).map((control) => (
                            <label
                                key={control.key}
                                style={{ display: "grid", gap: 9 }}
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        fontSize: 13,
                                    }}
                                >
                                    <strong>{control.label}</strong>
                                    <span style={{ color: "var(--muted)" }}>
                                        {settings[control.key]}
                                        {control.unit}
                                    </span>
                                </span>

                                <input
                                    type="range"
                                    min={control.min}
                                    max={control.max}
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
                                    }}
                                />

                                {control.key === "warmth" && (
                                    <span
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 10,
                                            color: "var(--muted)",
                                        }}
                                    >
                                        <span>Cooler</span>
                                        <span>Neutral</span>
                                        <span>Warmer</span>
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            marginTop: 25,
                        }}
                    >
                        <button
                            type="button"
                            onClick={reset}
                            style={secondaryButtonStyle}
                        >
                            <RotateCcw size={15} />
                            Reset adjustments
                        </button>

                        <button
                            type="button"
                            onClick={download}
                            style={{
                                ...primaryButtonStyle,
                                width: "auto",
                                flex: "1 1 200px",
                            }}
                        >
                            <Download size={17} />
                            Download full-resolution PNG
                        </button>
                    </div>

                    <img
                        ref={downloadImageRef}
                        src={result}
                        alt=""
                        aria-hidden="true"
                        style={{ display: "none" }}
                    />

                    <p
                        style={{
                            margin: "14px 0 0",
                            color: "var(--muted)",
                            fontSize: 11,
                            lineHeight: 1.6,
                        }}
                    >
                        Adjustments are applied to the preview and included in
                        your downloaded PNG. Original image dimensions are
                        preserved. AI-generated colors are estimates, not
                        guaranteed historical colors.
                    </p>
                </div>
            )}
        </section>
    );
}

