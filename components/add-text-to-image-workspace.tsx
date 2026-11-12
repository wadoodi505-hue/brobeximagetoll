"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown, ArrowUp, Bold, Copy, Download, Eye, EyeOff, ImagePlus,
  Italic, Layers3, Plus, RotateCcw, Trash2, Type,
} from "lucide-react";
import "./add-text-to-image-workspace.css";

type TextLayer = {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: CanvasTextAlign;
  opacity: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  shadow: string;
  shadowBlur: number;
  background: string;
  backgroundOpacity: number;
  visible: boolean;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const FONT_OPTIONS = [
  ["Arial", "Arial"], ["Georgia", "Georgia"], ["Verdana", "Verdana"],
  ["Times New Roman", "Times New Roman"], ["Courier New", "Courier New"],
  ["Trebuchet MS", "Trebuchet MS"], ["Impact", "Impact"],
  ["system-ui", "System UI"],
];

function makeLayer(index: number, width: number, height: number): TextLayer {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: `Text ${index + 1}`,
    text: index === 0 ? "Your text here" : "New text",
    x: width / 2,
    y: height / 2,
    size: Math.max(24, Math.round(Math.min(width, height) * 0.08)),
    font: "Arial",
    color: "#ffffff",
    bold: true,
    italic: false,
    underline: false,
    align: "center",
    opacity: 100,
    rotation: 0,
    stroke: "#111111",
    strokeWidth: 2,
    shadow: "#000000",
    shadowBlur: 4,
    background: "#000000",
    backgroundOpacity: 0,
    visible: true,
  };
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  if (!layer.visible || !layer.text.trim()) return;
  const lines = layer.text.split(/\r?\n/);
  const lineHeight = layer.size * 1.2;
  const fontStyle = `${layer.italic ? "italic " : ""}${layer.bold ? "700 " : "400 "}${layer.size}px "${layer.font}"`;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(100, layer.opacity)) / 100;
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.font = fontStyle;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = layer.strokeWidth * 2;
  ctx.strokeStyle = layer.stroke;
  ctx.fillStyle = layer.color;
  ctx.shadowColor = layer.shadow;
  ctx.shadowBlur = layer.shadowBlur;
  const widths = lines.map((line) => ctx.measureText(line || " ").width);
  const widest = Math.max(1, ...widths);
  const left = layer.align === "center" ? -widest / 2 : layer.align === "right" ? -widest : 0;
  if (layer.backgroundOpacity > 0) {
    const padding = Math.max(6, layer.size * 0.22);
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha *= layer.backgroundOpacity / 100;
    ctx.fillStyle = layer.background;
    ctx.fillRect(left - padding, -((lines.length * lineHeight) / 2) - padding, widest + padding * 2, lines.length * lineHeight + padding * 2);
    ctx.restore();
  }
  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * lineHeight;
    if (layer.strokeWidth > 0) ctx.strokeText(line, 0, y);
    ctx.fillText(line, 0, y);
    if (layer.underline) {
      const lineWidth = widths[index];
      const start = layer.align === "center" ? -lineWidth / 2 : layer.align === "right" ? -lineWidth : 0;
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = Math.max(1, layer.size / 18);
      ctx.beginPath();
      ctx.moveTo(start, y + layer.size * 0.42);
      ctx.lineTo(start + lineWidth, y + layer.size * 0.42);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();
}

export function AddTextToImageWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; pointerX: number; pointerY: number; layerX: number; layerY: number } | null>(null);

  const selected = useMemo(() => layers.find((layer) => layer.id === selectedId) ?? null, [layers, selectedId]);

  const updateLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  }, []);

  const loadFile = useCallback((nextFile?: File) => {
    if (!nextFile) return;
    setError("");
    setNotice("");
    if (!nextFile.type.startsWith("image/")) {
      setError("Please choose a supported image file.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("This image is larger than 25 MB. Choose a smaller file.");
      return;
    }
    const nextUrl = URL.createObjectURL(nextFile);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        URL.revokeObjectURL(nextUrl);
        setError("The selected image could not be decoded by this browser.");
        return;
      }
      if (image.naturalWidth * image.naturalHeight > 40_000_000) {
        URL.revokeObjectURL(nextUrl);
        setError("This image exceeds 40 megapixels and may use too much browser memory. Please resize it first.");
        return;
      }
      setFile(nextFile);
      setImageUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return nextUrl;
      });
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      const first = makeLayer(0, image.naturalWidth, image.naturalHeight);
      setLayers([first]);
      setSelectedId(first.id);
      setNotice(`Image loaded · ${image.naturalWidth} × ${image.naturalHeight}px`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setError("This image format is not supported by your browser.");
    };
    image.src = nextUrl;
  }, []);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      layers.forEach((layer) => drawTextLayer(ctx, layer));
    };
    image.src = imageUrl;
    return () => { cancelled = true; image.onload = null; };
  }, [imageUrl, layers]);

  const addLayer = () => {
    if (!imageUrl) return;
    const layer = makeLayer(layers.length, imageSize.width, imageSize.height);
    setLayers((current) => [...current, layer]);
    setSelectedId(layer.id);
  };

  const duplicateLayer = () => {
    if (!selected) return;
    const copy = { ...selected, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: `${selected.name} copy`, x: Math.min(imageSize.width, selected.x + 24), y: Math.min(imageSize.height, selected.y + 24) };
    setLayers((current) => [...current, copy]);
    setSelectedId(copy.id);
  };

  const removeLayer = () => {
    if (!selected) return;
    const remaining = layers.filter((layer) => layer.id !== selected.id);
    setLayers(remaining);
    setSelectedId(remaining.at(-1)?.id ?? "");
  };

  const moveLayer = (direction: -1 | 1) => {
    if (!selected) return;
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === selected.id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!selected || !stageRef.current) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * imageSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * imageSize.height;
    dragRef.current = { id: selected.id, pointerX: x, pointerY: y, layerX: selected.x, layerY: selected.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || !stageRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * imageSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * imageSize.height;
    updateLayer(drag.id, {
      x: Math.round(Math.max(0, Math.min(imageSize.width, drag.layerX + x - drag.pointerX))),
      y: Math.round(Math.max(0, Math.min(imageSize.height, drag.layerY + y - drag.pointerY))),
    });
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const exportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !file || !imageUrl || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const output = document.createElement("canvas");
      output.width = imageSize.width;
      output.height = imageSize.height;
      const ctx = output.getContext("2d");
      if (!ctx) throw new Error("Your browser could not create an export canvas.");
      ctx.drawImage(canvas, 0, 0);
      if (outputFormat === "image/jpeg") {
        const flattened = document.createElement("canvas");
        flattened.width = output.width;
        flattened.height = output.height;
        const flatCtx = flattened.getContext("2d");
        if (!flatCtx) throw new Error("Could not prepare the JPG background.");
        flatCtx.fillStyle = "#ffffff";
        flatCtx.fillRect(0, 0, flattened.width, flattened.height);
        flatCtx.drawImage(output, 0, 0);
        const blob = await new Promise<Blob>((resolve, reject) => flattened.toBlob((value) => value ? resolve(value) : reject(new Error("JPG export failed.")), outputFormat, quality / 100));
        download(blob);
      } else {
        const blob = await new Promise<Blob>((resolve, reject) => output.toBlob((value) => value ? resolve(value) : reject(new Error("Image export failed. Try another format.")), outputFormat, outputFormat === "image/webp" ? quality / 100 : undefined));
        download(blob);
      }
      setNotice("Your edited image is ready. The original file has not been changed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const ext = outputFormat === "image/jpeg" ? "jpg" : outputFormat === "image/webp" ? "webp" : "png";
    const base = (file?.name ?? "image").replace(/\.[^.]+$/, "");
    anchor.href = url;
    anchor.download = `${base}-brobex-text.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const reset = () => {
    setFile(null);
    setImageUrl((old) => { if (old) URL.revokeObjectURL(old); return ""; });
    setImageSize({ width: 0, height: 0 });
    setLayers([]);
    setSelectedId("");
    setError("");
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.items ?? []).find((item) => item.type.startsWith("image/"));
      const pastedFile = pasted?.getAsFile();
      if (pastedFile) loadFile(pastedFile);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selected || !imageUrl || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        updateLayer(selected.id, {
          x: Math.max(0, Math.min(imageSize.width, selected.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
          y: Math.max(0, Math.min(imageSize.height, selected.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0))),
        });
      }
      if (event.key === "Delete" || event.key === "Backspace") removeLayer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, imageUrl, imageSize, updateLayer]);

  return (
    <section className="brobex-text-workspace">
      <div className="btw-heading">
        <div className="btw-heading-icon"><Type size={22} /></div>
        <div><span className="btw-eyebrow">BROBEX IMAGE STUDIO</span><h2>Add Text to Image</h2><p>Design captions, titles, labels and watermarks with editable text layers.</p></div>
      </div>

      {!imageUrl ? (
        <div className="btw-upload"
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files?.[0]); }}
          data-dragging={dragging}>
          <input ref={inputRef} type="file" accept="image/*" onChange={(event) => loadFile(event.target.files?.[0])} />
          <div className="btw-upload-symbol"><ImagePlus size={30} /></div>
          <h3>Upload an image to start editing</h3>
          <p>Drag and drop an image here, paste from clipboard, or browse your device.</p>
          <button type="button" className="btw-primary" onClick={() => inputRef.current?.click()}><ImagePlus size={17} /> Choose image</button>
          <span>JPG, PNG, WebP, GIF and other browser-supported formats · Up to 25 MB</span>
        </div>
      ) : (
        <div className="btw-editor">
          <div className="btw-stage-column">
            <div className="btw-preview-sticky">
              <div className="btw-stage-toolbar">
                <div><strong>Live canvas</strong><span>{imageSize.width} × {imageSize.height}px</span></div>
                <button type="button" className="btw-quiet" onClick={reset}><RotateCcw size={15} /> Replace image</button>
              </div>
              <div className="btw-stage" ref={stageRef}>
                <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onLostPointerCapture={handlePointerUp} aria-label="Image preview. Drag selected text to reposition it." />
              </div>
              <div className="btw-stage-help">Select a layer, then drag it on the image. Use arrow keys to fine-tune its position; hold Shift for larger steps.</div>
            </div>
            <div className="btw-export">
              <div className="btw-export-title"><Download size={17} /><strong>Export image</strong></div>
              <div className="btw-export-controls">
                <label>Format<select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as typeof outputFormat)}><option value="image/png">PNG · Best quality</option><option value="image/jpeg">JPG · Smaller file</option><option value="image/webp">WebP · Modern format</option></select></label>
                {outputFormat !== "image/png" && <label>Quality · {quality}%<input type="range" min="40" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>}
                <button type="button" className="btw-primary btw-download" onClick={exportImage} disabled={busy || !layers.some((layer) => layer.visible && layer.text.trim())}>{busy ? "Exporting…" : <><Download size={17} /> Download image</>}</button>
              </div>
              <p>PNG preserves transparency. JPG uses a white background where the source is transparent. Export keeps the original pixel dimensions.</p>
            </div>
          </div>

          <aside className="btw-sidebar">
            <div className="btw-panel">
              <div className="btw-panel-heading"><div><Layers3 size={17} /><strong>Text layers</strong><span>{layers.length}</span></div><button type="button" className="btw-icon-button" onClick={addLayer} title="Add text layer"><Plus size={18} /></button></div>
              <div className="btw-layer-list">
                {layers.map((layer, index) => (
                  <div key={layer.id} className={`btw-layer-row ${selectedId === layer.id ? "is-selected" : ""}`}>
                    <button type="button" className="btw-layer-select" onClick={() => setSelectedId(layer.id)}><Type size={15} /><span>{layer.name}</span><small>{layer.text.replace(/\s+/g, " ").slice(0, 22) || "Empty text"}</small></button>
                    <button type="button" className="btw-layer-visibility" title={layer.visible ? "Hide layer" : "Show layer"} onClick={() => updateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <button type="button" className="btw-layer-order" title="Move layer up" disabled={index === layers.length - 1} onClick={() => { setSelectedId(layer.id); moveLayer(1); }}><ArrowUp size={14} /></button>
                  </div>
                ))}
              </div>
              {selected && (
                <>
                  <div className="btw-layer-actions"><button type="button" onClick={duplicateLayer}><Copy size={14} /> Duplicate</button><button type="button" onClick={() => moveLayer(-1)}><ArrowDown size={14} /> Send backward</button><button type="button" className="btw-danger" onClick={removeLayer}><Trash2 size={14} /> Delete</button></div>
                  <div className="btw-divider" />
                  <div className="btw-section-title">Text content</div>
                  <label className="btw-field">Layer name<input value={selected.name} maxLength={40} onChange={(event) => updateLayer(selected.id, { name: event.target.value })} /></label>
                  <label className="btw-field">Your text<textarea rows={3} maxLength={1000} value={selected.text} onChange={(event) => updateLayer(selected.id, { text: event.target.value })} placeholder="Type your caption…" /></label>
                  <div className="btw-section-title">Typography</div>
                  <label className="btw-field">Font family<select value={selected.font} onChange={(event) => updateLayer(selected.id, { font: event.target.value })}>{FONT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <div className="btw-two-fields">
                    <label className="btw-field">Size · {selected.size}px<input type="range" min="8" max={Math.max(240, Math.min(600, Math.max(imageSize.width, imageSize.height)))} value={selected.size} onChange={(event) => updateLayer(selected.id, { size: Number(event.target.value) })} /></label>
                    <label className="btw-field">Opacity · {selected.opacity}%<input type="range" min="0" max="100" value={selected.opacity} onChange={(event) => updateLayer(selected.id, { opacity: Number(event.target.value) })} /></label>
                  </div>
                  <div className="btw-style-buttons">
                    <button type="button" aria-pressed={selected.bold} className={selected.bold ? "active" : ""} onClick={() => updateLayer(selected.id, { bold: !selected.bold })}><Bold size={16} /> Bold</button>
                    <button type="button" aria-pressed={selected.italic} className={selected.italic ? "active" : ""} onClick={() => updateLayer(selected.id, { italic: !selected.italic })}><Italic size={16} /> Italic</button>
                    <button type="button" aria-pressed={selected.underline} className={selected.underline ? "active" : ""} onClick={() => updateLayer(selected.id, { underline: !selected.underline })}><span className="btw-underline-icon">U</span> Underline</button>
                  </div>
                  <div className="btw-two-fields">
                    <label className="btw-field">Text color<input type="color" value={selected.color} onChange={(event) => updateLayer(selected.id, { color: event.target.value })} /></label>
                    <label className="btw-field">Alignment<select value={selected.align} onChange={(event) => updateLayer(selected.id, { align: event.target.value as CanvasTextAlign })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                  </div>
                  <div className="btw-section-title">Text effects</div>
                  <div className="btw-two-fields">
                    <label className="btw-field">Outline color<input type="color" value={selected.stroke} onChange={(event) => updateLayer(selected.id, { stroke: event.target.value })} /></label>
                    <label className="btw-field">Outline · {selected.strokeWidth}px<input type="range" min="0" max="16" value={selected.strokeWidth} onChange={(event) => updateLayer(selected.id, { strokeWidth: Number(event.target.value) })} /></label>
                  </div>
                  <div className="btw-two-fields">
                    <label className="btw-field">Shadow color<input type="color" value={selected.shadow} onChange={(event) => updateLayer(selected.id, { shadow: event.target.value })} /></label>
                    <label className="btw-field">Shadow blur · {selected.shadowBlur}px<input type="range" min="0" max="40" value={selected.shadowBlur} onChange={(event) => updateLayer(selected.id, { shadowBlur: Number(event.target.value) })} /></label>
                  </div>
                  <div className="btw-two-fields">
                    <label className="btw-field">Box color<input type="color" value={selected.background} onChange={(event) => updateLayer(selected.id, { background: event.target.value })} /></label>
                    <label className="btw-field">Box opacity · {selected.backgroundOpacity}%<input type="range" min="0" max="100" value={selected.backgroundOpacity} onChange={(event) => updateLayer(selected.id, { backgroundOpacity: Number(event.target.value) })} /></label>
                  </div>
                  <div className="btw-section-title">Position & rotation</div>
                  <div className="btw-two-fields">
                    <label className="btw-field">X position<input type="number" min="0" max={imageSize.width} value={Math.round(selected.x)} onChange={(event) => updateLayer(selected.id, { x: Math.max(0, Math.min(imageSize.width, Number(event.target.value) || 0)) })} /></label>
                    <label className="btw-field">Y position<input type="number" min="0" max={imageSize.height} value={Math.round(selected.y)} onChange={(event) => updateLayer(selected.id, { y: Math.max(0, Math.min(imageSize.height, Number(event.target.value) || 0)) })} /></label>
                  </div>
                  <label className="btw-field">Rotation · {selected.rotation}°<input type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateLayer(selected.id, { rotation: Number(event.target.value) })} /></label>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
      {(error || notice) && <div className={`btw-feedback ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>{error || notice}</div>}
      <div className="btw-privacy-note"><span>🔒</span><div><strong>Private, browser-based editing</strong><p>Your selected image is processed locally in this browser. It is not uploaded to BROBEX servers.</p></div></div>
    </section>
  );
}
