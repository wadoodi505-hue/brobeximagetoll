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

export const imageToolCategories: DirectoryCategory[] = [
  {
    name: "Most Used Tools",
    tools: [
      item("Passport & ID Photo Maker", "passport-photo-maker", "Prepare passport and ID photos with common document dimensions."),
      item("Compress Image to Target KB", "compress-image-size", "Reduce file size to meet upload limits and sharing requirements."),
      item("Resize Image Dimensions", "resize-image-dimensions", "Set exact pixel width and height for your image."),
      item("Text to Handwriting Converter", undefined, "Turn typed text into a handwriting-style image."),
      item("Extract Text from Image (OCR)", "image-to-text", "Recognize text in photos and make it editable."),
      item("Create Photo Collages", "collage-maker", "Arrange multiple photos into one collage layout."),
      item("Signature Generator", undefined, "Create a clean digital signature for documents."),
      item("Increase Image File Size", undefined, "Adjust image output size for a required file limit."),
      item("Manual Photo Enhancement", "upscale-image", "Improve image dimensions with browser-based resampling."),
      item("Signature Image Resizer", undefined, "Resize a signature image to specified dimensions."),
      item("Resize Image in Centimeters", undefined, "Prepare images using physical dimensions in centimeters."),
      item("Resize Photo to 3.5 × 4.5 cm", undefined, "Create a photo at the common 3.5 × 4.5 cm size.")
    ]
  },
  {
    name: "Basic Editing",
    tools: [
      item("Blur Background", "blur-background"),
      item("Remove Background", "remove-background-from-image"),
      item("Remove Text from Image"),
      item("Remove Logo from Photo"),
      item("Remove Object from Photo", "blur-any-object"),
      item("Add Text to Image", "add-text-to-image"),
      item("Rotate Image", "flip-image"),
      item("Flip Image", "flip-image"),
      item("Add Text to Image", "add-text-to-image"),
      item("Freehand Crop", "crop-image"),
      item("Create Circular Image", "make-round-image"),
      item("Square Crop", "crop-image"),
      item("Crop Round Corners"),
      item("Resize Image Dimensions", "resize-image-dimensions"),
      item("Combine Multiple Images", "combine-images"),
      item("Combine Multiple Images", "combine-images"),
      item("Photos to Video"),
      item("JPG to MP4"),
      item("Slideshow Maker"),
      item("Word to JPG"),
      item("MP4 to JPG"),
      item("Split Image into Grid", "image-splitter"),
      item("Image Color Picker"),
      item("Edit Metadata"),
      item("View Image Properties & Metadata", "view-metadata"),
      item("Remove Metadata"),
      item("Crop PNG", "crop-image")
    ]
  },
  {
    name: "Blur, Pixelate and Special Effects",
    tools: [
      item("Beautify Image", "colorize-photo"),
      item("Deep Fry Photo"),
      item("Unblur Image"),
      item("Blur Image", "blur-background"),
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
      item("Blemishes Remover"),
      item("Retouch Image", "colorize-photo"),
      item("Add Text to Image", "add-text-to-image"),
      item("Overlay Images", "add-images-to-image")
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
      item("A4 Size"),
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
      item("Convert MB to KB"),
      item("Convert KB to MB")
    ]
  },
  {
    name: "Exact Target Sizes",
    tools: [
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size"),
      item("Compress Image to Target KB", "compress-image-size")
    ]
  }
];

const registeredSlugs = new Set(tools.map((tool) => tool.slug));

export function getDirectoryToolHref(tool: DirectoryTool): string | undefined {
  if (!tool.slug || !registeredSlugs.has(tool.slug)) return undefined;
  return `/tools/${tool.slug}`;
}



export function getDirectoryToolState(tool: DirectoryTool): {
  href: string | null;
  available: boolean;
} {
  if (!tool.slug) {
    return { href: null, available: false };
  }

  const registeredTool = tools.find((entry) => entry.slug === tool.slug);

  if (!registeredTool || registeredTool.status !== "browser") {
    return { href: null, available: false };
  }

  return {
    href: `/tools/${registeredTool.slug}`,
    available: true
  };
}
