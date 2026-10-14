# Asset ownership

The main extension, website, and retained legacy Proxy build independently. Keep the assets needed by each build, their licenses, and the original Store submission material. Do not keep unused copies in `site/public/`; everything there is deployed.

## Logos and fonts

| Asset | Source and consumers |
| --- | --- |
| Main mark | `browser/shared/temoto-mark.svg` is the canonical geometry. `site/public/temoto-mark.svg` is the website's deployed copy. |
| Legacy hollow mark | `browser/shared/temoto-proxy-mark.svg` is used by the legacy Store capture stage. It is not a website asset. |
| Extension PNG icons | `browser/shared/icon-utils.mjs` renders the main solid mark and Proxy's hollow counterpart. Core runs `npm run build:icons`; legacy Proxy generates icons as part of its build. |
| Geist | Core bundles `browser/temoto-chrome/public/fonts/geist-latin-wght-normal.woff2` with its license and source notes. The website carries its own deployed copy and license in `site/public/brand/`. The capture stage uses the core copy. |
| Inter Bold | `site/public/brand/Inter-Bold.ttf`, with `Inter-OFL.txt`, supplies the website and OG headline. |
| IBM Plex Mono | Extension dependencies supply technical color values and capture dimensions. |

The selected B / Joint mark uses two angular pieces in a 160 × 160 frame. Proxy uses its inward outline, strengthened at 16px. Keep these shapes and font licenses when regenerating assets. Exploration boards and retired alternatives remain in Git history.

## Store and release material

- Each extension's `store/assets/` contains its authoritative submission images; `store/listing.md` describes them. Main Japanese artwork remains reference material for the English-only 1.2.0 package. Legacy popup and retired manager images are historical release evidence, not examples of integrated Proxy.
- [`browser/shared/STORE-CAPTURE.md`](../browser/shared/STORE-CAPTURE.md) documents the built-UI capture stage. It serves shared logos and the core font directly; it does not need website image copies. Capture output does not prove installed-extension behavior or real proxy traffic.
- Each extension's ignored `release/` directory retains its original ZIPs. Do not regenerate or overwrite submitted artifacts during cleanup. [Main release status](../browser/temoto-chrome/CHROMEWEBSTORE.md) records the submitted version and SHA-256; the [dated handoff](../browser/STORE-HANDOFF-2026-09-13.md) retains earlier evidence.

## Website assets

- `site/app/components/launcher-preview.tsx` and its CSS render the current five-tool illustration. The SVGs in `site/public/tools/` come from `@phosphor-icons/react` 2.1.10; retain their adjacent MIT license.
- `site/public/showcase/chrome-launcher.png` is the 416 × 402 five-tool capture used by the OG template. SHA-256 prefix: `47ae7d5e3c53`.
- `site/public/og-temoto.png` is the current 1200 × 630 sharing image. Its source and rendering command are `site/scripts/og.html` and `site/scripts/render-og.sh`. When it changes, update the image version in `site/app/layout.tsx` so OG and X metadata point to the same revision.
- `site/docs/design/` and `site/design-qa.md` retain the selected design and comparison evidence outside the public directory.

The previous `product-*` copies, standalone-Proxy showcase, unused motion components, and image-copy build hooks were removed in the October 14 cleanup. Original Store images and the legacy source remain under `browser/`; removed website copies remain in Git history.

Run `npm run lint` and `npm test` in `site/` after website changes. Its tests cover rendered content, the current asset references, the single Store action, and OG dimensions. Local builds, deployed website state, and Chrome Store publication are separate verification steps.
