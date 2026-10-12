# temoto for Chrome

`temoto for Chrome` keeps four page tools in one English-only popup: Color Picker, Screenshot, CSS, and Video Speed. This README describes the four-tool source under development. The manifest remains at version 1.1.0; this change has not been submitted or published.

## Features

- Pick a color from the screen, copy HEX, RGB, or HSL, and return to the latest eight picked colors. History contains actual picks, not the preview's initial color.
- Capture the visible area or the full page. Inspect the result with Fit or 100% zoom, then copy it or save a PNG. Capture preparation, lazy-content preloading, and animation freezing run automatically; there are no capture settings.
- Select an element to inspect its dimensions, margin, padding, typography, colors, and borders. Copy grouped CSS declarations or a unique selector as a separate action. The displayed values are computed styles; they do not recover the page's original stylesheet or reproduce its full layout.
- Change HTML5 video speed from 0.25× to 5× using the popup or page shortcuts: `G` toggles 1× / 1.5×, `D` adds 0.25×, and `S` subtracts 0.25×. The popup and each video's passive badge follow its actual rate, including rates outside the controls' range. A new or reused video keeps its own rate; temoto does not carry a previous selection into later videos.

`temoto Proxy` remains a separately installed, independently operated product. The core extension has no environment side panel or Proxy controls.

## Privacy

Video shortcuts and badges run locally on HTTP(S) pages without opening the popup. They ignore editable fields and modifier-key combinations, do not record keystrokes, and send no data to external servers. An optional bridge on explicitly opted-in pages supports extension availability and video-speed control only.

Color history and preferred color format remain in Chrome's local extension storage. Each screenshot has its own local capture ID and stays in the extension's IndexedDB so its preview can reload. The preview's Close action deletes that capture. Otherwise, it expires after one hour; expired records are removed on the next capture save or load.

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

Load `dist/client` as an unpacked extension from `chrome://extensions` after running the build. The popup is 416px wide and fits its content. Its four tools form a compact list; CSS starts inspection directly, and the other tools open their controls.

## Chrome Web Store package

```sh
npm run package
```

The command validates the extension build and creates `release/temoto-for-chrome-v<version>.zip` with `manifest.json` at the archive root. The Web Store ZIP omits the manifest `key`; unpacked builds retain the store-issued public key so their ID matches the existing store item. Store copy, privacy declarations, permission justifications, and reviewer steps remain authoritative in [store/listing.md](./store/listing.md). [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md) tracks release readiness and links to that material.

Do not overwrite a previously submitted ZIP while the source version is unchanged. Select the next release version and regenerate the package only as part of an authorized release.
