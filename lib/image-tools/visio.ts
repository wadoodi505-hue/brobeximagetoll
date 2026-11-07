import JSZip from "jszip";

export type VisioPage = { name: string; xml: string; text: string[]; media: string[] };
export type VisioPackage = { pages: VisioPage[]; media: { name: string; blob: Blob }[]; warnings: string[] };

export async function readVisioFile(file: File): Promise<VisioPackage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isZip) {
    const signature = Array.from(bytes.slice(0,8)).map(v=>v.toString(16).padStart(2,"0")).join(" ");
    throw new Error(`This appears to be a legacy or unsupported binary Visio file (signature ${signature}). Open it in Microsoft Visio and save as .vsdx, then retry. Legacy .vsd parsing is not implemented.`);
  }
  const zip = await JSZip.loadAsync(bytes);
  const pageFiles = Object.keys(zip.files).filter(n=>/^visio\/pages\/page\d+\.xml$/i.test(n)).sort((a,b)=>Number(a.match(/page(\d+)/i)?.[1])-Number(b.match(/page(\d+)/i)?.[1]));
  if (!pageFiles.length) throw new Error("No Visio page XML was found. The file may not be a valid VSDX package.");
  const pages: VisioPage[] = [];
  for (const path of pageFiles) {
    const xml = await zip.file(path)!.async("text");
    const doc = new DOMParser().parseFromString(xml,"application/xml");
    const text = Array.from(doc.getElementsByTagName("Text")).map(n=>(n.textContent||"").trim()).filter(Boolean);
    const pageName = path.split("/").pop()!.replace(/\.xml$/i,"");
    pages.push({name:pageName,xml,text,media:[]});
  }
  const mediaFiles = Object.keys(zip.files).filter(n=>/^visio\/media\//i.test(n)&&!zip.files[n].dir);
  const media = await Promise.all(mediaFiles.map(async name=>{
    const f=zip.file(name)!; const ext=name.split(".").pop()?.toLowerCase();
    const mime=ext==="png"?"image/png":ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="gif"?"image/gif":ext==="svg"?"image/svg+xml":"application/octet-stream";
    return {name,blob:await f.async("blob").then(b=>new Blob([b],{type:mime}))};
  }));
  return {pages,media,warnings:["VSDX page geometry and connector styling are not fully interpreted. Text and embedded media are extracted; image previews are best-effort contact sheets, not pixel-identical Visio renders."]};
}

export async function createDocx(pkg: VisioPackage) {
  const zip=new JSZip();
  zip.file("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file("_rels/.rels",`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const body=pkg.pages.map((p,i)=>`<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Visio page ${i+1}: ${esc(p.name)}</w:t></w:r></w:p>`+p.text.map(t=>`<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`).join("")).join("");
  zip.file("word/document.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`);
  return zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
}

export async function createPptx(pkg: VisioPackage) {
  const zip=new JSZip();
  zip.file("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${pkg.pages.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`);
  zip.file("_rels/.rels",`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`);
  zip.file("ppt/presentation.xml",`<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>${pkg.pages.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+1}"/>`).join("")}</p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels",`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${pkg.pages.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`).join("")}</Relationships>`);
  pkg.pages.forEach((page,i)=>{
    const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const lines=[page.name,...page.text].slice(0,45);
    const paragraphs=lines.map((t,j)=>`<a:p><a:r><a:rPr lang="en-US" sz="${j===0?2400:1600}"/><a:t>${esc(t)}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p>`).join("");
    zip.file(`ppt/slides/slide${i+1}.xml`,`<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Text"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
  });
  return zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
}

export async function makeVisioContactSheet(pkg: VisioPackage) {
  const canvases: HTMLCanvasElement[]=[];
  for (const page of pkg.pages) {
    const canvas=document.createElement("canvas"); canvas.width=1200; canvas.height=800;
    const ctx=canvas.getContext("2d")!; ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,800);
    ctx.fillStyle="#111";ctx.font="bold 30px Arial";ctx.fillText(page.name,48,58);
    ctx.font="20px Arial"; page.text.slice(0,28).forEach((line,i)=>ctx.fillText(line.slice(0,100),60,110+i*24));
    canvases.push(canvas);
  }
  return Promise.all(canvases.map(c=>new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error("Could not render page.")),"image/jpeg",.92))));
}
