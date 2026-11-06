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

function readAscii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function concatBytes(...parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
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

function uint32(value: number) {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  const body = concatBytes(typeBytes, data);

  return concatBytes(
    uint32(data.length),
    body,
    uint32(crc32(body)),
  );
}

function padJpeg(bytes: Uint8Array, target: number) {
  if (
    bytes.length < 4 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    throw new Error("This JPEG file has no valid end marker.");
  }

  const original = bytes.slice(0, -2);
  const end = bytes.slice(-2);
  const parts: Uint8Array[] = [original];

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

  parts.push(end);
  return concatBytes(...parts);
}

function padPng(bytes: Uint8Array, target: number) {
  if (readAscii(bytes, 0, 8) !== "\x89PNG\r\n\x1a\n") {
    throw new Error("This PNG file has an invalid signature.");
  }

  let iend = -1;

  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length =
      bytes[offset] * 0x1000000 +
      (bytes[offset + 1] << 16) +
      (bytes[offset + 2] << 8) +
      bytes[offset + 3];

    const type = readAscii(bytes, offset + 4, 4);

    if (type === "IEND") {
      iend = offset;
      break;
    }

    offset += 12 + length;
  }

  if (iend < 0) {
    throw new Error("This PNG file has no valid IEND chunk.");
  }

  const parts: Uint8Array[] = [bytes.slice(0, iend)];
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

  parts.push(bytes.slice(iend));
  return concatBytes(...parts);
}

function padGif(bytes: Uint8Array, target: number) {
  if (readAscii(bytes, 0, 3) !== "GIF") {
    throw new Error("This GIF file has an invalid signature.");
  }

  const trailer = bytes.lastIndexOf(0x3b);

  if (trailer < 0) {
    throw new Error("This GIF file has no valid trailer.");
  }

  const parts: Uint8Array[] = [bytes.slice(0, trailer)];
  let currentSize = bytes.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.min(255, Math.max(1, remaining - 3));
    const extension = new Uint8Array(payloadLength + 3);

    extension[0] = 0x21;
    extension[1] = 0xfe;
    extension[2] = payloadLength;
    extension.fill(32, 3);
    parts.push(extension, new Uint8Array([0]));
    currentSize += extension.length + 1;
  }

  parts.push(bytes.slice(trailer));
  return concatBytes(...parts);
}

function padWebp(bytes: Uint8Array, target: number, width: number, height: number) {
  if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 4) !== "WEBP") {
    throw new Error("This WebP file has an invalid RIFF header.");
  }

  let data = bytes;
  let hasExtendedHeader = false;

  for (let offset = 12; offset + 8 <= data.length;) {
    const type = readAscii(data, offset, 4);
    const length =
      data[offset + 4] |
      (data[offset + 5] << 8) |
      (data[offset + 6] << 16) |
      (data[offset + 7] << 24);

    if (type === "VP8X") {
      hasExtendedHeader = true;
      break;
    }

    offset += 8 + length + (length & 1);
  }

  if (!hasExtendedHeader) {
    const header = new Uint8Array(18);
    header.set(new TextEncoder().encode("VP8X"), 0);
    header[4] = 10;
    header[8] = 0x04;

    const w = Math.max(0, width - 1);
    const h = Math.max(0, height - 1);

    header[12] = w & 255;
    header[13] = (w >>> 8) & 255;
    header[14] = (w >>> 16) & 255;
    header[15] = h & 255;
    header[16] = (h >>> 8) & 255;
    header[17] = (h >>> 16) & 255;

    data = concatBytes(data.slice(0, 12), header, data.slice(12));
  } else {
    data = data.slice();
    data[20] |= 0x04;
  }

  const parts: Uint8Array[] = [data];
  let currentSize = data.length;

  while (currentSize < target) {
    const remaining = target - currentSize;
    const payloadLength = Math.max(1, remaining - 8);
    const payload = new Uint8Array(payloadLength);
    payload.fill(32);

    const chunk = new Uint8Array(8 + payloadLength + (payloadLength & 1));
    chunk.set(new TextEncoder().encode("XMP "), 0);
    chunk[4] = payloadLength & 255;
    chunk[5] = (payloadLength >>> 8) & 255;
    chunk[6] = (payloadLength >>> 16) & 255;
    chunk[7] = (payloadLength >>> 24) & 255;
    chunk.set(payload, 8);

    parts.push(chunk);
    currentSize += chunk.length;
  }

  const output = concatBytes(...parts);
  const riffSize = output.length - 8;

  output[4] = riffSize & 255;
  output[5] = (riffSize >>> 8) & 255;
  output[6] = (riffSize >>> 16) & 255;
  output[7] = (riffSize >>> 24) & 255;

  return output;
}

async function convertImage(
  file: File,
  format: string,
): Promise<Blob> {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser cannot process this image.");
    }

    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The selected output format is not supported by this browser."));
            return;
          }

          if (blob.type.toLowerCase() !== format.toLowerCase()) {
            const requested = format.replace("image/", "").toUpperCase();
            reject(
              new Error(
                `Your browser could not export ${requested}. Choose another output format or use Original format.`,
              ),
            );
            return;
          }

          resolve(blob);
        },
        format,
        0.95,
      );
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
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("This tool supports images up to 25 MB.");
  }

  const sourceUrl = URL.createObjectURL(file);
  let width = 0;
  let height = 0;

  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    width = image.naturalWidth;
    height = image.naturalHeight;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }

  if (!width || !height) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const format = outputFormat === "original" ? file.type : outputFormat;

  let baseBlob: Blob = file;
  const converted = format !== file.type;

  if (converted) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(format)) {
      throw new Error("Choose JPG, PNG or WebP for format conversion.");
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
        ? "Image converted to the selected format. Its file size already meets your target."
        : "The original image already meets your requested minimum size. No changes were needed.",
    };
  }

  const bytes = new Uint8Array(await baseBlob.arrayBuffer());
  let padded: Uint8Array;

  switch (format) {
    case "image/jpeg":
      padded = padJpeg(bytes, targetBytes);
      break;
    case "image/png":
      padded = padPng(bytes, targetBytes);
      break;
    case "image/gif":
      padded = padGif(bytes, targetBytes);
      break;
    case "image/webp":
      padded = padWebp(bytes, targetBytes, width, height);
      break;
    default:
      throw new Error(
        "Safe file-size padding is not supported for this original format. Choose JPG, PNG or WebP instead.",
      );
  }

  const blobBytes = new ArrayBuffer(padded.byteLength);
  new Uint8Array(blobBytes).set(padded);
  const blob = new Blob([blobBytes], { type: format });

  return {
    blob,
    width,
    height,
    reachedTarget: blob.size >= targetBytes,
    message: converted
      ? `Converted to ${format.split("/")[1].toUpperCase()} and increased using format metadata. Dimensions were preserved.`
      : "File size increased using format metadata. The original image dimensions and visual image data were preserved.",
  };
}

