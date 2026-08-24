# Repository guide

This repository contains two independently built Chrome extensions under the lowercase `temoto` brand and their public website.

## Project map

- `browser/temoto-chrome/`: the Chrome extension. Follow its nested `AGENTS.md` when working in this directory.
- `browser/temoto-proxy/`: the standalone Chrome proxy companion. Follow its nested `AGENTS.md` when working in this directory.
- `browser/shared/`: shared popup design tokens used by both extensions.
- `site/`: the public website for both extensions, built with Next.js/vinext and deployed through a Cloudflare Worker.

## Validation

Run checks for the product you changed:

- Chrome extension: from `browser/temoto-chrome/`, run `npm test`, `npm run build`, and `npm run test:sites`
- Proxy companion: from `browser/temoto-proxy/`, run `npm run check`
- Website: from `site/`, run `npm run lint` and `npm test`

## Working conventions

- Keep changes scoped to the affected product unless a cross-product brand, asset, or release change is explicitly required.
- Preserve the separate npm lockfiles in `browser/temoto-chrome/` and `site/`; these projects are not an npm workspace.
- Do not edit generated or dependency directories such as `.build/`, `node_modules/`, `dist/`, `.vinext/`, or `.wrangler/`.
- Reuse the existing scripts and package commands instead of duplicating build or release logic.
