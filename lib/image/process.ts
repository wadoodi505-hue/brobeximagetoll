export type ImageOperation = "resize" | "compress" | "crop" | "flip" | "grayscale" | "pixelate" | "text" | "border" | "combine" | "circle" | "metadata" | "blur" | "convert" | "rotate";
export type ProcessSettings = {
  operation: ImageOperation;
  width?: number; height?: number; quality?: number; format?: string;
  cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number;
  flipX?: boolean; flipY?: boolean; rotation?: number; pixelSize?: number;
  text?: string; textSize?: number; textColor?: string; textX?: number; textY?: number;
  borderWidth?: number; borderColor?: string; blurAmount?: number;
};

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This file could not be decoded as a supported image.")); };
    image.src = url;
  });
}
function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { if (!blob) { reject(new Error(`This browser cannot export ${type}. Try PNG or JPEG.`)); return; } if (blob.type && blob.type !== type) { reject(new Error(`This browser cannot export ${type}. It returned ${blob.type} instead. Choose a different output format.`)); return; } resolve(blob); }, type, quality);
  });
}
export async function processImage(file: File, settings: ProcessSettings): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  if (!file.size) throw new Error("The selected file is empty.");
  const image = await loadImage(file);
  const maxDimension = 12000;
  const srcW = image.naturalWidth, srcH = image.naturalHeight;
  let width = Math.max(1, Math.min(maxDimension, Math.round(settings.width || srcW)));
  let height = Math.max(1, Math.min(maxDimension, Math.round(settings.height || srcH)));
  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (settings.operation === "crop") {
    sx = Math.max(0, Math.min(srcW - 1, Math.round(settings.cropX || 0)));
    sy = Math.max(0, Math.min(srcH - 1, Math.round(settings.cropY || 0)));
    sw = Math.max(1, Math.min(srcW - sx, Math.round(settings.cropWidth || srcW)));
    sh = Math.max(1, Math.min(srcH - sy, Math.round(settings.cropHeight || srcH)));
    width = sw; height = sh;
  }
  if (settings.operation === "rotate" && Math.abs(settings.rotation || 0) % 180 === 90) [width, height] = [height, width];
  if (settings.operation === "circle") { width = Math.min(srcW, srcH); height = width; sx = Math.floor((srcW-width)/2); sy = Math.floor((srcH-height)/2); sw=width; sh=height; }
  const canvas = document.createElement("canvas");
  canvas.width = width + (settings.operation === "border" ? Math.max(0, settings.borderWidth || 0) * 2 : 0);
  canvas.height = height + (settings.operation === "border" ? Math.max(0, settings.borderWidth || 0) * 2 : 0);
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  if (settings.operation === "circle") { ctx.beginPath(); ctx.arc(width/2,height/2,width/2,0,Math.PI*2); ctx.clip(); }
  if (settings.operation === "border") { ctx.fillStyle = settings.borderColor || "#171717"; ctx.fillRect(0,0,canvas.width,canvas.height); }
  if (settings.operation === "blur") ctx.filter = `blur(${Math.max(0, Math.min(30, settings.blurAmount || 4))}px)`;
  if (settings.operation === "grayscale") ctx.filter = "grayscale(1)";
  if (settings.operation === "flip") { ctx.translate(settings.flipX ? width : 0, settings.flipY ? height : 0); ctx.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1); }
  if (settings.operation === "rotate") { const angle = ((settings.rotation ?? 90) * Math.PI) / 180; ctx.translate(canvas.width/2,canvas.height/2); ctx.rotate(angle); }
  if (settings.operation === "pixelate") {
    const small = document.createElement("canvas"); const size = Math.max(2, Math.min(80, settings.pixelSize || 12));
    small.width = Math.max(1, Math.ceil(width/size)); small.height = Math.max(1, Math.ceil(height/size));
    const sctx = small.getContext("2d"); if (!sctx) throw new Error("Canvas is unavailable.");
    sctx.drawImage(image,sx,sy,sw,sh,0,0,small.width,small.height);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(small,0,0,canvas.width,canvas.height);
  } else {
    const offset = settings.operation === "border" ? Math.max(0, settings.borderWidth || 0) : 0;
    if (settings.operation === "rotate") ctx.drawImage(image,-srcW/2,-srcH/2,srcW,srcH);
    else ctx.drawImage(image,sx,sy,sw,sh,offset,offset,width,height);
  }
  if (settings.operation === "text" && settings.text) {
    ctx.filter = "none"; ctx.font = `600 ${Math.max(8,Math.min(240,settings.textSize || 36))}px Arial`;
    ctx.fillStyle = settings.textColor || "#ffffff"; ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 3;
    ctx.fillText(settings.text,Math.max(0,settings.textX ?? 24),Math.max(20,settings.textY ?? height-24),width);
  }
  const type = settings.operation === "compress" || settings.operation === "convert" ? (settings.format || "image/webp") : "image/png";
  const blob = await canvasBlob(canvas,type,Math.max(.1,Math.min(1,settings.quality ?? .82)));
  return { blob, width: canvas.width, height: canvas.height, mime: blob.type || type };
}
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(2)} MB`;
}

/** Compose multiple images into a single PNG without uploading them anywhere. */
export async function processImages(files: File[], layout: "horizontal" | "vertical" = "horizontal"): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  if (files.length < 2) throw new Error("Choose at least two images to combine.");
  const images = await Promise.all(files.map(loadImage));
  const maxDimension = 12000;
  const scale = Math.min(1, maxDimension / Math.max(...images.map(i => layout === "horizontal" ? i.naturalWidth : i.naturalHeight)));
  const dims = images.map(i => ({ w: Math.max(1, Math.round(i.naturalWidth * scale)), h: Math.max(1, Math.round(i.naturalHeight * scale)) }));
  const width = layout === "horizontal" ? dims.reduce((s,d) => s + d.w, 0) : Math.max(...dims.map(d => d.w));
  const height = layout === "vertical" ? dims.reduce((s,d) => s + d.h, 0) : Math.max(...dims.map(d => d.h));
  if (width > maxDimension || height > maxDimension || width * height > 80_000_000) throw new Error("The combined image would be too large. Choose smaller images.");
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
  let x = 0, y = 0;
  images.forEach((image, index) => { const d = dims[index]; ctx.drawImage(image, x, y, d.w, d.h); if (layout === "horizontal") x += d.w; else y += d.h; });
  const blob = await canvasBlob(canvas, "image/png", 1);
  return { blob, width, height, mime: blob.type || "image/png" };
}
