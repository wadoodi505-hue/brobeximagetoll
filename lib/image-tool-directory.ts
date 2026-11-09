import { tools } from "@/lib/tools";

export type DirectoryTool = {
  name: string;
  slug?: string;
  description?: string;
};

export type DirectoryCategory = {
  name: string;
  tools: DirectoryTool[];
};

const item = (name: string, slug?: string, description?: string): DirectoryTool => ({ name, slug, description });

const curatedToolCategories: DirectoryCategory[] = [
  {
    name: "Most Used Tools",
    tools: [
      item("Passport & ID Photo Maker", "passport-photo-maker", "Prepare passport and ID photos with common document dimensions."),
      item("Compress Image to Target KB", "compress-image-size", "Reduce file size to meet upload limits and sharing requirements."),
      item("Resize Image Dimensions", "resize-image-dimensions", "Set exact pixel width and height for your image."),
      item("Bulk Image Resizer", "bulk-image-resizer", "Resize multiple images and download them together as a ZIP archive."),
      item("Text to Handwriting Converter", undefined, "Turn typed text into a handwriting-style image."),
      item("Extract Text from Image (OCR)", "image-to-text", "Recognize text in photos and make it editable."),
      item("Create Photo Collages", "collage-maker", "Arrange multiple photos into one collage layout."),
      item("Signature Generator", "signature-generator", "Draw or type a digital signature and export a transparent PNG."),
      item("Increase Image File Size", "increase-image-file-size", "Adjust image output size for a required file limit."),
      item("Manual Photo Enhancement", "upscale-image", "Improve image dimensions with browser-based resampling."),
      item(
        "Signature Image Resizer",
        "signature-image-resizer",
        "Resize a signature image to exact print dimensions in centimeters and DPI."
      ),
      item("Resize Image in Centimeters", "signature-image-resizer", "Prepare images using physical dimensions in centimeters and print DPI."),
      item("Resize Photo to 3.5 Ã— 4.5 cm", undefined, "Create a photo at the common 3.5 Ã— 4.5 cm size.")
    ]
  },
  {
    name: "Basic Editing",
    tools: [
      item("Blur Background", "blur-background", "Keep the detected subject sharp while softening the background."),
      item("Remove Background", "remove-background-from-image", "Create a transparent cutout using local browser AI segmentation."),
      item("Remove Text from Image"),
      item("Remove Logo from Photo"),
      item("Remove Object from Photo", "blur-any-object", "Paint over unwanted objects and reconstruct the selected area with the browser inpainting workspace."),
      item("Add Text to Image", "add-text-to-image"),
      item("Rotate & Flip Image", "flip-image"),
      item("Add Text to Image", "add-text-to-image"),
      item("Crop Image", "crop-image", "Free crop, square, 16:9, triangle, hexagon and circular image cropping."),
      item("Crop Round Corners", "crop-round-corners"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Combine Multiple Images", "combine-images"),
      item("Photos to Video"),
      item("JPG to MP4"),
      item("Slideshow Maker"),
      item("Word to JPG"),
      item("MP4 to JPG"),
      item("Split Image into Grid", "image-splitter"),
      item("Image Color Picker", "image-color-picker"),
      item("Edit Metadata", "edit-metadata"),
      item("View Image Properties & Metadata", "view-metadata"),
      item("Remove Metadata", "remove-metadata"),

    ]
  },
  {
    name: "Blur, Pixelate and Special Effects",
    tools: [
      item("Beautify Image", "colorize-photo"),
      item("Deep Fry Photo"),
      item("Unblur Image"),
      item("Blur Image", "blur-image", "Apply adjustable blur to the full image while preserving the original file."),
      item("Make Background Transparent", "make-background-transparent", "Create a transparent subject cutout using local browser AI segmentation."),
      item("Square Crop", "square-crop", "Crop any image to a precise 1:1 square with adjustable framing."),
      item("Triangle Crop", "triangle-crop", "Create a triangular image crop with transparent exterior pixels."),
      item("Shape Crop", "shape-crop", "Create a hexagon-shaped image crop with transparent exterior pixels."),
      item("Make Round Image", "make-round-image", "Create a circular image with transparent corners."),
      item("Blur Face", "blur-any-object"),
      item("Unblur Face"),
      item("Add Image Border", "add-border-to-image"),
      item("Pixelate Image", "pixelate-image"),
      item("Pixelate Image", "pixelate-image"),
      item("Pixelate Image", "pixelate-image"),
      item("Motion Blur"),
      item("Convert Image to Black & White", "black-white"),
      item("Convert Image to Black & White", "black-white"),
      item("Pixelate Image", "pixelate-image"),
      item("Add Image Border", "add-border-to-image"),
      item("AI Face Generator"),
      item("Blemishes Remover", "blemishes-remover"),
      item("Retouch Image", "colorize-photo"),
      item("Add Text to Image", "add-text-to-image"),
      item("Overlay Images", "overlay-images")
    ]
  },
  {
    name: "DPI & Quality",
    tools: [
      item("Manual Photo Enhancement", "upscale-image"),
      item("Convert DPI (200, 300, 600)"),
      item("View Image Properties & Metadata", "view-metadata"),
      item("Manual Photo Enhancement", "upscale-image")
    ]
  },
  {
    name: "General Resizing",
    tools: [
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Bulk Image Resizer"),
      item("Manual Photo Enhancement", "upscale-image")
    ]
  },
  {
    name: "Resize Other Official Sizes",
    tools: [
      item("A4 Size", "a4-size"),
      item("SSC Photo Resize"),
      item("PAN Card"),
      item("UPSC Photo"),
      item("PSC Photo")
    ]
  },
  {
    name: "Passport & ID Photo Sizes",
    tools: [
      item("Red Background Passport"),
      item("White Background Passport"),
      item("Resize Passport"),
      item("Sign 6cm x 2cm (300 DPI)"),
      item("3.5cm x 4.5cm"),
      item("Signature 50mm x 20mm"),
      item("35mm x 45mm"),
      item("2 x 2 Inch"),
      item("3 x 4 Inch"),
      item("4 x 6 Inch"),
      item("600x600 Pixels")
    ]
  },
  {
    name: "Resize For Social Media",
    tools: [
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Split Image into Grid", "image-splitter"),
      item("Circular Profile Photo Maker", "profile-photo-maker"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Resize Image Dimensions", "resize-image-dimensions")
    ]
  },
  {
    name: "Format Conversions",
    tools: [
      item("Image Converter"),
      item("Convert PNG to JPG", "png-to-jpg"),
      item("Convert PNG to JPG", "png-to-jpg"),
      item("HEIC to JPG", "heic-to-jpg"),
      item("Convert WebP to JPG", "webp-to-jpg"),
      item("Convert WebP to PNG", "webp-to-png"),
      item("AVIF to JPG", "jpg-to-avif"),
      item("Convert PNG to JPG", "png-to-jpg"),
      item("Convert JPG to PNG", "jpg-to-png"),
      item("Convert PNG to JPG", "png-to-jpg"),
      item("PNG to ICO"),
      item("Image to Word"),
      item("Extract Text from Image (OCR)", "image-to-text"),
      item("Extract Text from Image (OCR)", "image-to-text"),
      item("Export Font Awesome Icons to PNG", "font-awesome-to-png")
    ]
  },
  {
    name: "Image to PDF",
    tools: [
      item("Image to PDF", "jpg-to-pdf"),
      item("PDF to JPG", "pdf-to-jpg"),
      item("JPG to PDF (Under 50KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 100KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 150KB)", "jpg-to-pdf"),
      item("JPEG to PDF (Under 200KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 250KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 300KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 400KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 500KB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 1MB)", "jpg-to-pdf"),
      item("JPG to PDF (Under 2MB)", "jpg-to-pdf")
    ]
  },
  {
    name: "General Compression",
    tools: [
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Convert MB to KB", "convert-mb-to-kb", "Convert megabytes into kilobytes."),
      item("Convert KB to MB", "convert-kb-to-mb", "Convert kilobytes into megabytes."),
      item("Compress PDF", "compress-pdf", "Optimize PDF structure locally where possible.")
    ]
  },
  {
    name: "Exact Target Sizes",
    tools: [
      item("Compress to 5KB", "compress-image-to-5kb", "Fixed target: 5 KB"),
      item("JPEG to 10KB", "compress-jpeg-to-10kb", "Fixed target: 10 KB"),
      item("Compress to 15KB", "compress-image-to-15kb", "Fixed target: 15 KB"),
      item("Compress to 20KB", "compress-image-to-20kb", "Fixed target: 20 KB"),
      item("Compress 20KB–50KB", "compress-jpeg-between-20kb-to-50kb", "Fixed target: 50 KB"),
      item("JPEG to 25KB", "compress-jpeg-to-25kb", "Fixed target: 25 KB"),
      item("JPEG to 30KB", "compress-jpeg-to-30kb", "Fixed target: 30 KB"),
      item("JPEG to 40KB", "compress-jpeg-to-40kb", "Fixed target: 40 KB"),
      item("Compress to 50KB", "compress-image-to-50kb", "Fixed target: 50 KB"),
      item("Compress to 60KB", "compress-image-to-60kb", "Fixed target: 60 KB"),
      item("Compress to 70KB", "compress-image-to-70kb", "Fixed target: 70 KB"),
      item("Compress to 80KB", "compress-image-to-80kb", "Fixed target: 80 KB"),
      item("Compress to 90KB", "compress-image-to-90kb", "Fixed target: 90 KB"),
      item("Resize to 50KB", "resize-image-to-50kb", "Fixed target: 50 KB"),
      item("Compress to 100KB", "compress-image-to-100kb", "Fixed target: 100 KB"),
      item("JPEG to 150KB", "compress-jpeg-to-150kb", "Fixed target: 150 KB"),
      item("Compress to 200KB", "compress-image-to-200kb", "Fixed target: 200 KB"),
      item("Resize to 200KB", "resize-image-to-200kb", "Fixed target: 200 KB"),
      item("JPEG to 300KB", "compress-jpeg-to-300kb", "Fixed target: 300 KB"),
      item("JPEG to 500KB", "compress-jpeg-to-500kb", "Fixed target: 500 KB"),
      item("Compress to 1MB", "compress-image-to-1mb", "Fixed target: 1 MB"),
      item("Compress to 2MB", "compress-image-to-2mb", "Fixed target: 2 MB")
    ]
  }
];


// Build one canonical directory with exactly ten categories. Curated entries
// retain useful preset labels; every registered route is added if not already
// represented. Duplicate name/route pairs are removed without losing presets.
const categoryNames = [
  "Image Editing",
  "Image Compression",
  "Image Resizing",
  "Background & Object Tools",
  "Photo Enhancement",
  "Passport & ID Photos",
  "Image Converters",
  "PDF & Documents",
  "OCR & Text Tools",
  "Creative & Media Tools"
] as const;

function classifyDirectoryTool(tool: DirectoryTool): (typeof categoryNames)[number] {
  const value = `${tool.name} ${tool.slug ?? ""} ${tool.description ?? ""}`.toLowerCase();

  if (/passport|\bid photo\b|3\.5|35mm|45mm|2 ?x ?2|3 ?x ?4|4 ?x ?6|600 ?x ?600|ssc photo|pan card|upsc|psc photo|signature.*(cm|mm)|a4 photo/.test(value)) {
    return "Passport & ID Photos";
  }

  if (/compress|\bkb\b|\bmb\b|target size/.test(value)) {
    return "Image Compression";
  }

  if (/pdf|word to jpg|image to word|merge pdf|split pdf/.test(value)) {
    return "PDF & Documents";
  }

  if (/ocr|extract text|translate image|handwriting|essay|paragraph|content improver|tiff to text/.test(value)) {
    return "OCR & Text Tools";
  }

  // Check creative tools BEFORE transparent-image tools.
  // This prevents Signature Generator from being incorrectly categorized.
  if (/video|mp4|slideshow|collage|signature generator|font awesome|chart maker|icon.*png/.test(value)) {
    return "Creative & Media Tools";
  }

  if (/background|remove object|remove logo|remove text|transparent/.test(value)) {
    return "Background & Object Tools";
  }

  if (/beautify|enhanc|unblur|blur|pixelat|retouch|face|deep fry|colorize|upscale|quality/.test(value)) {
    return "Photo Enhancement";
  }

  if (/convert|\.png|png to|jpg to|jpeg to|webp|heic|avif|tiff|svg|ico|gif|eps|psd/.test(value)) {
    return "Image Converters";
  }

  if (/resize|dimension|centimeter|social media|bulk resiz|dpi/.test(value)) {
    return "Image Resizing";
  }

  return "Image Editing";
}
const allDirectoryTools: DirectoryTool[] = [];
const seenDirectoryEntries = new Set<string>();
const representedSlugs = new Set<string>();

for (const category of curatedToolCategories) {
  for (const entry of category.tools) {
    const key = `${entry.slug ?? "no-route"}::${entry.name.trim().toLowerCase()}`;
    if (seenDirectoryEntries.has(key)) continue;
    seenDirectoryEntries.add(key);
    allDirectoryTools.push(entry);
    if (entry.slug) representedSlugs.add(entry.slug);
  }
}

for (const registeredTool of tools) {
  if (representedSlugs.has(registeredTool.slug)) continue;
  const entry = item(registeredTool.name, registeredTool.slug, registeredTool.description);
  const key = `${entry.slug}::${entry.name.trim().toLowerCase()}`;
  if (!seenDirectoryEntries.has(key)) {
    seenDirectoryEntries.add(key);
    allDirectoryTools.push(entry);
  }
  representedSlugs.add(registeredTool.slug);
}

export const imageToolCategories: DirectoryCategory[] = categoryNames.map((name) => ({
  name,
  tools: allDirectoryTools.filter((entry) => classifyDirectoryTool(entry) === name)
}));

const registeredSlugs = new Set(tools.map((tool) => tool.slug));

export function getDirectoryToolHref(tool: DirectoryTool): string | undefined {
  if (!tool.slug || !registeredSlugs.has(tool.slug)) return undefined;
  return `/tools/${tool.slug}`;
}

export function getDirectoryToolState(tool: DirectoryTool): {
  href: string | null;
  available: boolean;
} {
  if (!tool.slug) return { href: null, available: false };

  const registeredTool = tools.find((entry) => entry.slug === tool.slug);
  if (!registeredTool) return { href: null, available: false };

  const available = registeredTool.status === "browser";

  return {
    // An integration-only item must not expose a navigable destination.
    href: available ? `/tools/${registeredTool.slug}` : null,
    available
  };
}


