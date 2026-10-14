# Store artwork capture

The capture stage serves the actual built product HTML/CSS/JavaScript using its existing browser-preview data. It does not install an extension, apply a proxy or verify real network behavior. The stage itself is excluded from release ZIPs. Current product artwork is for the five-tool main extension; standalone Proxy routes are retained only for legacy material.

From each product directory, build using the existing `npm run build` command. Then, from the repository root:

```sh
node browser/shared/serve-store-capture.mjs
```

It listens only on `127.0.0.1:4190`. `TEMOTO_CAPTURE_PORT` can override the port. Stop it after capture.

| URL path | Size | Output |
| --- | --- | --- |
| `/?product=chrome&lang=en` or `lang=ja` | 1280 × 800 | Chrome launcher JPEG |
| `/?product=proxy&lang=en` or `lang=ja` | 1280 × 800 | Proxy popup JPEG |
| `/proxy/manager.html?lang=en` or `lang=ja` | 1280 × 800 | Historical manager route, available only from older builds |
| `/?product=chrome&mode=promo` | 440 × 280 | Chrome small promo JPEG |
| `/?product=proxy&mode=promo` | 440 × 280 | Proxy small promo JPEG |

Use browser capture, not reconstructed product markup. Set device scale to 1 after navigation, allow the loaded page to render, and check the saved image itself: the browser may restore a Retina scale on navigation. Confirm exact pixel dimensions, no clipping and no alpha for screenshots. Restore the viewport afterward. Save to the corresponding existing `store/assets/` paths listed in each product's `store/listing.md`.

The 2026-09-13 set was captured in the Codex in-app browser. Popup compositions label their sample data; manager captures show built-in sample profiles. Neither is evidence of installed Chrome runtime or network testing.

Brand assets are served from `browser/shared/` and the core extension's bundled Geist font. The capture stage does not depend on the website's public assets. Store artwork stays in each extension's `store/assets/`; the website's OG template uses its separate 416 × 402 launcher capture.

On October 13, 2026 the built five-row launcher—Color Picker, Screenshot, CSS, Video Speed, and Proxy—was recaptured for the site as a 416 × 402 PNG (SHA-256 prefix `47ae7d5e3c53`) and for the English/Japanese Store artwork as 1280 × 800 JPEGs. Formats, dimensions, and the saved images were checked. The single-product OG image was also refreshed as a 1200 × 630 PNG. These captures do not verify native Chrome permissions or real proxy traffic.

Use the same built-UI process for later launcher and integrated Proxy-control captures. Earlier four-tool screenshots and standalone Proxy popup/manager images are historical material, rather than evidence for the integrated product. Keep legacy assets and source for existing users; do not label them as the new Proxy UI.

The retained legacy Proxy uses `popup.html` for home and profile editing. The retired manager route is available only from older builds and must not be used for new product artwork.
