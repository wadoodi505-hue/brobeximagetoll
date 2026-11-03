# BROBEX Image Studio — Tool Guide Upgrade

This is a two-part split of one project tree. **Extract BOTH ZIP files into the SAME project folder**, in either order. Each archive contains distinct relative paths; together they reconstruct the complete project.

## Install
1. Create/open your project folder.
2. Extract `BROBEX-TOOL-GUIDES-PART-1-OF-2.zip` into that folder.
3. Extract `BROBEX-TOOL-GUIDES-PART-2-OF-2.zip` into that exact same folder.
4. Open PowerShell in the project folder and run:

```powershell
npm ci
npm run typecheck
npm run build
npm run dev
```

Open http://localhost:3000.

Do not extract the two archives into separate folders. Do not delete `node_modules` or your environment files when merging. Existing `.env.local` files are not included in this package.

## Included
- One JSON guide per registered tool.
- 107 guide entries mapped through `app/tools/[slug]/page.tsx`.
- About, tool-specific workflow, capabilities, benefits, limitations, and five FAQs per tool.
- Unique page metadata keywords and visible FAQ content with FAQPage JSON-LD.
- `TOOL-GUIDE-AUDIT.md` with inventory and verification notes.

TypeScript and production build were not executed in this packaging environment because dependencies were not installed. Run the commands above locally and review integration-dependent tools before deployment.
