# temoto for Chrome

`temoto for Chrome` is a compact browser toolkit for web developers. It keeps six common page-testing utilities in one focused popup and provides page-level video shortcuts.

## Features

- Pick a color from the screen and copy its hex value.
- Capture a selected region, the visible viewport, or the full page, with optional delay and scroll-reveal controls, then copy or save it as PNG.
- Change HTML5 video speed with the popup or page shortcuts: `G` toggles 1× / 1.5×, `D` adds 0.25×, and `S` subtracts 0.25×. A subtle badge at the video's top-left keeps the current speed visible.
- Switch between Local, Staging, and Production while preserving the current path, query, and hash.
- Clear cache, cookies, storage, and service workers for the current origin after an explicit permission prompt.
- Measure an element and copy a compact CSS selector.

Proxy functionality is intentionally not included. It will be developed as a separate companion because Chrome proxy access is broader than the core extension needs.

## Privacy

The extension installs a local key handler on HTTP(S) pages so video shortcuts work without opening the popup. It ignores editable fields and modifier-key combinations, does not record keystrokes, and sends no user data to external servers. Settings remain in Chrome's local extension storage, and capture pixels are held temporarily in the extension's local IndexedDB only until the capture view loads.

See [PRIVACY.md](./PRIVACY.md) for the complete policy and permission details.

## Development

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

## Chrome Web Store package

```sh
npm run package
```

The command validates the extension build and creates `release/temoto-for-chrome-v<version>.zip` with `manifest.json` at the archive root. Store copy, privacy declarations, permission justifications, and submission steps are in [store/listing.md](./store/listing.md).
