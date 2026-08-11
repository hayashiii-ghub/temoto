# temoto for Chrome

`temoto for Chrome` is a compact, on-demand browser toolkit for web developers. It keeps six common page-testing utilities in one popup without monitoring browsing in the background.

## Features

- Pick a color from the screen and copy its hex value.
- Capture the visible viewport or a selected region, then copy or save it as PNG.
- Detect HTML5 video and change its playback speed.
- Switch between Local, Staging, and Production while preserving the current path, query, and hash.
- Clear cache, cookies, storage, and service workers for the current origin after an explicit permission prompt.
- Measure an element and copy a compact CSS selector.

Proxy functionality is intentionally not included. It will be developed as a separate companion because Chrome proxy access is broader than the core extension needs.

## Privacy

Page access happens only after the user opens temoto or runs a tool. Settings remain in Chrome's local extension storage, capture pixels are held in session storage only until the capture view loads, and no user data is sent to external servers.

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
