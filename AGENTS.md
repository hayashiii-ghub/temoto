# Repository guide

This repository contains three independently built products under the lowercase `temoto` brand.

## Project map

- `Sources/ShelfDrop/` and `Tests/ShelfDropTests/`: the macOS app and its Swift tests. `Package.swift`, the root `Makefile`, `Assets/`, and `script/` belong to this product.
- `browser/temoto-chrome/`: the Chrome extension. Follow its nested `AGENTS.md` when working in this directory.
- `site/`: the macOS app's public website, built with Next.js/vinext and deployed through a Cloudflare Worker.

The `ShelfDrop` directory and symbol names are retained internal names; user-facing product copy should use `temoto` unless the surrounding code requires an existing identifier.

## Validation

Run checks for the product you changed:

- macOS app: `make check`
- Chrome extension: from `browser/temoto-chrome/`, run `npm test`, `npm run test:sites`, and `npm run build`
- Website: from `site/`, run `npm run lint` and `npm test`

The root `make check` validates only the macOS app and its scripts; it does not validate the Chrome extension or website.

## Working conventions

- Keep changes scoped to the affected product unless a cross-product brand, asset, or release change is explicitly required.
- Preserve the separate npm lockfiles in `browser/temoto-chrome/` and `site/`; these projects are not an npm workspace.
- Do not edit generated or dependency directories such as `.build/`, `node_modules/`, `dist/`, `.vinext/`, or `.wrangler/`.
- Reuse the existing scripts and package commands instead of duplicating build or release logic.
