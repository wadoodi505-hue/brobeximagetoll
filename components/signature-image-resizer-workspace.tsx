"use client";

import { useEffect, useRef, useState } from "react";

type FitMode = "contain" | "stretch";
type Format = "image/png" | "image/jpeg";
const MAX_SIDE = 12000;
const MAX_PIXELS = 40000000;
const pxFromCm = (cm: number, dpi: number) => Math.round((cm / 2.54) * dpi);
const bytesLabel = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;

export function SignatureImageResizerWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrl = useRef<string | null>(null);
  const outputUrl = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [cmW, setCmW] = useState("6");
  const [cmH, setCmH] = useState("2");
  const [dpi, setDpi] = useState(300);
  const [width, setWidth] = useState(709);
  const [height, setHeight] = useState(236);
  const [fit, setFit] = useState<FitMode>("contain");
  const [background, setBackground] = useState("transparent");
  const [format, setFormat] = useState<Format>("image/png");
  const [quality, setQuality] = useState(92);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outputBytes, setOutputBytes] = useState(0);

  useEffect(() => () => {
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
  }, []);

  const clearOutput = () => {
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = null; setResult(""); setOutputBytes(0);
  };
  const applyCm = (w: string, h: string, d: number) => {
    setCmW(w); setCmH(h); setDpi(d);
    const pw = pxFromCm(Number(w), d), ph = pxFromCm(Number(h), d);
    setWidth(pw); setHeight(ph); clearOutput();
  };
  const choose = (f?: File) => {
    if (!f) return;
    setError(""); clearOutput();
    if (!f.type.startsWith("image/")) { setError("Choose a valid image file."); return; }
    if (f.size > 20 * 1024 * 1024) { setError("Maximum upload size is 20 MB."); return; }
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      if (img.naturalWidth * img.naturalHeight > MAX_PIXELS) { URL.revokeObjectURL(url); setError("Image exceeds the 40-megapixel safety limit."); return; }
      if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
      sourceUrl.current = url; imageRef.current = img; setFile(f); setPreview(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("This image could not be opened."); };
    img.src = url;
  };
  const resize = async () => {
    const img = imageRef.current;
    if (!img) { setError("Upload a signature image first."); return; }
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) { setError("Use dimensions from 1–12,000 px and keep the output below 40 megapixels."); return; }
    setBusy(true); setError(""); clearOutput();
    try {
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable in this browser.");
      if (format === "image/jpeg" || background !== "transparent") { ctx.fillStyle = background === "transparent" ? "#fff" : background; ctx.fillRect(0, 0, width, height); }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      if (fit === "stretch") ctx.drawImage(img, 0, 0, width, height);
      else { const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight); const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale; ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh); }
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, format === "image/jpeg" ? quality / 100 : undefined));
      canvas.width = 0; canvas.height = 0; if (!blob) throw new Error("Could not export this image.");
      const url = URL.createObjectURL(blob); outputUrl.current = url; setResult(url); setOutputBytes(blob.size);
    } catch (e) { setError(e instanceof Error ? e.message : "Resize failed."); }
    finally { setBusy(false); }
  };
  const download = () => { if (!result) return; const a = document.createElement("a"); a.href = result; a.download = `brobex-signature-${width}x${height}.${format === "image/jpeg" ? "jpg" : "png"}`; a.click(); };

  return <section className="brobex-resize-tool" style={{ display: "grid", gap: 18, color: "var(--foreground, #171717)" }}>
    <style jsx>{`.brobex-resize-tool *{box-sizing:border-box}.br-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:16px}.br-panel{border:1px solid var(--border,#e5e5e5);border-radius:14px;padding:18px;background:var(--card,#fff)}.br-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.br-label{display:grid;gap:6px;font-size:13px;font-weight:650}.br-input{width:100%;min-width:0;padding:10px 11px;border:1px solid var(--border,#d4d4d4);border-radius:9px;background:var(--background,#fff);color:inherit}.br-btn{border:1px solid var(--border,#d4d4d4);border-radius:9px;padding:10px 13px;background:var(--background,#fff);color:inherit;font-weight:650;cursor:pointer}.br-primary{background:#171717;color:white;border-color:#171717}.br-preview{min-height:230px;display:grid;place-items:center;overflow:hidden;border:1px solid var(--border,#ddd);border-radius:11px;background-color:#f3f3f3;background-image:linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}.br-preview img{max-width:100%;max-height:340px;object-fit:contain}@media(max-width:720px){.br-grid{grid-template-columns:1fr}.br-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:390px){.br-fields{grid-template-columns:1fr}}`}</style>
    <header><div style={{fontSize:11,fontWeight:750,letterSpacing:1.2,opacity:.6}}>BROBEX IMAGE WORKSPACE</div><h2 style={{fontSize:26,margin:"5px 0"}}>Signature & Centimeter Image Resizer</h2><p style={{margin:0,fontSize:14,opacity:.72}}>Set exact print dimensions in centimeters and export at your chosen DPI. Processing stays on your device.</p></header>
    <div className="br-grid"><div style={{display:"grid",gap:15}}>
      <div className="br-panel"><h3 style={{margin:"0 0 12px",fontSize:16}}>1. Upload image</h3><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" onChange={e=>choose(e.target.files?.[0])}/><button className="br-btn" style={{width:"100%",minHeight:105,borderStyle:"dashed"}} onClick={()=>inputRef.current?.click()}>{file ? `✓ ${file.name}` : "＋ Choose signature or image"}<div style={{fontSize:12,fontWeight:400,opacity:.65,marginTop:6}}>PNG, JPG, WebP · Up to 20 MB</div></button>{file&&<p style={{fontSize:12,opacity:.7,marginBottom:0}}>Original: {imageRef.current?.naturalWidth} × {imageRef.current?.naturalHeight} px · {bytesLabel(file.size)}</p>}</div>
      <div className="br-panel"><h3 style={{margin:"0 0 12px",fontSize:16}}>2. Physical size & resolution</h3><div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}><button className="br-btn" onClick={()=>applyCm("6","2",300)}>Signature · 6 × 2 cm · 300 DPI</button><button className="br-btn" onClick={()=>applyCm("3.5","4.5",300)}>Photo · 3.5 × 4.5 cm</button><button className="br-btn" onClick={()=>applyCm("10","15",300)}>Photo · 10 × 15 cm</button></div><div className="br-fields"><label className="br-label">Width (cm)<input className="br-input" type="number" min="0.01" step="0.01" value={cmW} onChange={e=>{setCmW(e.target.value);setWidth(pxFromCm(Number(e.target.value),dpi));clearOutput()}}/></label><label className="br-label">Height (cm)<input className="br-input" type="number" min="0.01" step="0.01" value={cmH} onChange={e=>{setCmH(e.target.value);setHeight(pxFromCm(Number(e.target.value),dpi));clearOutput()}}/></label><label className="br-label">Print resolution (DPI)<select className="br-input" value={dpi} onChange={e=>applyCm(cmW,cmH,Number(e.target.value))}>{[72,96,150,300].map(v=><option key={v} value={v}>{v} DPI</option>)}</select></label><label className="br-label">Output format<select className="br-input" value={format} onChange={e=>{setFormat(e.target.value as Format);clearOutput()}}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label></div><div style={{marginTop:12,padding:12,borderRadius:9,background:"var(--muted,#f5f5f5)",fontSize:13}}><strong>Calculated output: {width} × {height} px</strong><div style={{opacity:.7,marginTop:3}}>Pixels = (centimeters ÷ 2.54) × DPI · 6 × 2 cm at 300 DPI = 709 × 236 px</div></div></div>
      <div className="br-panel"><h3 style={{margin:"0 0 12px",fontSize:16}}>3. Fit & export settings</h3><div className="br-fields"><label className="br-label">Image fitting<select className="br-input" value={fit} onChange={e=>setFit(e.target.value as FitMode)}><option value="contain">Fit inside (preserve ratio)</option><option value="stretch">Stretch to fill</option></select></label><label className="br-label">Canvas background<select className="br-input" value={background} onChange={e=>setBackground(e.target.value)}><option value="transparent">Transparent</option><option value="#ffffff">White</option><option value="#000000">Black</option></select></label></div>{format==="image/jpeg"&&<label className="br-label" style={{marginTop:12}}>JPEG quality: {quality}%<input type="range" min="30" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label>}<div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:15}}><button className="br-btn br-primary" disabled={!file||busy} onClick={resize}>{busy?"Resizing…":"Resize image"}</button><button className="br-btn" disabled={!result} onClick={download}>Download image</button></div>{error&&<p role="alert" style={{color:"#dc2626",fontSize:13}}>{error}</p>}</div>
    </div><div className="br-panel" style={{display:"grid",alignContent:"start",gap:12}}><h3 style={{margin:0,fontSize:16}}>Live preview & result</h3><div className="br-preview">{result?<img src={result} alt="Resized signature preview"/>:preview?<img src={preview} alt="Original signature preview"/>:<span style={{fontSize:13,opacity:.55}}>Your image preview appears here</span>}</div><div style={{fontSize:13,display:"grid",gap:6}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{opacity:.65}}>Output dimensions</span><strong>{width} × {height} px</strong></div><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{opacity:.65}}>Estimated / actual size</span><strong>{result?bytesLabel(outputBytes):"Calculated after export"}</strong></div><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span style={{opacity:.65}}>Resolution</span><strong>{dpi} DPI</strong></div></div>{result&&<p style={{margin:0,fontSize:12,color:"#15803d"}}>Image resized successfully and ready to download.</p>}</div></div>
  </section>;
}
