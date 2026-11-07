"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, UploadCloud } from "lucide-react";

type ImageInfo = { file: File; bitmap: ImageBitmap };
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 30_000_000;

export function OverlayImagesWorkspace() {
  const [base,setBase]=useState<ImageInfo|null>(null);
  const [overlay,setOverlay]=useState<ImageInfo|null>(null);
  const [opacity,setOpacity]=useState(75);
  const [scale,setScale]=useState(50);
  const [x,setX]=useState(50);
  const [y,setY]=useState(50);
  const [format,setFormat]=useState<"image/png"|"image/jpeg"|"image/webp">("image/png");
  const [background,setBackground]=useState("#ffffff");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const baseRef=useRef<ImageInfo|null>(null);
  const overlayRef=useRef<ImageInfo|null>(null);
  useEffect(()=>{baseRef.current=base;},[base]);
  useEffect(()=>{overlayRef.current=overlay;},[overlay]);
  useEffect(()=>()=>{for(const item of [baseRef.current,overlayRef.current])item?.bitmap.close();},[]);
  async function load(file?:File,kind:"base"|"overlay"="base") {
    if(!file)return;
    setError("");setNotice("");
    if(!file.type.startsWith("image/")||file.size<=0||file.size>MAX_BYTES){setError("Choose a valid image up to 20 MB.");return;}
    let bitmap:ImageBitmap;
    try{bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw new Error("Image exceeds the 30-megapixel processing limit.");}}
    catch(e){setError(e instanceof Error?e.message:"Could not decode this image.");return;}
    const info={file,bitmap};
    const previous=kind==="base"?baseRef.current:overlayRef.current;
    if(previous)previous.bitmap.close();
    if(kind==="base"){baseRef.current=info;setBase(info);}
    else{overlayRef.current=info;setOverlay(info);}
  }
  const render = useCallback(() => {
    if(!base||!overlay||!canvasRef.current)return;
    const canvas=canvasRef.current,ctx=canvas.getContext("2d");
    if(!ctx)return;
    const max=6000,ratio=Math.min(1,max/Math.max(base.bitmap.width,base.bitmap.height));
    canvas.width=Math.max(1,Math.round(base.bitmap.width*ratio));
    canvas.height=Math.max(1,Math.round(base.bitmap.height*ratio));
    ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(base.bitmap,0,0,canvas.width,canvas.height);
    const w=canvas.width*scale/100,h=w*(overlay.bitmap.height/overlay.bitmap.width);
    const left=(canvas.width-w)*x/100,top=(canvas.height-h)*y/100;
    ctx.globalAlpha=opacity/100;ctx.drawImage(overlay.bitmap,left,top,w,h);ctx.globalAlpha=1;
  }, [base, overlay, opacity, scale, x, y, background]);
  useEffect(()=>{render();},[render]);
  async function exportImage(){
    if(!base||!overlay||!canvasRef.current)return;
    setBusy(true);setError("");setNotice("");
    try{render();const canvas=canvasRef.current;const ctx=canvas.getContext("2d")!;
      if(format==="image/jpeg"){const flat=document.createElement("canvas");flat.width=canvas.width;flat.height=canvas.height;const f=flat.getContext("2d")!;f.fillStyle=background;f.fillRect(0,0,flat.width,flat.height);f.drawImage(canvas,0,0);canvas.width=flat.width;canvas.height=flat.height;ctx.drawImage(flat,0,0);}
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error("Could not export image.")),format,.92));
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${base.file.name.replace(/\.[^.]+$/,"")}-overlay.${format==="image/jpeg"?"jpg":format.split("/")[1]}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
      setNotice(`Exported ${canvas.width} × ${canvas.height}px · ${(blob.size/1024).toFixed(1)} KB.`);
    }catch(e){setError(e instanceof Error?e.message:"Export failed.");}finally{setBusy(false);}
  }
  return <section className="advanced-tools-workspace">
    <div className="advanced-tools-head"><span className="advanced-tools-mark"><ImagePlus size={19}/></span><div><h2>Overlay Images</h2><p>Place one image over another with adjustable position, scale and opacity. Processing stays in your browser.</p></div></div>
    <div className="overlay-upload-grid">
      <label className="advanced-upload"><UploadCloud/><span>{base?base.file.name:"Choose base image"}</span><small>Background / bottom layer<input type="file" accept="image/*" onChange={e=>void load(e.target.files?.[0],"base")}/></small></label>
      <label className="advanced-upload"><UploadCloud/><span>{overlay?overlay.file.name:"Choose overlay image"}</span><small>Foreground / top layer<input type="file" accept="image/*" onChange={e=>void load(e.target.files?.[0],"overlay")}/></small></label>
    </div>
    {base&&overlay&&<><div className="advanced-preview"><canvas ref={canvasRef} style={{maxWidth:"100%",height:"auto"}}/><span>Live composition preview</span></div>
      <div className="advanced-controls">
        <label>Overlay opacity <input type="range" min="0" max="100" value={opacity} onChange={e=>setOpacity(+e.target.value)}/><b>{opacity}%</b></label>
        <label>Overlay width <input type="range" min="5" max="150" value={scale} onChange={e=>setScale(+e.target.value)}/><b>{scale}%</b></label>
        <label>Horizontal position <input type="range" min="0" max="100" value={x} onChange={e=>setX(+e.target.value)}/><b>{x}%</b></label>
        <label>Vertical position <input type="range" min="0" max="100" value={y} onChange={e=>setY(+e.target.value)}/><b>{y}%</b></label>
        <label>JPEG background <input type="color" value={background} onChange={e=>setBackground(e.target.value)}/></label>
        <label>Export format <select value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
        <button className="advanced-primary" type="button" disabled={busy} onClick={()=>void exportImage()}><Download size={17}/> {busy?"Exporting…":"Export composition"}</button>
      </div>
    </>}
    {notice&&<p className="advanced-status" role="status">{notice}</p>}{error&&<p className="advanced-error" role="alert">{error}</p>}
  </section>;
}
