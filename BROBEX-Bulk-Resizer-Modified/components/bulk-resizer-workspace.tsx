"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";

type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";
type ResizeMode = "physical" | "pixels" | "percentage";
type FitMode = "contain" | "crop" | "stretch";
type FillMode = "transparent" | "white";
type JobStatus = "Pending" | "Processing" | "Completed" | "Error";
type Job = {
  id: string;
  file: File;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  status: JobStatus;
  progress: number;
  result?: Blob;
  outputWidth?: number;
  outputHeight?: number;
  outputType?: string;
  error?: string;
};

const MAX_SIDE = 12000;
const MAX_PIXELS = 40_000_000;
const MAX_FILE_BYTES = 40 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DPI_OPTIONS = [72, 96, 150, 300];
const prettySize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const extensionFor = (type: string) => type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
const mimeForFile = (file: File) => ACCEPTED_TYPES.includes(file.type) ? file.type : "image/png";
const physicalPixels = (value: number, unit: "cm" | "in", dpi: number) =>
  Math.round((unit === "cm" ? value / 2.54 : value) * dpi);

export function BulkResizerWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const jobsRef = useRef<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [width, setWidth] = useState("1600");
  const [height, setHeight] = useState("1600");
  const [percentage, setPercentage] = useState("50");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [dpi, setDpi] = useState(300);
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [fill, setFill] = useState<FillMode>("white");
  const [format, setFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => () => jobsRef.current.forEach((job) => URL.revokeObjectURL(job.url)), []);

  const target = useMemo(() => {
    if (mode === "percentage") {
      const value = Number(percentage);
      if (!Number.isFinite(value) || value <= 0 || value > 500) return null;
      return { width: value, height: value, percentage: true as const };
    }
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const pixelWidth = mode === "physical" ? physicalPixels(w, unit, dpi) : Math.round(w);
    const pixelHeight = mode === "physical" ? physicalPixels(h, unit, dpi) : Math.round(h);
    if (!Number.isInteger(pixelWidth) || !Number.isInteger(pixelHeight) || pixelWidth < 1 || pixelHeight < 1 || pixelWidth > MAX_SIDE || pixelHeight > MAX_SIDE || pixelWidth * pixelHeight > MAX_PIXELS) return null;
    return { width: pixelWidth, height: pixelHeight, percentage: false as const };
  }, [mode, width, height, percentage, unit, dpi]);

  const updateJob = (id: string, patch: Partial<Job>) => {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, ...patch } : job));
  };

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    if (!selected.length) return;
    const rejected: string[] = [];
    selected.forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) { rejected.push(`${file.name}: unsupported format`); return; }
      if (file.size > MAX_FILE_BYTES) { rejected.push(`${file.name}: larger than 40 MB`); return; }
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
          URL.revokeObjectURL(url);
          setError(`${file.name} exceeds the 40-megapixel input safety limit.`);
          return;
        }
        const job: Job = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file, url, image, width: image.naturalWidth, height: image.naturalHeight,
          status: "Pending", progress: 0,
        };
        setJobs((current) => [...current, job]);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        setError(`Could not read ${file.name}. Please try another image.`);
      };
      image.src = url;
    });
    setError(rejected.length ? rejected.slice(0, 3).join(" · ") : "");
    if (inputRef.current) inputRef.current.value = "";
  };

  const applySignaturePreset = () => {
    setMode("physical"); setUnit("cm"); setWidth("6"); setHeight("2"); setDpi(300);
    setFitMode("contain"); setFill("white");
  };

  const outputDimensions = (job: Job) => {
    if (!target) throw new Error("Enter valid dimensions before processing.");
    if (target.percentage) {
      const scale = target.width / 100;
      return { width: Math.max(1, Math.round(job.width * scale)), height: Math.max(1, Math.round(job.height * scale)) };
    }
    return { width: target.width, height: target.height };
  };

  const processAll = async () => {
    if (!jobs.length || busy) return;
    if (!target) { setError(mode === "percentage" ? "Enter a percentage between 1% and 500%." : `Enter valid dimensions. Output must be no larger than ${MAX_SIDE} × ${MAX_SIDE} pixels and 40 megapixels.`); return; }
    setBusy(true); setError("");
    const queue = [...jobs];
    for (const job of queue) {
      updateJob(job.id, { status: "Processing", progress: 3, error: undefined, result: undefined });
      try {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const dimensions = outputDimensions(job);
        const outW = dimensions.width;
        const outH = dimensions.height;
        if (outW > MAX_SIDE || outH > MAX_SIDE || outW * outH > MAX_PIXELS) throw new Error("Calculated output is too large. Reduce the dimensions or percentage.");
        const outputType = format === "original" ? mimeForFile(job.file) : format;
        const canvas = document.createElement("canvas");
        canvas.width = outW; canvas.height = outH;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not create a canvas for this image.");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        if (outputType === "image/jpeg" || fill === "white") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, outW, outH);
        } else {
          context.clearRect(0, 0, outW, outH);
        }
        updateJob(job.id, { progress: 35 });
        if (fitMode === "stretch") {
          context.drawImage(job.image, 0, 0, outW, outH);
        } else if (fitMode === "crop") {
          const scale = Math.max(outW / job.width, outH / job.height);
          const drawW = job.width * scale;
          const drawH = job.height * scale;
          context.drawImage(job.image, (outW - drawW) / 2, (outH - drawH) / 2, drawW, drawH);
        } else {
          const scale = Math.min(outW / job.width, outH / job.height);
          const drawW = job.width * scale;
          const drawH = job.height * scale;
          context.drawImage(job.image, (outW - drawW) / 2, (outH - drawH) / 2, drawW, drawH);
        }
        updateJob(job.id, { progress: 75 });
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, outputType === "image/png" ? undefined : quality / 100));
        canvas.width = 0; canvas.height = 0;
        if (!blob) throw new Error("The browser could not export this image. Try PNG or a smaller size.");
        updateJob(job.id, { result: blob, outputWidth: outW, outputHeight: outH, outputType, progress: 100, status: "Completed" });
      } catch (cause) {
        updateJob(job.id, { status: "Error", progress: 100, error: cause instanceof Error ? cause.message : "Processing failed." });
      }
    }
    setBusy(false);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const downloadOne = (job: Job) => {
    if (!job.result || !job.outputType) return;
    const base = job.file.name.replace(/\.[^.]+$/, "");
    triggerDownload(job.result, `${base}-resized.${extensionFor(job.outputType)}`);
  };

  const downloadZip = async () => {
    const ready = jobs.filter((job) => job.result && job.outputType);
    if (!ready.length || zipBusy) return;
    setZipBusy(true); setError("");
    try {
      const zip = new JSZip();
      const names = new Map<string, number>();
      ready.forEach((job) => {
        const base = job.file.name.replace(/\.[^.]+$/, "") || "image";
        const count = (names.get(base.toLowerCase()) ?? 0) + 1;
        names.set(base.toLowerCase(), count);
        const suffix = count > 1 ? `-${count}` : "";
        zip.file(`${base}-resized${suffix}.${extensionFor(job.outputType!)}`, job.result!);
      });
      const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 5 } });
      triggerDownload(archive, "brobex-bulk-resized-images.zip");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the ZIP archive.");
    } finally { setZipBusy(false); }
  };

  const removeJob = (id: string) => {
    const job = jobs.find((item) => item.id === id);
    if (job) URL.revokeObjectURL(job.url);
    setJobs((current) => current.filter((item) => item.id !== id));
  };
  const clearQueue = () => {
    jobs.forEach((job) => URL.revokeObjectURL(job.url));
    setJobs([]); setError("");
  };

  const completed = jobs.filter((job) => job.status === "Completed").length;
  const processed = jobs.filter((job) => job.status === "Completed" || job.status === "Error").length;
  const overallProgress = jobs.length ? Math.round(jobs.reduce((sum, job) => sum + job.progress, 0) / jobs.length) : 0;
  const controlClass = "br-control";

  return (
    <section className="br-workspace">
      <style jsx>{`
        .br-workspace{--br-accent:#c77b53;--br-border:var(--border,#303039);--br-panel:var(--card,#111116);--br-muted:var(--muted-foreground,#92929d);display:grid;gap:18px;color:var(--foreground,#f5f5f5)}
        .br-heading h2{font-size:clamp(23px,4vw,30px);font-weight:760;letter-spacing:-.04em;margin:4px 0}.br-heading p{font-size:13px;color:var(--br-muted);margin:0;line-height:1.6}.br-eyebrow{font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--br-accent)}
        .br-panel{border:1px solid var(--br-border);border-radius:16px;padding:clamp(14px,2.5vw,20px);background:var(--br-panel);box-shadow:0 8px 28px #00000012}.br-panel h3{font-size:15px;font-weight:750;margin:0 0 14px;letter-spacing:-.01em}
        .br-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.br-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.br-field{display:grid;gap:7px;min-width:0}.br-field label,.br-label{font-size:12px;font-weight:680;color:var(--foreground,#f5f5f5)}
        .br-control{width:100%;min-width:0;border:1px solid var(--br-border);border-radius:9px;padding:10px 11px;background:var(--background,#09090b);color:var(--foreground,#f5f5f5);font:inherit;font-size:13px;outline:none}.br-control:focus{border-color:var(--br-accent);box-shadow:0 0 0 3px #c77b5322}.br-control:disabled{opacity:.55}
        .br-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--br-border);border-radius:9px;padding:10px 13px;background:var(--background,#09090b);color:var(--foreground,#f5f5f5);font-size:12px;font-weight:750;cursor:pointer;transition:border-color .15s,transform .15s}.br-button:hover:not(:disabled){border-color:var(--br-accent);transform:translateY(-1px)}.br-button:disabled{opacity:.45;cursor:not-allowed}.br-primary{background:linear-gradient(135deg,#c77b53,#a85c3b);border-color:#c77b53;color:#fff}.br-preset{border-color:#c77b5366;background:#c77b5310;color:#e5a17d}
        .br-drop{display:grid;justify-items:center;text-align:center;gap:7px;padding:28px 16px;margin-top:14px;border:1.5px dashed var(--br-border);border-radius:13px;background:#c77b5308;cursor:pointer;transition:border-color .15s,background .15s}.br-drop.active{border-color:var(--br-accent);background:#c77b5318}.br-drop strong{font-size:13px}.br-drop span{font-size:11px;color:var(--br-muted)}
        .br-track{height:7px;border-radius:30px;background:#77777722;overflow:hidden}.br-track>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#a85c3b,#e4a078);transition:width .2s}
        .br-queue{display:grid;gap:9px;margin-top:14px}.br-item{display:grid;grid-template-columns:64px minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px;border:1px solid var(--br-border);border-radius:12px;background:var(--background,#09090b)}.br-thumb{width:64px;height:64px;object-fit:contain;border-radius:8px;background:#77777712}.br-filename{font-size:12px;font-weight:750;overflow-wrap:anywhere}.br-meta{font-size:10px;color:var(--br-muted);margin:4px 0 8px}.br-status{display:inline-flex;border-radius:30px;padding:4px 8px;font-size:10px;font-weight:750;background:#7777771c;color:var(--br-muted)}.br-status[data-status="Completed"]{background:#16a34a1c;color:#4ade80}.br-status[data-status="Processing"]{background:#c77b5320;color:#e5a17d}.br-status[data-status="Error"]{background:#dc26261c;color:#f87171}.br-status[data-status="Pending"]{background:#7777771c;color:var(--br-muted)}
        .br-error{font-size:12px;color:#f87171;margin:12px 0 0;line-height:1.5}.br-help{font-size:11px;color:var(--br-muted);line-height:1.55;margin:10px 0 0}.br-segment{display:flex;gap:6px;flex-wrap:wrap}.br-segment button{padding:8px 10px;border:1px solid var(--br-border);border-radius:8px;background:transparent;color:var(--br-muted);font-size:11px;font-weight:700;cursor:pointer}.br-segment button[aria-pressed="true"]{border-color:var(--br-accent);background:#c77b5318;color:var(--foreground,#fff)}.br-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.br-summary{font-size:12px;color:var(--br-muted)}.br-summary strong{color:var(--foreground,#fff)}
        @media(max-width:560px){.br-grid{grid-template-columns:1fr}.br-item{grid-template-columns:48px minmax(0,1fr)}.br-thumb{width:48px;height:48px}.br-item-actions{grid-column:2;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.br-item-actions .br-button{padding:7px 9px}.br-panel{border-radius:13px}}
      `}</style>

      <header className="br-heading">
        <div className="br-eyebrow">BROBEX IMAGE WORKSPACE</div>
        <h2>Bulk Image Resizer</h2>
        <p>Resize multiple images together, prepare print-ready dimensions and export your finished files in one ZIP. Everything runs locally in your browser.</p>
      </header>

      <section className="br-panel">
        <div className="br-row"><div><h3 style={{ marginBottom: 3 }}>Upload queue</h3><div className="br-summary">{jobs.length} {jobs.length === 1 ? "image" : "images"} added · JPEG, PNG and WebP</div></div>
          <button type="button" className="br-button" onClick={() => inputRef.current?.click()}>＋ Add images</button>
        </div>
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => event.target.files && addFiles(event.target.files)} />
        <div className={`br-drop${dragging ? " active" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
          <span style={{ fontSize: 25, color: "var(--br-accent)" }}>⇧</span><strong>Drop images here or browse files</strong><span>Multiple files supported · Up to 40 MB per image · 40-megapixel safety limit</span>
        </div>
        {jobs.length > 0 && <div style={{ marginTop: 15 }}>
          <div className="br-row" style={{ marginBottom: 7 }}><span className="br-summary">Processed <strong>{processed} of {jobs.length}</strong> images · <strong>{completed} completed</strong></span><strong style={{ fontSize: 12 }}>{overallProgress}%</strong></div>
          <div className="br-track"><span style={{ width: `${overallProgress}%` }} /></div>
        </div>}
      </section>

      <section className="br-panel">
        <div className="br-row"><h3 style={{ margin: 0 }}>Resize settings</h3><button type="button" className="br-button br-preset" onClick={applySignaturePreset}>✦ Apply 6 × 2 cm signature preset</button></div>
        <div style={{ marginTop: 15 }} className="br-segment" aria-label="Resize mode">
          <button type="button" aria-pressed={mode === "physical"} onClick={() => setMode("physical")}>Physical size</button>
          <button type="button" aria-pressed={mode === "pixels"} onClick={() => setMode("pixels")}>Pixel dimensions</button>
          <button type="button" aria-pressed={mode === "percentage"} onClick={() => setMode("percentage")}>Percentage scale</button>
        </div>

        {mode === "physical" ? <div className="br-grid" style={{ marginTop: 14 }}>
          <div className="br-field"><label htmlFor="br-width">Width ({unit})</label><input id="br-width" className={controlClass} type="number" min="0.01" step="0.01" value={width} onChange={(event) => setWidth(event.target.value)} /></div>
          <div className="br-field"><label htmlFor="br-height">Height ({unit})</label><input id="br-height" className={controlClass} type="number" min="0.01" step="0.01" value={height} onChange={(event) => setHeight(event.target.value)} /></div>
          <div className="br-field"><label htmlFor="br-unit">Measurement unit</label><select id="br-unit" className={controlClass} value={unit} onChange={(event) => setUnit(event.target.value as "cm" | "in")}><option value="cm">Centimeters (cm)</option><option value="in">Inches (in)</option></select></div>
          <div className="br-field"><label htmlFor="br-dpi">Print resolution</label><select id="br-dpi" className={controlClass} value={dpi} onChange={(event) => setDpi(Number(event.target.value))}>{DPI_OPTIONS.map((value) => <option key={value} value={value}>{value} DPI</option>)}</select></div>
        </div> : mode === "pixels" ? <div className="br-grid" style={{ marginTop: 14 }}>
          <div className="br-field"><label htmlFor="br-px-width">Target width (px)</label><input id="br-px-width" className={controlClass} type="number" min="1" max={MAX_SIDE} step="1" value={width} onChange={(event) => setWidth(event.target.value)} /></div>
          <div className="br-field"><label htmlFor="br-px-height">Target height (px)</label><input id="br-px-height" className={controlClass} type="number" min="1" max={MAX_SIDE} step="1" value={height} onChange={(event) => setHeight(event.target.value)} /></div>
        </div> : <div className="br-field" style={{ marginTop: 14, maxWidth: 360 }}><label htmlFor="br-percent">Scale percentage (1–500%)</label><input id="br-percent" className={controlClass} type="number" min="1" max="500" step="1" value={percentage} onChange={(event) => setPercentage(event.target.value)} /></div>}

        <div className="br-grid" style={{ marginTop: 15 }}>
          <div className="br-field"><label htmlFor="br-fit">Aspect ratio handling</label><select id="br-fit" className={controlClass} value={fitMode} onChange={(event) => setFitMode(event.target.value as FitMode)}><option value="contain">Maintain ratio · Fit with padding</option><option value="crop">Center-crop to fill</option><option value="stretch">Stretch to exact dimensions</option></select></div>
          <div className="br-field"><label htmlFor="br-fill">Padding background</label><select id="br-fill" className={controlClass} value={fill} onChange={(event) => setFill(event.target.value as FillMode)}><option value="white">White background</option><option value="transparent">Transparent background</option></select></div>
          <div className="br-field"><label htmlFor="br-format">Output format</label><select id="br-format" className={controlClass} value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}><option value="original">Keep each original format</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>
          <div className="br-field"><label htmlFor="br-quality">Quality · {quality}%</label><input id="br-quality" className={controlClass} type="range" min="1" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} disabled={format === "image/png" || format === "original" && jobs.every((job) => job.file.type === "image/png")} /><span className="br-help" style={{ margin: 0 }}>Used for JPEG and WebP. PNG is lossless.</span></div>
        </div>
        {mode === "physical" && <p className="br-help">Calculated output: <strong style={{ color: "var(--foreground,#fff)" }}>{target && !target.percentage ? `${target.width} × ${target.height} px` : "Enter valid physical dimensions"}</strong>. Formula: round((measurement ÷ 2.54) × DPI) for centimeters. The 6 × 2 cm preset at 300 DPI produces exactly 709 × 236 px.</p>}
        {!target && <p className="br-error" role="alert">Enter valid dimensions. Maximum output is {MAX_SIDE} px per side and {MAX_PIXELS.toLocaleString()} total pixels; percentage must be 1–500%.</p>}
        <div className="br-actions">
          <button type="button" className="br-button br-primary" disabled={!jobs.length || busy || !target} onClick={processAll}>{busy ? "Processing images…" : `Resize ${jobs.length ? `all ${jobs.length} images` : "images"}`}</button>
          <button type="button" className="br-button" disabled={!jobs.some((job) => job.result) || zipBusy} onClick={downloadZip}>{zipBusy ? "Building ZIP…" : "↓ Download All as ZIP"}</button>
          <button type="button" className="br-button" disabled={!jobs.length || busy} onClick={clearQueue}>Clear queue</button>
        </div>
        {error && <p className="br-error" role="alert">{error}</p>}
      </section>

      {jobs.length > 0 && <section className="br-panel">
        <div className="br-row"><h3 style={{ margin: 0 }}>Image queue</h3><span className="br-summary">{completed} / {jobs.length} completed</span></div>
        <div className="br-queue">{jobs.map((job) => <article className="br-item" key={job.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img className="br-thumb" src={job.url} alt={`Preview of ${job.file.name}`} />
          <div style={{ minWidth: 0 }}><div className="br-filename">{job.file.name}</div><div className="br-meta">Original: {job.width} × {job.height} px · {prettySize(job.file.size)}{job.result ? ` · Output: ${job.outputWidth} × ${job.outputHeight} px · ${prettySize(job.result.size)}` : ""}</div><div className="br-track"><span style={{ width: `${job.progress}%` }} /></div>{job.error && <p className="br-error" style={{ marginTop: 5 }}>{job.error}</p>}</div>
          <div className="br-item-actions" style={{ display: "grid", justifyItems: "end", gap: 7 }}><span className="br-status" data-status={job.status}>{job.status}</span>{job.result ? <button type="button" className="br-button" onClick={() => downloadOne(job)}>↓ Download</button> : <button type="button" className="br-button" disabled={busy} onClick={() => removeJob(job.id)}>Remove</button>}</div>
        </article>)}</div>
      </section>}
      <p className="br-help">Privacy: images are processed on your device and are not uploaded to a server. Very large images are limited to help keep your browser responsive.</p>
    </section>
  );
}
