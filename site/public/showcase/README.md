# Website product captures

`chrome-launcher.png` and `proxy-popup.png` show the September 12, 2026 site-aligned UI. The website is prepared for the release at the owner's request; extension packaging and Chrome Web Store publication are separate steps.

Originally captured from the rendered 416 × 500 study surfaces (these study entrypoints have since been removed):

- Chrome: `browser/temoto-chrome` preview, `/?lang=en&design=site`
- Proxy: the same study server, `/proxy-study.html?lang=en&design=site`, using sample profiles only

The approved styles are now the default extension UI. For future captures, use the Chrome preview at `/?lang=en` and the independently built Proxy preview at `/popup.html?lang=en`; no design query switch is needed.

The manager captures from September 11 are retained as source material but are no longer shown on the site. The Proxy section pairs the popup with the route demonstration, stacking them on small screens.

Proxy uses the built-in Charles local, Staging routes, and Company PAC preview profiles. The localhost endpoint is example data; no installed extension, real proxy settings, credentials, or private destinations were used. Preview connection tests are simulated, not evidence of a network request.

Canonical Store artwork in `public/product-*` is still synchronized separately by `scripts/sync-product-icons.mjs`. Recapture from the corresponding preview when the product UI changes, retaining the dimensions in `app/page.tsx` and the asset tests.

Serve these small UI captures directly (`unoptimized`), avoiding the image optimizer's one-year immutable cache and unsupported intrinsic widths. The popup image URLs include the first 12 characters of the file's SHA-256 digest; update the URL after recapturing. The rendered-HTML tests check the digest and direct delivery.
