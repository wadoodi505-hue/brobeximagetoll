"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";

type Job = { id: string; file: File; url: string; image: HTMLImageElement; result?: Blob; progress: number; error?: string };
const MAX_SIDE = 12000, MAX_PIXELS = 40000000;
const readable = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`;

export function BulkResizerWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const jobsRef = useRef<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [maxHeight, setMaxHeight] = useState(1600);
  const [format, setFormat] = useState<"image/jpeg"|"image/png"|"image/webp">("image/webp");
  const [quality, setQuality] = useState(88);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zipBusy, setZipBusy] = useState(false);
  const completed = jobs.filter(x=>x.result).length;
  const overall = jobs.length ? Math.round(jobs.reduce((sum,x)=>sum+x.progress,0)/jobs.length) : 0;

  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => () => jobsRef.current.forEach(x=>URL.revokeObjectURL(x.url)), []);
  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list).filter(f => ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 40*1024*1024);
    if (!files.length) { setError("Add JPEG, PNG or WebP images up to 40 MB each."); return; }
    setError("");
    files.forEach(file=>{
      const url=URL.createObjectURL(file), image=new Image();
      image.onload=()=>{
        if(image.naturalWidth*image.naturalHeight>MAX_PIXELS){URL.revokeObjectURL(url);setError(`${file.name} exceeds the 40-megapixel safety limit.`);return;}
        setJobs(old=>[...old,{id:`${file.name}-${file.lastModified}-${Math.random()}`,file,url,image,progress:0}]);
      };
      image.onerror=()=>{URL.revokeObjectURL(url);setError(`Could not decode ${file.name}.`);}; image.src=url;
    });
  };
  const updateJob=(id:string, patch:Partial<Job>)=>setJobs(old=>old.map(x=>x.id===id?{...x,...patch}:x));
  const processAll=async()=>{
    if(!jobs.length)return;
    if(!Number.isInteger(maxWidth)||!Number.isInteger(maxHeight)||maxWidth<1||maxHeight<1||maxWidth>MAX_SIDE||maxHeight>MAX_SIDE){setError("Maximum width and height must be between 1 and 12,000 pixels.");return;}
    setBusy(true);setError("");
    for(const job of jobs){
      updateJob(job.id,{progress:5,error:undefined,result:undefined});
      try{
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        const scale=Math.min(1,maxWidth/job.image.naturalWidth,maxHeight/job.image.naturalHeight);
        const w=Math.max(1,Math.round(job.image.naturalWidth*scale)),h=Math.max(1,Math.round(job.image.naturalHeight*scale));
        if(w*h>MAX_PIXELS)throw new Error("Output exceeds the safe pixel limit.");
        updateJob(job.id,{progress:35});
        const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas is unavailable.");
        if(format==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);}
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(job.image,0,0,w,h);
        updateJob(job.id,{progress:75});
        const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,format,format==="image/png"?undefined:quality/100));
        canvas.width=0;canvas.height=0;if(!blob)throw new Error("Image export failed.");
        updateJob(job.id,{result:blob,progress:100});
      }catch(e){updateJob(job.id,{error:e instanceof Error?e.message:"Processing failed",progress:100});}
    }
    setBusy(false);
  };
  const downloadZip=async()=>{
    const ready=jobs.filter(x=>x.result);if(!ready.length)return;
    setZipBusy(true);setError("");
    try{
      const zip=new JSZip(),extension=format==="image/jpeg"?"jpg":format==="image/png"?"png":"webp";
      const used=new Map<string,number>();
      ready.forEach(job=>{const base=job.file.name.replace(/\.[^.]+$/, "");const count=(used.get(base)||0)+1;used.set(base,count);const suffix=count>1?`-${count}`:"";const name=`${base}-resized${suffix}.${extension}`;zip.file(name,job.result!,{createFolders:false});});
      const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:5}});
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="brobex-resized-images.zip";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){setError(e instanceof Error?e.message:"Could not create ZIP archive.");}
    finally{setZipBusy(false);}
  };
  const remove=(id:string)=>{const job=jobs.find(x=>x.id===id);if(job)URL.revokeObjectURL(job.url);setJobs(old=>old.filter(x=>x.id!==id));};
  const clear=()=>{jobs.forEach(x=>URL.revokeObjectURL(x.url));setJobs([]);if(inputRef.current)inputRef.current.value="";};

  return <section style={{display:"grid",gap:16,color:"var(--foreground,#171717)"}}><style jsx>{`.bulk-panel{border:1px solid var(--border,#e5e5e5);border-radius:14px;padding:17px;background:var(--card,#fff)}.bulk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.bulk-input{width:100%;padding:10px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--background,#fff);color:inherit}.bulk-btn{padding:10px 14px;border:1px solid var(--border,#ddd);border-radius:9px;background:var(--background,#fff);color:inherit;font-weight:650;cursor:pointer}.bulk-primary{background:#171717;color:#fff;border-color:#171717}.bulk-list{display:grid;gap:9px}.bulk-item{display:grid;grid-template-columns:58px minmax(0,1fr) 90px;gap:11px;align-items:center;border:1px solid var(--border,#e5e5e5);border-radius:10px;padding:9px}.bulk-item img{width:58px;height:58px;object-fit:cover;border-radius:7px}.bulk-track{height:6px;border-radius:20px;background:var(--muted,#eee);overflow:hidden}.bulk-track span{display:block;height:100%;background:#16a34a;transition:width .2s}@media(max-width:520px){.bulk-grid{grid-template-columns:1fr}.bulk-item{grid-template-columns:48px minmax(0,1fr)}.bulk-item>button{grid-column:2}}`}</style>
    <header><div style={{fontSize:11,fontWeight:750,letterSpacing:1.2,opacity:.6}}>BROBEX IMAGE WORKSPACE</div><h2 style={{fontSize:26,margin:"5px 0"}}>Bulk Image Resizer</h2><p style={{margin:0,fontSize:14,opacity:.7}}>Resize a batch of images locally, track each file’s progress and download everything in one ZIP archive.</p></header>
    <div className="bulk-panel"><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><strong>Upload queue · {jobs.length} images</strong><button className="bulk-btn" onClick={()=>inputRef.current?.click()}>＋ Add images</button></div><input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>e.target.files&&addFiles(e.target.files)}/><div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}} style={{marginTop:12,padding:24,border:"1.5px dashed var(--border,#aaa)",borderRadius:11,textAlign:"center",fontSize:13,opacity:.75}}>Drop multiple JPEG, PNG or WebP files here<br/><span style={{fontSize:11}}>Up to 40 MB per image · 40 megapixel safety limit</span></div>{jobs.length>0&&<div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:13,fontSize:13}}><span>{completed} of {jobs.length} completed</span><strong>{overall}%</strong></div>}{jobs.length>0&&<div className="bulk-track" style={{marginTop:7}}><span style={{width:`${overall}%`}}/></div>}</div>
    <div className="bulk-panel"><h3 style={{fontSize:16,margin:"0 0 14px"}}>Batch settings</h3><div className="bulk-grid"><label style={{fontSize:13,fontWeight:650}}>Maximum width (px)<input className="bulk-input" type="number" min="1" max={MAX_SIDE} value={maxWidth} onChange={e=>setMaxWidth(Number(e.target.value))}/></label><label style={{fontSize:13,fontWeight:650}}>Maximum height (px)<input className="bulk-input" type="number" min="1" max={MAX_SIDE} value={maxHeight} onChange={e=>setMaxHeight(Number(e.target.value))}/></label><label style={{fontSize:13,fontWeight:650}}>Output format<select className="bulk-input" value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="image/webp">WebP · Recommended</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label><label style={{fontSize:13,fontWeight:650}}>Quality: {quality}%<input className="bulk-input" type="range" min="30" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))} disabled={format==="image/png"}/></label></div><p style={{fontSize:12,opacity:.65,marginBottom:0}}>Images are scaled proportionally to fit within both maximum dimensions. Smaller images are not enlarged.</p><div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:15}}><button className="bulk-btn bulk-primary" disabled={!jobs.length||busy} onClick={processAll}>{busy?"Processing batch…":"Resize all images"}</button><button className="bulk-btn" disabled={!completed||zipBusy} onClick={downloadZip}>{zipBusy?"Creating ZIP…":"Download ZIP"}</button><button className="bulk-btn" disabled={!jobs.length||busy} onClick={clear}>Clear queue</button></div>{error&&<p role="alert" style={{color:"#dc2626",fontSize:13}}>{error}</p>}</div>
    {jobs.length>0&&<div className="bulk-panel"><h3 style={{fontSize:16,margin:"0 0 12px"}}>Processing details</h3><div className="bulk-list">{jobs.map(job=><div className="bulk-item" key={job.id}><img src={job.url} alt=""/><div style={{minWidth:0}}><strong style={{display:"block",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.file.name}</strong><div style={{fontSize:11,opacity:.65,margin:"3px 0 6px"}}>{job.image.naturalWidth} × {job.image.naturalHeight} px · {readable(job.file.size)}{job.result?` · Output ${readable(job.result.size)}`:""}</div><div className="bulk-track"><span style={{width:`${job.progress}%`}}/></div>{job.error&&<span style={{fontSize:11,color:"#dc2626"}}>{job.error}</span>}</div><div style={{textAlign:"right",fontSize:12}}><strong>{job.error?"Failed":job.result?"Complete":`${job.progress}%`}</strong>{job.result&&<button className="bulk-btn" style={{display:"block",marginTop:5,padding:"6px 8px",fontSize:11}} onClick={()=>{const url=URL.createObjectURL(job.result!);const a=document.createElement("a");a.href=url;a.download=`${job.file.name.replace(/\.[^.]+$/,"")}-resized.${format==="image/jpeg"?"jpg":format==="image/png"?"png":"webp"}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Download</button>}</div></div>)}</div></div>}
  </section>;
}
