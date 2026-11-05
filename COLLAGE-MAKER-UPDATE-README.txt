BROBEX IMAGE TOOLS — COLLAGE MAKER UPDATE

WHAT CHANGED
- Added a dedicated CollageMakerWorkspace instead of the old basic vertical combine behavior.
- Added up to 20 images, drag/drop import, photo reordering, remove controls, five layouts,
  canvas ratios, resolution presets, Fill/Fit, spacing, outer margin, rounded corners,
  background color, transparent PNG, JPEG/PNG/WebP export, and a live canvas preview.
- Added a collage-specific SEO title, description, keywords, Open Graph title and canonical
  metadata through the existing getToolMetadata system.
- Updated the tool registry description/method and the collage-maker tool guide.
- Added responsive monochrome CSS for the collage workspace.

FILES ADDED
- components/collage-maker-workspace.tsx

FILES UPDATED
- app/tools/[slug]/page.tsx
- app/globals.css
- lib/tools.ts
- lib/tool-seo.ts
- content/tool-guides/collage-maker.json

INSTALL / RUN (PowerShell)
1. Extract the ZIP into a new folder, or copy the changed files into your existing project.
2. Open PowerShell in your project folder and run:

   npm ci
   npm run typecheck
   npm run build
   npm run dev

3. Test this page locally:
   http://localhost:3000/tools/collage-maker

IMPORTANT VERIFICATION NOTE
The source archive was checked for ZIP integrity. A dependency install was attempted in the
build environment but timed out, so TypeScript and production build verification were not
completed here. Run the commands above locally before deploying.

CURRENT SCOPE / HONEST LIMITATIONS
- Export is a flattened image, not an editable layered project.
- Photo framing is centered; per-photo drag-to-reposition, per-photo zoom/rotation,
  text/stickers/filters, and undo/redo history are not part of this implementation yet.
- Inputs: up to 20 images, 20 MB each, 40 MP per image.
- Export canvas is capped at 16 MP to avoid excessive browser memory use.
- Images are decoded and rendered locally in the browser; no image-upload API is used.
