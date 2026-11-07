"use client";

import { useEffect, useRef, useState } from "react";
import { startImageCompression } from "../lib/image-compression-worker";
import {
  AlertCircle, Check, CheckCircle2, Download, FileImage, ImagePlus,
  LoaderCircle, RotateCcw, ShieldCheck, SlidersHorizontal, X,
} from "lucide-react";

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

type Props = {
  title: string;
  description?: string;
  targetKb?: number | null;
  minTargetKb?: number;
  lockedFormat?: OutputFormat;
};

type CompressionResult = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  format: OutputFormat;
  metTarget: boolean;
  durationMs: number;
};

// Target values in this workspace use binary KB units (1 KB = 1,024 bytes).
const BYTES_PER_KB = 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const FORMATS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: "image/webp", label: "WebP", extension: "webp" },
  { value: "image/jpeg", label: "JPEG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

function encodeCanvas(canvas: HTMLCanvasElement, format: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("The browser could not encode this image. Try another format or a smaller image."));
      if (blob.type !== format) return reject(new Error(`${format.split("/")[1].toUpperCase()} export is not supported by this browser. Choose JPEG or WebP instead.`));
      resolve(blob);
    }, format, format === "image/png" ? undefined : quality);
  });
}

export function ImageCompressionWorkspace({
  title,
  description,
  targetKb = null,
  minTargetKb,
  lockedFormat,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState("");
  const originalUrlRef = useRef<string | null>(null);
  const operationIdRef = useRef(0);
  const workerRef = useRef<(() => void) | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Preparing image…");
  const [targetValue, setTargetValue] = useState(targetKb ?? 100);
  const [format, setFormat] = useState<OutputFormat>(lockedFormat ?? "image/webp");
  const [quality, setQuality] = useState(92);
  const [allowResize, setAllowResize] = useState(true);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => () => {
    workerRef.current?.();
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
  }, []);

  function clearOutput() {
    setResult(null);
    setNotice("");
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
  }

  function reset() {
    operationIdRef.current += 1;
    workerRef.current?.();
    workerRef.current = null;
    setProgress(0);
    setFile(null);
    setError("");
    setBusy(false);
    clearOutput();
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    originalUrlRef.current = null;
    setOriginalPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function processImage() {
    const selected = file;
    if (!selected) return;
    const operationId = ++operationIdRef.current;
    setError("");
    clearOutput();

    if (!selected.type.startsWith("image/")) {
      setError("Choose a supported image file.");
      return;
    }
    if (selected.size <= 0 || selected.size > MAX_FILE_BYTES) {
      setError("Choose a non-empty image up to 25 MB.");
      return;
    }
    if (!Number.isFinite(targetValue) || targetValue < 1 || targetValue > 20_480) {
      setError("Enter a target between 1 KB and 20,480 KB.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setProgressMessage("Preparing image…");

    try {
      const chosenFormat = lockedFormat ?? format;
      const task = startImageCompression({
        file: selected,
        targetBytes: targetValue * BYTES_PER_KB,
        format: chosenFormat,
        qualityLimit: quality / 100,
        allowResize,
        maxPixels: MAX_PIXELS,
        maxIterations: 12,
        onProgress: (value, message) => {
          if (operationId === operationIdRef.current) {
            setProgress(value);
            setProgressMessage(message);
          }
        },
      });
      workerRef.current = task.cancel;
      const compressedResult = await task.promise;
      if (operationId !== operationIdRef.current) return;
      const compressed: CompressionResult = {
        blob: compressedResult.blob,
        width: compressedResult.width,
        height: compressedResult.height,
        quality: compressedResult.quality,
        format: compressedResult.format,
        metTarget: compressedResult.metTarget,
        durationMs: compressedResult.durationMs,
      };
      setProgress(100);
      setResult(compressed);
      outputUrlRef.current = URL.createObjectURL(compressed.blob);

      if (!compressed.metTarget) {
        setNotice("The requested size could not be reached with the selected format and resize setting. The best available result is shown; check its actual size before using it.");
      } else if (minTargetKb && compressed.blob.size < minTargetKb * 1024) {
        setNotice(`The image is below the ${minTargetKb} KB lower guide. It is already optimized and will not be artificially enlarged just to increase its file size.`);
      } else if (compressed.blob.size > selected.size) {
        setNotice("The exported file meets the target, but it is larger than your original. Keep the original if minimizing file size is your priority.");
      } else {
        setNotice("Compression completed. The exported file is within your selected size limit.");
      }
    } catch (cause) {
      if (operationId === operationIdRef.current) {
        setError(cause instanceof Error ? cause.message : "Compression failed. Please try another image.");
      }
    } finally {
      if (operationId === operationIdRef.current) {
        workerRef.current = null;
        setBusy(false);
      }
    }
  }

  function chooseFile(selected?: File) {
    if (!selected) return;
    operationIdRef.current += 1;
    workerRef.current?.();
    workerRef.current = null;
    setBusy(false);
    clearOutput();
    setError("");
    setFile(selected);
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    originalUrlRef.current = URL.createObjectURL(selected);
    setOriginalPreviewUrl(originalUrlRef.current);
    if (inputRef.current) inputRef.current.value = "";
  }

  function download() {
    if (!file || !result || !outputUrlRef.current) return;
    const extension = FORMATS.find((item) => item.value === result.format)?.extension ?? "webp";
    const anchor = document.createElement("a");
    anchor.href = outputUrlRef.current;
    anchor.download = `${baseName(file.name)}-brobex-compressed.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  const sizeChange = file && result ? ((result.blob.size / file.size) - 1) * 100 : 0;
  const sizeChangeLabel = sizeChange < -0.05
    ? `${Math.abs(sizeChange).toFixed(1)}% smaller`
    : sizeChange > 0.05
      ? `${sizeChange.toFixed(1)}% larger`
      : "No change";
  const outputFormatName = FORMATS.find((item) => item.value === (result?.format ?? format))?.label ?? "Image";

  return (
    <section className="brobex-compression" aria-label={`${title} workspace`}>
      <div className="bc-heading">
        <div>
          <span className="bc-eyebrow">BROBEX IMAGE OPTIMIZER</span>
          <h2>{title}</h2>
          <p>{description ?? "Reduce image file size while balancing visual quality, dimensions and format."}</p>
        </div>
        <span className="bc-local-chip"><ShieldCheck size={15} /> On-device processing</span>
      </div>

      <div
        className={`bc-upload ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          chooseFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <span className="bc-upload-icon"><ImagePlus size={27} /></span>
        <strong>{file ? file.name : "Drop your image here"}</strong>
        <span>{file ? `${formatBytes(file.size)} · Ready to optimize` : "Drag and drop or browse from your device"}</span>
        <button type="button" className="bc-button bc-button-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          <FileImage size={17} /> {file ? "Replace image" : "Choose image"}
        </button>
        <small>JPG, PNG, WebP, GIF or AVIF · Up to 25 MB · Animated GIFs export as a still frame</small>
      </div>

      {error && <div className="bc-alert bc-alert-error" role="alert"><AlertCircle size={17} />{error}</div>}

      <div className="bc-settings">
        <div className="bc-settings-title">
          <div><SlidersHorizontal size={17} /><strong>Compression settings</strong></div>
          <button type="button" className="bc-text-button" disabled={busy} onClick={() => {
            setTargetValue(targetKb ?? 100);
            setFormat(lockedFormat ?? "image/webp");
            setQuality(92);
            setAllowResize(true);
            clearOutput();
          }}><RotateCcw size={14} /> Reset settings</button>
        </div>

        <div className="bc-settings-grid">
          <label className="bc-field">
            <span>Maximum file size</span>
            <div className="bc-input-suffix">
              <input
                type="number"
                min={1}
                max={20480}
                value={targetKb ?? targetValue}
                disabled={targetKb !== null || busy}
                onChange={(event) => { setTargetValue(Number(event.target.value)); clearOutput(); }}
              />
              <span>KB</span>
            </div>
            {targetKb !== null && <small>Preset target for this tool</small>}
          </label>

          <label className="bc-field">
            <span>Output format</span>
            <select
              value={lockedFormat ?? format}
              disabled={Boolean(lockedFormat) || busy}
              onChange={(event) => { setFormat(event.target.value as OutputFormat); clearOutput(); }}
            >
              {FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            {lockedFormat && <small>JPEG output is fixed for this preset</small>}
          </label>

          <label className="bc-field bc-quality-field">
            <span>Quality preference <strong>{quality}%</strong></span>
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={quality}
              disabled={busy}
              onChange={(event) => { setQuality(Number(event.target.value)); clearOutput(); }}
            />
            <small>{format === "image/png" ? "PNG stays in PNG format. Lower quality applies controlled color reduction to help reduce file size; 100% preserves full color precision." : "Higher quality is prioritized when the target allows it."}</small>
          </label>
        </div>

        <label className="bc-toggle">
          <input type="checkbox" checked={allowResize} disabled={busy} onChange={(event) => { setAllowResize(event.target.checked); clearOutput(); }} />
          <span className="bc-toggle-mark"><Check size={13} /></span>
          <span><strong>Allow dimension reduction when needed</strong><small>Preserves original dimensions whenever compression alone can meet the target.</small></span>
        </label>

        {minTargetKb && <p className="bc-range-note">Target guidance: {minTargetKb}–{targetKb} KB. The maximum size is enforced; files are never enlarged artificially to reach the lower number.</p>}
      </div>

      <button type="button" className="bc-button bc-button-primary bc-run-button" onClick={() => void processImage()} disabled={!file || busy}>
        {busy ? <LoaderCircle size={17} className="bc-spinner" /> : <SlidersHorizontal size={17} />}
        {busy ? "Optimizing image…" : result ? "Apply settings and compress again" : "Compress image"}
      </button>

      {busy && (
        <div className="bc-processing" role="status">
          <LoaderCircle size={21} className="bc-spinner" />
          <div><strong>Optimizing your image… {progress}%</strong><span>{progressMessage}</span><div className="bc-progress-track" aria-label={`Compression progress ${progress}%`} style={{ height: 6, marginTop: 10, overflow: "hidden", borderRadius: 999, background: "rgba(127,127,127,.18)" }}><span style={{ display: "block", height: "100%", width: `${progress}%`, borderRadius: 999, background: "currentColor", transition: "width .2s ease" }} /></div></div>
        </div>
      )}

      {file && result && !busy && (
        <div className="bc-result" aria-live="polite">
          <div className="bc-result-top">
            <div><span className="bc-eyebrow">OPTIMIZATION RESULT</span><h3>{result.metTarget ? "Your image is ready" : "Best available result"}</h3><p>{file.name}</p></div>
            <button type="button" className="bc-icon-button" onClick={reset} aria-label="Remove image"><X size={17} /></button>
          </div>

          <div className="bc-preview-grid">
            <div className="bc-preview-card">
              <div className="bc-preview-label"><span>Original</span><strong>{formatBytes(file.size)}</strong></div>
              <div className="bc-preview-image"><img src={originalPreviewUrl} alt="Original image preview" /></div>
              <small>Source image · original dimensions retained when possible</small>
            </div>
            <div className="bc-preview-card">
              <div className="bc-preview-label"><span>Optimized</span><strong>{formatBytes(result.blob.size)}</strong></div>
              <div className="bc-preview-image"><img src={outputUrlRef.current ?? ""} alt="Compressed image preview" /></div>
              <small>{result.width.toLocaleString()} × {result.height.toLocaleString()} px · {outputFormatName}</small>
            </div>
          </div>

          <div className="bc-stat-grid">
            <div><span>Original size</span><strong>{formatBytes(file.size)}</strong></div>
            <div><span>New size</span><strong>{formatBytes(result.blob.size)}</strong></div>
            <div><span>Size change</span><strong>{sizeChangeLabel}</strong></div>
            <div><span>Dimensions</span><strong>{result.width} × {result.height}</strong></div>
            <div><span>Processing time</span><strong>{(result.durationMs / 1000).toFixed(2)} s</strong></div>
          </div>

          {notice && <div className={`bc-alert ${result.metTarget ? "bc-alert-success" : "bc-alert-warning"}`}>{result.metTarget ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{notice}</div>}

          <button type="button" className="bc-button bc-button-download" onClick={download}><Download size={18} /> Download optimized image</button>
          <p className="bc-privacy-note"><ShieldCheck size={14} /> Your image is processed locally, not uploaded to BROBEX. Re-encoding also removes embedded EXIF metadata.</p>
        </div>
      )}

      <div className="bc-footnote"><ShieldCheck size={16} /><span>Target sizes are maximum limits, not promises of an exact byte count. Actual output depends on image detail, format support and dimensions.</span></div>
    </section>
  );
}
