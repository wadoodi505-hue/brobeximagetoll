"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Lock,
  Sparkles,
} from "lucide-react";
import { increaseImageFileSize } from "@/lib/image/increase-image-file-size";

type ImageInfo = {
  width: number;
  height: number;
  size: number;
};

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(mime: string, originalName: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };
  return extensions[mime] || (originalName.match(/\.[^.]+$/)?.[0] ?? "");
}

export function IncreaseImageFileSizeWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [resultInfo, setResultInfo] = useState<ImageInfo | null>(null);
  const [targetKb, setTargetKb] = useState(2048);
  const [outputFormat, setOutputFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!resultBlob) {
      setResultUrl("");
      return;
    }
    const url = URL.createObjectURL(resultBlob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resultBlob]);

  async function acceptFile(nextFile?: File) {
    if (!nextFile) return;
    if (inputRef.current) inputRef.current.value = "";

    setError("");
    setNotice("");
    setResultBlob(null);
    setResultInfo(null);

    if (!nextFile.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("The maximum upload size is 25 MB.");
      return;
    }

    const url = URL.createObjectURL(nextFile);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error("Invalid image dimensions.");
      }
      setFile(nextFile);
      setOutputFormat("original");
      setSourceUrl(url);
      setSourceInfo({
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: nextFile.size,
      });
      setNotice(
        nextFile.type === "image/avif"
          ? "AVIF loaded. Choose JPG, PNG or WebP before increasing its size."
          : "Image loaded. Choose the minimum file size.",
      );
    } catch {
      URL.revokeObjectURL(url);
      setError("This image could not be opened. Try another image.");
    }
  }

  async function process() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setResultBlob(null);
    setResultInfo(null);

    try {
      const generated = await increaseImageFileSize(file, targetKb * 1024, outputFormat);
      setResultBlob(generated.blob);
      setResultInfo({
        width: generated.width,
        height: generated.height,
        size: generated.blob.size,
      });
      setNotice(
        generated.reachedTarget
          ? generated.message
          : `${generated.message} The requested minimum could not be reached.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "File processing failed.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name.replace(/\.[^.]+$/, "")}-increased${getExtension(resultBlob.type, file.name)}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    setFile(null);
    setSourceInfo(null);
    setResultInfo(null);
    setResultBlob(null);
    setError("");
    setNotice("");
    setSourceUrl("");
    setResultUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const changePercent =
    sourceInfo && resultInfo && sourceInfo.size > 0
      ? ((resultInfo.size - sourceInfo.size) / sourceInfo.size) * 100
      : 0;
  const isAvif = file?.type === "image/avif";

  return (
    <section className="increase-size-workspace">
      <div className="isw-heading">
        <div>
          <span className="isw-kicker">
            <Sparkles size={14} /> BROBEX IMAGE ENGINE
          </span>
          <h2>Increase Image File Size</h2>
          <p>
            Increase an image&apos;s file size without resizing or changing its
            visual image data when using a supported original format.
          </p>
        </div>
        <span className="isw-private">
          <Lock size={13} /> Local processing
        </span>
      </div>

      {!file ? (
        <button
          type="button"
          className={`isw-dropzone ${dragging ? "isw-dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void acceptFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="isw-upload-icon"><UploadCloud size={28} /></span>
          <strong>Drop your image here</strong>
          <span>or click to browse your device</span>
          <small>JPG, PNG, WebP, GIF or AVIF - Maximum 25 MB</small>
        </button>
      ) : (
        <div className="isw-filebar">
          <div className="isw-file-icon"><FileImage size={22} /></div>
          <div className="isw-file-meta">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)} | {sourceInfo?.width} x {sourceInfo?.height}px</span>
          </div>
          <button type="button" className="isw-quiet-button" onClick={() => inputRef.current?.click()}>
            Replace
          </button>
          <button type="button" className="isw-icon-button" onClick={reset} aria-label="Remove image">
            <RotateCcw size={17} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        hidden
        onChange={(event) => void acceptFile(event.target.files?.[0])}
      />

      {file && (
        <div className="isw-layout">
          <div className="isw-settings">
            <div className="isw-section-title"><Lock size={16} /> SIZE SETTINGS</div>

            <label className="isw-label" htmlFor="isw-target">Target minimum file size</label>
            <div className="isw-target-row">
              <input
                id="isw-target"
                type="number"
                min="1"
                max="51200"
                value={targetKb}
                onChange={(event) => setTargetKb(Math.max(1, Math.min(51200, Number(event.target.value) || 1)))}
              />
              <span>KB</span>
            </div>

            <div className="isw-presets">
              {[100, 200, 500, 1024, 2048].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={targetKb === value ? "active" : ""}
                  onClick={() => setTargetKb(value)}
                >
                  {value >= 1024 ? `${value / 1024} MB` : `${value} KB`}
                </button>
              ))}
            </div>

            <label className="isw-label" htmlFor="isw-output-format">Output format</label>
            <select
              id="isw-output-format"
              className="isw-format-select"
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value as "original" | "image/jpeg" | "image/png" | "image/webp")}
            >
              <option value="original" disabled={isAvif}>Original format{isAvif ? " (unavailable for AVIF)" : " (recommended)"}</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
            <small className="isw-format-hint">
              {isAvif
                ? "AVIF can be uploaded and converted to JPG, PNG or WebP. Original AVIF padding is not supported."
                : "Original format preserves the existing image data. Choosing another format re-encodes the image."}
            </small>

            <div className="isw-preservation-note">
              <Lock size={17} />
              <div>
                <strong>Original image preserved</strong>
                <small>
                  Original-format mode adds format metadata without resizing or intentionally changing visual image data. Conversion may change image data, transparency, metadata or animation.
                </small>
              </div>
            </div>

            <div className="isw-technical-warning" role="note">
              <strong>Technical note:</strong>
              {" "}File-size padding does not improve image quality or resolution. Some upload services remove metadata or reject padded files. Converting an animated GIF through the browser may keep only its first frame. Always verify the downloaded file.
            </div>

            <button
              type="button"
              className="isw-process-button"
              disabled={busy || targetKb < 1 || targetKb > 51200}
              onClick={() => void process()}
            >
              {busy ? <><span className="isw-spinner" /> Processing file...</> : <><Sparkles size={17} /> Increase file size</>}
            </button>
            <p className="isw-local-note"><Lock size={12} /> Your file is processed locally in this browser.</p>
          </div>

          <div className="isw-preview-panel">
            <div className="isw-section-title"><ImageIcon size={16} /> IMAGE PREVIEW</div>
            <div className="isw-previews">
              <div className="isw-preview-card">
                <div className="isw-preview-image">
                  <img src={sourceUrl} alt="Original image preview" />
                </div>
                <div className="isw-preview-caption">
                  <strong>Original</strong>
                  <span>{sourceInfo ? formatBytes(sourceInfo.size) : "-"}</span>
                </div>
              </div>

              <div className="isw-preview-card">
                <div className="isw-preview-image">
                  {resultUrl ? (
                    <img src={resultUrl} alt="Generated increased image preview" />
                  ) : (
                    <div className="isw-preview-empty">
                      <ImageIcon size={30} />
                      <span>Generated preview appears here</span>
                    </div>
                  )}
                </div>
                <div className="isw-preview-caption">
                  <strong>Increased</strong>
                  <span>{resultInfo ? formatBytes(resultInfo.size) : "Not generated"}</span>
                </div>
              </div>
            </div>

            <div className="isw-stats">
              <div><span>Original size</span><strong>{sourceInfo ? formatBytes(sourceInfo.size) : "-"}</strong></div>
              <div><span>Output size</span><strong>{resultInfo ? formatBytes(resultInfo.size) : "-"}</strong></div>
              <div><span>Original dimensions</span><strong>{sourceInfo ? `${sourceInfo.width} x ${sourceInfo.height}` : "-"}</strong></div>
              <div><span>Size change</span><strong>{resultInfo ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%` : "-"}</strong></div>
            </div>

            {notice && <div className="isw-message success"><CheckCircle2 size={16} />{notice}</div>}
            {error && <div className="isw-message error"><AlertCircle size={16} />{error}</div>}

            {resultBlob && (
              <button type="button" className="isw-download-button" onClick={download}>
                <Download size={17} /> Download increased image
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
