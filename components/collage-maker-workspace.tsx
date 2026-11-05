"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, MoveDown, MoveUp, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";

type Photo = { id: string; file: File; url: string; image: HTMLImageElement; width: number; height: number };
type Layout = "grid" | "featured-left" | "featured-top" | "horizontal" | "vertical";
type Ratio = "1:1" | "4:5" | "9:16" | "16:9" | "3:2" | "4:3" | "free";

const MAX_FILES = 20;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;

function getCanvasSize(ratio: Ratio, longest: number, count: number) {
  if (ratio === "free") return { width: longest, height: Math.max(1, Math.round(longest / Math.max(1, count))) };
  const values: Record<Exclude<Ratio, "free">, number> = { "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16, "16:9": 16 / 9, "3:2": 3 / 2, "4:3": 4 / 3 };
  const r = values[ratio];
  return r >= 1 ? { width: longest, height: Math.round(longest / r) } : { width: Math.round(longest * r), height: longest };
}

function getCells(layout: Layout, count: number, width: number, height: number, gap: number, padding: number) {
  const n = Math.max(1, count);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const cells: Array<{ x: number; y: number; w: number; h: number }> = [];
  if (layout === "horizontal" || layout === "vertical") {
    const horizontal = layout === "horizontal";
    const cell = (horizontal ? innerW - gap * (n - 1) : innerH - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) cells.push(horizontal ? { x: padding + i * (cell + gap), y: padding, w: cell, h: innerH } : { x: padding, y: padding + i * (cell + gap), w: innerW, h: cell });
    return cells;
  }
  if (layout === "featured-left" && n > 1) {
    const mainW = (innerW - gap) * 0.58;
    cells.push({ x: padding, y: padding, w: mainW, h: innerH });
    const sideW = innerW - mainW - gap;
    const sideH = (innerH - gap * (n - 2)) / (n - 1);
    for (let i = 1; i < n; i++) cells.push({ x: padding + mainW + gap, y: padding + (i - 1) * (sideH + gap), w: sideW, h: sideH });
    return cells;
  }
  if (layout === "featured-top" && n > 1) {
    const mainH = (innerH - gap) * 0.58;
    cells.push({ x: padding, y: padding, w: innerW, h: mainH });
    const rest = n - 1;
    const cellW = (innerW - gap * (rest - 1)) / rest;
    const cellH = innerH - mainH - gap;
    for (let i = 1; i < n; i++) cells.push({ x: padding + (i - 1) * (cellW + gap), y: padding + mainH + gap, w: cellW, h: cellH });
    return cells;
  }
  const columns = Math.ceil(Math.sqrt(n * (width / height)));
  const rows = Math.ceil(n / columns);
  const cellW = (innerW - gap * (columns - 1)) / columns;
  const cellH = (innerH - gap * (rows - 1)) / rows;
  for (let i = 0; i < n; i++) cells.push({ x: padding + (i % columns) * (cellW + gap), y: padding + Math.floor(i / columns) * (cellH + gap), w: cellW, h: cellH });
  return cells;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function CollageMakerWorkspace() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [layout, setLayout] = useState<Layout>("grid");
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [resolution, setResolution] = useState(1600);
  const [gap, setGap] = useState(14);
  const [padding, setPadding] = useState(18);
  const [radius, setRadius] = useState(12);
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [output, setOutput] = useState("");
  const [outputSize, setOutputSize] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef("");
  const photosRef = useRef<Photo[]>([]);

  const dimensions = useMemo(() => getCanvasSize(ratio, resolution, photos.length), [ratio, resolution, photos.length]);
  const cells = useMemo(() => getCells(layout, photos.length, dimensions.width, dimensions.height, gap, padding), [layout, photos.length, dimensions, gap, padding]);

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    setError(""); setNotice(""); setOutput("");
    const chosen = Array.from(incoming);
    if (!chosen.length) return;
    if (photos.length + chosen.length > MAX_FILES) { setError(`You can add up to ${MAX_FILES} photos per collage.`); return; }
    const invalid = chosen.find(f => !f.type.startsWith("image/") || f.size === 0 || f.size > MAX_FILE_BYTES);
    if (invalid) { setError(`${invalid.name}: choose a valid image no larger than 20 MB.`); return; }
    const decoded: Photo[] = [];
    for (const file of chosen) {
      const url = URL.createObjectURL(file);
      try {
        const img = new Image(); img.src = url; await img.decode();
        if (img.naturalWidth * img.naturalHeight > 40_000_000) throw new Error(`${file.name} exceeds the 40-megapixel safety limit.`);
        decoded.push({ id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, file, url, image: img, width: img.naturalWidth, height: img.naturalHeight });
      } catch (e) { URL.revokeObjectURL(url); setError(e instanceof Error ? e.message : `Could not read ${file.name}.`); }
    }
    setPhotos(prev => [...prev, ...decoded]);
    if (decoded.length) setNotice(`${decoded.length} photo${decoded.length === 1 ? "" : "s"} added. Your originals remain unchanged.`);
  }, [photos.length]);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => { photosRef.current.forEach(p => URL.revokeObjectURL(p.url)); }, []);
  useEffect(() => { return () => { if (outputRef.current) URL.revokeObjectURL(outputRef.current); }; }, []);

  const draw = useCallback((canvas: HTMLCanvasElement, exportScale = 1) => {
    const w = Math.round(dimensions.width * exportScale), h = Math.round(dimensions.height * exportScale);
    if (w * h > MAX_PIXELS) throw new Error("This export is too large for safe browser processing. Choose a smaller resolution.");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas rendering is unavailable in this browser.");
    if (!transparent || format !== "image/png") { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    const scale = exportScale;
    photos.forEach((photo, index) => {
      const cell = cells[index]; if (!cell) return;
      const x = cell.x * scale, y = cell.y * scale, cw = cell.w * scale, ch = cell.h * scale;
      ctx.save(); roundedRect(ctx, x, y, cw, ch, radius * scale); ctx.clip();
      const img = photo.image;
      const sourceScale = fit === "cover" ? Math.max(cw / photo.width, ch / photo.height) : Math.min(cw / photo.width, ch / photo.height);
      const dw = photo.width * sourceScale, dh = photo.height * sourceScale;
      ctx.drawImage(img, x + (cw - dw) / 2, y + (ch - dh) / 2, dw, dh);
      ctx.restore();
    });
  }, [dimensions, background, transparent, format, photos, cells, radius, fit]);

  useEffect(() => {
    const canvas = previewRef.current; if (!canvas || !photos.length) return;
    try { draw(canvas, Math.min(1, 900 / Math.max(dimensions.width, dimensions.height))); } catch { /* preview will remain available for correction */ }
  }, [draw, photos.length, dimensions]);

  function movePhoto(index: number, direction: -1 | 1) {
    const next = [...photos], target = index + direction; if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; setPhotos(next); setOutput("");
  }
  function removePhoto(index: number) { const removed = photos[index]; if (removed) URL.revokeObjectURL(removed.url); setPhotos(prev => prev.filter((_, i) => i !== index)); setOutput(""); }
  function reset() {
    photos.forEach(p => URL.revokeObjectURL(p.url)); if (outputRef.current) URL.revokeObjectURL(outputRef.current); outputRef.current = ""; setPhotos([]); setLayout("grid"); setRatio("1:1"); setResolution(1600); setGap(14); setPadding(18); setRadius(12); setBackground("#ffffff"); setTransparent(false); setFit("cover"); setFormat("image/png"); setQuality(92); setError(""); setNotice(""); setOutput("");
  }

  async function exportCollage() {
    if (photos.length < 2 || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const canvas = document.createElement("canvas"); draw(canvas);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("The browser could not create the export. Try PNG or a smaller size.")), format, format === "image/png" ? undefined : quality / 100));
      if (blob.type !== format) throw new Error("This browser could not export the selected format. Choose PNG or JPEG instead.");
      if (outputRef.current) URL.revokeObjectURL(outputRef.current);
      const url = URL.createObjectURL(blob); outputRef.current = url; setOutput(url); setOutputSize(`${(blob.size / 1024 / 1024).toFixed(2)} MB`); setNotice(`Collage exported successfully · ${dimensions.width} × ${dimensions.height} px.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Collage export failed."); }
    finally { setBusy(false); }
  }

  const extension = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";

  return (
    <section className="brobex-collage" aria-label="Photo collage editor">
      <header className="brobex-collage-head">
        <div><span className="brobex-collage-kicker">BROBEX IMAGE STUDIO</span><h2>Photo collage maker</h2><p>Arrange, style and export your photos in one clean workspace.</p></div>
        <span className="brobex-collage-private"><ShieldCheck size={15}/> Private browser processing</span>
      </header>
      <div className="brobex-collage-grid">
        <div className="brobex-collage-main">
          <div className="brobex-collage-toolbar">
            <div><strong>Your photos</strong><small>{photos.length} / {MAX_FILES} selected · JPG, PNG, WebP, GIF and browser-supported images</small></div>
            <button type="button" className="brobex-collage-button" onClick={() => inputRef.current?.click()}><ImagePlus size={16}/> Add photos</button>
            <input ref={inputRef} hidden type="file" accept="image/*" multiple onChange={e => { if (e.target.files) void addFiles(e.target.files); e.currentTarget.value = ""; }}/>
          </div>
          <div className="brobex-collage-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void addFiles(e.dataTransfer.files); }}>
            {photos.length ? <div className="brobex-collage-stage" style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}><canvas ref={previewRef} aria-label="Live collage preview" /></div> : <button type="button" className="brobex-collage-empty" onClick={() => inputRef.current?.click()}><ImagePlus size={34}/><strong>Drop your photos here</strong><span>or browse files · up to 20 images · 20 MB each</span></button>}
          </div>
          {photos.length > 0 && <div className="brobex-collage-photo-list">{photos.map((photo, index) => <article key={photo.id} draggable onDragStart={() => setDragIndex(index)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIndex === null || dragIndex === index) return; const next = [...photos]; const [item] = next.splice(dragIndex, 1); next.splice(index, 0, item); setPhotos(next); setDragIndex(null); setOutput(""); }} onDragEnd={() => setDragIndex(null)}><img src={photo.url} alt={`Selected photo ${index + 1}`}/><span title={photo.file.name}>{index + 1}. {photo.file.name}</span><small>{photo.width} × {photo.height}</small><button type="button" aria-label={`Move ${photo.file.name} up`} disabled={index === 0} onClick={() => movePhoto(index, -1)}><MoveUp size={14}/></button><button type="button" aria-label={`Move ${photo.file.name} down`} disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)}><MoveDown size={14}/></button><button type="button" aria-label={`Remove ${photo.file.name}`} onClick={() => removePhoto(index)}><Trash2 size={14}/></button></article>)}</div>}
        </div>
        <aside className="brobex-collage-settings">
          <h3>Composition</h3>
          <label>Layout<select value={layout} onChange={e => { setLayout(e.target.value as Layout); setOutput(""); }}><option value="grid">Balanced grid</option><option value="featured-left">Featured photo — left</option><option value="featured-top">Featured photo — top</option><option value="horizontal">Horizontal strip</option><option value="vertical">Vertical strip</option></select></label>
          <label>Canvas ratio<select value={ratio} onChange={e => { setRatio(e.target.value as Ratio); setOutput(""); }}><option value="1:1">Square · 1:1</option><option value="4:5">Portrait · 4:5</option><option value="9:16">Story · 9:16</option><option value="16:9">Landscape · 16:9</option><option value="3:2">Photo · 3:2</option><option value="4:3">Classic · 4:3</option><option value="free">Auto composition</option></select></label>
          <label>Export resolution<select value={resolution} onChange={e => { setResolution(Number(e.target.value)); setOutput(""); }}><option value={1080}>1080 px · Standard</option><option value={1600}>1600 px · High</option><option value={2400}>2400 px · Ultra</option><option value={3000}>3000 px · Print</option></select></label>
          <label>Photo fit<select value={fit} onChange={e => { setFit(e.target.value as "cover" | "contain"); setOutput(""); }}><option value="cover">Fill frame · crop edges</option><option value="contain">Fit whole photo</option></select></label>
          <label>Spacing <output>{gap}px</output><input type="range" min="0" max="64" value={gap} onChange={e => { setGap(Number(e.target.value)); setOutput(""); }}/></label>
          <label>Outer margin <output>{padding}px</output><input type="range" min="0" max="80" value={padding} onChange={e => { setPadding(Number(e.target.value)); setOutput(""); }}/></label>
          <label>Corner radius <output>{radius}px</output><input type="range" min="0" max="48" value={radius} onChange={e => { setRadius(Number(e.target.value)); setOutput(""); }}/></label>
          <label>Canvas background<input type="color" value={background} disabled={transparent && format === "image/png"} onChange={e => { setBackground(e.target.value); setOutput(""); }}/></label>
          {format === "image/png" && <label className="brobex-collage-check"><input type="checkbox" checked={transparent} onChange={e => { setTransparent(e.target.checked); setOutput(""); }}/> Transparent PNG background</label>}
          <h3>Export</h3>
          <label>File format<select value={format} onChange={e => { setFormat(e.target.value as typeof format); setOutput(""); }}><option value="image/png">PNG · lossless</option><option value="image/jpeg">JPEG · smaller file</option><option value="image/webp">WebP · modern format</option></select></label>
          {format !== "image/png" && <label>Quality <output>{quality}%</output><input type="range" min="50" max="100" value={quality} onChange={e => { setQuality(Number(e.target.value)); setOutput(""); }}/></label>}
          <div className="brobex-collage-size">Output dimensions <strong>{dimensions.width} × {dimensions.height} px</strong></div>
          <button type="button" className="brobex-collage-export" onClick={exportCollage} disabled={photos.length < 2 || busy}>{busy ? "Rendering collage…" : <><Download size={16}/> Export collage</>}</button>
          {output && <a className="brobex-collage-download" href={output} download={`brobex-photo-collage.${extension}`}><Download size={15}/> Download {extension.toUpperCase()} · {outputSize}</a>}
          <button type="button" className="brobex-collage-reset" onClick={reset}><RotateCcw size={14}/> Reset workspace</button>
          <p className="brobex-collage-hint">At least 2 photos are required. Your images are processed locally and are not uploaded.</p>
        </aside>
      </div>
      {error && <p className="brobex-collage-alert" role="alert">{error}</p>}{notice && <p className="brobex-collage-notice" role="status">{notice}</p>}
    </section>
  );
}
