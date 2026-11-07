# BROBEX Image Tools — Update Notes

## Included in this project archive

### Monochrome theme system
- Replaced the active theme tokens with a strict monochrome palette.
- Light mode uses a white page and white component surfaces, black primary text, neutral borders.
- Dark mode uses a black page and black component surfaces, white primary text, subtle zinc borders.
- Kept the existing theme provider and persisted light/dark selection behavior.
- Added final overrides after legacy styles so old gradients/tinted panel rules do not take precedence.
- Primary/download controls remain inverted for clear contrast.

### Compression worker hardening
- Added magic-byte checks in the dedicated compression worker for JPEG, PNG, GIF, WebP, and AVIF.
- Added content-signature validation to the shared image loader (JPEG, PNG, GIF, WebP, BMP, TIFF, AVIF/HEIC, and SVG) and PDF/JPEG-to-PDF upload validation.
- Kept decoding and canvas work in the worker using `createImageBitmap` and `OffscreenCanvas`.
- Explicitly requests image orientation from EXIF when creating the bitmap; exported canvas files do not retain EXIF metadata.
- Requests sRGB canvas contexts for more predictable output color handling.
- Raised binary-search refinement from 8 to 12 iterations for more precise quality selection.
- Avoids the most destructive JPEG quality floor (0.01); the worker now searches down to 0.06 before trying smaller dimensions.
- Preserves the existing white matte when converting transparent content to JPEG.
- Kept the existing binary size convention (1 displayed KB unit = 1,024 bytes) and documented it in both compression workspaces.

## Important limitations (not represented as fixed)
- Exact target sizes are not mathematically guaranteed for every image. The UI reports when the best result still exceeds the target.
- PDF compression still uses `pdf-lib` structural/object-stream optimization. It does not rasterize or downsample embedded images, so it cannot promise large reductions for image-heavy PDFs.
- `createImageBitmap`/`OffscreenCanvas` support depends on the browser. The existing worker error path remains in place.
- This archive has not been built against installed dependencies in this environment. Run the verification commands below on your development machine.

## Verify locally (PowerShell)

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000`, switch themes, and verify representative image compression tools including 5KB, 50KB, 200KB, and 1MB targets.
