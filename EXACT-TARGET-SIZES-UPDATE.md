# BROBEX Image Tools — Exact Target Sizes update

## Included
- 22 dedicated fixed-target routes under `/tools/`.
- Each route has its own fixed target; users cannot edit the target size.
- Browser-local JPEG encoding with quality search.
- Original pixel width and height are preserved. The processor does not resize.
- The result panel shows original filename, original size, achieved size, target, dimensions, output format, download filename, and reduction.
- No original or processed image preview is rendered in this workspace.
- The homepage's START HERE / Most used tools section has been removed.

## Fixed-target routes
- `Compress to 5KB` — `/tools/compress-image-to-5kb` — target: 5 KB\n- `JPEG to 10KB` — `/tools/compress-jpeg-to-10kb` — target: 10 KB\n- `Compress to 15KB` — `/tools/compress-image-to-15kb` — target: 15 KB\n- `Compress to 20KB` — `/tools/compress-image-to-20kb` — target: 20 KB\n- `Compress 20KB–50KB` — `/tools/compress-jpeg-between-20kb-to-50kb` — target: 50 KB\n- `JPEG to 25KB` — `/tools/compress-jpeg-to-25kb` — target: 25 KB\n- `JPEG to 30KB` — `/tools/compress-jpeg-to-30kb` — target: 30 KB\n- `JPEG to 40KB` — `/tools/compress-jpeg-to-40kb` — target: 40 KB\n- `Compress to 50KB` — `/tools/compress-image-to-50kb` — target: 50 KB\n- `Compress to 60KB` — `/tools/compress-image-to-60kb` — target: 60 KB\n- `Compress to 70KB` — `/tools/compress-image-to-70kb` — target: 70 KB\n- `Compress to 80KB` — `/tools/compress-image-to-80kb` — target: 80 KB\n- `Compress to 90KB` — `/tools/compress-image-to-90kb` — target: 90 KB\n- `Resize to 50KB` — `/tools/resize-image-to-50kb` — target: 50 KB\n- `Compress to 100KB` — `/tools/compress-image-to-100kb` — target: 100 KB\n- `JPEG to 150KB` — `/tools/compress-jpeg-to-150kb` — target: 150 KB\n- `Compress to 200KB` — `/tools/compress-image-to-200kb` — target: 200 KB\n- `Resize to 200KB` — `/tools/resize-image-to-200kb` — target: 200 KB\n- `JPEG to 300KB` — `/tools/compress-jpeg-to-300kb` — target: 300 KB\n- `JPEG to 500KB` — `/tools/compress-jpeg-to-500kb` — target: 500 KB\n- `Compress to 1MB` — `/tools/compress-image-to-1mb` — target: 1 MB\n- `Compress to 2MB` — `/tools/compress-image-to-2mb` — target: 2 MB\n
## Important technical limitation
A fixed file-size target is not mathematically achievable for every image when pixel dimensions must remain unchanged. Very small targets (especially 5 KB) may be impossible for high-detail or large images even at very low JPEG quality. In that case the tool reports the actual smallest result produced and labels it as best-possible compression; it never claims the target was met when it was not. PNG transparency is flattened onto white because the output is JPEG. Animated formats are processed as a single decoded frame.

All processing in this workspace occurs locally in the browser. No server upload is performed.

## Modified source files
- `app/page.tsx`
- `app/globals.css`
- `app/tools/[slug]/page.tsx`
- `lib/tools.ts`
- `lib/image-tool-directory.ts`
- `lib/exact-targets.ts` (new)
- `components/exact-target-compression-workspace.tsx` (new)

## Local verification
The changed TS/TSX files passed a TypeScript transpilation syntax check. A full `npm ci` could not complete in the preparation environment (dependency installation timed out), so a full TypeScript project check, ESLint run, and Next.js production build have not been verified here.

Run in PowerShell from the project folder:
```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Deploy
After local verification:
```powershell
git add .
git commit -m "Add fixed target image compression tools"
git push
```
Connect the repository to the existing Vercel project, or let its existing Git integration deploy the pushed commit. This archive does not itself publish to the live site.
