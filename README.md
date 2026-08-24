# temoto

temoto is a pair of Chrome extensions for testing pages and managing development proxy settings. The products are separately installable and share only the minimum state needed for their companion integration.

- [Website](https://temoto.haygsiiii.chatgpt.site)
- [temoto for Chrome](https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid)
- [temoto Proxy](https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb)

## Products

### temoto for Chrome

A compact browser toolkit with six page-testing utilities:

- Color Picker
- Screenshot
- Video Speed
- Switch Origin
- Site Reset
- Inspect

Source, privacy details, development commands, and packaging instructions are in [`browser/temoto-chrome/`](./browser/temoto-chrome/).

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
browser/shared/         shared popup design tokens
site/                   public website
```
