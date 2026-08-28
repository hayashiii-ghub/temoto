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

## Cursor Cloud specific instructions

The three Node products (`browser/temoto-chrome/`, `browser/temoto-proxy/`, `site/`) are fully set up and testable on this Linux VM. The macOS Swift app (`Sources/ShelfDrop/`, `make check`, `make run`) requires the macOS 26 SDK/Swift and its CI runs on `macos-26`; it cannot be built or run on this Linux VM, so treat it as out of scope here. Standard validation/run commands live in the root `README.md`, the product `package.json` scripts, and this file's Validation section — reuse those rather than duplicating them.

- Node: these projects need Node ≥22.18 (`node --test` imports `.ts` sources directly and relies on default TypeScript type stripping). The base image's `/exec-daemon/node` is 22.14.0 and is too old, so setup installs Node 22 via `nvm` and adds `nvm use 22` to `~/.bashrc`. Fresh login/`tmux` shells and newly started `Shell` sessions get the right Node automatically; a shell may cache the old `node` path, so run `hash -r` (or open a new shell) if `node -v` still shows 22.14.0.
- Site dev/preview server (`cd site && npm run dev`, and `npm run start`) runs the worker under miniflare/workerd. It fails with a `500` / `fetch failed` (`Headers Overflow Error`) unless Node's HTTP header limit is raised. Start it as `NODE_OPTIONS="--max-http-header-size=1048576" npm run dev`. This is not needed for `npm run lint`, `npm test`, or `npm run build`. Dev serves on `http://localhost:3000/`; note `localhost` resolves to IPv6 `::1` here, so use `localhost` (not `127.0.0.1`) when curling it.
- Chrome extension popup dev server (`cd browser/temoto-chrome && npm run dev`) is a plain Vite server on `http://localhost:5173/` that renders the popup UI. Extension-only features that call `chrome.*` APIs only work when the built `dist/client` is loaded as an unpacked extension in Chrome (`npm run build` first); the Vite preview is for UI work.
- `site`'s `predev`/`prebuild` runs `scripts/sync-product-icons.mjs`, which can rewrite `site/public/product-*-icon.png` from the extension sources. If those regenerate identically, discard the diff before committing unless an icon change is intended.
