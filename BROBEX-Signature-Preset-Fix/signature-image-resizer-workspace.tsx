
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
type FitMode = "contain" | "stretch";

const MAX_DIMENSION = 12000;
const MAX_PIXELS = 40_000_000;

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export function SignatureImageResizerWorkspace() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const sourceUrlRef = useRef<string | null>(null);
    const resultUrlRef = useRef<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [sourceUrl, setSourceUrl] = useState("");
    const [resultUrl, setResultUrl] = useState("");
    const [width, setWidth] = useState(709);
    const [height, setHeight] = useState(236);
    const [originalWidth, setOriginalWidth] = useState(0);
    const [originalHeight, setOriginalHeight] = useState(0);
    const [locked, setLocked] = useState(true);
    const [fitMode, setFitMode] = useState<FitMode>("contain");
    const [format, setFormat] = useState<OutputFormat>("image/png");
    const [quality, setQuality] = useState(92);
    const [background, setBackground] = useState("transparent");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [resultSize, setResultSize] = useState(0);

    const ratio =
        originalWidth > 0 && originalHeight > 0
            ? originalWidth / originalHeight
            : 1;

    const releaseUrl = (url: string | null) => {
        if (url) URL.revokeObjectURL(url);
    };

    useEffect(() => {
        return () => {
            releaseUrl(sourceUrlRef.current);
            releaseUrl(resultUrlRef.current);
        };
    }, []);

    const clearResult = useCallback(() => {
        releaseUrl(resultUrlRef.current);
        resultUrlRef.current = null;
        setResultUrl("");
        setResultSize(0);
    }, []);

    const loadFile = useCallback(
        (selected: File | undefined) => {
            if (!selected) return;

            setError("");
            clearResult();

            if (!selected.type.startsWith("image/")) {
                setError("Please select a valid image file.");
                return;
            }

            if (selected.size > 20 * 1024 * 1024) {
                setError("The image is too large. Maximum file size is 20 MB.");
                return;
            }

            const url = URL.createObjectURL(selected);
            const image = new Image();

            image.onload = () => {
                if (!image.naturalWidth || !image.naturalHeight) {
                    URL.revokeObjectURL(url);
                    setError("The selected image could not be decoded.");
                    return;
                }

                if (
                    image.naturalWidth * image.naturalHeight >
                    MAX_PIXELS
                ) {
                    URL.revokeObjectURL(url);
                    setError("The image exceeds the 40-megapixel safety limit.");
                    return;
                }

                releaseUrl(sourceUrlRef.current);
                sourceUrlRef.current = url;
                imageRef.current = image;

                setFile(selected);
                setSourceUrl(url);
                setOriginalWidth(image.naturalWidth);
                setOriginalHeight(image.naturalHeight);
                setWidth(image.naturalWidth);
                setHeight(image.naturalHeight);
            };

            image.onerror = () => {
                URL.revokeObjectURL(url);
                setError("Unable to open this image. Try a PNG, JPG or WebP file.");
            };

            image.src = url;
        },
        [clearResult]
    );

    // 6 cm × 2 cm at 300 DPI: round((cm / 2.54) × DPI) = 709 × 236 px.
    const applySignaturePreset = () => {
        setWidth(Math.round((6 / 2.54) * 300));
        setHeight(Math.round((2 / 2.54) * 300));
        setLocked(false);
        setFitMode("contain");
        setBackground("#ffffff");
        clearResult();
        setError("");
    };

    const updateWidth = (value: number) => {
        const next = Math.min(MAX_DIMENSION, Math.max(1, Math.round(value)));
        setWidth(next);

        if (locked && originalWidth > 0) {
            setHeight(
                Math.min(
                    MAX_DIMENSION,
                    Math.max(1, Math.round(next / ratio))
                )
            );
        }

        clearResult();
    };

    const updateHeight = (value: number) => {
        const next = Math.min(MAX_DIMENSION, Math.max(1, Math.round(value)));
        setHeight(next);

        if (locked && originalHeight > 0) {
            setWidth(
                Math.min(
                    MAX_DIMENSION,
                    Math.max(1, Math.round(next * ratio))
                )
            );
        }

        clearResult();
    };

    const resizeImage = async () => {
        const image = imageRef.current;

        if (!image || !file) {
            setError("Upload a signature image first.");
            return;
        }

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < 1 ||
            height < 1 ||
            width > MAX_DIMENSION ||
            height > MAX_DIMENSION
        ) {
            setError("Enter valid dimensions between 1 and 12,000 pixels.");
            return;
        }

        if (width * height > MAX_PIXELS) {
            setError("The output exceeds the 40-megapixel safety limit.");
            return;
        }

        setProcessing(true);
        setError("");
        clearResult();

        try {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d", {
                alpha: true,
            });

            if (!context) {
                throw new Error("Your browser could not create an image canvas.");
            }

            context.clearRect(0, 0, width, height);

            if (format === "image/jpeg" || background !== "transparent") {
                context.fillStyle =
                    background === "transparent" ? "#ffffff" : background;
                context.fillRect(0, 0, width, height);
            }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";

            if (fitMode === "stretch") {
                context.drawImage(image, 0, 0, width, height);
            } else {
                const scale = Math.min(
                    width / image.naturalWidth,
                    height / image.naturalHeight
                );

                const drawWidth = image.naturalWidth * scale;
                const drawHeight = image.naturalHeight * scale;
                const x = (width - drawWidth) / 2;
                const y = (height - drawHeight) / 2;

                context.drawImage(image, x, y, drawWidth, drawHeight);
            }

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(
                    resolve,
                    format,
                    format === "image/png" ? undefined : quality / 100
                );
            });

            canvas.width = 0;
            canvas.height = 0;

            if (!blob) {
                throw new Error(
                    "Image export failed. Try a different output format."
                );
            }

            const url = URL.createObjectURL(blob);
            resultUrlRef.current = url;

            setResultUrl(url);
            setResultSize(blob.size);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while resizing the image."
            );
        } finally {
            setProcessing(false);
        }
    };

    const downloadImage = () => {
        if (!resultUrl) return;

        const extension =
            format === "image/jpeg"
                ? "jpg"
                : format === "image/webp"
                    ? "webp"
                    : "png";

        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `signature-resized-${width}x${height}.${extension}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const reset = () => {
        releaseUrl(sourceUrlRef.current);
        sourceUrlRef.current = null;
        imageRef.current = null;

        clearResult();

        setFile(null);
        setSourceUrl("");
        setOriginalWidth(0);
        setOriginalHeight(0);
        setWidth(709);
        setHeight(236);
        setLocked(true);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const styles = {
        panel: {
            background: "var(--background, #fff)",
            color: "var(--foreground, #171717)",
            border: "1px solid var(--border, #e5e5e5)",
            borderRadius: 16,
            padding: 20,
        } as React.CSSProperties,
        input: {
            width: "100%",
            minWidth: 0,
            padding: "11px 12px",
            border: "1px solid var(--border, #d4d4d4)",
            borderRadius: 9,
            background: "var(--input, transparent)",
            color: "inherit",
            fontSize: 14,
        } as React.CSSProperties,
        button: {
            border: "1px solid var(--border, #d4d4d4)",
            borderRadius: 9,
            padding: "11px 15px",
            background: "var(--card, transparent)",
            color: "inherit",
            fontWeight: 600,
            cursor: "pointer",
        } as React.CSSProperties,
        primary: {
            border: "1px solid #171717",
            borderRadius: 9,
            padding: "12px 18px",
            background: "#171717",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        } as React.CSSProperties,
    };

    return (
        <section className="signature-resizer" style={{ display: "grid", gap: 18 }}>
            <style jsx>{`
        .signature-resizer * {
          box-sizing: border-box;
        }

        .signature-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.85fr);
          gap: 18px;
          align-items: start;
        }

        .signature-drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 190px;
          padding: 24px;
          border: 1.5px dashed var(--border, #aaa);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          background: var(--card, transparent);
          transition: border-color .2s, background .2s;
        }

        .signature-drop:hover {
          border-color: var(--foreground, #222);
          background: var(--muted, #f5f5f5);
        }

        .signature-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .signature-label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 650;
        }

        .signature-preview {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 10px;
          border: 1px solid var(--border, #ddd);
          padding: 14px;
          background-color: #f4f4f4;
          background-image:
            linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
            linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
            linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0;
        }

        .signature-preview img {
          display: block;
          max-width: 100%;
          max-height: 340px;
          object-fit: contain;
        }

        .signature-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        @media (max-width: 720px) {
          .signature-grid {
            grid-template-columns: 1fr;
          }

          .signature-fields {
            grid-template-columns: 1fr 1fr;
          }

          .signature-preview {
            min-height: 170px;
          }
        }

        @media (max-width: 380px) {
          .signature-fields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

            <div style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 750, letterSpacing: 1.3, opacity: 0.6 }}>
                    BROBEX IMAGE WORKSPACE
                </span>
                <h2 style={{ fontSize: "clamp(21px, 3vw, 28px)", margin: 0 }}>
                    Signature Image Resizer
                </h2>
                <p style={{ margin: 0, opacity: 0.7, fontSize: 14, lineHeight: 1.6 }}>
                    Resize handwritten signature images to precise dimensions.
                    Your image is processed locally in your browser.
                </p>
            </div>

            <div className="signature-grid">
                <div style={{ display: "grid", gap: 16 }}>
                    <div style={styles.panel}>
                        <h3 style={{ margin: "0 0 13px", fontSize: 16 }}>
                            01. Upload signature
                        </h3>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                            hidden
                            onChange={(event) => loadFile(event.target.files?.[0])}
                        />

                        <button
                            type="button"
                            className="signature-drop"
                            style={{ width: "100%", color: "inherit" }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span style={{ fontSize: 30, marginBottom: 8 }}>↥</span>
                            <strong>{file ? file.name : "Choose a signature image"}</strong>
                            <span style={{ fontSize: 12, opacity: 0.65, marginTop: 7 }}>
                                PNG, JPG, WebP · Maximum 20 MB
                            </span>
                        </button>

                        {file && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                                <span>Original: {originalWidth} × {originalHeight} px</span>
                                <span>{formatBytes(file.size)}</span>
                            </div>
                        )}
                    </div>

                    <div style={styles.panel}>
                        <h3 style={{ margin: "0 0 15px", fontSize: 16 }}>
                            02. Output dimensions
                        </h3>

                        <button
                            type="button"
                            style={{ ...styles.button, width: "100%", marginBottom: 14, borderColor: "#c77b53" }}
                            onClick={applySignaturePreset}
                        >
                            Apply Signature Preset · 6 cm × 2 cm · 300 DPI (709 × 236 px)
                        </button>

                        <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 13, lineHeight: 1.5 }}>
                            Physical size: 6 cm × 2 cm at 300 DPI. Pixel dimensions are calculated using
                            (centimeters ÷ 2.54) × DPI and rounded to the nearest whole pixel.
                        </div>

                        <div className="signature-fields">
                            <label>
                                <span className="signature-label">Width (px)</span>
                                <input
                                    style={styles.input}
                                    type="number"
                                    min={1}
                                    max={MAX_DIMENSION}
                                    value={width}
                                    onChange={(event) => updateWidth(Number(event.target.value))}
                                    disabled={!file}
                                />
                            </label>

                            <label>
                                <span className="signature-label">Height (px)</span>
                                <input
                                    style={styles.input}
                                    type="number"
                                    min={1}
                                    max={MAX_DIMENSION}
                                    value={height}
                                    onChange={(event) => updateHeight(Number(event.target.value))}
                                    disabled={!file}
                                />
                            </label>
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 15, fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={locked}
                                disabled={!file}
                                onChange={(event) => setLocked(event.target.checked)}
                            />
                            Lock original aspect ratio
                        </label>

                        <div style={{ marginTop: 17 }}>
                            <span className="signature-label">Image fitting</span>
                            <select
                                style={styles.input}
                                value={fitMode}
                                onChange={(event) => {
                                    setFitMode(event.target.value as FitMode);
                                    clearResult();
                                }}
                                disabled={!file}
                            >
                                <option value="contain">Fit inside dimensions</option>
                                <option value="stretch">Stretch to exact dimensions</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.panel}>
                        <h3 style={{ margin: "0 0 15px", fontSize: 16 }}>
                            03. Export settings
                        </h3>

                        <label>
                            <span className="signature-label">Output format</span>
                            <select
                                style={styles.input}
                                value={format}
                                onChange={(event) => {
                                    setFormat(event.target.value as OutputFormat);
                                    clearResult();
                                }}
                            >
                                <option value="image/png">PNG — transparent support</option>
                                <option value="image/jpeg">JPEG — smaller file</option>
                                <option value="image/webp">WebP — optimized file</option>
                            </select>
                        </label>

                        <label style={{ display: "block", marginTop: 15 }}>
                            <span className="signature-label">Background</span>
                            <select
                                style={styles.input}
                                value={background}
                                disabled={format === "image/jpeg"}
                                onChange={(event) => {
                                    setBackground(event.target.value);
                                    clearResult();
                                }}
                            >
                                <option value="transparent">Transparent</option>
                                <option value="#ffffff">White</option>
                                <option value="#000000">Black</option>
                            </select>
                        </label>

                        {format !== "image/png" && (
                            <label style={{ display: "block", marginTop: 15 }}>
                                <span className="signature-label">
                                    Quality: {quality}%
                                </span>
                                <input
                                    type="range"
                                    min={40}
                                    max={100}
                                    value={quality}
                                    onChange={(event) => {
                                        setQuality(Number(event.target.value));
                                        clearResult();
                                    }}
                                    style={{ width: "100%" }}
                                />
                            </label>
                        )}
                    </div>

                    <div className="signature-actions">
                        <button
                            type="button"
                            style={styles.primary}
                            onClick={resizeImage}
                            disabled={!file || processing}
                        >
                            {processing ? "Processing..." : "Resize signature"}
                        </button>

                        <button type="button" style={styles.button} onClick={reset}>
                            Reset
                        </button>
                    </div>

                    {error && (
                        <div role="alert" style={{ padding: 13, borderRadius: 9, background: "#fee2e2", color: "#991b1b", fontSize: 13 }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                    <div style={styles.panel}>
                        <h3 style={{ margin: "0 0 13px", fontSize: 16 }}>
                            Live preview
                        </h3>

                        <div className="signature-preview">
                            {sourceUrl ? (
                                <img src={sourceUrl} alt="Original signature preview" />
                            ) : (
                                <span style={{ fontSize: 13, color: "#555" }}>
                                    Upload an image to see its preview
                                </span>
                            )}
                        </div>

                        {file && (
                            <p style={{ fontSize: 12, opacity: 0.65, margin: "10px 0 0" }}>
                                Original image · {originalWidth} × {originalHeight} px
                            </p>
                        )}
                    </div>

                    <div style={styles.panel}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 13 }}>
                            <h3 style={{ margin: 0, fontSize: 16 }}>Resized result</h3>
                            {resultUrl && (
                                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.65 }}>
                                    READY
                                </span>
                            )}
                        </div>

                        <div className="signature-preview">
                            {resultUrl ? (
                                <img src={resultUrl} alt="Resized signature preview" />
                            ) : (
                                <span style={{ fontSize: 13, color: "#555", textAlign: "center" }}>
                                    Your resized signature will appear here
                                </span>
                            )}
                        </div>

                        {resultUrl && (
                            <>
                                <div style={{ display: "grid", gap: 5, marginTop: 13, fontSize: 12, opacity: 0.75 }}>
                                    <span>Dimensions: {width} × {height} px</span>
                                    {width === 709 && height === 236 && (
                                        <span>Print preset: 6 cm × 2 cm · 300 DPI target</span>
                                    )}
                                    <span>File size: {formatBytes(resultSize)}</span>
                                    <span>Format: {format.replace("image/", "").toUpperCase()}</span>
                                </div>

                                <button
                                    type="button"
                                    style={{ ...styles.primary, width: "100%", marginTop: 15 }}
                                    onClick={downloadImage}
                                >
                                    ↓ Download resized signature
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <p style={{ fontSize: 12, opacity: 0.6, margin: 0, lineHeight: 1.6 }}>
                Privacy: image processing and export happen locally in your browser.
                No server upload is required. Browser canvas export does not preserve
                original EXIF metadata or guarantee a particular print DPI.
            </p>
        </section>
    );
}
