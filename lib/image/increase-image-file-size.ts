export type IncreaseImageResult = {
  blob: Blob;
  width: number;
  height: number;
  reachedTarget: boolean;
  message: string;
};

export async function increaseImageFileSize(
  file: File,
  targetBytes: number,
): Promise<IncreaseImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error("This tool supports images up to 25 MB.");
  }

  const imageUrl = URL.createObjectURL(file);

  let width = 0;
  let height = 0;

  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    width = image.naturalWidth;
    height = image.naturalHeight;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }

  if (!width || !height) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const requestedBytes = Math.max(1, Math.round(targetBytes));
  const paddingBytes = Math.max(0, requestedBytes - file.size);

  // Keep every original byte unchanged. Only append padding.
  const padding = new Uint8Array(paddingBytes);
  const output = new Blob([file, padding], {
    type: file.type,
  });

  return {
    blob: output,
    width,
    height,
    reachedTarget: output.size >= requestedBytes,
    message:
      paddingBytes > 0
        ? "File size increased using padding. Original image data and pixels were not modified."
        : "The original image already meets your requested minimum size. No changes were made.",
  };
}