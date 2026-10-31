import { tools } from "@/lib/tools";

export type DirectoryTool = {
  name: string;
  slug?: string;
};

export type DirectoryCategory = {
  name: string;
  tools: DirectoryTool[];
};

const item = (name: string, slug?: string): DirectoryTool => ({ name, slug });

export const imageToolCategories: DirectoryCategory[] = [
  {
    name: "Most Used Tools",
    tools: [
      item("Passport Photo Maker", "passport-photo-maker"),
      item("Reduce Image Size in KB", "compress-image-size"),
      item("Resize Image Pixel", "resize-image-dimensions"),
      item("Text to Handwriting"),
      item("Image to Text (OCR)", "image-to-text"),
      item("Photo Collage Maker", "collage-maker"),
      item("Generate Signature"),
      item("Increase Image Size In KB"),
      item("AI Photo Enhancer", "upscale-image"),
      item("Resize Signature"),
      item("Resize Image In Centimeter"),
      item("Resize Image (3.5cm x 4.5cm)")
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
      item("Add Name & DOB on Photo", "add-text-to-image"),
      item("Rotate Image", "flip-image"),
      item("Flip Image", "flip-image"),
      item("Watermark Images", "add-text-to-image"),
      item("Freehand Crop", "crop-image"),
      item("Circle Crop", "make-round-image"),
      item("Square Crop", "crop-image"),
      item("Crop Round Corners"),
      item("Change Aspect Ratio", "resize-image-dimensions"),
      item("Merge Photo & Signature", "combine-images"),
      item("Join Multiple Images", "combine-images"),
      item("Photos to Video"),
      item("JPG to MP4"),
      item("Slideshow Maker"),
      item("Word to JPG"),
      item("MP4 to JPG"),
      item("Split Image", "image-splitter"),
      item("Image Color Picker"),
      item("Edit Metadata"),
      item("View Metadata", "view-metadata"),
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
      item("Add Border To Image", "add-border-to-image"),
      item("Pixelate Image", "pixelate-image"),
      item("Pixelate Face", "pixelate-image"),
      item("Censor Photo", "pixelate-image"),
      item("Motion Blur"),
      item("Grayscale Image", "black-white"),
      item("Black & White Picture", "black-white"),
      item("Picture to Pixel Art", "pixelate-image"),
      item("Add White Border To Image", "add-border-to-image"),
      item("AI Face Generator"),
      item("Blemishes Remover"),
      item("Retouch Image", "colorize-photo"),
      item("Add Text to Image", "add-text-to-image"),
      item("Add Logo to Image", "add-images-to-image")
    ]
  },
  {
    name: "DPI & Quality",
    tools: [
      item("Increase Image Quality", "upscale-image"),
      item("Convert DPI (200, 300, 600)"),
      item("Check Image DPI", "view-metadata"),
      item("Super Resolution", "upscale-image")
    ]
  },
  {
    name: "General Resizing",
    tools: [
      item("Resize Image by Pixel", "resize-image-dimensions"),
      item("Resize in Centimeters", "resize-image-dimensions"),
      item("Resize in Millimeters", "resize-image-dimensions"),
      item("Resize in Inches", "resize-image-dimensions"),
      item("Bulk Image Resizer"),
      item("Upscale Image With AI", "upscale-image")
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
      item("Instagram (No Crop)", "resize-image-dimensions"),
      item("Instagram Grid Maker", "image-splitter"),
      item("WhatsApp DP", "profile-photo-maker"),
      item("YouTube Banner", "resize-image-dimensions"),
      item("Zoom Out Image", "resize-image-dimensions")
    ]
  },
  {
    name: "Format Conversions",
    tools: [
      item("Image Converter"),
      item("Image to JPG", "png-to-jpg"),
      item("JPEG to JPG", "png-to-jpg"),
      item("HEIC to JPG", "heic-to-jpg"),
      item("WEBP to JPG", "webp-to-jpg"),
      item("WebP to PNG", "webp-to-png"),
      item("AVIF to JPG", "jpg-to-avif"),
      item("JFIF to JPG", "png-to-jpg"),
      item("JPEG to PNG", "jpg-to-png"),
      item("PNG to JPEG", "png-to-jpg"),
      item("PNG to ICO"),
      item("Image to Word"),
      item("JPG to Text", "image-to-text"),
      item("PNG to Text", "image-to-text"),
      item("Favicon Generator", "font-awesome-to-png")
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
      item("Image Compressor", "compress-image-size"),
      item("Reduce Size in KB", "compress-image-size"),
      item("Reduce Size in MB", "compress-image-size"),
      item("JPG to KB", "compress-image-size"),
      item("Convert MB to KB"),
      item("Convert KB to MB")
    ]
  },
  {
    name: "Exact Target Sizes",
    tools: [
      item("Compress to 5KB", "compress-image-size"),
      item("JPEG to 10KB", "compress-image-size"),
      item("Compress to 15KB", "compress-image-size"),
      item("Compress to 20KB", "compress-image-size"),
      item("Compress 20KB-50KB", "compress-image-size"),
      item("JPEG to 25KB", "compress-image-size"),
      item("JPEG to 30KB", "compress-image-size"),
      item("JPEG to 40KB", "compress-image-size"),
      item("Compress to 50KB", "compress-image-size"),
      item("Compress to 60KB", "compress-image-size"),
      item("Compress to 70KB", "compress-image-size"),
      item("Compress to 80KB", "compress-image-size"),
      item("Compress to 90KB", "compress-image-size"),
      item("Resize to 50KB", "compress-image-size"),
      item("Compress to 100KB", "compress-image-size"),
      item("JPEG to 150KB", "compress-image-size"),
      item("Compress to 200KB", "compress-image-size"),
      item("Resize to 200KB", "compress-image-size"),
      item("JPEG to 300KB", "compress-image-size"),
      item("JPEG to 500KB", "compress-image-size"),
      item("Compress to 1MB", "compress-image-size"),
      item("Compress to 2MB", "compress-image-size")
    ]
  }
];

const registeredSlugs = new Set(tools.map((tool) => tool.slug));

export function getDirectoryToolHref(tool: DirectoryTool): string | undefined {
  if (!tool.slug || !registeredSlugs.has(tool.slug)) return undefined;
  return `/tools/${tool.slug}`;
}


