"use client";

import Link from "next/link";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ChangeEvent } from "react";
import {
  UploadCloud, Brush, Eraser, Undo2, Redo2, RotateCcw,
  Download, Image as ImageIcon, Sparkles
} from "lucide-react";

type Point = { x: number; y: number };

export default function BlurAnyObject() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"blur" | "erase">("blur");
  const [brushSize, setBrushSize] = useState(90);
  const [intensity, setIntensity] = useState(16);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const blurRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const undoRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);
  const intensityRef = useRef(intensity);

  const renderPreview = useCallback(() => {
    const output = canvasRef.current;
    const source = sourceRef.current;
    const mask = maskRef.current;
    const blurred = blurRef.current;
    if (!output || !source || !mask || !blurred) return;

    const width = source.width;
    const height = source.height;
    const blurContext = blurred.getContext("2d");
    const outputContext = output.getContext("2d");
    if (!blurContext || !outputContext) return;

    blurContext.clearRect(0, 0, width, height);
    blurContext.filter = `blur(${intensityRef.current}px)`;
    blurContext.drawImage(source, 0, 0);
    blurContext.filter = "none";
    blurContext.globalCompositeOperation = "destination-in";
    blurContext.drawImage(mask, 0, 0);
    blurContext.globalCompositeOperation = "source-over";

    outputContext.clearRect(0, 0, width, height);
    outputContext.drawImage(source, 0, 0);
    outputContext.drawImage(blurred, 0, 0);
  }, []);

  useEffect(() => {
    intensityRef.current = intensity;
    renderPreview();
  }, [intensity, renderPreview]);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    setReady(false);
    setError("");

    createImageBitmap(file).then((bitmap) => {
      if (cancelled) {
        bitmap.close();
        return;
      }

      const scale = Math.min(
        1,
        5000 / Math.max(bitmap.width, bitmap.height),
        Math.sqrt(20000000 / (bitmap.width * bitmap.height))
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const source = document.createElement("canvas");
      const mask = document.createElement("canvas");
      const blurred = document.createElement("canvas");

      [source, mask, blurred].forEach((canvas) => {
        canvas.width = width;
        canvas.height = height;
      });

      const sourceContext = source.getContext("2d");
      const output = canvasRef.current;
      if (!sourceContext || !output) {
        bitmap.close();
        setError("Your browser could not initialize the image editor.");
        return;
      }

      output.width = width;
      output.height = height;
      sourceContext.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      sourceRef.current = source;
      maskRef.current = mask;
      blurRef.current = blurred;
      undoRef.current = [];
      redoRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      renderPreview();
      setReady(true);
    }).catch(() => {
      setError("Could not open this image. Please try another image.");
    });

    return () => {
      cancelled = true;
    };
  }, [file, renderPreview]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }

    setFile(selected);
    event.target.value = "";
  };

  const getPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const paint = (from: Point, to: Point) => {
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    if (!mask || !context) return;

    context.save();
    context.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = "#ffffff";
    context.fillStyle = "#ffffff";
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = mode === "erase" ? "transparent" : "#ffffff";
    context.shadowBlur = mode === "erase" ? 0 : brushSize * 0.16;

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();

    if (from.x === to.x && from.y === to.y) {
      context.beginPath();
      context.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
    renderPreview();
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!ready || !maskRef.current) return;
    event.preventDefault();

    const context = maskRef.current.getContext("2d");
    if (!context) return;

    undoRef.current.push(context.getImageData(0, 0, maskRef.current.width, maskRef.current.height));
    if (undoRef.current.length > 30) undoRef.current.shift();
    redoRef.current = [];
    setCanUndo(true);
    setCanRedo(false);

    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = getPoint(event);
    lastPointRef.current = point;
    paint(point, point);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    event.preventDefault();
    const point = getPoint(event);
    paint(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const undo = () => {
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    const previous = undoRef.current.pop();
    if (!mask || !context || !previous) return;

    redoRef.current.push(context.getImageData(0, 0, mask.width, mask.height));
    context.putImageData(previous, 0, 0);
    setCanUndo(undoRef.current.length > 0);
    setCanRedo(true);
    renderPreview();
  };

  const redo = () => {
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    const next = redoRef.current.pop();
    if (!mask || !context || !next) return;

    undoRef.current.push(context.getImageData(0, 0, mask.width, mask.height));
    context.putImageData(next, 0, 0);
    setCanUndo(true);
    setCanRedo(redoRef.current.length > 0);
    renderPreview();
  };

  const clearBlur = () => {
    const mask = maskRef.current;
    const context = mask?.getContext("2d");
    if (!mask || !context) return;

    undoRef.current.push(context.getImageData(0, 0, mask.width, mask.height));
    redoRef.current = [];
    context.clearRect(0, 0, mask.width, mask.height);
    setCanUndo(true);
    setCanRedo(false);
    renderPreview();
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export the edited image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file?.name.replace(/\.[^.]+$/, "") || "image"}-blurred.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const reset = () => {
    setFile(null);
    setReady(false);
    setError("");
    sourceRef.current = null;
    maskRef.current = null;
    blurRef.current = null;
    undoRef.current = [];
    redoRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  };

  return (
    <main className="min-h-screen bg-[#090a0a] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-lg font-black tracking-[0.2em]">BROBEX</Link>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
            Browser-based editor
          </span>
        </header>

        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-emerald-400">
            <Sparkles size={14} /> BROBEX IMAGE STUDIO
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Blur Any Object</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
            Paint over any object or area to apply a smooth, adjustable blur. Erase mistakes and preview every edit instantly.
          </p>
        </div>

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[340px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.025] p-8 text-center transition hover:border-emerald-400/50 hover:bg-emerald-400/[0.04]"
          >
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <UploadCloud size={28} />
            </span>
            <span className="text-lg font-semibold">Upload an image</span>
            <span className="mt-2 text-sm text-white/40">JPG, PNG, WebP · Maximum 20 MB</span>
            <span className="mt-6 rounded-lg bg-emerald-400 px-5 py-3 text-xs font-bold text-black">Choose image</span>
          </button>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111313] p-2 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <ImageIcon size={15} className="text-emerald-400" /> Live preview
                </span>
                <span className="max-w-[60%] truncate text-[10px] text-white/35">{file.name}</span>
              </div>
              <div className="sticky top-3 flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(45deg,#171a1a_25%,transparent_25%),linear-gradient(-45deg,#171a1a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171a1a_75%),linear-gradient(-45deg,transparent_75%,#171a1a_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  onLostPointerCapture={stopDrawing}
                  className="block h-auto max-h-[72vh] max-w-full touch-none object-contain"
                  style={{ cursor: mode === "blur" ? "crosshair" : "cell" }}
                />
                {!ready && <span className="absolute text-xs text-white/40">Preparing image…</span>}
              </div>
              <p className="mt-3 text-center text-[10px] text-white/35">
                {mode === "blur" ? "Drag over the image to paint blur" : "Drag over painted areas to erase blur"}
              </p>
            </section>

            <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-[#111313] p-4 lg:sticky lg:top-6">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Editing tools</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMode("blur")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${mode === "blur" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60 hover:bg-white/5"}`}>
                    <Brush size={16} /> Blur brush
                  </button>
                  <button type="button" onClick={() => setMode("erase")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${mode === "erase" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60 hover:bg-white/5"}`}>
                    <Eraser size={16} /> Eraser
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="mb-2 flex justify-between text-xs">
                  <label htmlFor="blur-intensity" className="font-medium text-white/75">Blur intensity</label>
                  <span className="font-semibold tabular-nums text-emerald-300">{intensity}px</span>
                </div>
                <input id="blur-intensity" type="range" min="2" max="50" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-emerald-400" />
                <div className="mt-1 flex justify-between text-[10px] text-white/35"><span>Subtle</span><span>Strong</span></div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="mb-2 flex justify-between text-xs">
                  <label htmlFor="brush-size" className="font-medium text-white/75">Brush size</label>
                  <span className="font-semibold tabular-nums text-emerald-300">{brushSize}px</span>
                </div>
                <input id="brush-size" type="range" min="10" max="300" step="5" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-emerald-400" />
                <div className="mt-1 flex justify-between text-[10px] text-white/35"><span>Small</span><span>Large</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <button type="button" onClick={undo} disabled={!canUndo} className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-30"><Undo2 size={14} /> Undo</button>
                <button type="button" onClick={redo} disabled={!canRedo} className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-30"><Redo2 size={14} /> Redo</button>
                <button type="button" onClick={clearBlur} className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-white/60 hover:bg-white/5"><RotateCcw size={14} /> Clear all blur</button>
              </div>

              <button type="button" onClick={download} disabled={!ready} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-black transition hover:bg-emerald-300 disabled:opacity-40">
                <Download size={17} /> Export PNG
              </button>
              <button type="button" onClick={reset} className="w-full py-2 text-xs text-white/40 hover:text-white/80">Choose another image</button>
            </aside>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</p>}

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-[10px] tracking-wider text-white/30">
          BROBEX IMAGE STUDIO · PRIVATE BROWSER-BASED PROCESSING
        </footer>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={chooseFile} className="hidden" />
    </main>
  );
}

