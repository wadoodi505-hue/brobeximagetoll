import type { ToolDefinition, Category } from "@/types/tools";

export const tools: ToolDefinition[] = [
  {
    "slug": "remove-background-from-image",
    "name": "Remove Background from Image",
    "description": "Remove an image background with a configured segmentation provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "browser"
  },
  {
<<<<<<< HEAD
    slug: "upscale-image",
    name: "Upscale Image",
    description:
      "Increase image resolution by 2×, 3×, or 4× with high-quality browser resampling and downloadable PNG, JPEG, or WebP output.",
    category: "image",
    icon: "WandSparkles",
    acceptedTypes: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"],
    method: "Local browser canvas resampling",
    status: "browser"
=======
    "slug": "upscale-image",
    "name": "Upscale Image",
    "description": "Increase image resolution using an AI upscaling provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
>>>>>>> origin/main
  },
  {
    "slug": "remove-watermark",
    "name": "Remove Watermark",
    "description": "Requires a specialized image restoration provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "remove-objects-from-photo",
    "name": "Remove Objects from Photo",
    "description": "Remove selected objects using an image inpainting provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "unblur-image",
    "name": "Unblur Image",
    "description": "Restore detail with a configured image restoration provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "remove-person-from-photo",
    "name": "Remove Person from Photo",
    "description": "Remove a selected person using an image inpainting provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "photo-cleanup",
    "name": "Photo Cleanup",
    "description": "Clean scratches, dust, and imperfections using an image restoration provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "colorize-photo",
    "name": "Colorize Photo",
    "description": "Colorize monochrome photographs with an AI provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "make-background-transparent",
    "name": "Make Background Transparent",
    "description": "Create transparency using a background segmentation provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "blur-background",
    "name": "Blur Background",
    "description": "Blur a background; segmentation-based subject isolation requires a provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "translate-image",
    "name": "Translate Image",
    "description": "Detect and translate image text using OCR and translation providers.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "image-to-text",
    "name": "Image to Text",
    "description": "Extract text from images using an OCR provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "tiff-to-text",
    "name": "TIFF to Text",
    "description": "Extract text from TIFF files using a TIFF decoder and OCR provider.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "AI provider / OCR integration",
    "status": "integration"
  },
  {
    "slug": "resize-image-dimensions",
    "name": "Resize Image Dimensions",
    "description": "Change image width and height with optional aspect-ratio locking",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "resize"
  },
  {
    "slug": "compress-image-size",
    "name": "Compress Image Size",
    "description": "Reduce image file size by choosing an output format and quality",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "compress"
  },
  {
    "slug": "crop-image",
    "name": "Crop Image",
    "description": "Crop an image using coordinates and dimensions",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "crop"
  },
  {
    "slug": "flip-image",
    "name": "Flip Image",
    "description": "Flip horizontally or vertically and rotate raster images",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "flip"
  },
  {
    "slug": "black-white",
    "name": "Black & White",
    "description": "Convert an image to grayscale",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "grayscale"
  },
  {
    "slug": "pixelate-image",
    "name": "Pixelate Image",
    "description": "Create a pixelated effect with an adjustable block size",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "pixelate"
  },
  {
    "slug": "add-text-to-image",
    "name": "Add Text to an Image",
    "description": "Add customizable text to an image",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "text"
  },
  {
    "slug": "add-border-to-image",
    "name": "Add Border to Image",
    "description": "Add a solid border around an image",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "border"
  },
  {
    "slug": "combine-images",
    "name": "Combine Images",
    "description": "Combine multiple images into a vertical composition",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "combine"
  },
  {
    "slug": "add-images-to-image",
    "name": "Add Images to Image",
    "description": "Overlay/compose multiple images; current workspace combines uploaded images vertically",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "combine"
  },
  {
    "slug": "make-round-image",
    "name": "Make Round Image",
    "description": "Export a circular crop with transparent corners",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "circle"
  },
  {
    "slug": "profile-photo-maker",
    "name": "Profile Photo Maker",
    "description": "Create a circular profile image with transparent corners",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "circle"
  },
  {
    "slug": "image-splitter",
    "name": "Image Splitter",
    "description": "Split images into tiles (requires tile export workflow)",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Specialized browser/server integration",
    "status": "integration"
  },
  {
    "slug": "collage-maker",
    "name": "Collage Maker",
    "description": "Build a collage from multiple images (basic vertical composition available)",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "combine"
  },
  {
    "slug": "chart-maker",
    "name": "Chart Maker",
    "description": "Chart generation workspace integration point",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Specialized browser/server integration",
    "status": "integration"
  },
  {
    "slug": "view-metadata",
    "name": "View Metadata",
    "description": "Inspect image dimensions, MIME type, size, and browser-exposed properties",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "metadata"
  },
  {
    "slug": "font-awesome-to-png",
    "name": "Font Awesome to PNG",
    "description": "Requires icon-font rendering configuration",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/*"
    ],
    "method": "Specialized browser/server integration",
    "status": "integration"
  },
  {
    "slug": "png-to-jpg",
    "name": "PNG to JPG",
    "description": "Convert PNG files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "jpg-to-png",
    "name": "JPG to PNG",
    "description": "Convert JPEG files to PNG where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/jpeg"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "png-to-webp",
    "name": "PNG to WebP",
    "description": "Convert PNG files to WEBP where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/webp",
    "outputExtension": "webp"
  },
  {
    "slug": "webp-to-png",
    "name": "WebP to PNG",
    "description": "Convert WEBP files to PNG where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/webp"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "jpg-to-webp",
    "name": "JPG to WebP",
    "description": "Convert JPEG files to WEBP where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/jpeg"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/webp",
    "outputExtension": "webp"
  },
  {
    "slug": "webp-to-jpg",
    "name": "WebP to JPG",
    "description": "Convert WEBP files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/webp"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "png-to-svg",
    "name": "PNG to SVG",
    "description": "Convert PNG files to SVG+XML where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/svg+xml",
    "outputExtension": "svg"
  },
  {
    "slug": "jpg-to-svg",
    "name": "JPG to SVG",
    "description": "Convert JPEG files to SVG+XML where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/jpeg"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/svg+xml",
    "outputExtension": "svg"
  },
  {
    "slug": "svg-to-png",
    "name": "SVG to PNG",
    "description": "Convert SVG+XML files to PNG where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/svg+xml"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "heic-to-jpg",
    "name": "HEIC to JPG",
    "description": "Convert HEIC files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/heic"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "heic-to-png",
    "name": "HEIC to PNG",
    "description": "Convert HEIC files to PNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/heic"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "heic-to-avif",
    "name": "HEIC to AVIF",
    "description": "Convert HEIC files to AVIF where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/heic"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/avif",
    "outputExtension": "avif"
  },
  {
    "slug": "tiff-to-jpg",
    "name": "TIFF to JPG",
    "description": "Convert TIFF files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/tiff"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "tiff-to-png",
    "name": "TIFF to PNG",
    "description": "Convert TIFF files to PNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/tiff"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "tiff-to-svg",
    "name": "TIFF to SVG",
    "description": "Convert TIFF files to SVG+XML where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/tiff"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/svg+xml",
    "outputExtension": "svg"
  },
  {
    "slug": "jpg-to-tiff",
    "name": "JPG to TIFF",
    "description": "Convert JPEG files to TIFF where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/jpeg"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/tiff",
    "outputExtension": "tiff"
  },
  {
    "slug": "png-to-tiff",
    "name": "PNG to TIFF",
    "description": "Convert PNG files to TIFF where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/tiff",
    "outputExtension": "tiff"
  },
  {
    "slug": "jpg-to-avif",
    "name": "JPG to AVIF",
    "description": "Convert JPEG files to AVIF where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/jpeg"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/avif",
    "outputExtension": "avif"
  },
  {
    "slug": "png-to-avif",
    "name": "PNG to AVIF",
    "description": "Convert PNG files to AVIF where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/avif",
    "outputExtension": "avif"
  },
  {
    "slug": "webp-to-avif",
    "name": "WebP to AVIF",
    "description": "Convert WEBP files to AVIF where supported by this browser.",
    "category": "image",
    "icon": "Image",
    "acceptedTypes": [
      "image/webp"
    ],
    "method": "Canvas API",
    "status": "browser",
    "operation": "convert",
    "outputMime": "image/avif",
    "outputExtension": "avif"
  },
  {
    "slug": "gif-to-jpg",
    "name": "GIF to JPG",
    "description": "Convert GIF files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "gif-to-png",
    "name": "GIF to PNG",
    "description": "Convert GIF files to PNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "gif-to-webp",
    "name": "GIF to WebP",
    "description": "Convert GIF files to WEBP where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/webp",
    "outputExtension": "webp"
  },
  {
    "slug": "gif-to-avif",
    "name": "GIF to AVIF",
    "description": "Convert GIF files to AVIF where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/avif",
    "outputExtension": "avif"
  },
  {
    "slug": "gif-to-apng",
    "name": "GIF to APNG",
    "description": "Convert GIF files to APNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/apng",
    "outputExtension": "apng"
  },
  {
    "slug": "webp-to-gif",
    "name": "WebP to GIF",
    "description": "Convert WEBP files to GIF where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/webp"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/gif",
    "outputExtension": "gif"
  },
  {
    "slug": "eps-to-png",
    "name": "EPS to PNG",
    "description": "Convert APPLICATION/POSTSCRIPT files to PNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/postscript"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "eps-to-jpg",
    "name": "EPS to JPG",
    "description": "Convert APPLICATION/POSTSCRIPT files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/postscript"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "eps-to-svg",
    "name": "EPS to SVG",
    "description": "Convert APPLICATION/POSTSCRIPT files to SVG+XML where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/postscript"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/svg+xml",
    "outputExtension": "svg"
  },
  {
    "slug": "png-to-eps",
    "name": "PNG to EPS",
    "description": "Convert PNG files to APPLICATION/POSTSCRIPT where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/png"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "application/postscript",
    "outputExtension": "eps"
  },
  {
    "slug": "psd-to-jpg",
    "name": "PSD to JPG",
    "description": "Convert VND.ADOBE.PHOTOSHOP files to JPEG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/vnd.adobe.photoshop"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/jpeg",
    "outputExtension": "jpg"
  },
  {
    "slug": "psd-to-png",
    "name": "PSD to PNG",
    "description": "Convert VND.ADOBE.PHOTOSHOP files to PNG where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/vnd.adobe.photoshop"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/png",
    "outputExtension": "png"
  },
  {
    "slug": "psd-to-svg",
    "name": "PSD to SVG",
    "description": "Convert VND.ADOBE.PHOTOSHOP files to SVG+XML where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/vnd.adobe.photoshop"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "image/svg+xml",
    "outputExtension": "svg"
  },
  {
    "slug": "psd-to-ai",
    "name": "PSD to AI",
    "description": "Convert VND.ADOBE.PHOTOSHOP files to APPLICATION/POSTSCRIPT where supported by this browser.",
    "category": "image",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/vnd.adobe.photoshop"
    ],
    "method": "Specialist codec / vectorization integration",
    "status": "integration",
    "outputMime": "application/postscript",
    "outputExtension": "ai"
  },
  {
    "slug": "pdf-to-jpg",
    "name": "PDF to JPG",
    "description": "Convert PDF pages to JPG images using a PDF renderer.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf",
      "image/jpeg"
    ],
    "method": "PDF library / document conversion integration",
    "status": "integration"
  },
  {
    "slug": "merge-pdf",
    "name": "Merge PDF",
    "description": "Combine multiple PDF files using a PDF processing library.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf"
    ],
    "method": "pdf-lib (browser)",
    "status": "browser"
  },
  {
    "slug": "split-pdf",
    "name": "Split PDF",
    "description": "Extract selected PDF pages into a new file.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf"
    ],
    "method": "pdf-lib (browser)",
    "status": "browser"
  },
  {
    "slug": "compress-pdf",
    "name": "Compress PDF",
    "description": "Optimize a PDF with a compatible server-side or browser PDF pipeline.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf",
      "image/jpeg"
    ],
    "method": "PDF library / document conversion integration",
    "status": "integration"
  },
  {
    "slug": "edit-pdf",
    "name": "Edit PDF",
    "description": "Annotate or edit PDF documents with a PDF editor integration.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf",
      "image/jpeg"
    ],
    "method": "PDF library / document conversion integration",
    "status": "integration"
  },
  {
    "slug": "jpg-to-pdf",
    "name": "JPG to PDF",
    "description": "Create a PDF document from JPG images.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/jpeg",
      "image/png"
    ],
    "method": "pdf-lib (browser)",
    "status": "browser"
  },
  {
    "slug": "pdf-to-word",
    "name": "PDF to Word",
    "description": "Convert PDF content into editable DOCX with a document conversion engine.",
    "category": "pdf",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "application/pdf",
      "image/jpeg"
    ],
    "method": "PDF library / document conversion integration",
    "status": "integration"
  },
  {
    "slug": "gif-to-mp4",
    "name": "GIF to MP4",
    "description": "Convert animated GIF to MP4 using an FFmpeg/WASM or server-side media pipeline.",
    "category": "video",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "image/gif",
      "video/*"
    ],
    "method": "FFmpeg/WASM or server-side media integration",
    "status": "integration"
  },
  {
    "slug": "vsd-to-pdf",
    "name": "VSD to PDF",
    "description": "Requires a Visio-compatible conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsd-to-docx",
    "name": "VSD to DOCX",
    "description": "Requires a Visio/document conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsd-to-pptx",
    "name": "VSD to PPTX",
    "description": "Requires a Visio/document conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsd-to-jpg",
    "name": "VSD to JPG",
    "description": "Requires a Visio-compatible renderer.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsdx-to-pdf",
    "name": "VSDX to PDF",
    "description": "Requires a Visio-compatible conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsdx-to-docx",
    "name": "VSDX to DOCX",
    "description": "Requires a Visio/document conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsdx-to-pptx",
    "name": "VSDX to PPTX",
    "description": "Requires a Visio/document conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "vsdx-to-jpg",
    "name": "VSDX to JPG",
    "description": "Requires a Visio-compatible renderer.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "general-file-converter",
    "name": "General File Converter",
    "description": "Convert between supported file types through a configured conversion engine.",
    "category": "file",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "*/*"
    ],
    "method": "Specialist file conversion integration",
    "status": "integration"
  },
  {
    "slug": "content-improver",
    "name": "Content Improver",
    "description": "Clean up spacing, punctuation, and common readability issues with an offline text helper. This is template-based, not AI.",
    "category": "write",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "text/plain"
    ],
    "method": "Offline text helper (template-based; not AI)",
    "status": "browser"
  },
  {
    "slug": "essay-writer",
    "name": "Essay Writer",
    "description": "Create a structured essay draft from a topic using an offline template. Review and expand the generated outline.",
    "category": "write",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "text/plain"
    ],
    "method": "Offline text helper (template-based; not AI)",
    "status": "browser"
  },
  {
    "slug": "paragraph-writer",
    "name": "Paragraph Writer",
    "description": "Create a starter paragraph from a topic using an offline template.",
    "category": "write",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "text/plain"
    ],
    "method": "Offline text helper (template-based; not AI)",
    "status": "browser"
  },
  {
    "slug": "paragraph-completer",
    "name": "Paragraph Completer",
    "description": "Create a simple continuation suggestion for a paragraph using an offline template.",
    "category": "write",
    "icon": "WandSparkles",
    "acceptedTypes": [
      "text/plain"
    ],
    "method": "Offline text helper (template-based; not AI)",
    "status": "browser"
  }
] as ToolDefinition[];

export const categories: { id: Category; label: string; href: string; description: string }[] = [
  { id: "pdf", label: "PDF", href: "/tools/pdf", description: "Organize, convert, and prepare PDF documents." },
  { id: "image", label: "Image", href: "/tools/image", description: "Edit, optimize, and convert images in your browser." },
  { id: "write", label: "Write", href: "/tools/write", description: "Writing utilities with clear provider setup states." },
  { id: "video", label: "Video", href: "/tools/video", description: "Media conversion tools with documented processing requirements." },
  { id: "file", label: "File", href: "/tools/file_conversion", description: "Convert specialist and general file formats." },
];
export function getTool(slug: string) { return tools.find((tool) => tool.slug === slug); }
