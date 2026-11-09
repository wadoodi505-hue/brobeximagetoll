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

export function IncreaseImageFileSizeWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceInfo, setSourceInfo] = useState<ImageInfo | null>(null);
  const [resultInfo, setResultInfo] = useState<ImageInfo | null>(null);
  const [targetKb, setTargetKb] = useState(2048);
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [resultUrl, setResultUrl] = useState("");
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
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  function invalidateResult() {
    setResultBlob(null);
    setResultInfo(null);
    setResultUrl("");
    setNotice("");
  }

  async function acceptFile(nextFile?: File) {
    if (!nextFile) return;

    setError("");
    setNotice("");
    invalidateResult();

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
      setNotice("Image loaded. Choose the minimum file size.");
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
    invalidateResult();

    try {
      const generated = await increaseImageFileSize(file, targetKb * 1024, outputFormat);

      setResultBlob(generated.blob);
      setResultUrl(URL.createObjectURL(generated.blob));
      setResultInfo({
        width: generated.width,
        height: generated.height,
        size: generated.blob.size,
      });
      setNotice(generated.message);
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
    const extension = resultBlob.type === "image/jpeg" ? ".jpg" : resultBlob.type === "image/png" ? ".png" : resultBlob.type === "image/webp" ? ".webp" : resultBlob.type === "image/gif" ? ".gif" : (file.name.match(/\.[^.]+$/)?.[0] || "");
    anchor.download = `${file.name.replace(/\.[^.]+$/, "")}-increased${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setSourceInfo(null);
    setResultInfo(null);
    setResultBlob(null);
    setResultUrl("");
    setError("");
    setNotice("");
    setSourceUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const changePercent =
    sourceInfo && resultInfo
      ? ((resultInfo.size - sourceInfo.size) / sourceInfo.size) * 100
      : 0;

  return (
    <section className="increase-size-workspace">
      <div className="isw-heading">
        <div>
          <span className="isw-kicker">
            <Sparkles size={14} /> BROBEX IMAGE ENGINE
          </span>
          <h2>Increase Image File Size</h2>
          <p>
            Increase an image&apos;s file size without resizing, re-encoding,
            or changing its original image data.
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
          <span className="isw-upload-icon">
            <UploadCloud size={28} />
          </span>
          <strong>Drop your image here</strong>
          <span>or click to browse your device</span>
          <small>JPG, PNG, WebP, GIF or AVIF - Maximum 25 MB</small>
        </button>
      ) : (
        <div className="isw-filebar">
          <div className="isw-file-icon">
            <FileImage size={22} />
          </div>
          <div className="isw-file-meta">
            <strong>{file.name}</strong>
            <span>
              {formatBytes(file.size)} | {sourceInfo?.width} x {sourceInfo?.height}px
            </span>
          </div>
          <button
            type="button"
            className="isw-quiet-button"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </button>
          <button
            type="button"
            className="isw-icon-button"
            onClick={reset}
            aria-label="Remove image"
          >
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
            <div className="isw-section-title">
              <Lock size={16} /> SIZE SETTINGS
            </div>

            <label className="isw-label" htmlFor="isw-target">
              Target minimum file size
            </label>

            <div className="isw-target-row">
              <input
                id="isw-target"
                disabled={busy}
                type="number"
                min={targetUnit === "MB" ? "0.01" : "1"}
                max={targetUnit === "MB" ? "50" : "51200"}
                step={targetUnit === "MB" ? "0.01" : "1"}
                value={
                  targetUnit === "MB"
                    ? Number((targetKb / 1024).toFixed(2))
                    : targetKb
                }
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!Number.isFinite(value) || value <= 0) return;

                  const converted = Math.round(
                    value * (targetUnit === "MB" ? 1024 : 1)
                  );

                  setTargetKb(Math.max(1, Math.min(51200, converted)));
                  invalidateResult();
                  invalidateResult();
                }}
              />

              <div
                className="isw-unit-switch"
                style={{
                  display: "flex",
                  gap: "4px",
                  padding: "4px",
                  borderRadius: "10px",
                  background: "var(--isw-control-bg, #f1f1f1)",
                  flexShrink: 0
                }}
              >
                {(["KB", "MB"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setTargetUnit(unit);
                      invalidateResult();
                      invalidateResult();
                    }}
                    style={{
                      border: "none",
                      borderRadius: "7px",
                      padding: "8px 12px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      background:
                        targetUnit === unit ? "#c77b53" : "transparent",
                      color: targetUnit === unit ? "#ffffff" : "inherit"
                    }}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <small className="isw-format-hint">
              Maximum target: 50 MB. Your selected size is{" "}
              {targetUnit === "MB"
                ? `${(targetKb / 1024).toFixed(2)} MB`
                : `${targetKb.toLocaleString()} KB`}
              .
            </small>

            <div className="isw-presets">
              {[100, 200, 500, 1024, 2048].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={targetKb === value ? "active" : ""}
                  disabled={busy}
                  onClick={() => { setTargetKb(value); invalidateResult(); }}
                >
                  {value >= 1024 ? `${value / 1024} MB` : `${value} KB`}
                </button>
              ))}
            </div>
            <label className="isw-label" htmlFor="isw-output-format">
              Output format
            </label>
            <select
              id="isw-output-format"
              className="isw-format-select"
              disabled={busy}
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(
                  event.target.value as "original" | "image/jpeg" | "image/png" | "image/webp"
                );
                invalidateResult();
              }}
            >
              <option value="original">
                Original format (recommended)
              </option>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
            <small className="isw-format-hint">
              Original format is selected automatically. Choose another format only if you want to convert the image.
            </small>

            <div className="isw-preservation-note">
              <Lock size={17} />
              <div>
                <strong>Original image preserved</strong>
                <small>
                  No resizing, cropping, sharpening, recoloring, compression,
                  or format conversion. Only padding bytes are added.
                </small>
              </div>
            </div>

            
      <div className="isw-technical-warning" role="note">
        <strong>Technical note:</strong>
        Original format preserves the original image data by adding padding.
        Choosing JPG, PNG, or WebP re-encodes the image and may change its
        metadata or image data. Some upload services may remove padding or
        reject files containing padded data. Please verify the downloaded
        file before submitting it.
      </div>
<button
              type="button"
              className="isw-process-button"
              disabled={busy || targetKb < 1}
              onClick={() => void process()}
            >
              {busy ? (
                <>
                  <span className="isw-spinner" /> Processing file...
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Increase file size
                </>
              )}
            </button>

            <p className="isw-local-note">
              <Lock size={12} /> Your file is processed locally in this browser.
            </p>
          </div>

          <div className="isw-preview-panel">
            <div className="isw-section-title">
              <ImageIcon size={16} /> IMAGE PREVIEW
            </div>

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
                      <span>Preview appears here</span>
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
              <div>
                <span>Original size</span>
                <strong>{sourceInfo ? formatBytes(sourceInfo.size) : "-"}</strong>
              </div>
              <div>
                <span>Output size</span>
                <strong>{resultInfo ? formatBytes(resultInfo.size) : "-"}</strong>
              </div>
              <div>
                <span>Original dimensions</span>
                <strong>
                  {sourceInfo ? `${sourceInfo.width} x ${sourceInfo.height}` : "-"}
                </strong>
              </div>
              <div>
                <span>Size change</span>
                <strong>
                  {resultInfo ? `+${changePercent.toFixed(1)}%` : "-"}
                </strong>
              </div>
            </div>

            {notice && (
              <div className="isw-message success">
                <CheckCircle2 size={16} />
                {notice}
              </div>
            )}

            {error && (
              <div className="isw-message error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="button"
              className="isw-download-button"
              disabled={!resultBlob || busy}
              onClick={download}
              title={
                resultBlob
                  ? "Download the processed image"
                  : "Process the image with your current settings first"
              }
              style={{
                opacity: !resultBlob || busy ? 0.45 : 1,
                cursor: !resultBlob || busy ? "not-allowed" : "pointer"
              }}
            >
              <Download size={17} />
              {busy
                ? "Processing image..."
                : resultBlob
                  ? "Download increased image"
                  : "Process image to enable download"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}





