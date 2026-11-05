$ErrorActionPreference = 'Stop'
$project = (Get-Location).Path

$componentContent = @'
"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Download, Eraser, RotateCcw, PenLine, Type, ShieldCheck } from "lucide-react";

type Mode = "draw" | "type";
type ExportFormat = "png" | "jpg";
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 560;
const MAX_HISTORY = 20;

export function SignatureGeneratorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const [mode, setMode] = useState<Mode>("draw");
  const [signature, setSignature] = useState("");
  const [font, setFont] = useState("cursive");
  const [ink, setInk] = useState("#111111");
  const [stroke, setStroke] = useState(5);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [transparent, setTransparent] = useState(true);
  const [hasInk, setHasInk] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [message, setMessage] = useState("");

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
  }, []);

  const paintTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!signature.trim()) {
      setHasInk(false);
      return;
    }
    const families: Record<string, string> = {
      cursive: '"Brush Script MT", "Segoe Script", cursive',
      elegant: '"URW Chancery L", "Apple Chancery", cursive',
      serif: 'Georgia, "Times New Roman", serif',
      clean: '"Trebuchet MS", Arial, sans-serif',
    };
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 118px ${families[font] ?? families.cursive}`;
    let fitted = 118;
    while (ctx.measureText(signature).width > canvas.width - 120 && fitted > 32) {
      fitted -= 4;
      ctx.font = `italic ${fitted}px ${families[font] ?? families.cursive}`;
    }
    ctx.fillText(signature, canvas.width / 2, canvas.height / 2);
    setHasInk(true);
    historyRef.current = [];
    setHistoryCount(0);
  }, [font, getContext, ink, signature]);

  useEffect(() => {
    if (mode === "type") paintTypedSignature();
  }, [mode, paintTypedSignature]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    setHistoryCount(historyRef.current.length);
    drawingRef.current = true;
    const point = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.1, point.y + 0.1);
    ctx.strokeStyle = ink;
    ctx.lineWidth = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasInk(true);
  };

  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || mode !== "draw") return;
    const ctx = getContext();
    if (!ctx) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = ink;
    ctx.lineWidth = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    setHistoryCount(0);
    setHasInk(false);
    setMessage("Signature canvas cleared.");
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    const previous = historyRef.current.pop();
    if (!canvas || !ctx || !previous) return;
    ctx.putImageData(previous, 0, 0);
    setHistoryCount(historyRef.current.length);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let visible = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) { visible = true; break; }
    }
    setHasInk(visible);
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) {
      setMessage("Create a signature before downloading.");
      return;
    }
    const output = document.createElement("canvas");
    output.width = CANVAS_WIDTH;
    output.height = CANVAS_HEIGHT;
    const ctx = output.getContext("2d");
    if (!ctx) {
      setMessage("Your browser could not prepare the export. Please try again.");
      return;
    }
    if (format === "jpg" || !transparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, output.width, output.height);
    }
    ctx.drawImage(canvas, 0, 0, output.width, output.height);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    output.toBlob((blob) => {
      if (!blob) {
        setMessage("Export failed. Please try another browser.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `brobex-signature.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`Your ${format.toUpperCase()} signature is ready.`);
    }, mime, format === "jpg" ? 0.96 : undefined);
  };

  return (
    <section className="brobex-signature" aria-label="Signature generator workspace">
      <header className="brobex-signature-head">
        <div>
          <span className="brobex-signature-kicker">BROBEX CREATIVE STUDIO</span>
          <h2>Create Your Digital Signature</h2>
          <p>Draw a natural signature or type your name, then export a clean image.</p>
        </div>
        <span className="brobex-signature-private"><ShieldCheck size={15}/> Private · Runs in your browser</span>
      </header>

      <div className="brobex-signature-layout">
        <div className="brobex-signature-editor">
          <div className="brobex-signature-toolbar" role="group" aria-label="Signature mode">
            <button type="button" className={mode === "draw" ? "is-active" : ""} onClick={() => { if (mode !== "draw") clearCanvas(); setMode("draw"); setMessage(""); }}><PenLine size={16}/> Draw signature</button>
            <button type="button" className={mode === "type" ? "is-active" : ""} onClick={() => { setMode("type"); setMessage(""); }}><Type size={16}/> Type signature</button>
            <span className="brobex-signature-canvas-label">1600 × 560 px canvas</span>
          </div>

          {mode === "type" && (
            <div className="brobex-signature-typed-controls">
              <label>Full name or signature text<input value={signature} onChange={(event) => setSignature(event.target.value.slice(0, 48))} maxLength={48} placeholder="Type your name" /></label>
              <label>Style<select value={font} onChange={(event) => setFont(event.target.value)}><option value="cursive">Classic cursive</option><option value="elegant">Elegant script</option><option value="serif">Formal serif</option><option value="clean">Modern clean</option></select></label>
            </div>
          )}

          <div className={`brobex-signature-paper ${transparent ? "is-transparent" : "is-white"}`}>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
              aria-label={mode === "draw" ? "Draw your signature here" : "Typed signature preview"}
              onPointerDown={startDrawing} onPointerMove={continueDrawing}
              onPointerUp={stopDrawing} onPointerCancel={stopDrawing} onPointerLeave={stopDrawing}
              style={{ touchAction: mode === "draw" ? "none" : "auto", cursor: mode === "draw" ? "crosshair" : "default" }} />
            {!hasInk && mode === "draw" && <span className="brobex-signature-placeholder">Sign here using your mouse, stylus or finger</span>}
            {!hasInk && mode === "type" && <span className="brobex-signature-placeholder">Your typed signature preview will appear here</span>}
          </div>

          <div className="brobex-signature-actions">
            <button type="button" onClick={undo} disabled={mode !== "draw" || historyCount === 0}><RotateCcw size={15}/> Undo</button>
            <button type="button" onClick={clearCanvas}><Eraser size={15}/> Clear canvas</button>
            <span>{mode === "draw" ? "Use a steady stroke for a smoother result." : "Choose a style and enter your name above."}</span>
          </div>
        </div>

        <aside className="brobex-signature-settings">
          <h3>Signature settings</h3>
          {mode === "draw" && <label>Pen thickness <output>{stroke}px</output><input type="range" min="1" max="18" value={stroke} onChange={(event) => setStroke(Number(event.target.value))}/></label>}
          <label>Ink color <input type="color" value={ink} onChange={(event) => { setInk(event.target.value); if (mode === "type") paintTypedSignature(); }}/></label>
          <label className="brobex-signature-check"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)}/> Transparent background</label>
          <label>Download format<select value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}><option value="png">PNG · Supports transparency</option><option value="jpg">JPEG · White background</option></select></label>
          <div className="brobex-signature-note"><strong>Export quality</strong><span>High-resolution 1600 × 560 px image. PNG preserves transparent pixels.</span></div>
          <button type="button" className="brobex-signature-download" onClick={exportSignature} disabled={!hasInk}><Download size={17}/> Download signature</button>
          <button type="button" className="brobex-signature-reset" onClick={() => { clearCanvas(); setSignature(""); setInk("#111111"); setStroke(5); setMode("draw"); setTransparent(true); setFormat("png"); }}>Reset settings</button>
          {message && <p className="brobex-signature-message" role="status">{message}</p>}
          <p className="brobex-signature-footnote">Your signature is rendered locally. No paid API, account, or server upload is required. A generated image is not a verified electronic-signature certificate.</p>
        </aside>
      </div>
    </section>
  );
}
'@
$guideContent = @'
{
  "slug": "signature-generator",
  "title": "Signature Generator",
  "keywords": [
    "signature generator",
    "online signature maker",
    "digital signature image",
    "transparent signature PNG",
    "draw signature online"
  ],
  "about": "Create a signature image by drawing with a mouse, stylus, or finger, or by typing your name in a selectable style. The workspace renders and exports the result locally in your browser without a paid API or account.",
  "steps": [
    "Open Signature Generator and choose Draw signature to write naturally on the canvas, or choose Type signature to enter your name.",
    "When drawing, adjust pen thickness and ink color. Use a mouse, touchscreen, or compatible stylus; select Undo to revert the most recent stroke.",
    "When typing, enter your name and choose a cursive, elegant, serif, or clean text style. The preview updates as you edit.",
    "Choose a transparent background for a PNG signature image, or disable transparency for a white background. JPEG exports always use a white background.",
    "Select PNG or JPEG and download the high-resolution 1600 \u00d7 560 pixel image. Review the file before inserting it into a document."
  ],
  "capabilities": "Freehand signature drawing, touch and stylus input, typed signature styles, ink color selection, adjustable pen thickness, undo, clear and reset controls, transparent PNG export, white-background JPEG export, and high-resolution browser-side rendering.",
  "benefits": "Create a reusable signature image for mockups, personal documents, design layouts, and workflows that accept an inserted signature image. The tool requires no account, paid API, or server-side image processing, and the signature canvas remains in the current browser session.",
  "limitations": "This tool creates a signature image only. It does not verify identity, apply a cryptographic certificate, provide an audit trail, or guarantee legal acceptance. Typed signatures are rendered using fonts available on the device, so their appearance can vary between systems. Do not use a signature image as a substitute for a verified e-signature service when identity verification or tamper evidence is required.",
  "faqs": [
    {
      "question": "Is the signature generator free?",
      "answer": "Yes. Drawing, typing, previewing, and exporting use browser features and do not require a paid API or subscription."
    },
    {
      "question": "Can I create a transparent signature?",
      "answer": "Yes. Keep Transparent background enabled and export as PNG. JPEG does not support transparency and is exported on white."
    },
    {
      "question": "Can I draw with my phone?",
      "answer": "Yes. Use your finger or a compatible stylus on the drawing canvas."
    },
    {
      "question": "Are my signature details uploaded?",
      "answer": "The signature is rendered locally in your browser. The workspace does not upload the signature to a processing server."
    },
    {
      "question": "Is this a legally verified electronic signature?",
      "answer": "No. It exports a signature image and does not perform identity verification, cryptographic signing, or create a tamper-evident audit record."
    }
  ]
}
'@

if (!(Test-Path -LiteralPath (Join-Path $project 'package.json'))) {
  throw 'Run this script from your BROBEX project root (the folder containing package.json).'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $project ".signature-generator-backup-$stamp"
$filesToBackup = @(
  'lib\tools.ts',
  'lib\image-tool-directory.ts',
  'lib\tool-seo.ts',
  'app\tools\[slug]\page.tsx',
  'content\tool-guides\index.ts',
  'app\globals.css'
)
foreach ($relative in $filesToBackup) {
  $full = Join-Path $project $relative
  if (!(Test-Path -LiteralPath $full)) { throw "Required project file not found: $relative" }
  $backup = Join-Path $backupRoot $relative
  New-Item -ItemType Directory -Force -Path (Split-Path $backup) | Out-Null
  Copy-Item -LiteralPath $full -Destination $backup -Force
}

$componentDest = Join-Path $project 'components\signature-generator-workspace.tsx'
$guideDest = Join-Path $project 'content\tool-guides\signature-generator.json'
New-Item -ItemType Directory -Force -Path (Split-Path $componentDest) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $guideDest) | Out-Null
Set-Content -LiteralPath $componentDest -Value $componentContent -Encoding utf8
Set-Content -LiteralPath $guideDest -Value $guideContent -Encoding utf8

function Update-File([string]$RelativePath, [string]$Old, [string]$New, [string]$Marker) {
  $path = Join-Path $project $RelativePath
  $content = Get-Content -LiteralPath $path -Raw
  if ($content.Contains($Marker)) { return }
  if (!$content.Contains($Old)) { throw "Could not find expected insertion point in $RelativePath. No further changes were made." }
  $content = $content.Replace($Old, $New)
  Set-Content -LiteralPath $path -Value $content -Encoding utf8
}

$oldToolMarker = '    "slug": "chart-maker",'
$newToolBlock = @'
    slug: "signature-generator",
    name: "Signature Generator",
    description: "Create a handwritten-style digital signature by drawing with a mouse, stylus, or finger, or typing your name. Export a high-resolution transparent PNG or JPEG directly in your browser.",
    category: "image",
    icon: "PenLine",
    acceptedTypes: [],
    method: "Local HTML Canvas API (no API key or server upload)",
    status: "browser"
  },
  {
    "slug": "chart-maker",
'@
Update-File 'lib\tools.ts' $oldToolMarker $newToolBlock 'slug: "signature-generator"'

Update-File 'lib\image-tool-directory.ts' 'item("Signature Generator", undefined, "Create a clean digital signature for documents.")' 'item("Signature Generator", "signature-generator", "Draw or type a digital signature and export a transparent PNG.")' 'item("Signature Generator", "signature-generator"'

$oldSeo = '  "chart-maker": {'
$newSeo = @'
  "signature-generator": {
    title: "Free Online Signature Generator & Signature Maker | Brobex",
    description: "Create a free digital signature online. Draw with a mouse, stylus, or finger, or type your name. Download a high-resolution transparent PNG or JPEG. No paid API or sign-up required.",
    keywords: ["free online signature generator", "signature maker", "draw signature online", "digital signature image", "transparent signature PNG"],
    ogTitle: "Free Online Signature Generator – Draw or Type Your Signature | BROBEX",
  },
  "chart-maker": {
'@
Update-File 'lib\tool-seo.ts' $oldSeo $newSeo '"signature-generator": {'

$oldPageImport = 'import { CollageMakerWorkspace } from "@/components/collage-maker-workspace";'
$newPageImport = @'
import { CollageMakerWorkspace } from "@/components/collage-maker-workspace";
import { SignatureGeneratorWorkspace } from "@/components/signature-generator-workspace";
'@
Update-File 'app\tools\[slug]\page.tsx' $oldPageImport $newPageImport 'SignatureGeneratorWorkspace'

$oldPageBranch = '    ) : tool.slug === "tiff-to-text" ? ('
$newPageBranch = @'
    ) : tool.slug === "signature-generator" ? (
      <SignatureGeneratorWorkspace />
    ) : tool.slug === "tiff-to-text" ? (
'@
Update-File 'app\tools\[slug]\page.tsx' $oldPageBranch $newPageBranch 'tool.slug === "signature-generator"'

$oldGuideImport = 'import guide0 from "@/content/tool-guides/remove-background-from-image.json";'
$newGuideImport = @'
import signatureGeneratorGuide from "@/content/tool-guides/signature-generator.json";
import guide0 from "@/content/tool-guides/remove-background-from-image.json";
'@
Update-File 'content\tool-guides\index.ts' $oldGuideImport $newGuideImport 'signatureGeneratorGuide'

$oldGuideMap = 'export const toolGuides: Record<string, ToolGuideData> = {'
$newGuideMap = @'
export const toolGuides: Record<string, ToolGuideData> = {
  "signature-generator": signatureGeneratorGuide,
'@
Update-File 'content\tool-guides\index.ts' $oldGuideMap $newGuideMap '"signature-generator": signatureGeneratorGuide'

$cssPath = Join-Path $project 'app\globals.css'
$css = Get-Content -LiteralPath $cssPath -Raw
if (!$css.Contains('BROBEX Signature Studio')) {
  $cssAdd = @'

/* BROBEX Signature Studio — monochrome, responsive, browser-only */
.brobex-signature { width:100%; color:var(--foreground,#111); }
.brobex-signature-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin:0 0 20px; }
.brobex-signature-kicker { display:block; font-size:10px; font-weight:800; letter-spacing:.16em; opacity:.62; margin-bottom:8px; }
.brobex-signature-head h2 { margin:0 0 7px; font-size:clamp(24px,3vw,34px); letter-spacing:-.04em; }
.brobex-signature-head p { margin:0; opacity:.68; font-size:14px; }
.brobex-signature-private { display:inline-flex; align-items:center; gap:7px; border:1px solid currentColor; border-radius:999px; padding:8px 11px; font-size:11px; white-space:nowrap; opacity:.8; }
.brobex-signature-layout { display:grid; grid-template-columns:minmax(0,1fr) 270px; gap:17px; align-items:start; }
.brobex-signature-editor,.brobex-signature-settings { min-width:0; padding:16px; border:1px solid var(--border,#ddd); border-radius:16px; background:var(--card,#fff); }
.brobex-signature-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.brobex-signature-toolbar button,.brobex-signature-actions button,.brobex-signature-download,.brobex-signature-reset { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:39px; padding:8px 11px; border:1px solid var(--border,#ccc); border-radius:9px; background:transparent; color:inherit; font-size:12px; font-weight:750; cursor:pointer; }
.brobex-signature-toolbar button.is-active { background:#111; color:#fff; border-color:#111; }
.brobex-signature-canvas-label { margin-left:auto; font-size:10px; opacity:.58; }
.brobex-signature-typed-controls { display:grid; grid-template-columns:minmax(0,1fr) 190px; gap:10px; margin-bottom:12px; }
.brobex-signature-typed-controls label,.brobex-signature-settings label { display:grid; gap:7px; margin:0 0 13px; font-size:11px; font-weight:750; }
.brobex-signature-typed-controls input,.brobex-signature-typed-controls select,.brobex-signature-settings select { width:100%; min-height:39px; padding:8px 10px; border:1px solid var(--border,#ccc); border-radius:9px; background:var(--input,#fff); color:inherit; font:inherit; }
.brobex-signature-paper { position:relative; display:grid; place-items:center; width:100%; overflow:hidden; border:1px solid var(--border,#ccc); border-radius:12px; background:#fff; }
.brobex-signature-paper.is-transparent { background-color:#fff; background-image:linear-gradient(45deg,#ededed 25%,transparent 25%),linear-gradient(-45deg,#ededed 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ededed 75%),linear-gradient(-45deg,transparent 75%,#ededed 75%); background-size:24px 24px; background-position:0 0,0 12px,12px -12px,-12px 0; }
.brobex-signature-paper canvas { display:block; width:100%; height:auto; aspect-ratio:1600/560; touch-action:none; }
.brobex-signature-placeholder { position:absolute; pointer-events:none; color:#777; font-size:clamp(12px,2vw,17px); text-align:center; padding:12px; }
.brobex-signature-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; }
.brobex-signature-actions button:disabled { opacity:.35; cursor:not-allowed; }
.brobex-signature-actions span { margin-left:auto; font-size:10px; opacity:.58; }
.brobex-signature-settings h3 { margin:0 0 16px; font-size:14px; }
.brobex-signature-settings label output { justify-self:end; margin-top:-24px; opacity:.65; }
.brobex-signature-settings input[type=range] { width:100%; accent-color:currentColor; }
.brobex-signature-settings input[type=color] { width:100%; height:38px; padding:3px; border:1px solid var(--border,#ccc); border-radius:9px; background:transparent; }
.brobex-signature-check { display:flex!important; grid-template-columns:auto 1fr; align-items:center; gap:8px!important; }
.brobex-signature-check input { width:15px; height:15px; accent-color:currentColor; }
.brobex-signature-note { display:grid; gap:5px; margin:15px 0; padding:11px; border:1px solid var(--border,#ddd); border-radius:10px; font-size:11px; }
.brobex-signature-note span { opacity:.65; line-height:1.5; }
.brobex-signature-download { width:100%; min-height:44px; background:#111; color:#fff; border-color:#111; }
.brobex-signature-download:disabled { opacity:.4; cursor:not-allowed; }
.brobex-signature-reset { width:100%; margin-top:8px; }
.brobex-signature-message { margin:10px 0 0; padding:9px 10px; border:1px solid currentColor; border-radius:8px; font-size:11px; }
.brobex-signature-footnote { margin:13px 0 0; font-size:10px; line-height:1.55; opacity:.62; }
:root[data-theme="dark"] .brobex-signature { color:#fff; }
:root[data-theme="dark"] .brobex-signature-editor,:root[data-theme="dark"] .brobex-signature-settings { background:#101010; border-color:#393939; }
:root[data-theme="dark"] .brobex-signature-toolbar button.is-active,:root[data-theme="dark"] .brobex-signature-download { background:#fff; color:#000; border-color:#fff; }
:root[data-theme="dark"] .brobex-signature-typed-controls input,:root[data-theme="dark"] .brobex-signature-typed-controls select,:root[data-theme="dark"] .brobex-signature-settings select { background:#111; border-color:#444; color:#fff; }
:root[data-theme="light"] .brobex-signature { color:#000; }
:root[data-theme="light"] .brobex-signature-toolbar button.is-active,:root[data-theme="light"] .brobex-signature-download { background:#000; color:#fff; border-color:#000; }
.brobex-signature-toolbar button:hover,.brobex-signature-actions button:hover,.brobex-signature-download:hover,.brobex-signature-reset:hover { box-shadow:0 0 0 2px currentColor; }
@media(max-width:850px) { .brobex-signature-layout { grid-template-columns:1fr; } .brobex-signature-settings { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 12px; } .brobex-signature-settings h3,.brobex-signature-note,.brobex-signature-download,.brobex-signature-reset,.brobex-signature-message,.brobex-signature-footnote { grid-column:1/-1; } }
@media(max-width:560px) { .brobex-signature-head { flex-direction:column; } .brobex-signature-private { white-space:normal; } .brobex-signature-editor,.brobex-signature-settings { padding:11px; } .brobex-signature-typed-controls,.brobex-signature-settings { grid-template-columns:1fr; } .brobex-signature-actions span { width:100%; margin-left:0; } .brobex-signature-canvas-label { width:100%; margin:3px 0 0; } }
'@
  Add-Content -LiteralPath $cssPath -Value $cssAdd -Encoding utf8
}

Write-Host "Signature Generator installed. Backup: $backupRoot" -ForegroundColor Green
Write-Host 'Next run: npm run typecheck; npm run build; npm run dev' -ForegroundColor Cyan
