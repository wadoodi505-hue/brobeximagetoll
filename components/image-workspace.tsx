
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Download,
  RotateCcw,
  ShieldCheck,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  WandSparkles,
  Maximize2,
} from "lucide-react";
import type { ToolDefinition } from "@/types/tools";
import {
  formatBytes,
  processImage,
  processImages,
} from "@/lib/image/process";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 20;
const MAX_OUTPUT_PIXELS = 8_294_400;

// Fit the image inside a UHD 4K frame without stretching or cropping.
// Portrait images use the portrait equivalent of the same UHD frame.
function getUhdDimensions(sourceWidth: number, sourceHeight: number) {
  const portrait = sourceHeight > sourceWidth;
  const maxWidth = portrait ? 2160 : 3840;
  const maxHeight = portrait ? 3840 : 2160;

  const scale = Math.min(
    maxWidth / sourceWidth,
    maxHeight / sourceHeight,
    Math.sqrt(MAX_OUTPUT_PIXELS / (sourceWidth * sourceHeight)),
  );

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

type Metadata = {
  width: number;
  height: number;
  type: string;
  size: number;
};

type PreviewMode = "compare" | "original" | "enhanced";

export function ImageWorkspace({ tool }: { tool: ToolDefinition }) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lock, setLock] = useState(true);
  const [quality, setQuality] = useState(tool.slug === "compress-image-size" ? 50 : 82);
  const [format, setFormat] = useState(tool.slug === "compress-image-size" ? "image/webp" : tool.outputMime || "image/webp");

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(800);
  const [cropH, setCropH] = useState(600);
  const cropStageRef = useRef<HTMLDivElement>(null);

  const cropDragRef = useRef<{
    mode: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  function beginCropDrag(
    event: React.PointerEvent,
    mode: string,
  ) {
    if (busy || !cropStageRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    cropDragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: cropX,
      y: cropY,
      w: cropW,
      h: cropH,
    };

    cropStageRef.current.setPointerCapture(event.pointerId);
  }

  function updateCropDrag(event: React.PointerEvent) {
    const drag = cropDragRef.current;
    const stage = cropStageRef.current;

    if (!drag || !stage || width < 1 || height < 1) return;

    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = ((event.clientX - drag.startX) / rect.width) * width;
    const dy = ((event.clientY - drag.startY) / rect.height) * height;
    const mode = drag.mode;

    let x = drag.x;
    let y = drag.y;
    let w = drag.w;
    let h = drag.h;

    if (mode === "move") {
      x = Math.max(0, Math.min(width - w, drag.x + dx));
      y = Math.max(0, Math.min(height - h, drag.y + dy));
    } else {
      if (mode.includes("w")) {
        const right = drag.x + drag.w;
        x = Math.max(0, Math.min(right - 1, drag.x + dx));
        w = right - x;
      }

      if (mode.includes("e")) {
        w = Math.max(1, Math.min(width - drag.x, drag.w + dx));
      }

      if (mode.includes("n")) {
        const bottom = drag.y + drag.h;
        y = Math.max(0, Math.min(bottom - 1, drag.y + dy));
        h = bottom - y;
      }

      if (mode.includes("s")) {
        h = Math.max(1, Math.min(height - drag.y, drag.h + dy));
      }
    }

    setCropX(Math.round(x));
    setCropY(Math.round(y));
    setCropW(Math.round(w));
    setCropH(Math.round(h));
  }

  function endCropDrag() {
    cropDragRef.current = null;
  }

  const [flipX, setFlipX] = useState(true);
  const [flipY, setFlipY] = useState(false);
  const [text, setText] = useState("BROBEX");
  const [textSize, setTextSize] = useState(36);
  const [textColor, setTextColor] = useState("#ffffff");
  const [borderWidth, setBorderWidth] = useState(12);
  const [borderColor, setBorderColor] = useState("#171717");
  const [pixelSize, setPixelSize] = useState(12);
  const [rotation, setRotation] = useState(90);
  const [blurAmount, setBlurAmount] = useState(4);

  // Automatic enhancement defaults: restrained sharpening and noise reduction.
  const [sharpness, setSharpness] = useState(1.25);
  const [detailStrength, setDetailStrength] = useState(0.3);
  const [noiseReduction, setNoiseReduction] = useState(0.12);

  // Professional before/after comparison.
  const [comparison, setComparison] = useState(50);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("compare");
  const cropPreviewMode = true;

  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const operationId = useRef(0);
  const previewRef = useRef("");
  const resultRef = useRef("");

  const op = tool.operation;
  const canProcess = tool.status === "browser" && !!op;

  // Keep refs synchronized so cleanup always revokes the current URLs.
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    };
  }, []);

  function clearOutput() {
    operationId.current += 1;
    setResult("");
    setResultBlob(null);
    setError("");
    setMessage("");
    setMetadata(null);
    setPreviewMode("compare");
  }

  function validateImage(next: File): string | null {
    if (!next.size) return "The selected file is empty.";
    if (next.size > MAX_BYTES) {
      return "Maximum file size is 20 MB per image.";
    }
    if (!next.type.startsWith("image/")) {
      return "Choose a supported image file.";
    }
    return null;
  }

  function inspectImage(next: File) {
    const url = URL.createObjectURL(next);
    const image = new Image();

    image.onload = () => {
      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);
      setCropW(image.naturalWidth);
      setCropH(image.naturalHeight);
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError(
        "The browser could not decode this image. Try PNG, JPEG or WebP.",
      );
    };

    image.src = url;
  }

  function selectFile(next: File | null) {
    if (busy) return;

    clearOutput();

    if (!next) {
      setFile(null);
      setFiles([]);
      setPreview("");
      return;
    }

    const validationError = validateImage(next);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setFile(next);
    setFiles([next]);
    setPreview(URL.createObjectURL(next));
    inspectImage(next);
  }

  function selectMultipleFiles(chosen: File[]) {
    if (busy) return;

    clearOutput();

    if (chosen.length > MAX_FILES) {
      setError(`Choose no more than ${MAX_FILES} images at once.`);
      return;
    }

    if (chosen.length === 0) return;

    const invalid = chosen.find((item) => validateImage(item));

    if (invalid) {
      setError(
        `${invalid.name}: every image must be a supported image no larger than 20 MB.`,
      );
      return;
    }

    setError("");
    setFiles(chosen);
    setFile(chosen[0]);
    setPreview(URL.createObjectURL(chosen[0]));
    inspectImage(chosen[0]);
  }

  function reset() {
    if (busy) return;

    clearOutput();
    setFiles([]);
    setFile(null);
    setPreview("");
    setError("");
    setMessage("");
    setComparison(50);
  }

  async function run() {
    if (!file || busy) return;

    const currentOperation = ++operationId.current;

    setBusy(true);
    setError("");
    setMessage("");
    setMetadata(null);

    try {
      if (op === "combine") {
        if (files.length < 2) {
          throw new Error("Choose at least two images to combine.");
        }

        const output = await processImages(
          files,
          tool.slug === "collage-maker" ? "vertical" : "horizontal",
        );

        if (currentOperation !== operationId.current) return;

        const nextUrl = URL.createObjectURL(output.blob);
        setResult(nextUrl);
        setResultBlob(output.blob);
        setMessage(
          `Combined ${files.length} images into ${output.width} Ã— ${output.height} pixels.`,
        );
        return;
      }

      if (op === "metadata") {
        const image = new Image();
        image.src = preview;
        await image.decode();

        if (currentOperation !== operationId.current) return;

        setMetadata({
          width: image.naturalWidth,
          height: image.naturalHeight,
          type: file.type || "Unknown",
          size: file.size,
        });

        setMessage("Image properties read successfully.");
        return;
      }

      if (!canProcess || !op) {
        throw new Error(
          "This tool does not have a browser operation configured.",
        );
      }

      let outputWidth = width;
      let outputHeight = height;

      // One-click UHD enhancement: upscale and sharpen in the same operation.
      if (op === "unblur") {
        const dimensions = getUhdDimensions(width, height);
        outputWidth = dimensions.width;
        outputHeight = dimensions.height;
      }

      const settings: Parameters<typeof processImage>[1] = {
        operation: op,
        width: outputWidth,
        height: outputHeight,
        quality: quality / 100,
        format,
        cropX,
        cropY,
        cropWidth: cropW,
        cropHeight: cropH,
        flipX,
        flipY,
        text,
        textSize,
        textColor,
        borderWidth,
        borderColor,
        pixelSize,
        rotation,
        blurAmount,
        sharpness,
        detailStrength,
        noiseReduction,
      };

      const output = await processImage(file, settings);

      if (currentOperation !== operationId.current) return;

      const nextUrl = URL.createObjectURL(output.blob);
      setResult(nextUrl);
      setResultBlob(output.blob);
      setPreviewMode("compare");

      if (op === "unblur") {
        setMessage(
          `Enhancement complete: ${output.width} Ã— ${output.height} pixels. PNG output Â· ${formatBytes(output.blob.size)}. Your image was processed locally.`,
        );
      } else {
        setMessage(
          `Processed ${output.width} Ã— ${output.height} pixels. Output: ${formatBytes(output.blob.size)}.`,
        );
      }
    } catch (e) {
      if (currentOperation !== operationId.current) return;

      setError(
        e instanceof Error
          ? e.message
          : "Processing failed. Try another image.",
      );
    } finally {
      if (currentOperation === operationId.current) {
        setBusy(false);
      }
    }
  }


  // Automatically compress uploaded images on the target-size tool.
  useEffect(() => {
    if (tool.slug !== "compress-image-size") return;

    if (!file) {
      autoCompressFileRef.current = null;
      return;
    }

    if (autoCompressFileRef.current === file) return;

    autoCompressFileRef.current = file;
    void run();
  }, [file, op, tool.slug]);
  const outputName = useMemo(() => {
    const mime = op === "unblur" ? "image/png" : resultBlob?.type || format;

    const extension =
      mime === "image/svg+xml"
        ? "svg"
        : mime === "image/jpeg"
          ? "jpg"
          : mime === "image/png"
            ? "png"
            : mime === "image/webp"
              ? "webp"
              : mime.split("/")[1] || "png";

    const baseName =
      file?.name.replace(/\.[^.]+$/, "") || "brobex-image";

    return `${baseName}${op === "unblur" ? "-enhanced-4k" : "-processed"}.${extension}`;
  }, [file, resultBlob, format, op]);

  const uhdDimensions = useMemo(
    () => (file ? getUhdDimensions(width, height) : null),
    [file, width, height],
  );

  return (
    <div className="workspace">
      <div className="workspace-top">
        <div>
          <span className="eyebrow">
            {op === "unblur" ? "BROBEX CLARITY STUDIO" : "BROWSER WORKSPACE"}
          </span>

          <h2>
            {op === "unblur"
              ? "Unblur & enhance to 4K"
              : "Upload and process"}
          </h2>

          <p>
            {op === "unblur"
              ? "One-click sharpening, controlled noise reduction and UHD-sized export in your browser."
              : "Your image stays in this browser for supported operations."}
          </p>
        </div>

        <span className="privacy-chip">
          <ShieldCheck size={15} />
          Local processing
        </span>
      </div>

      <label
        className={`dropzone ${file ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (busy) return;

          const chosen = Array.from(event.dataTransfer.files);

          if (op === "combine") {
            selectMultipleFiles(chosen);
          } else {
            selectFile(chosen[0] || null);
          }
        }}
      >
        <input
          type="file"
          disabled={busy}
          multiple={op === "combine"}
          accept={tool.acceptedTypes.join(",")}
          onChange={(event) => {
            const chosen = Array.from(event.target.files || []);

            if (op === "combine") {
              selectMultipleFiles(chosen);
            } else {
              selectFile(chosen[0] || null);
            }

            event.currentTarget.value = "";
          }}
        />

        {file ? (
          <>
            <ImageIcon size={28} />
            <strong>
              {op === "combine"
                ? `${files.length} images selected`
                : file.name}
            </strong>
            <span>
              {op === "combine"
                ? files.map((item) => item.name).join(" Â· ")
                : `${formatBytes(file.size)} Â· ${file.type || "Unknown MIME type"}`}
            </span>
            <small>Click to choose another image</small>
          </>
        ) : (
          <>
            <UploadCloud size={30} />
            <strong>Drop an image here or browse files</strong>
            <span>Supported image formats Â· 20 MB maximum per image</span>
            <small>Your image is not uploaded to a server.</small>
          </>
        )}
      </label>

      {file && (
        <div className="file-facts">
          <span>
            Original: <b>{file.name}</b>
          </span>
          <span>
            Size: <b>{formatBytes(file.size)}</b>
          </span>
          <span>
            Type: <b>{file.type || "Unknown"}</b>
          </span>
        </div>
      )}

      {file && (
        <div className="workspace-columns">
          <div
            className={`preview-panel ${op === "unblur" ? "unblur-preview-panel" : ""}`}
          >
            {op === "unblur" ? (
              <>
                <div className="unblur-preview-header">
                  <div>
                    <span className="eyebrow">IMAGE RESTORATION STUDIO</span>
                    <h3>Clarity preview</h3>
                    <p>
                      Review the original and enhanced image before downloading.
                    </p>
                  </div>

                  <span className="unblur-status">
                    <span className="unblur-status-dot" />
                    {busy ? "Enhancing" : result ? "Enhanced" : "Ready"}
                  </span>
                </div>

                <div
                  className="unblur-mode-switch"
                  role="group"
                  aria-label="Image preview mode"
                >
                  {(
                    [
                      ["compare", "Compare"],
                      ["original", "Original"],
                      ["enhanced", "Enhanced"],
                    ] as [PreviewMode, string][]
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      className={previewMode === mode ? "active" : ""}
                      aria-pressed={previewMode === mode}
                      disabled={mode === "enhanced" && !result}
                      onClick={() => setPreviewMode(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="unblur-comparison">
                  {previewMode === "original" || !result ? (
                    <img src={preview} alt="Original image preview" />
                  ) : previewMode === "enhanced" ? (
                    <img src={result} alt="Enhanced image preview" />
                  ) : (
                    <>
                      <img src={preview} alt="Original image comparison" />

                      <div
                        className="unblur-comparison-result"
                        style={{
                          clipPath: `inset(0 0 0 ${comparison}%)`,
                        }}
                      >
                        <img src={result} alt="Enhanced image comparison" />
                      </div>

                      <div
                        className="unblur-comparison-divider"
                        style={{ left: `${comparison}%` }}
                        aria-hidden="true"
                      >
                        <span>â†”</span>
                      </div>
                    </>
                  )}

                  {previewMode === "compare" && result && (
                    <>
                      <span className="unblur-image-label original-label">
                        ORIGINAL
                      </span>
                      <span className="unblur-image-label enhanced-label">
                        ENHANCED
                      </span>
                    </>
                  )}

                  {busy && (
                    <div className="unblur-processing-overlay" role="status">
                      <span className="unblur-spinner" />
                      <strong>Enhancing imageâ€¦</strong>
                      <span>Keep this tab open until processing finishes.</span>
                    </div>
                  )}
                </div>

                {previewMode === "compare" && result && (
                  <label className="unblur-comparison-control">
                    <span>Comparison position</span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={comparison}
                      onChange={(event) =>
                        setComparison(Number(event.target.value))
                      }
                      aria-label="Move comparison divider"
                    />
                  </label>
                )}

                <div className="unblur-preview-footer">
                  <span>{formatBytes(file.size)} original</span>
                  <span>
                    {resultBlob
                      ? `${formatBytes(resultBlob.size)} enhanced`
                      : "Enhance to compare results"}
                  </span>
                </div>

                {resultBlob && uhdDimensions && (
                  <div className="unblur-output-specs">
                    <div>
                      <Maximize2 size={16} />
                      <span>
                        <strong>
                          {uhdDimensions.width} Ã— {uhdDimensions.height}
                        </strong>
                        <small>UHD-frame output dimensions</small>
                      </span>
                    </div>
                    <div>
                      <ShieldCheck size={16} />
                      <span>
                        <strong>PNG export</strong>
                        <small>Lossless output encoding</small>
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>

                  <div className="panel-heading">
                    {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop"].includes(op || "") ? "Interactive crop editor" : "Original preview"}
                  </div>

                  {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop"].includes(op || "") && preview ? (
                    <>
                      <div className="crop-editor-viewport">
                        <div
                          ref={cropStageRef}
                          className="crop-editor-stage"
                          onPointerMove={updateCropDrag}
                          onPointerUp={endCropDrag}
                          onPointerCancel={endCropDrag}
                          onLostPointerCapture={endCropDrag}
                        >
                          <img
                            src={preview}
                            alt="Drag the crop frame to select the image area"
                            draggable={false}
                          />

                          <div
                            className="crop-selection"
                            style={{
                              left: `${(cropX / Math.max(1, width)) * 100}%`,
                              top: `${(cropY / Math.max(1, height)) * 100}%`,
                              width: `${(cropW / Math.max(1, width)) * 100}%`,
                              height: `${(cropH / Math.max(1, height)) * 100}%`,
                            }}
                            onPointerDown={(event) => beginCropDrag(event, "move")}
                          >
                            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(
                              (handle) => (
                                <span
                                  key={handle}
                                  className={`crop-handle crop-handle-${handle}`}
                                  onPointerDown={(event) => beginCropDrag(event, handle)}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="crop-dimensions">
                        <span>Selected area</span>
                        <strong>{cropW} Ã— {cropH} px</strong>
                        <span>
                          Position: {cropX}, {cropY}
                        </span>
                      </div>

                      <p className="hint">
                        Drag inside the frame to move it. Drag its edges or corners to resize.
                      </p>
                    </>
                  ) : (
                    <div className="preview-canvas">
                      {preview && (
                        <img src={preview} alt="Original selected image" />
                      )}
                    </div>
                  )}
                  <div className="preview-canvas">
                    {preview && (
                      <div className="crop-preview-stage">
                        <img
                          src={preview}
                          alt="Image crop preview"
                          style={
                            ["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop"].includes(op || "") && cropPreviewMode
                              ? {
                                clipPath: `inset(
                  ${(cropY / Math.max(1, height)) * 100}%
                  ${100 - ((cropX + cropW) / Math.max(1, width)) * 100}%
                  ${100 - ((cropY + cropH) / Math.max(1, height)) * 100}%
                  ${(cropX / Math.max(1, width)) * 100}%
                )`,
                              }
                              : undefined
                          }
                        />
                      </div>
                    )}
                  </div>
                  {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop"].includes(op || "") && (
                    <div className="settings-grid crop-controls">
                      <div className="crop-controls-heading">
                        <strong>Crop dimensions</strong>
                        <span>Fine-tune your selection in pixels.</span>
                      </div>

                      {(
                        [
                          ["X position", cropX, setCropX, width],
                          ["Y position", cropY, setCropY, height],
                          ["Width (px)", cropW, setCropW, width - cropX],
                          ["Height (px)", cropH, setCropH, height - cropY],
                        ] as [
                          string,
                          number,
                          (value: number) => void,
                          number,
                        ][]
                      ).map(([label, value, setter, max]) => (
                        <label key={label}>
                          {label}
                          <input
                            type="number"
                            min={label.includes("position") ? 0 : 1}
                            max={Math.max(1, max)}
                            step="1"
                            value={value}
                            disabled={busy}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (!Number.isFinite(next)) return;

                              const limit = Math.max(0, max);

                              setter(
                                Math.max(
                                  label.includes("position") ? 0 : 1,
                                  Math.min(limit, Math.floor(next)),
                                ),
                              );
                            }}
                          />
                        </label>
                      ))}

                      <div className="crop-actions">
                        <button
                          type="button"
                          className="button button-light"
                          disabled={busy}
                          onClick={() => {
                            setCropX(0);
                            setCropY(0);
                            setCropW(width);
                            setCropH(height);
                          }}
                        >
                          <RotateCcw size={14} />
                          Reset selection
                        </button>

                        <span>
                          {cropW} Ã— {cropH} px
                        </span>
                      </div>
                    </div>
                  )}

              </>
            )}
          </div>

          <div className="settings-panel">
            {tool.slug !== "compress-image-size" && <h3>{op === "unblur" ? "Enhancement settings" : "Settings"}</h3>}

            {op === "unblur" && (
              <div className="unblur-settings">
                <div className="unblur-heading">
                  <Sparkles size={18} />
                  <div>
                    <strong>Automatic clarity enhancement</strong>
                    <p className="hint">
                      Recommended values are selected for a balanced first pass.
                    </p>
                  </div>
                </div>

                <div className="unblur-quick-preset">
                  <span>Processing preset</span>
                  <strong>Balanced Â· UHD frame</strong>
                  <small>
                    Sharpening and noise reduction run together in one action.
                  </small>
                </div>

                <label>
                  Sharpness: {sharpness.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.05"
                    value={sharpness}
                    disabled={busy}
                    onChange={(event) =>
                      setSharpness(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Detail enhancement: {detailStrength.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={detailStrength}
                    disabled={busy}
                    onChange={(event) =>
                      setDetailStrength(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Noise reduction: {noiseReduction.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.02"
                    value={noiseReduction}
                    disabled={busy}
                    onChange={(event) =>
                      setNoiseReduction(Number(event.target.value))
                    }
                  />
                </label>

                <p className="hint">
                  More sharpening can create halos around edges. Strong noise
                  reduction can remove fine texture. Adjust the controls and
                  run enhancement again to apply changes.
                </p>

                {uhdDimensions && (
                  <div className="unblur-target">
                    <span>Target output</span>
                    <strong>
                      {uhdDimensions.width} Ã— {uhdDimensions.height} px
                    </strong>
                    <small>
                      Aspect ratio preserved Â· Maximum 3840 Ã— 2160 landscape
                      frame or 2160 Ã— 3840 portrait frame
                    </small>
                  </div>
                )}
              </div>
            )}

            {op === "resize" && (
              <>
                <label>
                  Width (px)
                  <input
                    type="number"
                    min="1"
                    max="12000"
                    value={width}
                    onChange={(event) => {
                      const nextWidth = Number(event.target.value);

                      if (!Number.isFinite(nextWidth)) return;

                      if (lock && width > 0) {
                        setHeight(
                          Math.max(
                            1,
                            Math.round(nextWidth * (height / width)),
                          ),
                        );
                      }

                      setWidth(nextWidth);
                    }}
                  />
                </label>

                <label>
                  Height (px)
                  <input
                    type="number"
                    min="1"
                    max="12000"
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value))}
                  />
                </label>

                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={lock}
                    onChange={(event) => setLock(event.target.checked)}
                  />
                  Keep proportions
                </label>
              </>
            )}

            {op === "compress" && tool.slug !== "compress-image-size" && (
              <>
                <label>
                  Output format
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value)}
                  >
                    <option value="image/webp">WebP</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                  </select>
                </label>

                <label>
                  Quality: {quality}%
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                  />
                </label>
              </>
            )}

            {op === "convert" && (
              <label>
                Output format
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </label>
            )}


            {["crop", "square-crop", "triangle-crop", "shape-crop", "aspect-ratio-crop"].includes(op || "") && (
              <div className="settings-grid crop-controls">
                <div className="crop-controls-heading">
                  <strong>Crop settings</strong>
                  <span>Set the exact area you want to keep.</span>
                </div>

                {(
                  [
                    ["X position", cropX, setCropX],
                    ["Y position", cropY, setCropY],
                    ["Width (px)", cropW, setCropW],
                    ["Height (px)", cropH, setCropH],
                  ] as [string, number, (value: number) => void][]
                ).map(([label, value, setter]) => (
                  <label key={label}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={value}
                      onChange={(event) =>
                        setter(Math.max(0, Math.floor(Number(event.target.value) || 0)))
                      }
                    />
        </label>
                ))}

                <div className="crop-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setCropX(0);
                      setCropY(0);
                      if (preview) {
                        const image = new Image();
                        image.onload = () => {
                          setCropW(image.naturalWidth);
                          setCropH(image.naturalHeight);
                        };
                        image.src = preview;
                      }
                    }}
                  >
                    Reset crop
                  </button>
                  <span>
                    Output: {cropW} Ã— {cropH} px
                  </span>
                </div>
              </div>
            )}


            {op === "flip" && (
              <>
                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={flipX}
                    onChange={(event) => setFlipX(event.target.checked)}
                  />
                  Flip horizontally
                </label>

                <label className="check-setting">
                  <input
                    type="checkbox"
                    checked={flipY}
                    onChange={(event) => setFlipY(event.target.checked)}
                  />
                  Flip vertically
                </label>
              </>
            )}

            {op === "rotate" && (
              <label>
                Rotation
                <select
                  value={rotation}
                  onChange={(event) =>
                    setRotation(Number(event.target.value))
                  }
                >
                  <option value={90}>90Â° clockwise</option>
                  <option value={180}>180Â°</option>
                  <option value={270}>270Â° clockwise</option>
                </select>
              </label>
            )}

            {op === "pixelate" && (
              <label>
                Pixel block size: {pixelSize}px
                <input
                  type="range"
                  min="2"
                  max="80"
                  value={pixelSize}
                  onChange={(event) =>
                    setPixelSize(Number(event.target.value))
                  }
                />
              </label>
            )}

            {op === "text" && (
              <>
                <label>
                  Overlay text
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={120}
                  />
                </label>

                <label>
                  Text size
                  <input
                    type="number"
                    min="8"
                    max="240"
                    value={textSize}
                    onChange={(event) =>
                      setTextSize(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Text color
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                  />
                </label>
              </>
            )}

            {op === "border" && (
              <>
                <label>
                  Border width
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={borderWidth}
                    onChange={(event) =>
                      setBorderWidth(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  Border color
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(event) => setBorderColor(event.target.value)}
                  />
                </label>
              </>
            )}

            {op === "blur" && (
              <label>
                Blur amount: {blurAmount}px
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={blurAmount}
                  onChange={(event) =>
                    setBlurAmount(Number(event.target.value))
                  }
                />
              </label>
            )}

            {op === "metadata" && (
              <p className="hint">
                Reads image dimensions, MIME type and file size. Full EXIF
                metadata is not available through every browser.
              </p>
            )}

            {!op && (
              <p className="hint">
                This tool does not have a browser operation configured.
              </p>
            )}

            <div className="workspace-actions">
              <button
                type="button"
                className={`button button-dark ${tool.slug === "compress-image-size" ? "auto-compress-hidden" : ""}`}
                onClick={run}
                disabled={
                  busy ||
                  !file ||
                  (op === "combine" && files.length < 2) ||
                  !canProcess
                }
              >
                {busy ? (
                  "Processingâ€¦"
                ) : op === "metadata" ? (
                  "Read metadata"
                ) : op === "combine" ? (
                  "Combine images"
                ) : op === "unblur" ? (
                  <>
                    <WandSparkles size={16} />
                    Enhance to 4K
                  </>
                ) : (
                  "Process image"
                )}
              </button>

              <button
                type="button"
                className="button button-light"
                onClick={reset}
                disabled={busy}
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>

            {resultBlob && result && (
              <a
                className="button button-dark download-button"
                href={result}
                download={outputName}
              >
                <Download size={16} />
                {op === "png-to-svg" ? "Download SVG file" : "Download enhanced image"}
              </a>
            )}

            {message && (
              <p className="notice success" role="status">
                <CheckCircle2 size={16} />
                {message}
              </p>
            )}

            {error && (
              <p className="notice error" role="alert">
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {metadata && (
              <div className="metadata-card">
                <h4>Image properties</h4>
                <p>
                  Dimensions: {metadata.width} Ã— {metadata.height}px
                </p>
                <p>MIME type: {metadata.type}</p>
                <p>File size: {formatBytes(metadata.size)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tool.status === "integration" && (
        <div className="integration-notice">
          <span className="integration-icon">
            <WandIcon />
          </span>

          <div>
            <h3>Integration Required</h3>
            <p>
              This tool needs a provider or specialist codec that is not
              configured. No fake processing result will be generated.
            </p>
            <p className="hint">
              Required path: <code>{tool.method}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function WandIcon() {
  return <span aria-hidden="true">âœ³</span>;
}



