export type ImageMetadataFields = {
  description?: string;
  artist?: string;
  copyright?: string;
};

const EXIF_TAGS = {
  0x010e: "description",
  0x013b: "artist",
  0x8298: "copyright",
} as const;

function readU16(view: DataView, offset: number, little: boolean) {
  return view.getUint16(offset, little);
}
function readU32(view: DataView, offset: number, little: boolean) {
  return view.getUint32(offset, little);
}

/** Reads the common descriptive EXIF fields from JPEG APP1 metadata. */
export async function readJpegExif(file: File): Promise<ImageMetadataFields> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result: ImageMetadataFields = {};
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return result;
  let offset = 2;
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const start = offset + 4;
    if (marker === 0xe1 && String.fromCharCode(...bytes.slice(start, start + 6)) === "Exif\u0000\u0000") {
      const tiff = start + 6;
      const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
      if (!little && !(bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d)) return result;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const ifd = tiff + readU32(view, tiff + 4, little);
      const count = Math.min(readU16(view, ifd, little), 512);
      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        const tag = readU16(view, entry, little);
        if (!(tag in EXIF_TAGS)) continue;
        const type = readU16(view, entry + 2, little);
        const n = readU32(view, entry + 4, little);
        if (type !== 2 || !n || n > 8192) continue;
        const valueOffset = n <= 4 ? entry + 8 : tiff + readU32(view, entry + 8, little);
        const value = new TextDecoder().decode(bytes.slice(valueOffset, valueOffset + n)).replace(/\0+$/, "");
        const key = EXIF_TAGS[tag as keyof typeof EXIF_TAGS];
        result[key] = value;
      }
      return result;
    }
    offset += 2 + length;
  }
  return result;
}

/** Writes the standard EXIF description/artist/copyright tags into a JPEG APP1 segment.
 * Existing EXIF APP1 blocks are replaced; other JPEG segments and image scan data are preserved.
 */
export async function writeJpegExif(file: File, fields: ImageMetadataFields): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Embedded EXIF editing currently supports JPEG files only. For PNG/WebP, export the metadata sidecar instead.");
  }
  const candidates: Array<[number, string | undefined]> = [
    [0x010e, fields.description],
    [0x013b, fields.artist],
    [0x8298, fields.copyright],
  ];
  const clean = candidates
    .filter((item): item is [number, string] => typeof item[1] === "string" && item[1].trim().length > 0)
    .map(([tag, value]) => [tag, value.trim().slice(0, 2000)] as const);
  if (!clean.length) throw new Error("Enter at least one metadata field before exporting.");
  const count = clean.length;
  const dataStart = 8 + 2 + count * 12 + 4;
  const values: number[] = [];
  const ifd: number[] = [];
  clean.forEach(([tag, value], index) => {
    const encoded = [...new TextEncoder().encode(value), 0];
    const valueOffset = dataStart + values.length;
    ifd.push(tag & 255, tag >> 8, 2, 0);
    const n = encoded.length;
    ifd.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255);
    ifd.push(valueOffset & 255, (valueOffset >>> 8) & 255, (valueOffset >>> 16) & 255, (valueOffset >>> 24) & 255);
    values.push(...encoded);
  });
  const tiff = new Uint8Array(dataStart + values.length);
  tiff.set([0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00], 0);
  tiff[8] = count & 255; tiff[9] = (count >>> 8) & 255;
  tiff.set(ifd, 10);
  const nextIfd = 10 + count * 12;
  tiff.set([0,0,0,0], nextIfd);
  tiff.set(values, dataStart);
  const exifHeader = new TextEncoder().encode("Exif\u0000\u0000");
  const payload = new Uint8Array(exifHeader.length + tiff.length);
  payload.set(exifHeader); payload.set(tiff, exifHeader.length);
  const segmentLength = payload.length + 2;
  if (segmentLength > 65535) throw new Error("Metadata fields are too large for a JPEG EXIF segment.");
  const app1 = new Uint8Array(payload.length + 4);
  app1.set([0xff,0xe1,(segmentLength >>> 8) & 255,segmentLength & 255]);
  app1.set(payload, 4);

  const chunks: Uint8Array[] = [bytes.slice(0, 2), app1];
  let offset = 2;
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const segmentEnd = offset + 2 + length;
    const isExif = marker === 0xe1 &&
      String.fromCharCode(...bytes.slice(offset + 4, offset + 10)) === "Exif\u0000\u0000";
    if (!isExif) chunks.push(bytes.slice(offset, segmentEnd));
    offset = segmentEnd;
  }
  chunks.push(bytes.slice(offset));
  return new Blob(chunks, { type: "image/jpeg" });
}
