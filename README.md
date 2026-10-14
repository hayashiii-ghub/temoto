# temoto

temoto brings Color Picker, Screenshot, CSS, Video Speed, and simple Proxy switching into one Chrome extension. Version 1.2.0 was submitted to Chrome Web Store review on October 14, 2026, with automatic publication after approval enabled. See [release status](./browser/temoto-chrome/CHROMEWEBSTORE.md) for the last verified Store state.

- [Website](https://temoto.hayashiii-gpt.chatgpt.site)
- [temoto for Chrome](https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid)

## temoto for Chrome

A compact browser toolkit with five tools:

- Color Picker: HEX, RGB, HSL, and the latest eight picked colors.
- Screenshot: visible-area and full-page capture with preview, clipboard copy, and PNG download.
- CSS: inspect an element and copy its size, spacing, typography, and colors.
- Video Speed: popup controls and page shortcuts that follow each video's actual rate.
- Proxy: named single-endpoint Fixed profiles or PAC URLs, with Add/Edit/Delete, click to activate, and Off. Adding a profile saves it without applying it. Editing the active profile uses Save & reapply and updates its current setting immediately; other saves keep the profile inactive.

Source, privacy details, development commands, and packaging instructions are in [`browser/temoto-chrome/`](./browser/temoto-chrome/). The existing Store link does not confirm that this integrated source has been released.

Proxy requires Chrome's `proxy` permission and affects all regular Chrome windows. It supports HTTP, HTTPS, SOCKS4, SOCKS5, and PAC URLs. Off clears temoto's override, allowing the underlying setting to take effect. The simple switcher does not include custom authentication, connection diagnostics, domain routing, import/export, or incognito configuration.

## Moving from legacy temoto Proxy

1. Open the old separately installed `temoto Proxy` and select Off.
2. Open temoto → Proxy and recreate the Fixed endpoints or PAC URLs you need.
3. Activate a saved profile only when ready; use Off when finished.

There is no automatic migration or activation. Existing profiles and credentials in the old extension are preserved. The separate Store item was unpublished on October 14, 2026; its [source and advanced-profile documentation](./browser/temoto-proxy/) remain available for existing users.

## Privacy

temoto does not use accounts, analytics, or telemetry. Colors, preferences, and simple proxy profiles remain in Chrome's local extension storage. Integrated Proxy stores no authentication usernames or passwords. Traffic goes through a user-supplied proxy only after activation; Chrome fetches a selected PAC URL as needed.

- [temoto for Chrome privacy policy](./browser/temoto-chrome/PRIVACY.md)
- [Legacy temoto Proxy privacy policy](./browser/temoto-proxy/PRIVACY.md)

## Development

Validate temoto for Chrome:

```sh
cd browser/temoto-chrome
npm install
npm test
npm run build
npm run test:sites
```

Validate the legacy Proxy only when changing that retained source:

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
browser/temoto-proxy/   retained legacy temoto Proxy
browser/shared/         shared design tokens, icon renderer, and Store capture tools
site/                   public website
docs/                   asset ownership and maintenance guide
```

The main extension, website, and retained legacy source keep separate builds and npm lockfiles; this repository is not an npm workspace.

## Assets and release material

- [`docs/assets.md`](./docs/assets.md): canonical logos, website images, and regeneration paths.
- The main extension's `store/`: listing copy and the refreshed five-tool launcher artwork. Legacy artwork remains historical material.
- Each extension's `release/`: local ZIP artifacts; keep the submitted ZIP unchanged.
- [`browser/shared/STORE-CAPTURE.md`](./browser/shared/STORE-CAPTURE.md): the current Store screenshot workflow.
- [`browser/STORE-HANDOFF-2026-09-13.md`](./browser/STORE-HANDOFF-2026-09-13.md): dated preparation evidence, not live Store status.

Keep documentation and design notes out of `site/public/`; that directory is deployed as public assets.

## License

[MIT](./LICENSE)
