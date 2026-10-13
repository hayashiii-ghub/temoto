# temoto for Chrome

`temoto for Chrome` keeps five tools in one English-only popup: Color Picker, Screenshot, CSS, Video Speed, and Proxy. This README describes the integrated source under development. The manifest remains at version 1.1.0; this change has not been submitted or published.

## Features

- Pick a color from the screen, copy HEX, RGB, or HSL, and return to the latest eight picked colors. History contains actual picks, not the preview's initial color.
- Capture the visible area or the full page. Inspect the result with Fit or 100% zoom, then copy it or save a PNG. Capture preparation, lazy-content preloading, and animation freezing run automatically; there are no capture settings.
- Select an element to inspect its dimensions, margin, padding, typography, colors, and borders. Copy grouped CSS declarations or a unique selector as a separate action. The displayed values are computed styles; they do not recover the page's original stylesheet or reproduce its full layout.
- Change HTML5 video speed from 0.25× to 5× using the popup or page shortcuts: `G` toggles 1× / 1.5×, `D` adds 0.25×, and `S` subtracts 0.25×. The popup and each video's passive badge follow its actual rate, including rates outside the controls' range. A new or reused video keeps its own rate; temoto does not carry a previous selection into later videos.

- Save named Fixed proxy profiles with one HTTP, HTTPS, SOCKS4, or SOCKS5 endpoint, or a PAC URL. Add, edit, delete, and click a saved profile to switch regular Chrome windows. Saving a new profile does not activate it. Editing the active profile uses Save & reapply and updates its current setting immediately; other saves keep the profile inactive. Off clears temoto's override and lets the underlying Chrome/system setting take effect.

Proxy uses the required Chrome `proxy` permission across regular windows, rather than only the current tab. It does not provide custom authentication, connection tests, domain routing, import/export, or incognito configuration. A proxy server or PAC URL must be supplied by the user.

## Moving from the old temoto Proxy

1. Open the separately installed `temoto Proxy` and select Off.
2. Open temoto → Proxy and recreate each needed Fixed endpoint or PAC URL profile.
3. Click the saved profile when you want to activate it; use Off when finished.

There is no automatic import or activation. The old extension's profiles and session credentials are preserved. Its [source and documentation](../temoto-proxy/) remain available for existing advanced profiles.

## Privacy

Video shortcuts and badges run locally on HTTP(S) pages without opening the popup. They ignore editable fields and modifier-key combinations, do not record keystrokes, and send no data to external servers. An optional bridge on explicitly opted-in pages supports extension availability and video-speed control only.

Color history, preferred color format, saved proxy profiles, and selected proxy state remain in Chrome's local extension storage. Proxy stores no usernames or passwords. Unfinished editor fields stay in browser-session storage until Save, Cancel, or Delete; reopening the popup can restore them without applying a proxy. Each screenshot has its own local capture ID and stays in the extension's IndexedDB so its preview can reload. The preview's Close action deletes that capture. Otherwise, it expires after one hour; expired records are removed on the next capture save or load.

See [PRIVACY.md](./PRIVACY.md) for the complete policy and permission details.

## Development

All extension application code lives in `src/` as strict TypeScript. Vite bundles the React surfaces, while `tsconfig.extension.json` compiles the service worker and content scripts to their manifest paths. The packaged extension contains browser-ready JavaScript only.

```sh
npm install
npm run dev
```

Build and test:

```sh
npm test
npm run build
npm run test:sites
```

Load `dist/client` as an unpacked extension from `chrome://extensions` after running the build. The popup is 416px wide and fits its content. Its five tools form a compact list; CSS starts inspection directly, and the other tools open their controls.

## Chrome Web Store package

```sh
npm run package
```

The command validates the extension build and creates `release/temoto-for-chrome-v<version>.zip` with `manifest.json` at the archive root. The Web Store ZIP omits the manifest `key`; unpacked builds retain the store-issued public key so their ID matches the existing store item. Store copy, privacy declarations, permission justifications, and reviewer steps remain authoritative in [store/listing.md](./store/listing.md). [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md) tracks release readiness and links to that material.

Do not overwrite a previously submitted ZIP while the source version is unchanged. Select the next release version and regenerate the package only as part of an authorized release.
