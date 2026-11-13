export type ImageMetadataFields = {
  title?: string;
  dateTime?: string;
  description?: string;
  artist?: string;
  copyright?: string;
  keywords?: string;
  comment?: string;
  software?: string;
};

const EXIF_TAGS: Record<number, keyof ImageMetadataFields> = {
  0x010d: "title", 0x0132: "dateTime", 0x010e: "description",
  0x013b: "artist", 0x8298: "copyright", 0x0131: "software",
  0x9c9b: "title", 0x9c9c: "comment", 0x9c9e: "keywords",
};

function u16(view: DataView, offset: number, little: boolean) { return view.getUint16(offset, little); }
function u32(view: DataView, offset: number, little: boolean) { return view.getUint32(offset, little); }
function decodeAscii(bytes: Uint8Array) { return new TextDecoder().decode(bytes).replace(/\0+$/, ""); }

/** Reads common descriptive tags from a JPEG EXIF APP1 segment. */
export async function readJpegExif(file: File): Promise<ImageMetadataFields> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result: ImageMetadataFields = {};
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return result;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const start = offset + 4;
    if (marker === 0xe1 && decodeAscii(bytes.slice(start, start + 6)) === "Exif\u0000\u0000") {
      const tiff = start + 6;
      const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
      if (!little && !(bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d)) return result;
      try {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const ifd = tiff + u32(view, tiff + 4, little);
        const count = Math.min(u16(view, ifd, little), 512);
        for (let i = 0; i < count; i++) {
          const entry = ifd + 2 + i * 12;
          if (entry + 12 > bytes.length) break;
          const tag = u16(view, entry, little);
          const type = u16(view, entry + 2, little);
          const n = u32(view, entry + 4, little);
          const key = EXIF_TAGS[tag];
          if (!key || !n || n > 8192) continue;
          const valueOffset = n <= 4 ? entry + 8 : tiff + u32(view, entry + 8, little);
          const raw = bytes.slice(valueOffset, valueOffset + n);
          if (tag >= 0x9c9b && tag <= 0x9c9e) {
            const even = raw.length - (raw.length % 2);
            result[key] = new TextDecoder("utf-16le").decode(raw.slice(0, even)).replace(/\0+$/, "");
          } else if (type === 2 || type === 7) result[key] = decodeAscii(raw);
        }
      } catch { return result; }
      return result;
    }
    offset += 2 + length;
  }
  return result;
}

/** Injects standard EXIF and Windows-compatible XP descriptive tags without re-encoding JPEG pixels. */
export async function writeJpegExif(file: File, fields: ImageMetadataFields): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Embedded metadata writing currently supports JPEG files.");
  const normal: Array<[number, string]> = [
    [0x010e, fields.description || ""], [0x013b, fields.artist || ""],
    [0x8298, fields.copyright || ""], [0x0132, fields.dateTime || ""],
    [0x0131, fields.software || ""],
  ];
  const xp: Array<[number, string]> = [
    [0x9c9b, fields.title || ""], [0x9c9c, fields.comment || ""],
    [0x9c9e, fields.keywords || ""],
  ];
  const entries: Array<{ tag: number; type: number; count: number; data: Uint8Array }> = [];
  for (const [tag, value] of normal) {
    const text = value.trim().slice(0, 2000);
    if (!text) continue;
    const data = new Uint8Array([...new TextEncoder().encode(text), 0]);
    entries.push({ tag, type: 2, count: data.length, data });
  }
  for (const [tag, value] of xp) {
    const text = value.trim().slice(0, 1000);
    if (!text) continue;
    const encoded = new Uint8Array(new TextEncoder().encode(text));
    const data = new Uint8Array(encoded.length * 2 + 2);
    for (let i = 0; i < encoded.length; i++) data[i * 2] = encoded[i];
    entries.push({ tag, type: 1, count: data.length, data });
  }
  if (fields.title?.trim() && !entries.some(e => e.tag === 0x010d)) {
    const data = new Uint8Array([...new TextEncoder().encode(fields.title.trim().slice(0, 2000)), 0]);
    entries.push({ tag: 0x010d, type: 2, count: data.length, data });
  }
  if (!entries.length) throw new Error("Enter at least one metadata field before exporting.");

  const ifdStart = 8;
  const dataStart = ifdStart + 2 + entries.length * 12 + 4;
  const tiff = new Uint8Array(dataStart + entries.reduce((n, e) => n + e.data.length, 0));
  const view = new DataView(tiff.buffer);
  tiff.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0]);
  view.setUint16(ifdStart, entries.length, true);
  let dataOffset = dataStart;
  entries.forEach((entry, index) => {
    const at = ifdStart + 2 + index * 12;
    view.setUint16(at, entry.tag, true);
    view.setUint16(at + 2, entry.type, true);
    view.setUint32(at + 4, entry.count, true);
    if (entry.data.length <= 4) tiff.set(entry.data, at + 8);
    else {
      view.setUint32(at + 8, dataOffset, true);
      tiff.set(entry.data, dataOffset);
      dataOffset += entry.data.length;
    }
  });
  const exif = new TextEncoder().encode("Exif\u0000\u0000");
  const payload = new Uint8Array(exif.length + tiff.length);
  payload.set(exif); payload.set(tiff, exif.length);
  const segmentLength = payload.length + 2;
  if (segmentLength > 65535) throw new Error("Metadata is too large for a JPEG EXIF segment.");
  const app1 = new Uint8Array(payload.length + 4);
  app1.set([0xff, 0xe1, segmentLength >>> 8, segmentLength & 255]);
  app1.set(payload, 4);

  const chunks: BlobPart[] = [bytes.slice(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const end = offset + 2 + length;
    const isExif = marker === 0xe1 && decodeAscii(bytes.slice(offset + 4, offset + 10)) === "Exif\u0000\u0000";
    if (!isExif) chunks.push(bytes.slice(offset, end));
    offset = end;
  }
  chunks.push(app1, bytes.slice(offset));
  return new Blob(chunks, { type: "image/jpeg" });
}

/** Removes metadata chunks/segments from JPEG, PNG and WebP without re-encoding pixel data. */
export async function stripImageMetadata(file: File): Promise<{ blob: Blob; removed: number; remaining: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const chunks: BlobPart[] = [bytes.slice(0, 2)];
    let offset = 2, removed = 0, remaining = 0;
    while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) { chunks.push(bytes.slice(offset)); break; }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (length < 2 || offset + 2 + length > bytes.length) { chunks.push(bytes.slice(offset)); break; }
      const end = offset + 2 + length;
      if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) removed++;
      else { chunks.push(bytes.slice(offset, end)); remaining++; }
      offset = end;
    }
    return { blob: new Blob(chunks, { type: "image/jpeg" }), removed, remaining };
  }
  const pngSig = [137,80,78,71,13,10,26,10];
  if (pngSig.every((v, i) => bytes[i] === v)) {
    const chunks: BlobPart[] = [bytes.slice(0, 8)];
    let offset = 8, removed = 0, remaining = 0;
    const strip = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "iCCP"]);
    while (offset + 12 <= bytes.length) {
      const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
      const type = ascii(offset + 4, 4), end = offset + 12 + length;
      if (end > bytes.length) { chunks.push(bytes.slice(offset)); break; }
      if (strip.has(type)) removed++;
      else { chunks.push(bytes.slice(offset, end)); if (type !== "IEND" && type !== "IDAT") remaining++; }
      offset = end;
      if (type === "IEND") break;
    }
    return { blob: new Blob(chunks, { type: "image/png" }), removed, remaining };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunks: BlobPart[] = [bytes.slice(0, 12)];
    let offset = 12, removed = 0, remaining = 0;
    const strip = new Set(["EXIF", "XMP ", "ICCP"]);
    while (offset + 8 <= bytes.length) {
      const type = ascii(offset, 4);
      const size = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
      const end = offset + 8 + size + (size & 1);
      if (end > bytes.length) { chunks.push(bytes.slice(offset)); break; }
      if (strip.has(type)) removed++;
      else { chunks.push(bytes.slice(offset, end)); remaining++; }
      offset = end;
    }
    const total = chunks.reduce((sum, part) => sum + (part instanceof Uint8Array ? part.length : 0), 0) - 8;
    const header = new Uint8Array(12); header.set(bytes.slice(0, 12));
    new DataView(header.buffer).setUint32(4, total, true);
    chunks[0] = header;
    return { blob: new Blob(chunks, { type: "image/webp" }), removed, remaining };
  }
  throw new Error("Metadata-preserving binary cleanup is supported for JPEG, PNG and WebP files.");
}
