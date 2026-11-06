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
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  async function acceptFile(nextFile?: File) {
    if (!nextFile) return;

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
    setNotice("");

    try {
      const generated = await increaseImageFileSize(file, targetKb * 1024);

      setResultBlob(generated.blob);
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
    anchor.download = `${file.name.replace(/\.[^.]+$/, "")}-increased${file.name.match(/\.[^.]+$/)?.[0] || ""}`;
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
            Increase an image's file size without resizing, re-encoding,
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
                type="number"
                min="1"
                max="51200"
                value={targetKb}
                onChange={(event) =>
                  setTargetKb(
                    Math.max(1, Math.min(51200, Number(event.target.value) || 1))
                  )
                }
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
                  {sourceUrl ? (
                    <img src={sourceUrl} alt="Preserved original image preview" />
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

            {resultBlob && (
              <button
                type="button"
                className="isw-download-button"
                onClick={download}
              >
                <Download size={17} /> Download increased image
              </button>
            )}
          </div>
        </div>
      )}

      <div className="isw-footnote">
        <strong>Technical note:</strong> The original file bytes are preserved.
        This tool appends padding bytes to increase file size. Some upload
        services may remove padding or reject files containing trailing data.
      </div>
    </section>
  );
}