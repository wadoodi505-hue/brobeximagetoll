<<<<<<< HEAD
# BROBEX Image Tools

A Next.js App Router starter for a privacy-conscious image utilities platform. The browser-based workspace includes real canvas operations for supported raster images; advanced AI and specialist format tools clearly report when an integration is not configured.

## Requirements
- Node.js 20.9+ (Node 22 LTS recommended)
- npm

## Local development
```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```
Open http://localhost:3000.

## Validation
```powershell
npm run typecheck
npm run build
```
The `lint` script is intended for ESLint integration; install/configure ESLint separately if you want a lint gate. This starter does not claim that every listed specialist format has a configured codec or provider.

## Deploy to Vercel
1. Push this folder to a Git repository.
2. Import the repository into Vercel as a Next.js app.
3. Set environment variables only for providers you actually configure.
4. Deploy and test tool routes, upload limits, downloads, metadata, and mobile navigation in the deployed environment.

## What's implemented
- Responsive homepage, category routes, individual tool routes, theme toggle, search/filter, metadata, sitemap, robots, privacy/terms/about/contact.
- Browser processing: resize, compress, crop (rectangle settings), grayscale, flip, rotate, pixelate, text overlay, border, circular crop, blur, raster conversion where browser canvas supports it, image metadata, and image combining.
- PDF merge/split primitives are not exposed as complete UI workflows in this starter; PDF and file conversion entries are labeled integration-required.
- AI, OCR, HEIC/TIFF/PSD/EPS/Visio, animated formats, and vector conversions requiring specialized codecs are explicitly marked as requiring an integration.

## Privacy and security notes
- Browser image operations stay in the browser.
- No upload API or arbitrary URL fetch endpoint is included.
- The browser cannot guarantee that every metadata field is available. Metadata shown is limited to what the browser can read.
- Advanced providers must be implemented server-side with validation, rate limits, file-size limits, timeouts, and a documented retention policy before deployment.
=======
# brobeximagetoll
>>>>>>> origin/main
