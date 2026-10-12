# temoto

temoto contains two independently installable Chrome extensions: four focused page tools and a separate development proxy manager.

- [Website](https://temoto.haygsiiii.chatgpt.site)
- [temoto for Chrome](https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid)
- [temoto Proxy](https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb)

## Products

### temoto for Chrome

A compact browser toolkit with four page tools:

- Color Picker: HEX, RGB, HSL, and the latest eight picked colors.
- Screenshot: visible-area and full-page capture with preview, clipboard copy, and PNG download.
- CSS: inspect an element and copy its size, spacing, typography, and colors.
- Video Speed: popup controls and page shortcuts that follow each video's actual rate.

Source, privacy details, development commands, and packaging instructions are in [`browser/temoto-chrome/`](./browser/temoto-chrome/). The four-tool changes are local development work; the existing Store links do not confirm that this source has been released.

### temoto Proxy

A standalone companion for named HTTP, HTTPS, SOCKS, domain-routing, PAC, and authenticated proxy profiles. It remains separate because Chrome's `proxy` permission changes browser-wide network behavior.

Source, privacy details, development commands, and packaging instructions are in [`browser/temoto-proxy/`](./browser/temoto-proxy/).

## Privacy

temoto does not use accounts, analytics, or telemetry. Settings remain in Chrome's local extension storage. Proxy credentials are session-only and are never included in exports.

- [temoto for Chrome privacy policy](./browser/temoto-chrome/PRIVACY.md)
- [temoto Proxy privacy policy](./browser/temoto-proxy/PRIVACY.md)

## Development

Validate temoto for Chrome:

```sh
cd browser/temoto-chrome
npm install
npm test
npm run build
npm run test:sites
```

Validate temoto Proxy:

```sh
cd browser/temoto-proxy
npm install
npm run check
```

Validate the website:

```sh
cd site
npm install
npm run lint
npm test
```

## Repository structure

```text
browser/temoto-chrome/  temoto for Chrome
browser/temoto-proxy/   temoto Proxy
browser/shared/         shared design tokens, icon renderer, and Store capture tools
site/                   public website
docs/                   asset ownership and maintenance guide
```

Each product keeps its own build and npm lockfile; this repository is not an npm workspace.

## Assets and release material

- [`docs/assets.md`](./docs/assets.md): canonical logos, website images, and regeneration paths.
- Each extension's `store/`: listing copy and current submission artwork.
- Each extension's `release/`: local ZIP artifacts; keep the submitted ZIP unchanged.
- [`browser/shared/STORE-CAPTURE.md`](./browser/shared/STORE-CAPTURE.md): the current Store screenshot workflow.
- [`browser/STORE-HANDOFF-2026-09-13.md`](./browser/STORE-HANDOFF-2026-09-13.md): dated preparation evidence, not live Store status.

Keep documentation and design notes out of `site/public/`; that directory is deployed as public assets.

## License

[MIT](./LICENSE)
