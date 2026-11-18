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

/** Reads common descriptive metadata from JPEG EXIF and PNG tEXt/iTXt chunks. */
export async function readImageMetadata(file: File): Promise<ImageMetadataFields> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return readJpegExif(file);
  const signature = [137,80,78,71,13,10,26,10];
  if (!signature.every((v, i) => bytes[i] === v)) return {};
  const result: ImageMetadataFields = {};
  const names: Record<string, keyof ImageMetadataFields> = {
    title: "title", description: "description", imageDescription: "description",
    author: "artist", artist: "artist", copyright: "copyright",
    keywords: "keywords", comment: "comment", software: "software",
    "creation time": "dateTime",
  };
  const decoder = new TextDecoder();
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const end = dataStart + length + 4;
    if (end > bytes.length) break;
    if (type === "tEXt") {
      const data = bytes.subarray(dataStart, dataStart + length);
      const split = data.indexOf(0);
      if (split > 0) {
        const key = decoder.decode(data.subarray(0, split)).toLowerCase();
        const target = names[key];
        if (target) result[target] = decoder.decode(data.subarray(split + 1));
      }
    } else if (type === "iTXt") {
      const data = bytes.subarray(dataStart, dataStart + length);
      const zero = (from: number) => data.indexOf(0, from);
      const keyEnd = zero(0);
      if (keyEnd > 0 && keyEnd + 2 < data.length) {
        const compressionFlag = data[keyEnd + 1];
        let cursor = zero(keyEnd + 3) + 1; // language tag terminator
        cursor = zero(cursor) + 1; // translated keyword terminator
        if (cursor > 0 && cursor <= data.length && compressionFlag === 0) {
          const key = decoder.decode(data.subarray(0, keyEnd)).toLowerCase();
          const target = names[key];
          if (target) result[target] = decoder.decode(data.subarray(cursor));
        }
      }
    }
    offset = end;
    if (type === "IEND") break;
  }
  return result;
}
