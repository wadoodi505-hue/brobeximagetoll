BROBEX IMAGE EDITOR — STICKY PREVIEW UPDATE

Modified:
- components/image-workspace.tsx
- app/globals.css

Backups:
- components/image-workspace.tsx.backup-sticky-20261107-111944
- app/globals.css.backup-sticky-20261107-111944

Implementation:
- On viewports up to 767px, the existing workspace becomes a single-column mobile layout.
- The visual preview is wrapped in .preview-sticky-region and uses native position: sticky.
- The preview wrapper is promoted into the full .workspace-columns flow using display: contents on the preview panel. This lets the sticky element remain constrained by the full workspace and release naturally at the workspace end.
- The workspace overflow is made visible on mobile so it does not become a sticky scroll container.
- Preview media use contain sizing to preserve aspect ratio.
- Desktop/tablet layouts at 768px and wider retain their existing base layout.

Validation:
- TypeScript TSX transpilation/parser check passed.
- CSS brace-balance check passed.
- Full ESLint, typecheck, and Next.js production build could not be run because npm ci did not complete within the available execution window; the installed node_modules remained incomplete.
- Real-browser viewport and touch interaction testing has not been performed in this environment.
