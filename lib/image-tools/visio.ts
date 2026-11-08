import JSZip from "jszip";

export type VisioPage = { name: string; xml: string; text: string[]; media: string[] };
export type VisioPackage = { pages: VisioPage[]; media: { name: string; blob: Blob }[]; warnings: string[] };

/**
 * Safe, best-effort VSDX package inspection.
 * This is deliberately not advertised as Visio rendering/conversion: page
 * geometry, connectors, themes, masters and layout are not reconstructed.
 */
export async function readVisioFile(file: File): Promise<VisioPackage> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".vsd")) {
    throw new Error("Legacy .vsd is a binary Visio format and cannot be converted in this browser workspace. Open it in Microsoft Visio and save it as .vsdx, or use a dedicated Visio-compatible conversion service.");
  }
  if (!name.endsWith(".vsdx")) {
    throw new Error("Choose a .vsdx file for package inspection. Legacy .vsd conversion is not supported here.");
  }
  if (!file.size || file.size > 100 * 1024 * 1024) {
    throw new Error("Choose a non-empty VSDX file up to 100 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
  if (!isZip) throw new Error("The file extension is .vsdx, but its binary signature is not a ZIP-based VSDX package.");

  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const names = Object.keys(zip.files);
  if (names.length > 5000) throw new Error("This VSDX package contains too many entries for safe browser inspection.");
  const pageFiles = names
    .filter(path => /^visio\/pages\/page\d+\.xml$/i.test(path) && !zip.files[path].dir)
    .sort((a,b) => Number(a.match(/page(\d+)/i)?.[1]) - Number(b.match(/page(\d+)/i)?.[1]));
  if (!pageFiles.length) throw new Error("No Visio page XML was found. The package may be damaged or use an unsupported structure.");

  const pages: VisioPage[] = [];
  for (const path of pageFiles) {
    const xml = await zip.file(path)!.async("text");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) continue;
    const text = Array.from(doc.getElementsByTagName("Text"))
      .map(node => (node.textContent || "").trim())
      .filter(Boolean);
    const pageName = path.split("/").pop()!.replace(/\.xml$/i, "");
    pages.push({ name: pageName, xml, text, media: [] });
  }
  if (!pages.length) throw new Error("VSDX page XML could not be parsed.");

  const mediaFiles = names.filter(path => /^visio\/media\//i.test(path) && !zip.files[path].dir);
  const media = await Promise.all(mediaFiles.map(async path => {
    const entry = zip.file(path)!;
    const ext = path.split(".").pop()?.toLowerCase();
    const mime = ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "gif" ? "image/gif" :
      ext === "svg" ? "image/svg+xml" : "application/octet-stream";
    const bytes = await entry.async("uint8array");
    const blobBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(blobBuffer).set(bytes);
    return { name: path, blob: new Blob([blobBuffer], { type: mime }) };
  }));

  return {
    pages,
    media,
    warnings: [
      "Inspection only: page text and embedded media are extracted, but Visio shapes, connectors, page geometry, themes and layout are not rendered.",
      "Faithful DOCX, PPTX, PDF or JPG conversion requires a dedicated Visio-compatible rendering engine; no simulated conversion is provided.",
    ],
  };
}
