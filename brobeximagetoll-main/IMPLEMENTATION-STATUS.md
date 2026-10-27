# BROBEX Image Tools — implementation status

This update keeps the existing Next.js application and adds real free browser-side implementations where the existing dependencies support them.

## Implemented in this update

- Existing Canvas operations: resize, compress, crop, flip, grayscale, pixelate, text overlay, border, circle crop, blur, metadata, rotation, and supported browser image format conversion.
- Multi-image composition: Combine Images, Add Images to Image, and a basic vertical Collage Maker workflow.
- PDF tools using the existing `pdf-lib` dependency: Merge PDF, Split PDF (page ranges such as `1,3-5`), and JPG/PNG to PDF.
- Offline writing helpers: Content Improver (basic cleanup), Essay Writer, Paragraph Writer, and Paragraph Completer. These are explicitly template-based helpers, not AI models.
- The tool catalog status is updated only for the operations wired to these implementations.

## Still requires a specialist engine or model

AI image generation, background removal, AI upscaling, object/person removal, inpainting, colorization, and high-quality restoration require model inference. They are not represented as working without a model.

PDF-to-JPG needs a PDF renderer; PDF-to-Word needs document reconstruction; GIF-to-MP4 needs a video codec pipeline; EPS/PSD/VSD/VSDX and several TIFF/HEIC/GIF conversions need compatible format decoders/encoders. Those tools remain unavailable until their real implementations are added.

## Local verification

From the project root run:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

The package install could not be completed in the authoring environment because the install command timed out, so this ZIP must still be built and tested locally before production deployment. Do not deploy until all three checks pass.

## Free hosting considerations

Browser operations process files on the visitor's device and avoid server processing costs. They still use device memory and CPU. Keep strict file-size and pixel-count limits. Heavy AI models and video/document conversions may exceed free serverless limits and may need local inference or a separately hosted processing worker.
