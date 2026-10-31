"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw, ShieldCheck } from "lucide-react";

type Preset = {
  id: string;
  label: string;
  width: number;
  height: number;
  detail: string;
};

const presets: Preset[] = [
  { id: "35x45", label: "35 × 45 mm", width: 413, height: 531, detail: "Standard portrait · 300 DPI" },
  { id: "2x2", label: "2 × 2 inch", width: 600, height: 600, detail: "Square ID photo · 300 DPI" },
  { id: "35x35", label: "35 × 35 mm", width: 413, height: 413, detail: "Square photo · 300 DPI" },
  { id: "600", label: "600 × 600 px", width: 600, height: 600, detail: "Digital square photo" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function PassportPhotoWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [presetId, setPresetId] = useState("35x45");
  const [background, setBackground] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(0);
  const [vertical, setVertical] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const preset = presets.find((item) => item.id === presetId) || presets[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !ready) return;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Your browser could not initialize image processing.");
      return;
    }

    canvas.width = preset.width;
    canvas.height = preset.height;

    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const ratio = preset.width / preset.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;

    let baseWidth: number;
    let baseHeight: number;

    if (imageRatio > ratio) {
      baseHeight = image.naturalHeight;
      baseWidth = baseHeight * ratio;
    } else {
      baseWidth = image.naturalWidth;
      baseHeight = baseWidth / ratio;
    }

    const cropWidth = baseWidth / zoom;
    const cropHeight = baseHeight / zoom;

    const maxX = Math.max(0, image.naturalWidth - cropWidth);
    const maxY = Math.max(0, image.naturalHeight - cropHeight);

    const sourceX = Math.min(maxX, Math.max(0, maxX / 2 + horizontal * maxX / 2));
    const sourceY = Math.min(maxY, Math.max(0, maxY / 2 + vertical * maxY / 2));

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
  }, [ready, preset, background, zoom, horizontal, vertical]);

  function handleFile(file: File | undefined) {
    if (!file) return;

    setError("");
    setReady(false);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      imageRef.current = image;
      setFileName(file.name);
      setZoom(1);
      setHorizontal(0);
      setVertical(0);
      setReady(true);
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("This image could not be opened. Try a JPG, PNG, or WebP file.");
    };

    image.src = objectUrl;
  }

  function resetPosition() {
    setZoom(1);
    setHorizontal(0);
    setVertical(0);
  }

  function downloadPhoto() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not export this image. Please try again.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `brobex-passport-photo-${preset.width}x${preset.height}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  }

  return (
    <section className="workspace passport-workspace">
      <div className="workspace-top">
        <div>
          <span className="eyebrow">BROBEX IMAGE STUDIO</span>
          <h2>Passport Photo Maker</h2>
          <p>Prepare a correctly sized photo with adjustable framing and a clean background.</p>
        </div>
        <span className="passport-local-badge">
          <ShieldCheck size={15} /> Local processing
        </span>
      </div>

      <div className="passport-layout">
        <div className="passport-preview-panel">
          <div className="passport-panel-heading">
            <div>
              <strong>Photo preview</strong>
              <p>Your output updates as you adjust the settings.</p>
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
              <ImagePlus size={30} />
              <strong>Upload your photo</strong>
              <span>Choose JPG, PNG or WebP · Maximum 20 MB</span>
            </button>
          ) : (
            <div className="passport-canvas-wrap">
              <canvas ref={canvasRef} aria-label="Passport photo preview" />
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          {fileName && (
            <div className="passport-file-row">
              <span>{fileName}</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Change photo
              </button>
            </div>
          )}

          {error && <p className="notice error">{error}</p>}
        </div>

        <div className="passport-settings">
          <div className="passport-setting-group">
            <label htmlFor="passport-size">Photo size</label>
            <select
              id="passport-size"
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
            >
              {presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="passport-help">{preset.detail}</span>
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-background">Canvas background</label>
            <div className="passport-color-row">
              <input
                id="passport-background"
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
              />
              <span>{background.toUpperCase()}</span>
            </div>
            <div className="passport-swatches">
              {["#ffffff", "#e8f0ff", "#dcebdc", "#e8e8e8"].map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set background ${color}`}
                  style={{ background: color }}
                  onClick={() => setBackground(color)}
                />
              ))}
            </div>
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-zoom">
              Zoom <strong>{zoom.toFixed(2)}×</strong>
            </label>
            <input
              id="passport-zoom"
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              disabled={!ready}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </div>

          <div className="passport-setting-group">
            <label htmlFor="passport-horizontal">Horizontal position</label>
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
            <label htmlFor="passport-vertical">Vertical position</label>
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

          <div className="passport-actions">
            <button
              type="button"
              className="button-light"
              disabled={!ready}
              onClick={resetPosition}
            >
              <RotateCcw size={16} /> Reset crop
            </button>
            <button
              type="button"
              className="button-dark"
              disabled={!ready}
              onClick={downloadPhoto}
            >
              <Download size={16} /> Download JPG
            </button>
          </div>

          <p className="passport-help">
            Your photo is processed in your browser. Background color changes
            fill the photo canvas; they do not remove the original background.
          </p>
        </div>
      </div>
    </section>
  );
}
