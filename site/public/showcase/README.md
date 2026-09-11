# Site-only product captures

Captured 2026-09-11 from the existing local browser previews, in English, at device scale 1. These are screenshots of the product UI, not generated mockups. No installed extension, real proxy configuration, credentials, or private destinations were used.

- `chrome-launcher.png`: temoto for Chrome 0.2.0, Vite preview `/?lang=en`, launcher main element, 416 × 500.
- `proxy-popup.png`: temoto Proxy 1.1.0, built `popup.html?lang=en`, popup shell, 416 × 500.
- `proxy-manager.png`: temoto Proxy 1.1.0, built `manager.html?lang=en`, top viewport, 1000 × 760.
- `proxy-manager-mobile.png`: same preview at 390 × 760, selected by the site's picture element below 768px so the profile text stays readable.

Proxy uses the built-in preview profiles (Charles local, Staging routes, Company PAC). The localhost endpoint is example data. The selected profile is Charles local, with authentication off; no PAC contents or private hosts are shown. The existing preview already shows an active profile. In the real popup the user activates a profile before testing it; the website illustration follows that order. The preview's successful test is simulated, not evidence of a network request.

Keep these assets separate from the canonical Store screenshots maintained by `scripts/sync-product-icons.mjs`. Recapture from the corresponding preview when product UI changes; retain the image dimensions in `app/page.tsx` and the asset tests.
