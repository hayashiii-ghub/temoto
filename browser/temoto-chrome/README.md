# temoto for Chrome

`temoto for Chrome` is a compact browser toolkit for web developers. It keeps six common page-testing utilities in one focused popup and provides page-level video shortcuts.

## Features

- Pick a color from the screen and copy its hex value.
- Capture a selected region, the visible viewport, or the full page, with optional delay and scroll-reveal controls, then copy or save it as PNG.
- Change HTML5 video speed with the popup or page shortcuts: `G` toggles 1× / 1.5×, `D` adds 0.25×, and `S` subtracts 0.25×. The last chosen speed is kept for later videos, and a subtle badge at the video's top-left stays in sync with the current rate.
- Switch between Local, Staging, and Production while preserving the current path, query, and hash.
- Clear cache, cookies, storage, and service workers for the current origin after an explicit permission prompt.
- Measure an element and copy a compact CSS selector.

Proxy settings remain in the separately installed `temoto Proxy` companion because Chrome proxy access is broader than the core extension needs. When the companion is installed, the `temoto for Chrome` side panel shows its effective state and supports profile switching, safe Off, and opening the full proxy manager without receiving credentials or full proxy configuration.

## Privacy

The extension installs a local key handler on HTTP(S) pages so video shortcuts work without opening the popup. It ignores editable fields and modifier-key combinations, does not record keystrokes, and sends no user data to external servers. Settings remain in Chrome's local extension storage, and capture pixels are held temporarily in the extension's local IndexedDB only until the capture view loads.

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
npm run test:sites
npm run build
```

Load `dist/client` as an unpacked extension from `chrome://extensions` after running the build.

To test the Proxy integration locally, also build and load `../temoto-proxy/dist/client`, then reload both extensions after manifest changes.

## Chrome Web Store package

```sh
npm run package
```

The command validates the extension build and creates `release/temoto-for-chrome-v<version>.zip` with `manifest.json` at the archive root. The Web Store ZIP omits the manifest `key` because the dashboard rejects that field; unpacked builds retain the store-issued public key so their ID matches the reserved store item. Store copy, privacy declarations, permission justifications, and submission steps are in [store/listing.md](./store/listing.md).
