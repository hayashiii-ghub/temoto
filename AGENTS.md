# Repository guide

This repository contains the main `temoto` Chrome extension and its public website. The former standalone `temoto Proxy` source remains available for migration and existing users.

## Project map

- `browser/temoto-chrome/`: the Chrome extension. Follow its nested `AGENTS.md` when working in this directory.
- `browser/temoto-proxy/`: legacy standalone Proxy source and saved-data compatibility. Preserve existing profiles and credentials; follow its nested `AGENTS.md` when working there.
- `browser/shared/`: shared design sources and capture tools, including those retained for the legacy extension.
- `site/`: the public website for temoto, built with Next.js/vinext and deployed through a Cloudflare Worker.

## Validation

Run checks for the product you changed:

- Chrome extension: from `browser/temoto-chrome/`, run `npm test`, `npm run build`, and `npm run test:sites`
- Legacy Proxy, when changed: from `browser/temoto-proxy/`, run `npm run check`
- Website: from `site/`, run `npm run lint` and `npm test`

## Working conventions

- Keep changes scoped to the affected product unless a cross-product brand, asset, or release change is explicitly required.
- Preserve the separate npm lockfiles in `browser/temoto-chrome/` and `site/`; these projects are not an npm workspace.
- Do not edit generated or dependency directories such as `.build/`, `node_modules/`, `dist/`, `.vinext/`, or `.wrangler/`.
- Reuse the existing scripts and package commands instead of duplicating build or release logic.
- The website keeps its purple hero and black lower section/footer in both themes. Only the tool demo follows the browser's light/dark preference automatically. Its five launcher buttons open interactive demos styled like the extension; use sample content and in-memory profiles, with no proxy or browser settings changes.
