"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  RotateCcw,
  ShieldCheck,
  Printer,
  FileImage,
} from "lucide-react";

type Preset = {
  id: string;
  label: string;
  country: string;
  width: number;
  height: number;
  detail: string;
};

const PRESETS: Preset[] = [
  { id: "pk-passport", country: "Pakistan", label: "Pakistan Passport / CNIC", width: 413, height: 531, detail: "35 × 45 mm · Common portrait format" },
  { id: "pk-visa", country: "Pakistan", label: "Pakistan eVisa / 2×2", width: 600, height: 600, detail: "51 × 51 mm · Square format" },
  { id: "us-passport", country: "United States", label: "US Passport / Visa", width: 600, height: 600, detail: "2 × 2 inches · Square format" },
  { id: "uk-passport", country: "United Kingdom", label: "UK Passport", width: 413, height: 531, detail: "35 × 45 mm · Portrait format" },
  { id: "schengen", country: "Schengen", label: "Schengen Visa", width: 413, height: 531, detail: "35 × 45 mm · Portrait format" },
  { id: "canada", country: "Canada", label: "Canada Passport", width: 591, height: 827, detail: "50 × 70 mm · Portrait format" },
  { id: "australia", country: "Australia", label: "Australia Passport", width: 413, height: 531, detail: "35 × 45 mm · Common portrait format" },
  { id: "india", country: "India", label: "India Passport Photo", width: 413, height: 531, detail: "35 × 45 mm · Common portrait format" },
  { id: "square", country: "Custom", label: "Square ID Photo", width: 600, height: 600, detail: "600 × 600 pixels" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function canvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export failed."));
      },
      "image/jpeg",
      quality,
    );
  });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

export function PassportPhotoWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [ready, setReady] = useState(false);
  const [presetId, setPresetId] = useState("pk-passport");
  const background: string = "#ffffff";
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [targetKB, setTargetKB] = useState("0");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  const preset =
    PRESETS.find((item) => item.id === presetId) || PRESETS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !ready) return;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Your browser cannot initialize the image editor.");
      return;
    }

    canvas.width = preset.width;
    canvas.height = preset.height;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const outputRatio = preset.width / preset.height;
    const sourceRatio = image.naturalWidth / image.naturalHeight;

    let baseWidth: number;
    let baseHeight: number;

    if (sourceRatio > outputRatio) {
      baseHeight = image.naturalHeight;
      baseWidth = baseHeight * outputRatio;
    } else {
      baseWidth = image.naturalWidth;
      baseHeight = baseWidth / outputRatio;
    }

    const cropWidth = baseWidth / zoom;
    const cropHeight = baseHeight / zoom;

    const maxX = Math.max(0, image.naturalWidth - cropWidth);
    const maxY = Math.max(0, image.naturalHeight - cropHeight);

    const sourceX = maxX * (0.5 + horizontal / 2);
    const sourceY = maxY * (0.5 + vertical / 2);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      preset.width,
      preset.height,
    );
  }, [
    ready,
    preset,
    background,
    zoom,
    horizontal,
    vertical,
    revision,
  ]);

  function resetPosition() {
    setZoom(1);
    setHorizontal(0);
    setVertical(0);
  }

  function handleFile(selected?: File) {
    if (!selected) return;

    setError("");
    setMessage("");
    setReady(false);

    if (!selected.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("Maximum upload size is 20 MB.");
      return;
    }

    const url = URL.createObjectURL(selected);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      if (
        image.naturalWidth > 12000 ||
        image.naturalHeight > 12000 ||
        image.naturalWidth * image.naturalHeight > 40000000
      ) {
        setError("This image is too large for reliable browser processing.");
        return;
      }

      imageRef.current = image;
      setFileName(selected.name);
      resetPosition();
      setReady(true);
      setRevision((value) => value + 1);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Unable to open this image. Try JPG, PNG or WebP.");
    };

    image.src = url;
  }

  async function downloadPhoto() {
    const canvas = canvasRef.current;

    if (!canvas || !ready) return;

    try {
      setError("");
      setMessage("Preparing your export...");

      let blob = await canvasBlob(canvas, 0.94);

      const limit = Number(targetKB);

      if (limit > 0) {
        let quality = 0.90;

        while (blob.size > limit * 1024 && quality >= 0.30) {
          blob = await canvasBlob(canvas, quality);
          quality -= 0.10;
        }

        if (blob.size > limit * 1024) {
          setMessage(
            `Best available size: ${formatSize(blob.size)}. The selected limit could not be reached at these dimensions.`,
          );
        } else {
          setMessage(`Export ready: ${formatSize(blob.size)}.`);
        }
      } else {
        setMessage(`Export ready: ${formatSize(blob.size)}.`);
      }

      saveBlob(
        blob,
        `brobex-${preset.id}-${preset.width}x${preset.height}.jpg`,
      );
    } catch {
      setError("Could not export the photo. Please try again.");
    }
  }

  async function downloadPrintSheet(format: "4x6" | "a4") {
    const source = canvasRef.current;

    if (!source || !ready) return;

    try {
      setError("");
      setMessage("Building print sheet...");

      const sheet = document.createElement("canvas");

      sheet.width = format === "4x6" ? 1200 : 2480;
      sheet.height = format === "4x6" ? 1800 : 3508;

      const context = sheet.getContext("2d");

      if (!context) throw new Error("Canvas unavailable.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, sheet.width, sheet.height);

      const gap = 30;
      const photoWidth = preset.width;
      const photoHeight = preset.height;

      const columns = Math.floor(
        (sheet.width + gap) / (photoWidth + gap),
      );

      const rows = Math.floor(
        (sheet.height + gap) / (photoHeight + gap),
      );

      if (columns < 1 || rows < 1) {
        throw new Error("The selected photo dimensions are too large for this sheet.");
      }

      const totalWidth = columns * photoWidth + (columns - 1) * gap;
      const totalHeight = rows * photoHeight + (rows - 1) * gap;

      const startX = Math.floor((sheet.width - totalWidth) / 2);
      const startY = Math.floor((sheet.height - totalHeight) / 2);

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x = startX + column * (photoWidth + gap);
          const y = startY + row * (photoHeight + gap);

          context.drawImage(source, x, y);

          context.strokeStyle = "#bdbdbd";
          context.lineWidth = 2;
          context.strokeRect(x, y, photoWidth, photoHeight);
        }
      }

      const blob = await canvasBlob(sheet, 0.94);

      saveBlob(
        blob,
        `brobex-passport-print-sheet-${format}.jpg`,
      );

      setMessage(
        `${columns * rows} copies prepared on a ${format === "4x6" ? "4 × 6 inch" : "A4"} pixel-size sheet. Print at actual size without scaling.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Print sheet generation failed.",
      );
    }
  }

  return (
    <section className="workspace passport-workspace passport-pro">

      <div className="workspace-top passport-pro-header">
        <div>
          <span className="eyebrow">BROBEX DOCUMENT STUDIO / 01</span>
          <h2>Passport & ID Photo Studio</h2>
          <p>
            Professional document photo preparation, intelligent
            background removal and precision image export.
          </p>
        </div>

        <span className="passport-local-badge">
          <ShieldCheck size={16} />
          Private browser processing
        </span>
      </div>

      <div className="passport-pro-trust">
        <span><ShieldCheck size={15} /> No photo upload to our server</span>
        <span><RotateCcw size={15} /> Precision image framing</span>
        <span><FileImage size={15} /> Exact output pixels</span>
      </div>

      <div className="passport-layout">

        <div className="passport-preview-panel">

          <div className="passport-panel-heading">
            <div>
              <strong>Live document preview</strong>
              <p>Review your crop before exporting.</p>
            </div>

            {ready && (
              <span className="passport-dimensions">
                {preset.width} × {preset.height} px
              </span>
            )}
          </div>

          {!ready ? (
            <button
              type="button"
              className="passport-upload"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={36} />
              <strong>Upload your portrait</strong>
              <span>Drag-free upload · JPG, PNG or WebP · Up to 20 MB</span>
              <span className="passport-upload-action">
                Select an image
              </span>
            </button>
          ) : (
            <div className="passport-canvas-wrap">
              <div className="passport-canvas-stage">
                <canvas
                  ref={canvasRef}
                  aria-label="Passport photo live preview"
                />

                <div className="passport-guide" aria-hidden="true">
                  <div className="passport-guide-oval" />
                  <div className="passport-guide-eye-line" />
                  <div className="passport-guide-center-line" />
                </div>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {fileName && ready && (
            <div className="passport-file-row">
              <span>{fileName}</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Replace photo
              </button>
            </div>
          )}

          {ready && (
            <div className="passport-photo-information">
              <span>Document: {preset.country}</span>
              <span>Output: JPG</span>
              <span>{preset.width} × {preset.height} pixels</span>
            </div>
          )}

          {error && <p className="notice error">{error}</p>}
          {message && <p className="notice success">{message}</p>}

        </div>

        <div className="passport-settings">

          <div className="passport-pro-section-heading">
            <span>01 / DOCUMENT SETTINGS</span>
            <h3>Photo requirements</h3>
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-size">Country & document format</label>

            <select
              id="passport-size"
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
            >
              {PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.country} — {item.label}
                </option>
              ))}
            </select>

            <span className="passport-help">{preset.detail}</span>
          </div>

          <div className="passport-pro-section-heading">
            <span>02 / IMAGE ADJUSTMENTS</span>
            <h3>Precision framing</h3>
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-zoom">
              Zoom <strong>{zoom.toFixed(2)}×</strong>
            </label>

            <input
              id="passport-zoom"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              disabled={!ready}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-horizontal">
              Horizontal position
            </label>

            <input
              id="passport-horizontal"
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={horizontal}
              disabled={!ready}
              onChange={(event) => setHorizontal(Number(event.target.value))}
            />
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-vertical">
              Vertical position
            </label>

            <input
              id="passport-vertical"
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={vertical}
              disabled={!ready}
              onChange={(event) => setVertical(Number(event.target.value))}
            />
          </div>

          <button
            type="button"
            className="button-light passport-reset-button"
            onClick={resetPosition}
            disabled={!ready}
          >
            <RotateCcw size={15} /> Reset framing
          </button>

          <div className="passport-pro-section-heading">
            <span>04 / EXPORT CONTROL</span>
            <h3>Image quality & size</h3>
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-kb">Maximum JPG file size</label>

            <select
              id="passport-kb"
              value={targetKB}
              onChange={(event) => setTargetKB(event.target.value)}
            >
              <option value="0">Best quality · No limit</option>
              <option value="50">Up to 50 KB</option>
              <option value="100">Up to 100 KB</option>
              <option value="200">Up to 200 KB</option>
              <option value="500">Up to 500 KB</option>
            </select>
          </div>

          <div className="passport-actions">
            <button
              type="button"
              className="button-dark"
              disabled={!ready}
              onClick={downloadPhoto}
            >
              <Download size={16} /> Download JPG
            </button>
          </div>

          <div className="passport-pro-section-heading">
            <span>05 / PRINT STUDIO</span>
            <h3>Multiple photo sheets</h3>
          </div>

          <div className="passport-print-actions">
            <button
              type="button"
              disabled={!ready}
              onClick={() => downloadPrintSheet("4x6")}
            >
              <Printer size={16} />
              4 × 6 inch sheet
            </button>

            <button
              type="button"
              disabled={!ready}
              onClick={() => downloadPrintSheet("a4")}
            >
              <FileImage size={16} />
              A4 print sheet
            </button>
          </div>

          <p className="passport-help">
            Print at actual size without scaling. The sheet is a
            pixel-based layout; verify physical measurements after
            printing.
          </p>

        </div>
      </div>

      <div className="passport-disclaimer">
        <ShieldCheck size={17} />
        <p>
          BROBEX helps prepare document photos. Dimensions are common
          presets, not a certification of government compliance.
          Always verify the latest requirements of the issuing authority.
        </p>
      </div>

    </section>
  );
}
