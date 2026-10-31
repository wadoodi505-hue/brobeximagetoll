
"use client";

import "./image-to-text-workspace.css";
import { useRef, useState } from "react";
import {
    AlertCircle,
    Copy,
    Download,
    FileImage,
    Loader2,
    ShieldCheck,
    Sparkles,
    UploadCloud,
    X,
} from "lucide-react";

const LANGUAGES = [
    { label: "English", code: "eng" },
    { label: "Urdu", code: "urd" },
    { label: "Arabic", code: "ara" },
    { label: "Hindi", code: "hin" },
    { label: "French", code: "fra" },
    { label: "Spanish", code: "spa" },
    { label: "German", code: "deu" },
    { label: "Portuguese", code: "por" },
    { label: "Italian", code: "ita" },
    { label: "Turkish", code: "tur" },
    { label: "Russian", code: "rus" },
    { label: "Chinese (Simplified)", code: "chi_sim" },
    { label: "Japanese", code: "jpn" },
    { label: "Korean", code: "kor" },
    { label: "Bengali", code: "ben" },
    { label: "Dutch", code: "nld" },
    { label: "Polish", code: "pol" },
    { label: "Thai", code: "tha" },
    { label: "Vietnamese", code: "vie" },
    { label: "Indonesian", code: "ind" },
];

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 20;
const MAX_PIXELS = 25_000_000;

type ProgressInfo = {
    status?: string;
    progress?: number;
};

export function TiffToTextWorkspace() {
    const [file, setFile] = useState<File | null>(null);
    const [language, setLanguage] = useState("eng");
    const [result, setResult] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pageCount, setPageCount] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    function selectFile(next?: File) {
        if (!next || busy) return;

        setError("");
        setNotice("");
        setResult("");
        setPageCount(0);

        const isTiff =
            /\.(tif|tiff)$/i.test(next.name) ||
            next.type === "image/tiff" ||
            next.type === "image/x-tiff";

        if (!isTiff) {
            setFile(null);
            setError("Please select a valid .tif or .tiff file.");
            return;
        }

        if (next.size > MAX_BYTES) {
            setFile(null);
            setError("File exceeds the 25 MB browser-processing limit.");
            return;
        }

        setFile(next);
    }

    async function extract() {
        if (!file || busy) return;

        setBusy(true);
        setError("");
        setNotice("");
        setResult("");
        setProgress(0);
        setStage("Reading TIFF document...");

        let worker:
            | {
                recognize: (
                    input: Blob
                ) => Promise<{ data: { text: string } }>;
                terminate: () => Promise<unknown>;
            }
            | null = null;

        try {
            const [UTIF, Tesseract] = await Promise.all([
                import("utif2"),
                import("tesseract.js"),
            ]);

            const buffer = await file.arrayBuffer();
            const pages = UTIF.decode(buffer);

            if (!pages.length) {
                throw new Error("No readable image pages were found in this TIFF file.");
            }

            if (pages.length > MAX_PAGES) {
                throw new Error(
                    `This file contains ${pages.length} pages. The current limit is ${MAX_PAGES} pages per document.`
                );
            }

            setPageCount(pages.length);
            setStage(`Found ${pages.length} TIFF page(s). Starting OCR...`);

            worker = await Tesseract.createWorker(language, 1, {
                logger: (info: ProgressInfo) => {
                    if (typeof info.progress === "number") {
                        setProgress(Math.round(info.progress * 100));
                    }

                    if (info.status) {
                        setStage(info.status.replace(/_/g, " "));
                    }
                },
            });

            const extractedPages: string[] = [];

            for (let index = 0; index < pages.length; index++) {
                const page = pages[index];

                setStage(`Decoding page ${index + 1} of ${pages.length}...`);
                setProgress(0);

                UTIF.decodeImage(buffer, page);

                const width = page.width;
                const height = page.height;

                if (
                    !Number.isSafeInteger(width) ||
                    !Number.isSafeInteger(height) ||
                    width <= 0 ||
                    height <= 0 ||
                    width * height > MAX_PIXELS
                ) {
                    throw new Error(
                        `Page ${index + 1} has invalid or excessive dimensions. Maximum: 25 megapixels per page.`
                    );
                }

                const rgba = UTIF.toRGBA8(page);

                if (rgba.length !== width * height * 4) {
                    throw new Error(`Could not decode TIFF page ${index + 1}.`);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Your browser could not create an image-processing canvas.");
                }

                context.putImageData(
                    new ImageData(new Uint8ClampedArray(rgba), width, height),
                    0,
                    0
                );

                const imageBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error(`Could not prepare page ${index + 1} for OCR.`));
                    }, "image/png");
                });

                canvas.width = 0;
                canvas.height = 0;

                setStage(`Extracting text from page ${index + 1} of ${pages.length}...`);

                const output = await worker.recognize(imageBlob);
                extractedPages.push(output.data.text.trim());
            }

            const text = extractedPages
                .map((page, index) => `--- Page ${index + 1} ---\n${page}`)
                .join("\n\n")
                .trim();

            setResult(text);

            if (text.replace(/--- Page \d+ ---/g, "").trim()) {
                setNotice(
                    `Successfully processed ${pages.length} TIFF page(s). Review, edit, copy, or download your text.`
                );
            } else {
                setError(
                    "No readable text was found. Try a clearer scan or select another OCR language."
                );
            }
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "TIFF processing failed. Please try another file."
            );
        } finally {
            if (worker) {
                await worker.terminate().catch(() => undefined);
            }

            setBusy(false);
            setStage("");
            setProgress(0);
        }
    }

    async function copyResult() {
        if (!result.trim()) return;

        try {
            await navigator.clipboard.writeText(result);
            setNotice("Extracted text copied to clipboard.");
        } catch {
            setError("Clipboard access was blocked. Select the text and copy it manually.");
        }
    }

    function downloadResult() {
        if (!result.trim()) return;

        const blob = new Blob([result], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `${file?.name.replace(/\.(tif|tiff)$/i, "") || "brobex-tiff-text"}.txt`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    }

    function clearAll() {
        if (busy) return;

        setFile(null);
        setResult("");
        setError("");
        setNotice("");
        setPageCount(0);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return (
        <section className="image-text-studio">
            <div className="image-text-heading">
                <div>
                    <span className="image-text-kicker">
                        <Sparkles size={13} /> BROBEX TIFF OCR STUDIO
                    </span>
                    <h2>Extract text from TIFF documents.</h2>
                    <p>
                        Decode TIFF images and recognize text locally in your browser,
                        including supported multi-page TIFF documents.
                    </p>
                </div>

                <span className="image-text-local">
                    <i /> Free · Browser processing
                </span>
            </div>

            {!file ? (
                <button
                    type="button"
                    className="image-text-upload"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        event.preventDefault();
                        selectFile(event.dataTransfer.files?.[0]);
                    }}
                >
                    <span className="image-text-upload-icon">
                        <UploadCloud size={29} />
                    </span>
                    <strong>Drop your TIFF document here</strong>
                    <span>or browse files from your device</span>
                    <em>TIF · TIFF · Up to 25 MB · Maximum 20 pages</em>
                    <b>Choose TIFF File</b>
                </button>
            ) : (
                <div className="image-text-file-panel">
                    <div className="image-text-filebar">
                        <div>
                            <FileImage size={18} />
                            <span>{file.name}</span>
                            <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                        </div>

                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={busy}
                            aria-label="Remove TIFF document"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    <div className="image-text-controls">
                        <label>
                            OCR language
                            <select
                                value={language}
                                onChange={(event) => setLanguage(event.target.value)}
                                disabled={busy}
                            >
                                {LANGUAGES.map((item) => (
                                    <option key={item.code} value={item.code}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            className="image-text-primary"
                            onClick={extract}
                            disabled={busy}
                        >
                            {busy ? (
                                <>
                                    <Loader2 className="image-text-spin" size={16} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Extract Text
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                className="image-text-hidden"
                type="file"
                accept=".tif,.tiff,image/tiff,image/x-tiff"
                onChange={(event) => selectFile(event.target.files?.[0])}
            />

            {busy && (
                <div className="image-text-progress">
                    <div>
                        <span>{stage || "Processing TIFF document..."}</span>
                        <b>{progress}%</b>
                    </div>

                    <div className="image-text-track">
                        <i style={{ width: `${progress}%` }} />
                    </div>

                    <small>
                        Large documents can take longer. Keep this browser tab open
                        until processing finishes.
                    </small>
                </div>
            )}

            {pageCount > 0 && (
                <p>
                    <small>Document pages detected: {pageCount}</small>
                </p>
            )}

            {error && (
                <div className="image-text-alert error">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {notice && (
                <div className="image-text-alert">
                    {notice}
                </div>
            )}

            {result !== "" && (
                <div className="image-text-result">
                    <div className="image-text-result-head">
                        <div>
                            <span>RECOGNIZED CONTENT</span>
                            <h3>Extracted text</h3>
                        </div>

                        <div>
                            <button type="button" onClick={copyResult}>
                                <Copy size={14} /> Copy
                            </button>

                            <button type="button" onClick={downloadResult}>
                                <Download size={14} /> TXT
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={result}
                        onChange={(event) => setResult(event.target.value)}
                        spellCheck={false}
                        aria-label="Editable extracted TIFF text"
                    />

                    <small>Edit recognized text before copying or downloading.</small>
                </div>
            )}

            <div className="image-text-privacy">
                <ShieldCheck size={18} />
                <div>
                    <strong>Your document stays on your device.</strong>
                    <span>
                        TIFF decoding and OCR run locally in your browser. No paid
                        OCR API or account is required. Tesseract language data may
                        download on first use.
                    </span>
                </div>
            </div>
        </section>
    );
}
