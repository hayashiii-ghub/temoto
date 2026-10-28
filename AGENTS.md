# Repository guide

## Structure and checks

Run commands in the affected directory; use Node 22 for extensions and Bun 1.4.2 for the site, matching CI.

| Directory | Purpose | Commands |
| --- | --- | --- |
| `browser/temoto-chrome/` | Main extension; edit `src/` | `npm ci`, `npm test`, `npm run build`, `npm run test:sites` |
| `browser/temoto-proxy/` | Retained legacy extension | `npm ci`, `npm run check` |
| `browser/shared/` | Shared design/capture tools | Check affected consumers |
| `site/` | Static website; edit `src/` | `bun install --frozen-lockfile`, `bun run check`, `bun run test` |

Keep separate npm/Bun lockfiles and existing scripts. Do not edit generated `dist/`, `.build/`, `release/` or dependencies. Preserve the Chrome Sites build bridge/tests. Vercel publishes `site/dist/` from `site/`; retain the former Sites `.openai/hosting.json`.

PRs describe changes and verification. Run previews yourself, check responsive/unpacked behavior when relevant, and stop servers afterward.

## Product boundaries

- Main product: lowercase `temoto`, English-only, exactly Color Picker, Screenshot, CSS, Video Speed and Proxy. Use the selected T-panel mark, compact neutral controls, thin outlines and browser-following light/dark appearance. Keep errors inline and neutral. Override shared tokens locally so the retained legacy Proxy design is unchanged; keep environment/reset/settings surfaces and study assets out of the product.
- Align the LP and interactive demos with the extension's monochrome appearance in both themes. Keep the existing concise copy, one Store CTA and no eyebrow. Use sample data and in-memory Proxy profiles without changing browser settings.
- Restore page state after captures, including failures; appearance must not alter captured pixels. CSS exposes computed declarations. Confirm clipboard success. Keep unavailable-page detection quiet until a requested operation needs feedback.
- Display actual video speed, including page-selected rates outside the controls' range. Never apply a previous choice to later/replaced videos. Ignore editable/modifier shortcuts and clean up page scripts/overlays. The explicitly opted-in WebMCP bridge exposes only availability and video-speed control in its own tab.
- Main Proxy keeps required `proxy`, `regular_only` and Off that clears its override. Saving inactive profiles/drafts must not activate routing; active edits use Save & reapply. Do not add authentication, diagnostics, routing rules, import/export, incognito or extra host/webRequest access. Drafts exclude passwords and clear on Save/Cancel/Delete.
- Preserve legacy source, advanced profiles and credentials without automatic migration/activation. Passwords stay session-only; exports omit credentials and replacement imports clear session passwords. Keep diagnostics public HTTP(S), without credentials/bodies/redirects, and Incognito opt-in/access. Preserve truthful failures and reversible Off. Allowlisted GET_SUMMARY returns identity/status only; OPEN_MANAGER directs users to the toolbar.

## Assets, capture and release

Keep the legacy shared mark, existing icon commands and `store/assets/` originals. The current Chrome/LP mark follows `browser/temoto-chrome/icons/toolbar.svg`. Preserve font/icon licenses and attribution; core Geist comes from `@fontsource-variable/geist@5.3.0`. Verify rendered badge fonts; retain a system fallback without styling page content. Keep design material outside deployed `site/public/`.

Build the extension; run `node browser/shared/serve-store-capture.mjs` from root for built UI/sample data at `127.0.0.1:4190` (`TEMOTO_CAPTURE_PORT` overrides it). `/?product=chrome&lang=en` (or `ja`): 1280×800; add `&mode=promo`: 440×280. Set scale 1 after navigation, inspect saved dimensions/clipping/alpha and stop the server. Previews do not prove installed behavior or real traffic. OG source: `site/scripts/og.html` / `render-og.sh`; keep OG/X metadata aligned.

`npm run package` in the extension directory creates a keyless Store ZIP in `release/`; unpacked builds retain the reserved identity. Never overwrite submitted ZIPs. Version bumps, website publication and Store submission/release need authorization. Verify package identity/permissions, native Chrome behavior, submission receipt and public status separately.

Keep both `PRIVACY.md` policies at their existing public URLs and each `store/listing.md` as authoritative listing/permission/reviewer copy. Keep user guidance in README.md and work instructions in AGENTS.md; ask before creating another explanatory document.
