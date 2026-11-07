export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This image could not be decoded by your browser.")); };
    image.src = url;
  });
}

export function canvasBlob(canvas: HTMLCanvasElement, type: ExportFormat, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Image export failed.")), type, type === "image/png" ? undefined : quality));
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function imageCanvas(file: File) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(image, 0, 0);
  return { canvas, ctx, image };
}

export function colorValues(r: number, g: number, b: number) {
  const hex = "#" + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,"0")).join("").toUpperCase();
  const rn=r/255, gn=g/255, bn=b/255, max=Math.max(rn,gn,bn), min=Math.min(rn,gn,bn), d=max-min;
  let h=0; if(d){ if(max===rn) h=((gn-bn)/d)%6; else if(max===gn) h=(bn-rn)/d+2; else h=(rn-gn)/d+4; h*=60; if(h<0)h+=360; }
  const l=(max+min)/2, s=d===0?0:d/(1-Math.abs(2*l-1));
  return { hex, rgb:`rgb(${r}, ${g}, ${b})`, hsl:`hsl(${Math.round(h)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`, hsv:`hsv(${Math.round(h)}, ${Math.round(max===0?0:d/max*100)}%, ${Math.round(max*100)}%)` };
}

export function makeRoundedCanvas(source: HTMLCanvasElement, radii: number[]) {
  const out=document.createElement("canvas"); out.width=source.width; out.height=source.height;
  const c=out.getContext("2d"); if(!c) throw new Error("Canvas is unavailable.");
  const [tl,tr,br,bl]=radii.map(v=>Math.max(0,Math.min(v,Math.min(out.width,out.height)/2)));
  c.beginPath(); c.moveTo(tl,0); c.lineTo(out.width-tr,0); c.quadraticCurveTo(out.width,0,out.width,tr);
  c.lineTo(out.width,out.height-br); c.quadraticCurveTo(out.width,out.height,out.width-br,out.height);
  c.lineTo(bl,out.height); c.quadraticCurveTo(0,out.height,0,out.height-bl); c.lineTo(0,tl); c.quadraticCurveTo(0,0,tl,0); c.closePath(); c.clip();
  c.drawImage(source,0,0); return out;
}

export function a4Dimensions(dpi: number) { return { width: Math.round(210/25.4*dpi), height: Math.round(297/25.4*dpi) }; }
