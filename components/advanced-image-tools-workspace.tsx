"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Copy, Download, FileArchive, FileText, UploadCloud, Wand2 } from "lucide-react";
import {
  a4Dimensions, canvasBlob, colorValues, downloadBlob, imageCanvas, makeRoundedCanvas,
  type ExportFormat,
} from "@/lib/image-tools/core";
import { readJpegExif, writeJpegExif, stripImageMetadata } from "@/lib/image-tools/metadata";
import { readVisioFile, type VisioPackage } from "@/lib/image-tools/visio";

type ToolProps = { slug: string; title: string };
const visioSlugs = ["vsd-to-docx","vsd-to-pptx","vsd-to-jpg","vsd-to-pdf","vsdx-to-docx","vsdx-to-pptx","vsdx-to-jpg","vsdx-to-pdf"];
const labels: Record<string,string> = {
  "crop-round-corners":"Crop Round Corners","image-color-picker":"Image Color Picker",
  "edit-metadata":"Edit Metadata","remove-metadata":"Remove Metadata",
  "blemishes-remover":"Blemishes Remover","a4-size":"A4 Size",
  "profile-photo-maker":"Circular Profile Photo Maker","aspect-ratio-crop":"Aspect Ratio Crop",
  "add-border-to-image":"Add Image Border",
  "view-metadata":"View Image Properties & Metadata",
};
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_PIXELS = 50_000_000;

async function validateRaster(file: File) {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error("Choose a non-empty image up to 30 MB.");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const png = bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47;
  const jpg = bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
  const gif = bytes[0]===0x47 && bytes[1]===0x49 && bytes[2]===0x46;
  const webp = bytes[0]===0x52 && bytes[1]===0x49 && bytes[2]===0x46 && bytes[8]===0x57 && bytes[9]===0x45 && bytes[10]===0x42 && bytes[11]===0x50;
  const avif = bytes[4]===0x66 && bytes[5]===0x74 && bytes[6]===0x79 && bytes[7]===0x70 && String.fromCharCode(...bytes.slice(8,12)).includes("avif");
  if (!(png || jpg || gif || webp || avif)) throw new Error("The file signature is not a supported raster image (JPEG, PNG, WebP, GIF or AVIF).");
}

function safeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").slice(0, 100) || "brobex-image";
}

export function AdvancedImageToolsWorkspace({ slug, title }: ToolProps) {
  const input = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewUrl = useRef("");
  const [file,setFile] = useState<File|null>(null);
  const [url,setUrl] = useState("");
  const [originalUrl,setOriginalUrl] = useState("");
  const [previewMode,setPreviewMode] = useState<"edited"|"original">("edited");
  const [canvasRevision,setCanvasRevision] = useState(0);
  const [borderWidth,setBorderWidth] = useState(24);
  const [borderColor,setBorderColor] = useState("#ffffff");
  const [titleField,setTitleField] = useState("");
  const [dateTime,setDateTime] = useState("");
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [format,setFormat] = useState<ExportFormat>("image/png");
  const [radius,setRadius] = useState(90);
  const [bg,setBg] = useState("#ffffff");
  const [ratio,setRatio] = useState("1:1");
  const [dpi,setDpi] = useState(300);
  const [zoom,setZoom] = useState(1);
  const [frameX,setFrameX] = useState(50);
  const [frameY,setFrameY] = useState(50);
  const [author,setAuthor] = useState("");
  const [description,setDescription] = useState("");
  const [copyright,setCopyright] = useState("");
  const [keywords,setKeywords] = useState("");
  const [comment,setComment] = useState("");
  const [software,setSoftware] = useState("BROBEX Image Tools");
  const [quality,setQuality] = useState(92);
  const [sample,setSample] = useState<Record<string,string>|null>(null);
  const [palette,setPalette] = useState<string[]>([]);
  const [brushSize,setBrushSize] = useState(24);
  const [brushCursor,setBrushCursor] = useState<{x:number;y:number}|null>(null);
  const [metadata,setMetadata] = useState<Record<string,string>|null>(null);
  const [pkg,setPkg] = useState<VisioPackage|null>(null);
  const [busy,setBusy] = useState(false);
  const isVisio = visioSlugs.includes(slug);
  const isProfile = slug === "profile-photo-maker";

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  useEffect(() => () => { if (originalUrl) URL.revokeObjectURL(originalUrl); }, [originalUrl]);

  function setPreview(blob: Blob) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const next = URL.createObjectURL(blob);
    previewUrl.current = next;
    setUrl(next);
  }

  // Preview work is scheduled through RAF and capped at 1000px. Full-resolution
  // source pixels remain untouched and are only used by exportImage().
  useEffect(() => {
    if (!file || !canvasRef.current || !["crop-round-corners", "aspect-ratio-crop", "add-border-to-image"].includes(slug)) return;
    let frame = 0;
    let cancelled = false;
    const render = () => {
      const source = canvasRef.current;
      if (!source || cancelled) return;
      const scale = Math.min(1, 1000 / Math.max(source.width, source.height));
      let out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(source.width * scale));
      out.height = Math.max(1, Math.round(source.height * scale));
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, out.width, out.height);
      if (slug === "crop-round-corners") {
        out = makeRoundedCanvas(out, [radius * scale, radius * scale, radius * scale, radius * scale]);
      }
      if (slug === "aspect-ratio-crop") {
        const [rw, rh] = ratio.split(":").map(Number);
        const w = out.width, h = out.height;
        let cw = w, ch = Math.round(w * rh / rw);
        if (ch > h) { ch = h; cw = Math.round(h * rw / rh); }
        const sx = Math.round((w - cw) * frameX / 100);
        const sy = Math.round((h - ch) * frameY / 100);
        const cropped = document.createElement("canvas"); cropped.width = cw; cropped.height = ch;
        const cctx = cropped.getContext("2d"); if (!cctx) return;
        cctx.drawImage(out, sx, sy, cw, ch, 0, 0, cw, ch); out = cropped;
      }
      if (slug === "add-border-to-image") {
        const width = Math.max(0, Math.round(borderWidth * scale));
        const bordered = document.createElement("canvas");
        bordered.width = out.width + width * 2; bordered.height = out.height + width * 2;
        const bctx = bordered.getContext("2d"); if (!bctx) return;
        bctx.fillStyle = borderColor; bctx.fillRect(0, 0, bordered.width, bordered.height);
        bctx.drawImage(out, width, width); out = bordered;
      }
      void canvasBlob(out, "image/png").then(blob => {
        if (!cancelled) setPreview(blob);
      }).catch(() => undefined);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [file, canvasRevision, slug, radius, ratio, frameX, frameY, borderWidth, borderColor]);

  async function choose(next?: File) {
    if (!next || busy) return;
    setError(""); setMessage(""); setMetadata(null); setSample(null); setPalette([]); setPkg(null);
    if (previewUrl.current) { URL.revokeObjectURL(previewUrl.current); previewUrl.current = ""; }
    setUrl(""); setOriginalUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return ""; }); setFile(next);
    if (isVisio) {
      setBusy(true);
      try {
        const result = await readVisioFile(next);
        setPkg(result);
        setMessage(`Inspected VSDX package: ${result.pages.length} page(s), ${result.media.length} embedded media file(s). This is an inspection result, not a converted Visio document.`);
      } catch (e) { setError(e instanceof Error ? e.message : "Could not inspect this Visio file."); }
      finally { setBusy(false); }
      return;
    }
    try {
      await validateRaster(next);
      const {canvas} = await imageCanvas(next);
      if (canvas.width * canvas.height > MAX_PIXELS) throw new Error("This image exceeds the 50-megapixel browser processing limit.");
      canvasRef.current = canvas;
      setCanvasRevision((value) => value + 1);
      const originalBlob = await canvasBlob(canvas,"image/png");
      const original = URL.createObjectURL(originalBlob);
      setOriginalUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return original; });
      setPreviewMode("edited");
      setRadius(90); setRatio("1:1"); setFrameX(50); setFrameY(50);
      setPreview(originalBlob);
      if (slug === "view-metadata") {
        const exif = next.type === "image/jpeg" || next.name.toLowerCase().endsWith(".jpg") || next.name.toLowerCase().endsWith(".jpeg")
          ? await readJpegExif(next) : {};
        const bytes = new Uint8Array(await next.arrayBuffer());
        const raw = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 2_000_000)));
        const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
        const divisor = gcd(canvas.width, canvas.height) || 1;
        setMetadata({
          "File name": next.name,
          "MIME type": next.type || "Not provided by browser",
          "File size": `${(next.size/1024).toFixed(2)} KB`,
          "Dimensions": `${canvas.width} × ${canvas.height} px`,
          "Aspect ratio": `${canvas.width / divisor}:${canvas.height / divisor}`,
          "Megapixels": `${((canvas.width * canvas.height) / 1_000_000).toFixed(2)} MP`,
          "Color depth": "Browser-decoded RGB/RGBA; source bit depth not reliably exposed",
          "Color profile": raw.includes("ICC_PROFILE") || raw.includes("iCCP") ? "Embedded ICC profile marker found" : "Not detected",
          "Title": exif.title || "Not present / not readable",
          "Description": exif.description || "Not present / not readable",
          "Author": exif.artist || "Not present / not readable",
          "Copyright": exif.copyright || "Not present / not readable",
          "Date & time": exif.dateTime || "Not present / not readable",
          "Keywords": exif.keywords || "Not present / not readable",
          "Software": exif.software || "Not present / not readable",
          "GPS coordinates": "Not extracted by this browser workspace",
        });
      }
      if (slug === "edit-metadata" && (next.type === "image/jpeg" || /\.jpe?g$/i.test(next.name))) {
        const exif = await readJpegExif(next);
        setTitleField(exif.title || "");
        setDateTime(exif.dateTime || "");
        setDescription(exif.description || "");
        setAuthor(exif.artist || "");
        setCopyright(exif.copyright || "");
        setKeywords(exif.keywords || "");
        setComment(exif.comment || "");
        setSoftware(exif.software || "BROBEX Image Tools");
      }
      setMessage("Image loaded and signature-checked. Original file remains unchanged.");
    } catch (e) { setFile(null); setError(e instanceof Error ? e.message : "Image could not be opened."); }
  }

  async function exportImage() {
    if (!file || !canvasRef.current) return;
    try {
      let out = canvasRef.current;
      if (slug === "crop-round-corners") out = makeRoundedCanvas(out,[radius,radius,radius,radius]);
      if (isProfile) {
        const side = Math.min(out.width,out.height);
        const c = document.createElement("canvas"); c.width=side; c.height=side;
        const x = c.getContext("2d"); if (!x) throw new Error("Canvas is unavailable.");
        x.beginPath(); x.arc(side/2,side/2,side/2,0,Math.PI*2); x.clip();
        const sw=side/zoom, sh=side/zoom;
        const sx=(out.width-sw)*frameX/100, sy=(out.height-sh)*frameY/100;
        x.drawImage(out,sx,sy,sw,sh,0,0,side,side);
        out=c;
      }
      if (slug === "aspect-ratio-crop") {
        const [rw,rh]=ratio.split(":").map(Number); const w=out.width,h=out.height;
        let cw=w,ch=Math.round(w*rh/rw); if(ch>h){ch=h;cw=Math.round(h*rw/rh);}
        const c=document.createElement("canvas"); c.width=cw;c.height=ch;
        const x=c.getContext("2d"); if(!x)throw new Error("Canvas is unavailable.");
        const sx=Math.round((w-cw)*frameX/100), sy=Math.round((h-ch)*frameY/100);
        x.drawImage(out,sx,sy,cw,ch,0,0,cw,ch);out=c;
      }
      if (slug === "add-border-to-image") {
        const c=document.createElement("canvas"); c.width=out.width+borderWidth*2; c.height=out.height+borderWidth*2;
        const x=c.getContext("2d"); if(!x) throw new Error("Canvas is unavailable.");
        x.fillStyle=borderColor; x.fillRect(0,0,c.width,c.height); x.drawImage(out,borderWidth,borderWidth); out=c;
      }
      if (slug === "a4-size") {
        const dims=a4Dimensions(dpi); const c=document.createElement("canvas");c.width=dims.width;c.height=dims.height;
        const x=c.getContext("2d");if(!x)throw new Error("Canvas is unavailable.");
        x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
        const scale=Math.min(c.width/out.width,c.height/out.height),w=out.width*scale,h=out.height*scale;
        x.drawImage(out,(c.width-w)/2,(c.height-h)/2,w,h);out=c;
      }
      const chosenFormat: ExportFormat = isProfile ? "image/png" : format;
      if (slug==="crop-round-corners" && chosenFormat==="image/jpeg") {
        const flat=document.createElement("canvas");flat.width=out.width;flat.height=out.height;
        const x=flat.getContext("2d");if(!x)throw new Error("Canvas is unavailable.");
        x.fillStyle=bg;x.fillRect(0,0,flat.width,flat.height);x.drawImage(out,0,0);out=flat;
      }
      const blob=await canvasBlob(out,chosenFormat,quality / 100);
      const ext=chosenFormat==="image/jpeg"?"jpg":chosenFormat.split("/")[1];
      downloadBlob(blob,`${safeName(file.name)}-brobex.${ext}`);
      setMessage(`Exported ${out.width} × ${out.height}px (${(blob.size/1024).toFixed(1)} KB). ${isProfile?"Transparent circular PNG export.":""}`);
    } catch(e) { setError(e instanceof Error?e.message:"Export failed."); }
  }

  async function removeMetadata() {
    if (!file) return;
    try {
      const result = await stripImageMetadata(file);
      const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
      downloadBlob(result.blob, `${safeName(file.name)}-metadata-removed.${ext}`);
      setMessage(`Metadata scrub complete. ${result.removed} metadata segment(s)/chunk(s) removed; ${result.remaining} non-image structural segment(s) retained. Image pixels were not re-encoded.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Metadata removal failed.");
    }
  }

  async function editMetadata() {
    if (!file) return;
    try {
      const fields={title:titleField,dateTime,description,artist:author,copyright,keywords,comment,software};
      if (file.type==="image/jpeg" || /\.jpe?g$/i.test(file.name)) {
        const blob=await writeJpegExif(file,fields);
        downloadBlob(blob,`${safeName(file.name)}-metadata-edited.jpg`);
        setMessage("Success: JPEG EXIF title, date/time, description, author and copyright fields were written. Other EXIF/IPTC/XMP fields are not edited.");
      } else {
        const sidecar={sourceFile:file.name,...fields,createdAt:new Date().toISOString(),note:"This format is not supported for embedded metadata writing in this browser tool. The original image is unchanged."};
        downloadBlob(new Blob([JSON.stringify(sidecar,null,2)],{type:"application/json"}),`${safeName(file.name)}.metadata.json`);
        setMessage("This format cannot be edited in-place here; a JSON metadata sidecar was exported instead.");
      }
    } catch(e) { setError(e instanceof Error?e.message:"Metadata editing failed."); }
  }

  function sampleColor(e: MouseEvent<HTMLImageElement>) {
    const c=canvasRef.current;if(!c)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=Math.max(0,Math.min(c.width-1,Math.floor((e.clientX-rect.left)/rect.width*c.width)));
    const y=Math.max(0,Math.min(c.height-1,Math.floor((e.clientY-rect.top)/rect.height*c.height)));
    const pixel=c.getContext("2d",{willReadFrequently:true})!.getImageData(x,y,1,1).data;
    const v=colorValues(pixel[0],pixel[1],pixel[2]);
    setSample({hex:v.hex,rgb:v.rgb,hsl:v.hsl,hsv:v.hsv});
    setPalette(prev=>prev.includes(v.hex)?prev:[...prev,v.hex].slice(-40));
  }

  async function healSpot(e: MouseEvent<HTMLImageElement>) {
    const c=canvasRef.current;if(!c)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)/rect.width*c.width);
    const y=Math.floor((e.clientY-rect.top)/rect.height*c.height);
    const r=Math.max(3,Math.min(150,brushSize*Math.max(c.width/rect.width,c.height/rect.height)/2));
    const ctx=c.getContext("2d",{willReadFrequently:true});if(!ctx)return;
    const sx=x-r*2.4>=0?x-r*2.4:Math.min(c.width-1,x+r*2.4);
    const sy=y;
    const patch=document.createElement("canvas"); patch.width=Math.max(1,Math.ceil(r*2)); patch.height=Math.max(1,Math.ceil(r*2));
    const patchCtx=patch.getContext("2d"); if(!patchCtx)return;
    patchCtx.drawImage(c,Math.max(0,Math.min(c.width-patch.width,Math.floor(sx-r))),Math.max(0,Math.min(c.height-patch.height,Math.floor(sy-r))),patch.width,patch.height,0,0,patch.width,patch.height);
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
    ctx.globalAlpha=0.9;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.drawImage(patch,Math.max(0,x-r),Math.max(0,y-r),r*2,r*2);ctx.restore();
    setPreview(await canvasBlob(c,"image/png"));
    setMessage("Clone-stamp spot applied. This is a basic local brush, not AI content-aware healing.");
  }

  function resetTool() {
    setError(""); setMessage(""); setPreviewMode("edited");
    setRadius(90); setBorderWidth(24); setBorderColor("#ffffff");
    setRatio("1:1"); setFrameX(50); setFrameY(50);
    setZoom(1); setDpi(300); setBg("#ffffff"); setFormat("image/png");
    setBrushSize(24); setTitleField(""); setAuthor(""); setDescription("");
    setCopyright(""); setDateTime(""); setKeywords(""); setComment(""); setSoftware("BROBEX Image Tools"); setQuality(92); setSample(null); setPalette([]);
    if (file) setCanvasRevision(value => value + 1);
  }

  function exportPalette(kind: "css"|"json"|"txt") {
    if (!palette.length) return;
    const content=kind==="json"?JSON.stringify(palette,null,2):kind==="css"?`:root {\n${palette.map((v,i)=>`  --brobex-color-${i+1}: ${v};`).join("\n")}\n}`:palette.join("\n");
    downloadBlob(new Blob([content],{type:kind==="json"?"application/json":"text/plain"}),`brobex-color-palette.${kind}`);
  }

  const titleText=labels[slug]||title;
  const clickHandler=slug==="image-color-picker"?sampleColor:slug==="blemishes-remover"?healSpot:undefined;

  return <section className="advanced-tools-workspace">
    <div className="advanced-tools-head"><span className="advanced-tools-mark"><Wand2 size={19}/></span><div><h2>{titleText}</h2><p>Private, browser-based processing. Your selected files are processed locally.</p></div></div>
    <input ref={input} type="file" hidden accept={isVisio?".vsd,.vsdx,application/vnd.ms-visio.drawing,application/vnd.ms-visio.drawing.main+xml":"image/png,image/jpeg,image/webp,image/gif,image/avif"} onChange={e=>{void choose(e.target.files?.[0]);e.currentTarget.value="";}}/>
    <button className="advanced-upload" type="button" onClick={()=>input.current?.click()}><UploadCloud size={20}/><span>{file?file.name:"Choose a file or click to upload"}</span><small>{isVisio?"VSD / VSDX · inspection only":"JPEG · PNG · WebP · GIF · AVIF · max 30 MB"}</small></button>
    {file&&!isVisio&&url&&<div className="advanced-preview">
      {["crop-round-corners","aspect-ratio-crop","add-border-to-image"].includes(slug)&&<div className="advanced-action-row" role="group" aria-label="Preview image">
        <button type="button" aria-pressed={previewMode==="original"} onClick={()=>setPreviewMode("original")}>Original Image</button>
        <button type="button" aria-pressed={previewMode==="edited"} onClick={()=>setPreviewMode("edited")}>Edited Image</button>
      </div>}
      <div className="advanced-preview-stage" style={{position:"relative",display:"inline-block",maxWidth:"100%"}}
        onMouseMove={e=>{if(slug!=="blemishes-remover")return;const r=e.currentTarget.getBoundingClientRect();setBrushCursor({x:e.clientX-r.left,y:e.clientY-r.top});}}
        onMouseLeave={()=>setBrushCursor(null)}>
        <img src={previewMode==="original"&&originalUrl?originalUrl:url} alt={previewMode==="original"?"Original uploaded image":"Live edited image preview"} onClick={clickHandler} style={{cursor:clickHandler?"crosshair":"default",touchAction:"manipulation",display:"block"}}/>
        {slug==="blemishes-remover"&&brushCursor&&<span aria-hidden="true" style={{position:"absolute",left:brushCursor.x,top:brushCursor.y,width:brushSize,height:brushSize,border:"1.5px solid currentColor",borderRadius:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",boxShadow:"0 0 0 1px rgba(255,255,255,.8)"}}/>}
      </div>
      <span>{file.name} · {(file.size/1024).toFixed(1)} KB · {canvasRef.current?.width} × {canvasRef.current?.height}px</span></div>}
    {file&&!isVisio&&<div className="advanced-controls">
      {slug==="crop-round-corners"&&<><label>Corner radius <input type="range" min="0" max="500" value={radius} onChange={e=>setRadius(+e.target.value)}/><b>{radius}px</b></label><label>JPEG background <input type="color" value={bg} onChange={e=>setBg(e.target.value)}/></label></>}
      {slug==="add-border-to-image"&&<><label>Border width <input type="range" min="0" max="200" value={borderWidth} onChange={e=>setBorderWidth(+e.target.value)}/><b>{borderWidth}px</b></label><label>Border color <input type="color" value={borderColor} onChange={e=>setBorderColor(e.target.value)}/></label></>}
      {slug==="aspect-ratio-crop"&&<><label>Aspect ratio <select value={ratio} onChange={e=>setRatio(e.target.value)}>{["1:1","4:3","3:2","16:9","9:16","3:4","2:3","5:4","4:5"].map(v=><option key={v}>{v}</option>)}</select></label><label>Horizontal crop position <input type="range" min="0" max="100" value={frameX} onChange={e=>setFrameX(+e.target.value)}/><b>{frameX}%</b></label><label>Vertical crop position <input type="range" min="0" max="100" value={frameY} onChange={e=>setFrameY(+e.target.value)}/><b>{frameY}%</b></label></>}
      {isProfile&&<><p>Output is always a true transparent circular PNG. Adjust zoom and framing before export.</p><label>Zoom <input type="range" min="1" max="3" step=".05" value={zoom} onChange={e=>setZoom(+e.target.value)}/><b>{zoom.toFixed(2)}×</b></label><label>Horizontal framing <input type="range" min="0" max="100" value={frameX} onChange={e=>setFrameX(+e.target.value)}/><b>{frameX}%</b></label><label>Vertical framing <input type="range" min="0" max="100" value={frameY} onChange={e=>setFrameY(+e.target.value)}/><b>{frameY}%</b></label></>}
      {slug==="a4-size"&&<><label>Print resolution <select value={dpi} onChange={e=>setDpi(+e.target.value)}><option value="150">150 DPI</option><option value="300">300 DPI</option></select></label><label>Page background <input type="color" value={bg} onChange={e=>setBg(e.target.value)}/></label><p>Output page: {a4Dimensions(dpi).width} × {a4Dimensions(dpi).height}px at {dpi} DPI (A4 portrait).</p></>}
      {slug==="edit-metadata"&&<div className="metadata-editor" aria-label="Image metadata fields">
        <p>Update the descriptive metadata below. Embedded EXIF writing is supported for JPEG; other formats receive a downloadable JSON sidecar.</p>
        <label>Title<input value={titleField} onChange={e=>setTitleField(e.target.value)} placeholder="Image title"/></label>
        <label>Author<input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Creator or author"/></label>
        <label>Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe this image"/></label>
        <label>Copyright<input value={copyright} onChange={e=>setCopyright(e.target.value)} placeholder="Copyright notice"/></label>
        <label>Date &amp; time<input type="text" value={dateTime} onChange={e=>setDateTime(e.target.value)} placeholder="YYYY:MM:DD HH:MM:SS"/></label>
        <label>Keywords<input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Comma-separated keywords"/></label>
        <label>Comment<input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Additional comment"/></label>
        <label>Software<input value={software} onChange={e=>setSoftware(e.target.value)} placeholder="Software name"/></label>
      </div>}
      {slug==="view-metadata"&&metadata&&<div className="sample-values"><div><b>Image properties and readable metadata</b>{Object.entries(metadata).map(([k,v])=><span key={k}>{k}: {v}</span>)}</div></div>}
      {slug==="image-color-picker"&&<><p>Tap/click any pixel in the preview to sample its exact source-image color.</p>{sample&&<div className="sample-values"><i style={{background:sample.hex}}/><div><b>{sample.hex}</b><span>{sample.rgb} · {sample.hsl} · {sample.hsv}</span></div><button type="button" onClick={()=>navigator.clipboard.writeText(sample.hex)}><Copy size={15}/> Copy HEX</button></div>}<div className="advanced-action-row">{(["css","json","txt"] as const).map(k=><button key={k} type="button" disabled={!palette.length} onClick={()=>exportPalette(k)}>Export {k.toUpperCase()}</button>)}</div>{palette.length>0&&<div className="palette-swatches">{palette.map(v=><button key={v} title={v} style={{background:v}} onClick={()=>navigator.clipboard.writeText(v)} aria-label={`Copy ${v}`}/>)}</div>}</>}
      {slug==="blemishes-remover"&&<><p>Click/tap a small mark in the preview to apply a local clone-stamp patch. Use small brush sizes for best control; this is not AI healing.</p><label>Brush size <input type="range" min="6" max="80" value={brushSize} onChange={e=>setBrushSize(+e.target.value)}/><b>{brushSize}px</b></label></>}
      {slug!=="image-color-picker"&&slug!=="view-metadata"&&slug!=="edit-metadata"&&slug!=="remove-metadata"&&!isProfile&&<><label>Export format <select value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>{format!=="image/png"&&<label>Quality <input type="range" min="40" max="100" value={quality} onChange={e=>setQuality(+e.target.value)}/><b>{quality}%</b></label>}</>}
      <div className="advanced-action-row">
        <button type="button" onClick={resetTool}><span>Reset</span></button>
        {slug==="remove-metadata"?<button className="advanced-primary" type="button" onClick={()=>void removeMetadata()}><Download size={17}/> Re-encode & download</button>:slug==="edit-metadata"?<button className="advanced-primary" type="button" onClick={()=>void editMetadata()}><Download size={17}/> Write metadata & download</button>:slug==="image-color-picker"||slug==="view-metadata"?null:<button className="advanced-primary" type="button" onClick={()=>void exportImage()}><Download size={17}/> Process & download</button>}
      </div>
    </div>}
    {isVisio&&pkg&&<div className="visio-results"><div className="visio-summary"><FileArchive/><b>{pkg.pages.length} page(s) inspected</b><span>{pkg.media.length} embedded media file(s)</span></div><div className="visio-pages">{pkg.pages.map((page,i)=><article key={page.name}><b>Page {i+1} · {page.name}</b><p>{page.text.slice(0,5).join(" · ")||"No text extracted"}</p></article>)}</div>{pkg.warnings.map(w=><p className="advanced-warning" key={w}>{w}</p>)}<p className="advanced-warning">No Visio rendering or conversion engine is configured. The page will not generate DOCX, PPTX, PDF or JPG files that falsely imply a faithful conversion. VSDX inspection only extracts text and embedded media; legacy VSD requires a dedicated converter or Microsoft Visio export.</p><button type="button" onClick={()=>{const text=pkg.pages.map((page,i)=>`PAGE ${i+1}: ${page.name}\n${page.text.join("\n")}`).join("\n\n");downloadBlob(new Blob([text],{type:"text/plain"}),`${safeName(file?.name||"visio")}-extracted-text.txt`);}}> <FileText size={16}/> Download extracted text only</button></div>}
    {busy&&<p className="advanced-status">Processing locally…</p>}{message&&<p className="advanced-status" role="status">{message}</p>}{error&&<p className="advanced-error" role="alert">{error}</p>}
  </section>;
}
