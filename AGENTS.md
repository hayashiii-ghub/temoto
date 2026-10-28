# Repository guide

## Structure and checks

| Directory | Purpose | Checks from that directory |
| --- | --- | --- |
| `browser/temoto-chrome/` | Main Chrome extension; edit `src/` | `npm ci`, `npm test`, `npm run build`, `npm run test:sites` |
| `browser/temoto-proxy/` | Retained legacy extension | `npm ci`, `npm run check` |
| `browser/shared/` | Shared popup tokens, marks, icon and capture tools | Run the checks for affected consumers |
| `site/` | Bun 1.4.2 / TypeScript static site; edit `src/` | `bun install --frozen-lockfile`, `bun run check`, `bun run test` |

Use Node 22 for extension builds, matching CI. Keep separate extension npm lockfiles and the website Bun lockfile; this is not a package workspace. Run checks for affected products and describe the change and verification in the PR. For visual changes, run the existing preview yourself, verify desktop/mobile or the unpacked extension, and stop preview servers afterward.

Do not edit generated `dist/`, `.build/`, `release/`, or dependencies directly. Preserve the Chrome Sites bridge (`.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, `tests/sites-worker.test.mjs`); its build emits `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`. Vercel uses `site/` as its root and publishes `site/dist/` to `https://temoto.shigoto.dev`; retain `site/.openai/hosting.json` as the former Sites identity.

## Product safeguards

- The main product is lowercase `temoto`: exactly Color Picker, Screenshot, CSS, Video Speed, and Proxy, with English-only UI. Keep environment navigation/settings/reset, side panels, and study switches out of the package.
- Preserve the approved flat popup: 416px wide, 60px header, height fitted to content up to 580px, five 68px launcher rows and 1px rules. Use shared tokens in `browser/shared/temoto-popup-tokens.css`, 44px standard controls, 56px action rows, and equal columns for adjacent actions. Keep a single-line wordmark, regular Phosphor icons (22px launcher, 20px header, 18px actions), and a 60×60px Back target on tool pages; CSS starts inspection directly.
- Follow browser light/dark preference with no manual theme setting. Use purple selection, dark `#080808` / off-white surfaces, bundled Geist for UI/rates, and IBM Plex Mono only for technical values. Keep controls flat, without rounded cards, glass, status-colored feedback, helper paragraphs, or routine success toasts. Errors stay actionable and inline; restricted pages stay quiet until a requested operation needs feedback.
- Screenshot offers Visible area and Full page, Fit/100%, clipboard copy and PNG download. Keep bounded lazy-content preparation, page restoration on success/failure, and capture pixels unchanged by appearance. Each IndexedDB capture can reload, expires after one hour on the next save/load, and is deleted by preview Close.
- CSS shows computed declarations and a separate unique selector, with selection guidance, Esc-to-exit, listener/overlay cleanup, and clipboard-acknowledged success. Keep launch errors and Retry in the CSS row, separate from other tools.
- Video Speed commands stay within 0.25–5×, with four presets, ±0.05 buttons and G/D/S shortcuts. Display actual rates even outside that range; never carry a chosen rate into later videos. Ignore editable/modifier shortcuts, handle media replacement and invalidated scripts, and keep badges pointer-transparent. The explicitly opted-in WebMCP bridge exposes only availability and video speed in that tab.
- Main Proxy supports single-endpoint Fixed profiles or HTTP(S) PAC URLs. Saving inactive profiles does not activate them; active edits use Save & reapply. Keep required `proxy`, `regular_only`, and Off that clears the override. Do not add authentication, diagnostics, routing, import/export, incognito, or extra host/webRequest permissions. Session drafts exclude passwords, never apply routing, and clear on Save/Cancel/Delete.
- Preserve legacy source, profiles, credentials and advanced schemas without automatic migration or activation. Passwords stay session-only; exports omit usernames/passwords; replacement imports clear session passwords and reset diagnostic URLs. Diagnostics accept public HTTP(S), omit credentials/bodies and redirects. Incognito requires explicit opt-in/access. The allowlisted companion exposes GET_SUMMARY identity/status only; OPEN_MANAGER returns a toolbar instruction. Keep legacy operations in the popup, with truthful state after failures and reversible Off; do not merge its runtime into the main build.

## Website and assets

- Preserve the selected LP copy/layout: purple hero and black lower section/footer in both themes, no eyebrow. Only the five tool demos follow browser appearance; use sample data and in-memory Proxy profiles without changing browser settings.
- Canonical mark: `browser/shared/temoto-mark.svg`, 160px frame; the legacy mark uses its inward outline. Generate icons with existing commands (`npm run build:icons` for core), preserving transparent `#9974F8` artwork and the legacy 16px optical stroke. Keep canonical Store images in each extension's `store/assets/`; do not deploy design notes or unused copies from `site/public/`.
- Keep bundled font/icon licenses and attribution. The core Geist file comes unchanged from `@fontsource-variable/geist@5.3.0`; popup and video badges share it. Verify the rendered badge font and retain a system-sans fallback without styling page content. Site Inter/Geist and Phosphor assets retain their adjacent licenses.
- `site/scripts/og.html` and `site/scripts/render-og.sh` produce the 1200×630 OG image from the separate 416×402 launcher capture. Keep OG/X metadata on the same image revision.

## Store capture and release

Build the relevant extension, then run `node browser/shared/serve-store-capture.mjs` from the repository root. It serves built UI with sample data on `127.0.0.1:4190` (`TEMOTO_CAPTURE_PORT` overrides it). Use `/?product=chrome&lang=en` or `lang=ja` for 1280×800 launcher JPEGs; `&mode=promo` produces the 440×280 tile. Legacy `product=proxy` is historical material. Capture at device scale 1 after navigation, inspect the saved image for exact dimensions/clipping/alpha, and stop the server. This preview does not install an extension or prove real proxy behavior.

From the relevant extension directory, `npm run package` creates a ZIP in `release/` with `manifest.json` at its root. It removes the Store manifest key while retaining the reserved identity in unpacked builds, and refuses to overwrite an existing ZIP. Do not bump versions, overwrite submitted archives, publish the website, or submit/release extensions without authorization. Package creation, submission, review, installed QA and public availability require separate verification.

Keep `browser/temoto-chrome/PRIVACY.md` at its public URL used by the website and Store; retain the legacy policy and each `store/listing.md` as authoritative listing/permission/reviewer copy. For authorized releases, run product checks and native Chrome QA, then verify policy/listing declarations, ZIP identity and permissions, submission receipt, and public status independently. Source changes and old release notes do not prove current Store status.

Keep user guidance in README.md and work instructions in AGENTS.md. Ask before creating another explanatory document.
