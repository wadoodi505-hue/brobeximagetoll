"use client";

import { useEffect, useRef, useState } from "react";
import { startImageCompression } from "../lib/image-compression-worker";
import { CheckCircle2, Download, FileImage, LoaderCircle, ShieldCheck, UploadCloud, X } from "lucide-react";

type Props = { targetKb: number; title: string };

// The tool's existing KB targets use binary units (1 KB in this UI = 1,024 bytes).
const BYTES_PER_KB = 1024;

type Result = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  metTarget: boolean;
  durationMs: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

export function ExactTargetCompressionWorkspace({ targetKb, title }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const workerRef = useRef<(() => void) | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Preparing image…");

  useEffect(() => () => {
    workerRef.current?.();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function reset() {
    workerRef.current?.();
    workerRef.current = null;
    setProgress(0);
    setFile(null);
    setResult(null);
    setError("");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }

  async function compress(selected: File) {
    reset();
    if (!selected.type.startsWith("image/")) {
      setError("Choose a supported image file (JPG, PNG, WebP, GIF or AVIF).");
      return;
    }
    if (selected.size <= 0 || selected.size > 20 * 1024 * 1024) {
      setError("Choose a non-empty image up to 20 MB.");
      return;
    }
    setFile(selected);
    setBusy(true);
    setError("");
    setProgress(0);
    setProgressMessage("Preparing image…");
    try {
      const task = startImageCompression({
        file: selected,
        targetBytes: targetKb * BYTES_PER_KB,
        format: "image/jpeg",
        qualityLimit: 0.96,
        allowResize: true,
        maxPixels: 40_000_000,
        maxIterations: 12,
        onProgress: (value, message) => {
          setProgress(value);
          setProgressMessage(message);
        },
      });
      workerRef.current = task.cancel;
      const compressed = await task.promise;
      setProgress(100);
      setResult({
        blob: compressed.blob,
        width: compressed.width,
        height: compressed.height,
        quality: compressed.quality,
        metTarget: compressed.metTarget,
        durationMs: compressed.durationMs,
      });
      resultUrlRef.current = URL.createObjectURL(compressed.blob);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compression failed. Please try another image.");
      setFile(null);
    } finally {
      workerRef.current = null;
      setBusy(false);
    }
  }

  function onFile(selected?: File) {
    if (selected) void compress(selected);
  }

  function download() {
    if (!file || !result) return;
    const url = resultUrlRef.current;
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeBaseName(file.name)}-${targetKb >= 1024 ? `${targetKb / 1024}mb` : `${targetKb}kb`}.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <section className="exact-compress" aria-label={`${title} image compressor`}>
      <div
        className={`exact-upload ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); onFile(event.dataTransfer.files?.[0]); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        <div className="exact-upload-icon"><UploadCloud size={26} /></div>
        <h2>{file ? "Image selected" : "Upload your image"}</h2>
        <p>{file ? "Your image is ready for fixed-target compression." : "Drop an image here or select a file from your device."}</p>
        <button className="exact-primary-button" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          <FileImage size={17} /> {file ? "Choose another image" : "Choose image"}
        </button>
        <span className="exact-upload-meta">JPG, PNG, WebP, GIF or AVIF · Maximum 20 MB</span>
      </div>

      {error && <div className="exact-error" role="alert">{error}</div>}

      {busy && (
        <div className="exact-processing" role="status">
          <LoaderCircle size={20} className="exact-spinner" />
          <div><strong>Optimizing your image · {progress}%</strong><span>{progressMessage}</span><div className="exact-progress-track" aria-label={`Compression progress ${progress}%`} style={{ height: 6, marginTop: 10, overflow: "hidden", borderRadius: 999, background: "rgba(127,127,127,.18)" }}><span style={{ display: "block", height: "100%", width: `${progress}%`, borderRadius: 999, background: "currentColor", transition: "width .2s ease" }} /></div></div>
        </div>
      )}

      {file && result && !busy && (
        <div className="exact-result" aria-live="polite">
          <div className="exact-result-heading">
            <span className="exact-success-icon"><CheckCircle2 size={19} /></span>
            <div><strong>{result.metTarget ? "Compression complete" : "Best possible compression created"}</strong><span>{file.name}</span></div>
            <button className="exact-reset-button" type="button" onClick={reset} aria-label="Remove image"><X size={17} /></button>
          </div>
          <div className="exact-stats">
            <div><span>Original size</span><strong>{formatBytes(file.size)}</strong></div>
            <div><span>Compressed size</span><strong>{formatBytes(result.blob.size)}</strong></div>
            <div><span>Target size</span><strong>{targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`}</strong></div>
            <div><span>Dimensions</span><strong>{result.width} × {result.height}</strong></div>
            <div><span>Output format</span><strong>JPEG</strong></div>
            <div><span>Download filename</span><strong>{safeBaseName(file.name)}-{targetKb >= 1024 ? `${targetKb / 1024}mb` : `${targetKb}kb`}.jpg</strong></div>
            <div><span>Reduction</span><strong>{Math.max(0, (1 - result.blob.size / file.size) * 100).toFixed(1)}%</strong></div>
            <div><span>Processing time</span><strong>{(result.durationMs / 1000).toFixed(2)} s</strong></div>
          </div>
          {!result.metTarget && (
            <p className="exact-warning">
              This image could not reach {targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`} within the quality and dimension limits. The best available JPEG is shown above; verify its actual size before using it.
            </p>
          )}
          <button className="exact-download-button" type="button" onClick={download}>
            <Download size={18} /> Download compressed image
          </button>
          <p className="exact-download-note"><ShieldCheck size={14} /> Processed locally in your browser. No image is uploaded; re-encoding removes embedded EXIF metadata.</p>
        </div>
      )}
      <div className="exact-tool-note">
        <ShieldCheck size={16} />
        <span>Fixed target: <strong>{targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`}</strong>. Original dimensions are preserved whenever possible. If needed, the image is proportionally resized to meet the target.</span>
      </div>
    </section>
  );
}
