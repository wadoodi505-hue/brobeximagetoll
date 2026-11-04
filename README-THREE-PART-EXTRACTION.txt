BROBEX IMAGE TOOLS — THREE-PART PROJECT ARCHIVE
================================================

FILES
-----
BROBEX-IMAGE-TOOLS.z01
BROBEX-IMAGE-TOOLS.z02
BROBEX-IMAGE-TOOLS.zip

IMPORTANT: Keep all three archive parts together in the SAME folder.
Do not rename any part and do not extract .z01 or .z02 individually.

EXTRACT
-------
1. Install 7-Zip or WinRAR if it is not already installed.
2. Right-click BROBEX-IMAGE-TOOLS.zip (the .zip file, Part 3).
3. Choose 7-Zip > Extract to "BROBEX-IMAGE-TOOLS\\" (or WinRAR > Extract Here).
4. The archive utility automatically reads .z01 and .z02 and reconstructs
   the complete BROBEX-IMAGE-TOOLS project folder.
5. Open that extracted folder in VS Code.

RUN LOCALLY
-----------
Open a terminal in the extracted BROBEX-IMAGE-TOOLS folder and run:

  npm install
  npm run dev

Then open http://localhost:3000

For production validation:

  npm run typecheck
  npm run lint
  npm run build

Do not extract the three volumes into separate folders. All three parts are
one continuous split ZIP archive, not three independent ZIP projects.

NOTES
-----
- node_modules and .next are intentionally not included. npm install recreates
  dependencies for the target computer and avoids shipping machine-specific files.
- Keep your real environment variables in a local .env.local file. Never upload
  secrets to GitHub or share them in the archive.
- Existing routes, tool workspaces, tool guides, SEO files, analytics and legal
  pages are included in the project archive.
