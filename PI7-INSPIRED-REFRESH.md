# BROBEX Image Tools — PI7-inspired homepage refresh

This archive contains the supplied BROBEX project with a refreshed homepage and directory presentation.

## What changed
- Reworked the homepage into a practical image-tool portal with a prominent hero, popular-tool shortcuts, a searchable categorized directory, and a privacy explainer.
- Added responsive styling for desktop, tablet, and mobile layouts.
- Updated the homepage visual system to a clean light interface with blue utility accents, plus matching dark-theme variables.
- Preserved the existing BROBEX tool pages, processing components, routes, API handlers, and project configuration.

## Important
This is an original BROBEX design informed by the reference site's broad information architecture and utility-directory approach. It does not reuse Pi7's logo, source code, assets, or exact page styling.

The popular shortcuts point to existing tool routes in the supplied project. The directory continues to mark tools as unavailable when no matching implemented route exists. AI/provider-dependent tools still require their configured providers to be available; this visual refresh does not add provider credentials or create new processing engines.

## Run locally
```powershell
npm install
npm run dev
```

Production verification:
```powershell
npm run typecheck
npm run build
```
