# Repository guide

This repository contains the main `temoto` Chrome extension and its public website. The former standalone `temoto Proxy` source remains available for migration and existing users.

## Project map

- `browser/temoto-chrome/`: the Chrome extension. Follow its nested `AGENTS.md` when working in this directory.
- `browser/temoto-proxy/`: legacy standalone Proxy source and saved-data compatibility. Preserve existing profiles and credentials; follow its nested `AGENTS.md` when working there.
- `browser/shared/`: shared design sources and capture tools, including those retained for the legacy extension.
- `site/`: the public website for temoto, built with Bun and TypeScript. React generates static HTML at build time and hydrates the five demos in the browser. Edit `site/src/`; Vercel publishes `site/dist/` at `https://temoto.shigoto.dev`.

## Validation

Run checks for the product you changed:

- Chrome extension: from `browser/temoto-chrome/`, run `npm test`, `npm run build`, and `npm run test:sites`
- Legacy Proxy, when changed: from `browser/temoto-proxy/`, run `npm run check`
- Website: use Bun 1.4.2. From `site/`, run `bun install --frozen-lockfile`, `bun run check`, and `bun run test`. `bun run dev` serves a local preview; stop it after verification.

## Working conventions

- Keep changes scoped to the affected product unless a cross-product brand, asset, or release change is explicitly required.
- Preserve the extension npm lockfiles and the website Bun lockfile; these projects are not a package workspace. The website has no Next.js, vinext, or Worker runtime. Vercel uses `site/` as its project root; retain `site/.openai/hosting.json` only to identify the former Sites deployment for redirect management.
- Do not edit generated or dependency directories such as `.build/`, `node_modules/`, `dist/`.
- Reuse the existing scripts and package commands instead of duplicating build or release logic.
- The website keeps its purple hero and black lower section/footer in both themes. Only the tool demo follows the browser's light/dark preference automatically. Its five launcher buttons open interactive demos styled like the extension; use sample content and in-memory profiles, with no proxy or browser settings changes.

- Preserve the selected landing-page copy and layout; the hero eyebrow “A small toolkit” was removed on 2026-10-17.
