# BROBEX Tool Page Interface Refresh

This update applies one shared, responsive interface to the individual tool pages.

## Included
- A consistent BROBEX tool-studio header with category, workspace and availability status.
- A breadcrumb trail for Home / Category / Tool.
- Shared workspace styling for image, PDF, writing and other existing tool components.
- Responsive help and compatibility panels.
- Related-tool navigation and a consistent select / process / export guide.
- Accessible focus states and reduced-motion support.
- Light and dark theme support through the existing theme variables.

## Scope and preservation
Existing tool processing components, route slugs, project dependencies, package lockfile, SEO metadata, and existing site navigation are retained. This is an original BROBEX design informed by the broad utility-directory and task-focused workspace approach of Pi7 Image Tools. It does not copy Pi7 source code, branding, or assets.

The refresh changes shared page presentation. It does not add missing processing engines or provider credentials. Tools that already show an integration requirement continue to show that state rather than pretending to process files.

## Local run
```powershell
npm ci
npm run dev
```

## Verify before deployment
```powershell
npm run typecheck
npm run lint
npm run build
```
