
"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
    UploadCloud,
    Image as ImageIcon,
    Download,
    Grid3X3,
    RotateCcw,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Archive,
} from "lucide-react";

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_TILES = 100;

type TileResult = {
    name: string;
    blob: Blob;
    url: string;
    width: number;
    height: number;
};

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function UploadIcon() {
    return (
        <UploadCloud className="h-8 w-8" aria-hidden="true" />
    );
}

export function ImageSplitterWorkspace() {
    const inputRef = useRef<HTMLInputElement>(null);
    const originalUrlRef = useRef<string | null>(null);
    const tileUrlsRef = useRef<string[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [rows, setRows] = useState(3);
    const [columns, setColumns] = useState(3);
    const [tiles, setTiles] = useState<TileResult[]>([]);
    const [processing, setProcessing] = useState(false);
    const [packing, setPacking] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [dragging, setDragging] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        return () => {
            if (originalUrlRef.current) {
                URL.revokeObjectURL(originalUrlRef.current);
            }

            tileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    function clearTiles() {
        tileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        tileUrlsRef.current = [];
        setTiles([]);
    }

    function chooseFile(selected?: File) {
        if (!selected || processing) return;

        setError("");
        setMessage("");
        clearTiles();

        if (!selected.type.startsWith("image/")) {
            setError("Please choose a valid image file.");
            return;
        }

        if (selected.size > MAX_FILE_SIZE) {
            setError("This image is larger than 12 MB. Choose a smaller image.");
            return;
        }

        if (originalUrlRef.current) {
            URL.revokeObjectURL(originalUrlRef.current);
        }

        const url = URL.createObjectURL(selected);
        originalUrlRef.current = url;

        setFile(selected);
        setPreviewUrl(url);
        setDimensions({ width: 0, height: 0 });
        setMessage("Image uploaded successfully. Choose your tile layout.");

        createImageBitmap(selected)
            .then((bitmap) => {
                setDimensions({
                    width: bitmap.width,
                    height: bitmap.height,
                });
                bitmap.close();
            })
            .catch(() => {
                setError("This image could not be opened. Try another image format.");
            });
    }

    function handleInput(event: ChangeEvent<HTMLInputElement>) {
        chooseFile(event.target.files?.[0]);
        event.target.value = "";
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        chooseFile(event.dataTransfer.files?.[0]);
    }

    async function splitImage() {
        if (!file || processing || packing) return;

        const tileCount = rows * columns;

        if (
            !Number.isInteger(rows) ||
            !Number.isInteger(columns) ||
            rows < 1 ||
            columns < 1 ||
            tileCount > MAX_TILES
        ) {
            setError(`Choose a layout containing between 1 and ${MAX_TILES} tiles.`);
            return;
        }

        setProcessing(true);
        setProgress(0);
        setError("");
        setMessage("");
        clearTiles();

        let bitmap: ImageBitmap | null = null;

        try {
            bitmap = await createImageBitmap(file);

            if (bitmap.width * bitmap.height > MAX_PIXELS) {
                throw new Error("This image exceeds the 40-megapixel processing limit.");
            }

            if (rows > bitmap.height || columns > bitmap.width) {
                throw new Error(
                    "The selected grid is too large for this image's pixel dimensions."
                );
            }

            const generated: TileResult[] = [];

            const baseName =
                file.name.replace(/\.[^.]+$/, "") || "brobex-image";

            for (let row = 0; row < rows; row++) {
                for (let column = 0; column < columns; column++) {
                    const left = Math.floor((column * bitmap.width) / columns);
                    const top = Math.floor((row * bitmap.height) / rows);
                    const right = Math.floor(((column + 1) * bitmap.width) / columns);
                    const bottom = Math.floor(((row + 1) * bitmap.height) / rows);

                    const tileWidth = right - left;
                    const tileHeight = bottom - top;

                    const canvas = document.createElement("canvas");
                    canvas.width = tileWidth;
                    canvas.height = tileHeight;

                    const context = canvas.getContext("2d");

                    if (!context) {
                        throw new Error("Your browser could not create an image canvas.");
                    }

                    context.drawImage(
                        bitmap,
                        left,
                        top,
                        tileWidth,
                        tileHeight,
                        0,
                        0,
                        tileWidth,
                        tileHeight
                    );

                    const blob = await new Promise<Blob>((resolve, reject) => {
                        canvas.toBlob(
                            (result) => {
                                if (result) resolve(result);
                                else reject(new Error("A tile could not be exported."));
                            },
                            "image/png"
                        );
                    });

                    const name = `${baseName}-row-${row + 1}-column-${column + 1}.png`;
                    const url = URL.createObjectURL(blob);

                    generated.push({
                        name,
                        blob,
                        url,
                        width: tileWidth,
                        height: tileHeight,
                    });

                    canvas.width = 0;
                    canvas.height = 0;

                    setProgress(Math.round((generated.length / tileCount) * 100));
                }
            }

            tileUrlsRef.current = generated.map((tile) => tile.url);
            setTiles(generated);
            setMessage(
                `Successfully split your image into ${generated.length} PNG tiles.`
            );
        } catch (cause) {
            generatedCleanup(tileUrlsRef.current);
            tileUrlsRef.current = [];

            setError(
                cause instanceof Error
                    ? cause.message
                    : "Image splitting failed. Please try another image."
            );
        } finally {
            bitmap?.close();
            setProcessing(false);
            setProgress(0);
        }
    }

    function generatedCleanup(urls: string[]) {
        urls.forEach((url) => URL.revokeObjectURL(url));
    }

    async function downloadAll() {
        if (!tiles.length || packing) return;

        setPacking(true);
        setError("");

        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            tiles.forEach((tile) => {
                zip.file(tile.name, tile.blob);
            });

            const archive = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 5 },
            });

            const baseName =
                file?.name.replace(/\.[^.]+$/, "") || "brobex-image";

            downloadBlob(archive, `${baseName}-split-tiles.zip`);
            setMessage("Your ZIP archive is ready.");
        } catch {
            setError("ZIP export failed. You can still download individual tiles.");
        } finally {
            setPacking(false);
        }
    }

    function reset() {
        if (processing || packing) return;

        clearTiles();

        if (originalUrlRef.current) {
            URL.revokeObjectURL(originalUrlRef.current);
            originalUrlRef.current = null;
        }

        setFile(null);
        setPreviewUrl("");
        setDimensions({ width: 0, height: 0 });
        setError("");
        setMessage("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    const tileCount = rows * columns;
    const busy = processing || packing;

    return (
        <main className="min-h-screen overflow-hidden bg-[#080a0a] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:52px_52px]" />

            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-lg font-black tracking-[0.2em] text-white">
                        BROBEX<span className="text-[#c77b53]">.</span>
                    </span>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Free · Browser processing
                    </div>
                </header>

                <section className="mx-auto max-w-3xl text-center">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c77b53]/25 bg-[#c77b53]/[0.08] px-3 py-1.5 text-xs font-medium tracking-wide text-[#e4a17d]">
                        <Grid3X3 size={15} />
                        IMAGE SPLITTER STUDIO
                    </div>

                    <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
                        Split images with
                        <span className="mt-2 block bg-gradient-to-r from-[#f0c3a7] via-[#c77b53] to-[#e6a17b] bg-clip-text text-transparent">
                            precision.
                        </span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                        Divide an image into perfectly aligned tiles. Choose your grid,
                        preview every section, and export individual images or one ZIP archive.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/45">
                        <span>PNG tile export</span>
                        <span>Custom grid layouts</span>
                        <span>Local processing</span>
                    </div>
                </section>

                <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-[#101313]/90 p-4 shadow-2xl shadow-black/30 sm:mt-14 sm:p-7">
                    {!file ? (
                        <div
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            className={`flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-12 text-center transition sm:min-h-[360px] ${dragging
                                    ? "border-[#dfa17e] bg-[#c77b53]/10"
                                    : "border-white/20 bg-white/[0.02]"
                                }`}
                        >
                            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c77b53]/25 bg-[#c77b53]/10 text-[#e4a17d]">
                                <UploadIcon />
                            </div>

                            <h2 className="text-xl font-semibold tracking-tight">
                                Drop your image here
                            </h2>

                            <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                                Upload an image from your device to create a custom tile grid.
                            </p>

                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c77b53] px-6 py-3 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] focus:outline-none focus:ring-2 focus:ring-[#dfa17e] focus:ring-offset-2 focus:ring-offset-[#101313]"
                            >
                                <UploadIcon />
                                Choose Image
                            </button>

                            <p className="mt-4 text-xs text-white/35">
                                JPG · PNG · WEBP · Up to 12 MB
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white">
                                        Image workspace
                                    </p>
                                    <p className="mt-1 break-all text-xs text-white/45">
                                        {file.name}
                                        {dimensions.width > 0 &&
                                            ` · ${dimensions.width} × ${dimensions.height}px`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={reset}
                                    disabled={busy}
                                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white disabled:opacity-40"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <RotateCcw size={14} /> Change image
                                    </span>
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                        <span className="text-xs font-medium text-white/70">
                                            Original image
                                        </span>
                                        <ImageIcon size={15} className="text-white/40" />
                                    </div>

                                    <div className="flex min-h-[250px] items-center justify-center p-4 sm:min-h-[340px]">
                                        <img
                                            src={previewUrl}
                                            alt="Original image"
                                            className="max-h-[420px] max-w-full rounded-lg object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                        <span className="text-xs font-medium text-white/70">
                                            Live grid preview
                                        </span>
                                        <span className="rounded-md bg-[#c77b53]/10 px-2 py-1 text-[10px] text-[#e4a17d]">
                                            {rows} × {columns}
                                        </span>
                                    </div>

                                    <div className="flex min-h-[250px] items-center justify-center p-4 sm:min-h-[340px]">
                                        <div className="relative w-full overflow-hidden rounded-lg">
                                            <img
                                                src={previewUrl}
                                                alt="Image with tile grid preview"
                                                className="block max-h-[420px] w-full object-contain"
                                            />
                                            <div
                                                className="pointer-events-none absolute inset-0 grid"
                                                style={{
                                                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {Array.from({ length: tileCount }).map((_, index) => (
                                                    <div
                                                        key={index}
                                                        className="border border-[#f0b18e]/90 bg-[#c77b53]/[0.06]"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            Grid configuration
                                        </h3>
                                        <p className="mt-1 text-xs text-white/45">
                                            Customize the number of rows and columns.
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-white/10 bg-[#171a1a] px-3 py-2 text-xs text-white/70">
                                        {tileCount} tiles
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-xs text-white/60">
                                        Rows
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={rows}
                                            disabled={busy}
                                            onChange={(event) =>
                                                setRows(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
                                            }
                                            className="min-h-11 rounded-xl border border-white/15 bg-[#171a1a] px-3 text-sm text-white outline-none focus:border-[#c77b53] disabled:opacity-50"
                                        />
                                    </label>

                                    <label className="flex flex-col gap-2 text-xs text-white/60">
                                        Columns
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={columns}
                                            disabled={busy}
                                            onChange={(event) =>
                                                setColumns(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
                                            }
                                            className="min-h-11 rounded-xl border border-white/15 bg-[#171a1a] px-3 text-sm text-white outline-none focus:border-[#c77b53] disabled:opacity-50"
                                        />
                                    </label>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {[2, 3, 4].map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            disabled={busy || size * size > MAX_TILES}
                                            onClick={() => {
                                                setRows(size);
                                                setColumns(size);
                                                clearTiles();
                                                setMessage("");
                                            }}
                                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-[#c77b53]/60 hover:text-white disabled:opacity-40"
                                        >
                                            {size} × {size}
                                        </button>
                                    ))}
                                </div>

                                {tileCount > MAX_TILES && (
                                    <p className="mt-3 text-xs text-amber-200">
                                        Maximum supported layout: {MAX_TILES} tiles.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={splitImage}
                                    disabled={busy || tileCount > MAX_TILES || dimensions.width === 0}
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c77b53] px-5 py-3.5 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] focus:outline-none focus:ring-2 focus:ring-[#dfa17e] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Splitting {progress}%
                                        </>
                                    ) : (
                                        <>
                                            <Grid3X3 size={17} />
                                            Split Image
                                        </>
                                    )}
                                </button>

                                {processing && (
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#a95835] via-[#d99a75] to-[#f0c3a7] transition-[width] duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleInput}
                    />

                    {error && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm leading-6 text-red-200">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Unable to process image</p>
                                <p className="mt-1 text-red-100/75">{error}</p>
                            </div>
                        </div>
                    )}

                    {message && !error && (
                        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
                            <CheckCircle2 size={17} className="shrink-0" />
                            {message}
                        </div>
                    )}

                    {tiles.length > 0 && (
                        <section className="mt-7">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">Your image tiles</h3>
                                    <p className="mt-1 text-xs text-white/45">
                                        {tiles.length} PNG files · Original image dimensions preserved
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={downloadAll}
                                    disabled={packing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c77b53] px-4 py-3 text-xs font-semibold text-[#160d09] transition hover:bg-[#dfa17e] disabled:opacity-60"
                                >
                                    {packing ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Archive size={16} />
                                    )}
                                    {packing ? "Creating ZIP..." : "Download All ZIP"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {tiles.map((tile, index) => (
                                    <article
                                        key={tile.name}
                                        className="overflow-hidden rounded-xl border border-white/10 bg-[#090b0b]"
                                    >
                                        <div className="flex aspect-square items-center justify-center bg-white/[0.03] p-3">
                                            <img
                                                src={tile.url}
                                                alt={`Tile ${index + 1}`}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>

                                        <div className="p-3">
                                            <p className="truncate text-xs font-semibold text-white/85">
                                                Tile {index + 1}
                                            </p>
                                            <p className="mt-1 text-[10px] text-white/40">
                                                {tile.width} × {tile.height}px
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => downloadBlob(tile.blob, tile.name)}
                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-2 text-xs text-white/75 transition hover:border-[#c77b53]/60 hover:text-white"
                                            >
                                                <Download size={14} />
                                                Download PNG
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </section>

                <section className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3">
                    {[
                        {
                            title: "Upload",
                            description: "Choose an image from your device.",
                        },
                        {
                            title: "Configure",
                            description: "Set the exact rows and columns you need.",
                        },
                        {
                            title: "Export",
                            description: "Download each tile or all tiles in a ZIP.",
                        },
                    ].map((step, index) => (
                        <div
                            key={step.title}
                            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                        >
                            <p className="text-xs tracking-[0.18em] text-[#d99a75]">
                                STEP 0{index + 1}
                            </p>
                            <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                            <p className="mt-2 text-xs leading-5 text-white/45">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </section>

                <div className="mx-auto mt-8 flex max-w-5xl items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-xs leading-6 text-white/45">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <p>
                        <strong className="text-white/75">Private browser processing.</strong>{" "}
                        Your image is processed locally using your browser&apos;s image canvas.
                        No image-processing API or account is required.
                    </p>
                </div>

                <footer className="mt-12 text-center text-xs text-white/30">
                    BROBEX Image Tools · Image Splitter
                </footer>
            </div>
        </main>
    );
}
