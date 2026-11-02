"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileImage, LoaderCircle, ShieldCheck, UploadCloud, X } from "lucide-react";

type Props = { targetKb: number; title: string };

type Result = {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  metTarget: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not encode this image.")), "image/jpeg", quality);
  });
}

export function ExactTargetCompressionWorkspace({ targetKb, title }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function reset() {
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
    if (selected.size > 20 * 1024 * 1024) {
      setError("This tool supports images up to 20 MB.");
      return;
    }
    setFile(selected);
    setBusy(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(selected);
      if (bitmap.width * bitmap.height > 40_000_000) {
        bitmap.close();
        throw new Error("This image is too large to process safely in the browser (maximum 40 megapixels).");
      }
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Your browser could not start the image processor.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      const targetBytes = targetKb * 1024;
      let low = 0.01;
      let high = 0.96;
      let best = await canvasBlob(canvas, low);
      let bestQuality = low;

      if (best.size <= targetBytes) {
        let candidate = best;
        for (let i = 0; i < 11; i++) {
          const mid = (low + high) / 2;
          candidate = await canvasBlob(canvas, mid);
          if (candidate.size <= targetBytes) {
            low = mid;
            best = candidate;
            bestQuality = mid;
          } else {
            high = mid;
          }
        }
      } else {
        // No resizing is performed: preserve the exact source pixel dimensions.
        best = await canvasBlob(canvas, 0.01);
      }

      const metTarget = best.size <= targetBytes;
      setResult({ blob: best, width: canvas.width, height: canvas.height, quality: bestQuality, metTarget });
      resultUrlRef.current = URL.createObjectURL(best);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compression failed. Please try another image.");
      setFile(null);
    } finally {
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
          <div><strong>Optimizing your image</strong><span>Preserving original pixel dimensions while reducing file size.</span></div>
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
          </div>
          {!result.metTarget && (
            <p className="exact-warning">
              This image cannot reach {targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`} at its original dimensions without unacceptable loss. The download below is the smallest JPEG this browser produced; its actual size is shown above.
            </p>
          )}
          <button className="exact-download-button" type="button" onClick={download}>
            <Download size={18} /> Download compressed image
          </button>
          <p className="exact-download-note"><ShieldCheck size={14} /> Processed locally in your browser. No image is uploaded to a server.</p>
        </div>
      )}
      <div className="exact-tool-note">
        <ShieldCheck size={16} />
        <span>Fixed target: <strong>{targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`}</strong>. Width and height are preserved; this tool never silently resizes your photo.</span>
      </div>
    </section>
  );
}
