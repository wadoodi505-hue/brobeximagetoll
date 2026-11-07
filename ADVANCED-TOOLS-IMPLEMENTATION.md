# BROBEX Image Tools — Complete Source + Advanced Workspace Additions

This archive contains the full project source from the supplied BROBEX archive, plus the advanced workspace integration.

## Added workspace routes

- `/tools/crop-round-corners`
- `/tools/image-color-picker`
- `/tools/edit-metadata`
- `/tools/remove-metadata`
- `/tools/blemishes-remover`
- `/tools/a4-size`
- `/tools/profile-photo-maker`
- `/tools/aspect-ratio-crop`
- `/tools/vsd-to-docx`
- `/tools/vsd-to-pptx`
- `/tools/vsd-to-jpg`
- `/tools/vsdx-to-docx`
- `/tools/vsdx-to-pptx`
- `/tools/vsdx-to-jpg`

The existing `profile-photo-maker` and `aspect-ratio-crop` registry entries are reused; they are not duplicated.

## Theme update

The active global theme tokens now enforce pure white page/cards in light mode and pure black page/cards in dark mode, with monochrome borders and high-contrast text. The implementation is in `app/globals.css` and uses the existing `data-theme` attribute from the theme provider.

## Architecture

- `components/advanced-image-tools-workspace.tsx`: shared responsive workspace and route-specific controls.
- `lib/image-tools/core.ts`: image decode, canvas export, color sampling, A4 sizing, and rounded-corner helpers.
- `lib/image-tools/visio.ts`: VSDX ZIP/XML extraction and generated DOCX/PPTX/contact-sheet outputs.
- `app/tools/[slug]/page.tsx`: routes the added slugs to the new workspace.
- `lib/tools.ts`: tool directory registrations.
- `app/globals.css`: monochrome responsive workspace styling.

The existing project dependencies already include `jszip`; no new dependency or API key is required for these additions.

## Important functionality boundaries (do not misrepresent)

- **Edit Metadata:** exports a JSON metadata sidecar. It does not write EXIF/IPTC fields into the original image.
- **Remove Metadata:** re-encodes to PNG through Canvas. Browser decoding/color management can alter pixel encoding; this is not a byte-preserving metadata-only edit.
- **Blemishes Remover:** includes a basic smoothing operation, not professional content-aware healing or AI inpainting.
- **VSD legacy binary:** legacy `.vsd` is detected and rejected with a clear instruction to save as `.vsdx` in Visio. A legacy binary parser is not included.
- **VSDX page output:** extracts page text and embedded media. The generated JPGs are text contact sheets, not pixel-identical Visio page renders. Full Visio shape geometry, connectors, themes, and layout rendering are not implemented.
- **DOCX/PPTX:** generated documents contain extracted page text. They do not recreate the original Visio diagram artwork as editable shapes.

## Run locally

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000`.

Run the typecheck/lint/build commands before deploying. This archive has been assembled from the supplied project and statically reviewed; a successful production build has not been claimed.
