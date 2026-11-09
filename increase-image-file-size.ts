export type IncreaseImageFormat =
  | "original"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type IncreaseImageResult = {
  blob: Blob;
  width: number;
  height: number;
  reachedTarget: boolean;
  message: string;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TARGET_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function concatBytes(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function writeU32BE(value: number) {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

function writeU32LE(value: number) {
  return new Uint8Array([
    value & 255,
    (value >>> 8) & 255,
    (value >>> 16) & 255,
    (value >>> 24) & 255,
  ]);
}

function readU32LE(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] +
    bytes[offset + 1] * 0x100 +
    bytes[offset + 2] * 0x10000 +
    bytes[offset + 3] * 0x1000000
  );
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  const body = concatBytes(typeBytes, data);
  return concatBytes(
    writeU32BE(data.length),
    body,
    writeU32BE(crc32(body)),
  );
}

function detectFormat(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 && ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") {
    return "image/png";
  }
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")) {
    return "image/gif";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brands = ascii(bytes, 8, Math.min(24, bytes.length - 8));
    if (brands.includes("avif") || brands.includes("avis")) return "image/avif";
  }
  throw new Error("The file content is not a supported JPEG, PNG, WebP, GIF or AVIF image.");
}

function padJpeg(bytes: Uint8Array, target: number) {
  if (bytes.length < 4 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new Error("This JPEG does not have a valid end marker. Try exporting it again.");
  }

  const parts: Uint8Array[] = [bytes.subarray(0, bytes.length - 2)];
  let currentSize = bytes.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.min(65533, Math.max(1, remaining - 4));
    const segment = new Uint8Array(payloadLength + 4);
    segment[0] = 0xff;
    segment[1] = 0xfe;
    segment[2] = ((payloadLength + 2) >>> 8) & 255;
    segment[3] = (payloadLength + 2) & 255;
    segment.fill(32, 4);
    parts.push(segment);
    currentSize += segment.length;
  }

  parts.push(bytes.subarray(bytes.length - 2));
  return concatBytes(...parts);
}

function padPng(bytes: Uint8Array, target: number) {
  if (bytes.length < 20 || ascii(bytes, 0, 8) !== "\x89PNG\r\n\x1a\n") {
    throw new Error("This PNG file has an invalid signature.");
  }

  let offset = 8;
  let iend = -1;
  let firstChunk = true;

  while (offset + 12 <= bytes.length) {
    const length = bytes[offset] * 0x1000000 +
      bytes[offset + 1] * 0x10000 +
      bytes[offset + 2] * 0x100 +
      bytes[offset + 3];

    if (length > bytes.length - offset - 12) {
      throw new Error("This PNG contains an incomplete chunk.");
    }

    const type = ascii(bytes, offset + 4, 4);
    if (firstChunk && type !== "IHDR") {
      throw new Error("This PNG has an invalid chunk order.");
    }
    firstChunk = false;

    if (type === "IEND") {
      if (length !== 0 || offset + 12 !== bytes.length) {
        throw new Error("This PNG has invalid data after its end chunk.");
      }
      iend = offset;
      break;
    }
    offset += 12 + length;
  }

  if (iend < 0) throw new Error("This PNG file has no valid IEND chunk.");

  const parts: Uint8Array[] = [bytes.subarray(0, iend)];
  let currentSize = bytes.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.max(1, remaining - 19);
    const text = new Uint8Array(7 + payloadLength);
    text.set(new TextEncoder().encode("BROBEX\0"));
    text.fill(32, 7);
    const chunk = pngChunk("tEXt", text);
    parts.push(chunk);
    currentSize += chunk.length;
  }

  parts.push(bytes.subarray(iend));
  return concatBytes(...parts);
}

function padGif(bytes: Uint8Array, target: number) {
  if (
    bytes.length < 14 ||
    (ascii(bytes, 0, 6) !== "GIF87a" && ascii(bytes, 0, 6) !== "GIF89a") ||
    bytes[bytes.length - 1] !== 0x3b
  ) {
    throw new Error("This GIF does not have a valid header and trailer.");
  }

  const parts: Uint8Array[] = [bytes.subarray(0, bytes.length - 1)];
  let currentSize = bytes.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.min(255, Math.max(1, remaining - 4));
    const extension = new Uint8Array(payloadLength + 4);
    extension[0] = 0x21;
    extension[1] = 0xfe;
    extension[2] = payloadLength;
    extension.fill(32, 3, 3 + payloadLength);
    extension[extension.length - 1] = 0;
    parts.push(extension);
    currentSize += extension.length;
  }

  parts.push(bytes.subarray(bytes.length - 1));
  return concatBytes(...parts);
}

function padWebp(bytes: Uint8Array, target: number, width: number, height: number) {
  if (
    bytes.length < 20 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 4) !== "WEBP" ||
    readU32LE(bytes, 4) !== bytes.length - 8
  ) {
    throw new Error("This WebP file has an invalid RIFF structure.");
  }

  let offset = 12;
  let vp8xOffset = -1;
  let hasImageChunk = false;

  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const length = readU32LE(bytes, offset + 4);
    const paddedLength = length + (length & 1);
    if (paddedLength > bytes.length - offset - 8) {
      throw new Error("This WebP file contains an incomplete chunk.");
    }
    if (type === "VP8X") vp8xOffset = offset;
    if (type === "VP8 " || type === "VP8L") hasImageChunk = true;
    offset += 8 + paddedLength;
  }

  if (offset !== bytes.length || !hasImageChunk) {
    throw new Error("This WebP file has an invalid chunk layout.");
  }

  let data = bytes.slice();

  if (vp8xOffset >= 0) {
    if (vp8xOffset !== 12 || readU32LE(data, vp8xOffset + 4) !== 10) {
      throw new Error("This extended WebP layout is not supported safely.");
    }
    data[20] |= 0x04;
  } else {
    const header = new Uint8Array(18);
    header.set(new TextEncoder().encode("VP8X"), 0);
    header[4] = 10;
    header[8] = 0x04;
    const w = width - 1;
    const h = height - 1;
    header[12] = w & 255;
    header[13] = (w >>> 8) & 255;
    header[14] = (w >>> 16) & 255;
    header[15] = h & 255;
    header[16] = (h >>> 8) & 255;
    header[17] = (h >>> 16) & 255;
    data = concatBytes(data.subarray(0, 12), header, data.subarray(12));
  }

  const encoder = new TextEncoder();
  const prefix = encoder.encode(
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:brobex="https://brobex.example/ns/"><brobex:Padding>'
  );
  const suffix = encoder.encode(
    "</brobex:Padding></rdf:Description></rdf:RDF></x:xmpmeta>"
  );

  const parts: Uint8Array[] = [data];
  let currentSize = data.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.max(prefix.length + suffix.length + 1, remaining - 8);
    const payload = new Uint8Array(payloadLength);
    payload.set(prefix);
    payload.fill(32, prefix.length, payloadLength - suffix.length);
    payload.set(suffix, payloadLength - suffix.length);

    const chunk = new Uint8Array(8 + payloadLength + (payloadLength & 1));
    chunk.set(encoder.encode("XMP "), 0);
    chunk.set(writeU32LE(payloadLength), 4);
    chunk.set(payload, 8);
    parts.push(chunk);
    currentSize += chunk.length;
  }

  const output = concatBytes(...parts);
  output.set(writeU32LE(output.length - 8), 4);
  return output;
}

async function convertImage(file: File, format: string): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser cannot process this image.");

    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Your browser could not export this format."));
          return;
        }
        if (blob.type.toLowerCase() !== format) {
          reject(new Error(`Your browser does not support ${format.replace("image/", "").toUpperCase()} export. Choose another format.`));
          return;
        }
        resolve(blob);
      }, format, 0.95);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function increaseImageFileSize(
  file: File,
  targetBytes: number,
  outputFormat: IncreaseImageFormat = "original",
): Promise<IncreaseImageResult> {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error("Choose a non-empty image file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("This tool supports images up to 25 MB.");
  }
  if (!Number.isSafeInteger(targetBytes) || targetBytes < 1 || targetBytes > MAX_TARGET_BYTES) {
    throw new Error("Choose a target between 1 byte and 50 MB.");
  }

  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const sourceFormat = detectFormat(sourceBytes);
  const sourceUrl = URL.createObjectURL(file);
  let width = 0;
  let height = 0;

  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    width = image.naturalWidth;
    height = image.naturalHeight;
  } catch {
    throw new Error("Your browser could not decode this image. Try another file or browser.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }

  if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("This image is too large to process safely in your browser (maximum 40 megapixels).");
  }

  const format = outputFormat === "original" ? sourceFormat : outputFormat;
  const converted = format !== sourceFormat;

  if (outputFormat === "original" && sourceFormat === "image/avif") {
    throw new Error("Original AVIF padding is not supported. Choose JPG, PNG or WebP to convert this image.");
  }

  let baseBlob: Blob = file;
  if (converted) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(format)) {
      throw new Error("Choose JPG, PNG or WebP for conversion.");
    }
    baseBlob = await convertImage(file, format);
  }

  if (baseBlob.size >= targetBytes) {
    return {
      blob: baseBlob,
      width,
      height,
      reachedTarget: true,
      message: converted
        ? `Converted to ${format.split("/")[1].toUpperCase()}. The converted file already meets your minimum target.`
        : "The original image already meets your minimum target. No file changes were needed.",
    };
  }

  const bytes = new Uint8Array(await baseBlob.arrayBuffer());
  let output: Uint8Array;

  switch (format) {
    case "image/jpeg":
      output = padJpeg(bytes, targetBytes);
      break;
    case "image/png":
      output = padPng(bytes, targetBytes);
      break;
    case "image/gif":
      output = padGif(bytes, targetBytes);
      break;
    case "image/webp":
      output = padWebp(bytes, targetBytes, width, height);
      break;
    default:
      throw new Error("Safe original-format padding is not supported for this image. Choose JPG, PNG or WebP instead.");
  }

  const outputBuffer = new ArrayBuffer(output.byteLength);
  new Uint8Array(outputBuffer).set(output);
  const blob = new Blob([outputBuffer], { type: format });
  return {
    blob,
    width,
    height,
    reachedTarget: blob.size >= targetBytes,
    message: converted
      ? `Converted to ${format.split("/")[1].toUpperCase()} and increased the file size. Dimensions were preserved.`
      : "File size increased using format metadata. The image dimensions and visual image data were preserved.",
  };
}

