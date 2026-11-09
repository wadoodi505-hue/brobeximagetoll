"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Entry = { id: string; file: File; url: string; image: HTMLImageElement; width: number; height: number; result?: string; error?: string };
const MAX_SIDE = 12000, MAX_PIXELS = 40000000;
const sizeText = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;

export function DimensionResizerWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Entry[]>([]);
  const itemsRef = useRef<Entry[]>([]);
  itemsRef.current = items;
  const [activeId, setActiveId] = useState("");
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<"pixels" | "percent">("pixels");
  const [percent, setPercent] = useState(100);
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = items.find(x => x.id === activeId) || items[0];
  const valid = useMemo(() => items.length > 0 && items.every(x => x.width > 0 && x.height > 0 && x.width <= MAX_SIDE && x.height <= MAX_SIDE && x.width * x.height <= MAX_PIXELS), [items]);

  useEffect(() => () => { itemsRef.current.forEach(x => { URL.revokeObjectURL(x.url); if (x.result) URL.revokeObjectURL(x.result); }); }, []);
  const addFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 30 * 1024 * 1024);
    if (!incoming.length) { setError("Choose image files up to 30 MB each."); return; }
    setError("");
    incoming.forEach(file => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        if (img.naturalWidth * img.naturalHeight > MAX_PIXELS) { URL.revokeObjectURL(url); setError(`${file.name} exceeds the 40-megapixel limit.`); return; }
        const entry: Entry = { id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url, image: img, width: img.naturalWidth, height: img.naturalHeight };
        setItems(old => [...old, entry]); setActiveId(old => old || entry.id);
      };
      img.onerror = () => { URL.revokeObjectURL(url); setError(`Could not open ${file.name}.`); };
      img.src = url;
    });
  };
  const changeDimension = (axis: "width" | "height", raw: number) => {
    if (!active || !Number.isFinite(raw)) return;
    const value = Math.round(raw);
    setItems(old => old.map(item => {
      if (item.id !== active.id) return item;
      if (mode === "percent") { const p = Math.min(800, Math.max(1, raw)); setPercent(p); return { ...item, width: Math.max(1, Math.round(item.image.naturalWidth * p / 100)), height: Math.max(1, Math.round(item.image.naturalHeight * p / 100)), result: item.result ? (URL.revokeObjectURL(item.result), undefined) : undefined }; }
      const next = Math.min(MAX_SIDE, Math.max(1, value));
      const width = axis === "width" ? next : locked ? Math.max(1, Math.round(next * item.image.naturalWidth / item.image.naturalHeight)) : item.width;
      const height = axis === "height" ? next : locked ? Math.max(1, Math.round(next * item.image.naturalHeight / item.image.naturalWidth)) : item.height;
      if (item.result) URL.revokeObjectURL(item.result);
      return { ...item, width, height, result: undefined };
    }));
  };
  const process = async () => {
    if (!items.length || !valid) { setError("Enter valid dimensions. Each side must be 1–12,000 px and output below 40 megapixels."); return; }
    setBusy(true); setError("");
    for (const item of items) {
      try {
        const canvas = document.createElement("canvas"); canvas.width = item.width; canvas.height = item.height;
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
        if (format === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, item.width, item.height); }
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(item.image, 0, 0, item.width, item.height);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality / 100));
        canvas.width = 0; canvas.height = 0; if (!blob) throw new Error("Export failed");
        const result = URL.createObjectURL(blob);
        setItems(old => old.map(x => { if (x.id !== item.id) return x; if (x.result) URL.revokeObjectURL(x.result); return { ...x, result, error: undefined }; }));
      } catch (e) { setItems(old => old.map(x => x.id === item.id ? { ...x, error: e instanceof Error ? e.message : "Resize failed" } : x)); }
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
    setBusy(false);
  };
  const download = (item: Entry) => { if (!item.result) return; const a = document.createElement("a"); a.href = item.result; a.download = `${item.file.name.replace(/\.[^.]+$/, "")}-${item.width}x${item.height}.${format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png"}`; a.click(); };
  const downloadAll = () => items.filter(x => x.result).forEach(download);
  const remove = (id: string) => { const item = items.find(x => x.id === id); if (item) { URL.revokeObjectURL(item.url); if (item.result) URL.revokeObjectURL(item.result); } setItems(old => old.filter(x => x.id !== id)); if (activeId === id) setActiveId(items.find(x => x.id !== id)?.id || ""); };

  return <section style={{display:"grid",gap:16,color:"var(--foreground,#171717)"}}><style jsx>{`.dr-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);gap:16px}.dr-panel{border:1px solid var(--border,#e5e5e5);border-radius:14px;padding:16px;background:var(--card,#fff)}.dr-input{width:100%;padding:10px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--background,#fff);color:inherit}.dr-button{padding:10px 13px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--background,#fff);color:inherit;font-weight:650;cursor:pointer}.dr-primary{background:#171717;color:white;border-color:#171717}.dr-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.dr-queue{display:grid;gap:8px}.dr-item{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px;border:1px solid var(--border,#e5e5e5);border-radius:9px;text-align:left;background:var(--background,#fff);color:inherit}.dr-item img{width:48px;height:48px;object-fit:cover;border-radius:6px}@media(max-width:720px){.dr-grid{grid-template-columns:1fr}}`}</style>
    <header><div style={{fontSize:11,fontWeight:750,letterSpacing:1.2,opacity:.6}}>BROBEX IMAGE WORKSPACE</div><h2 style={{fontSize:26,margin:"5px 0"}}>Resize Image Dimensions</h2><p style={{margin:0,fontSize:14,opacity:.7}}>Resize one or multiple images by exact pixels or percentage, with high-quality browser rendering.</p></header>
    <div className="dr-panel"><div className="dr-row"><strong>Image queue ({items.length})</strong><button className="dr-button" onClick={()=>inputRef.current?.click()}>＋ Add images</button></div><input ref={inputRef} hidden type="file" accept="image/*" multiple onChange={e=>e.target.files&&addFiles(e.target.files)}/><div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}} style={{marginTop:12,padding:16,border:"1px dashed var(--border,#aaa)",borderRadius:10,textAlign:"center",fontSize:13,opacity:.75}}>Drop multiple images here or use Add images · 30 MB per file</div>{items.length>0&&<div className="dr-queue" style={{marginTop:12}}>{items.map(x=><button key={x.id} className="dr-item" onClick={()=>setActiveId(x.id)} style={{borderColor:x.id===active?.id?"var(--foreground,#222)":"var(--border,#ddd)"}}><img src={x.url} alt=""/><span style={{minWidth:0}}><strong style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{x.file.name}</strong><small style={{opacity:.65}}>{x.image.naturalWidth} × {x.image.naturalHeight} px · {sizeText(x.file.size)}</small></span><span style={{fontSize:11,opacity:.65}}>{x.result?"Done":x.error||"Queued"}</span></button>)}</div>}</div>
    <div className="dr-grid"><div className="dr-panel" style={{display:"grid",gap:13}}><strong>Resize settings {active?`· ${active.file.name}`:""}</strong><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="dr-button" onClick={()=>setMode("pixels")} aria-pressed={mode==="pixels"}>Pixels</button><button className="dr-button" onClick={()=>setMode("percent")} aria-pressed={mode==="percent"}>Percentage</button></div>{active&&mode==="pixels"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><label style={{fontSize:13,fontWeight:650}}>Width (px)<input className="dr-input" type="number" min="1" max={MAX_SIDE} value={active.width} onChange={e=>changeDimension("width",Number(e.target.value))}/></label><label style={{fontSize:13,fontWeight:650}}>Height (px)<input className="dr-input" type="number" min="1" max={MAX_SIDE} value={active.height} onChange={e=>changeDimension("height",Number(e.target.value))}/></label></div>:active?<label style={{fontSize:13,fontWeight:650}}>Scale: {percent}%<input className="dr-input" type="number" min="1" max="800" value={percent} onChange={e=>changeDimension("width",Number(e.target.value))}/><input type="range" min="1" max="400" value={Math.min(percent,400)} onChange={e=>changeDimension("width",Number(e.target.value))} style={{width:"100%"}}/></label>:<p style={{fontSize:13,opacity:.6}}>Upload an image to configure dimensions.</p>}<label style={{display:"flex",gap:9,alignItems:"center",fontSize:13}}><input type="checkbox" checked={locked} onChange={e=>setLocked(e.target.checked)}/> Maintain aspect ratio</label><div style={{fontSize:12,opacity:.65}}>Settings apply to the selected image. Select another queue item to set individual dimensions.</div><label style={{fontSize:13,fontWeight:650}}>Output format<select className="dr-input" value={format} onChange={e=>{setFormat(e.target.value);setItems(old=>old.map(x=>{if(x.result)URL.revokeObjectURL(x.result);return {...x,result:undefined}}));}}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>{format!=="image/png"&&<label style={{fontSize:13}}>Quality: {quality}%<input type="range" min="30" max="100" value={quality} onChange={e=>{setQuality(Number(e.target.value));setItems(old=>old.map(x=>{if(x.result)URL.revokeObjectURL(x.result);return {...x,result:undefined}}));}} style={{width:"100%"}}/></label>}<div className="dr-row"><button className="dr-button dr-primary" disabled={!items.length||busy||!valid} onClick={process}>{busy?"Processing…":"Resize all images"}</button><button className="dr-button" disabled={!items.some(x=>x.result)} onClick={downloadAll}>Download completed</button></div>{error&&<p role="alert" style={{color:"#dc2626",fontSize:13}}>{error}</p>}{!valid&&items.length>0&&<p role="alert" style={{color:"#dc2626",fontSize:12}}>One or more output dimensions exceed the safe browser limit.</p>}</div>
    <div className="dr-panel"><strong>Preview</strong><div style={{marginTop:12,minHeight:220,display:"grid",placeItems:"center",background:"var(--muted,#f5f5f5)",borderRadius:10,overflow:"hidden"}}>{active&&<img src={active.result||active.url} alt="Selected image preview" style={{maxWidth:"100%",maxHeight:300,objectFit:"contain"}}/>}</div>{active&&<div style={{fontSize:13,marginTop:12,display:"grid",gap:6}}><div className="dr-row"><span>Output dimensions</span><strong>{active.width} × {active.height} px</strong></div><div className="dr-row"><span>Original file size</span><strong>{sizeText(active.file.size)}</strong></div>{active.result&&<button className="dr-button dr-primary" onClick={()=>download(active)}>Download selected image</button>}<button className="dr-button" onClick={()=>remove(active.id)}>Remove from queue</button></div>}</div></div>
  </section>;
}
