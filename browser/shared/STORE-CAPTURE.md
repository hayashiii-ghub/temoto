# Store artwork capture

The capture stage serves the actual built product HTML/CSS/JavaScript using its existing browser-preview data. It does not install an extension, apply a proxy or verify real network behavior. The stage itself is excluded from both release ZIPs.

From each product directory, build using the existing `npm run build` command. Then, from the repository root:

```sh
node browser/shared/serve-store-capture.mjs
```

It listens only on `127.0.0.1:4190`. `TEMOTO_CAPTURE_PORT` can override the port. Stop it after capture.

| URL path | Size | Output |
| --- | --- | --- |
| `/?product=chrome&lang=en` or `lang=ja` | 1280 × 800 | Chrome launcher JPEG |
| `/?product=proxy&lang=en` or `lang=ja` | 1280 × 800 | Proxy popup JPEG |
| `/proxy/manager.html?lang=en` or `lang=ja` | 1280 × 800 | Proxy manager opaque PNG |
| `/?product=chrome&mode=promo` | 440 × 280 | Chrome small promo JPEG |
| `/?product=proxy&mode=promo` | 440 × 280 | Proxy small promo JPEG |

Use browser capture, not reconstructed product markup. Set device scale to 1 after navigation, allow the loaded page to render, and check the saved image itself: the browser may restore a Retina scale on navigation. Confirm exact pixel dimensions, no clipping and no alpha for screenshots. Restore the viewport afterward. Save to the corresponding existing `store/assets/` paths listed in each product's `store/listing.md`.

The 2026-09-13 set was captured in the Codex in-app browser. Popup compositions label their sample data; manager captures show built-in sample profiles. Neither is evidence of installed Chrome runtime or network testing.

Run the site's existing `npm run sync:product-icons` command after updating artwork to synchronize its canonical copies. This does not deploy the website.
