# temoto Proxy

`temoto Proxy` turns Chrome proxy settings into named development workspaces that are visible, reversible and safe to share. It is a separate companion to `temoto for Chrome` because Chrome's mandatory `proxy` permission changes browser-wide network behavior.

## Product goal

Web developers can switch browser network routes without proxy expertise or fear of leaving Chrome misconfigured. Every effective state is visible, every temoto override can be cleared, and traffic content never leaves the browser through temoto.

## Features

- Fixed HTTP, HTTPS, SOCKS4 and SOCKS5 proxy profiles.
- Single-proxy or protocol-specific HTTP, HTTPS and fallback endpoints.
- Ordered domain routing rules compiled to a local PAC script.
- Inline or URL-based PAC profiles with explicit mandatory-mode warnings.
- Chrome-compatible bypass lists.
- One-click activation and a safe Off action that clears temoto's setting instead of forcing direct mode.
- Detection of policy and higher-priority extension conflicts.
- Session-only proxy authentication restricted to explicit proxy hosts.
- Credential-free connection diagnostics against a public user-selected URL without redirect following.
- Secret-free JSON import, export and team sharing; imported test URLs reset to the public default, and replace imports clear session passwords.
- Explicit, isolated incognito control with session-only or persistent scope.
- Persistent toolbar state and recovery across Manifest V3 service-worker restarts.
- Allowlisted companion controls in the `temoto for Chrome` side panel for effective status, profile activation, safe Off, and opening the manager.

## Privacy and permissions

The extension does not collect browsing history, URLs, request or response bodies, analytics, or telemetry. Profiles remain in `chrome.storage.local`. Proxy passwords remain only in `chrome.storage.session` and are excluded from exports.

The `proxy` permission is the product's core capability. `webRequest` and `webRequestAuthProvider`, together with `<all_urls>`, are used only to answer proxy authentication challenges for explicitly allowed proxy hosts. They are not used to inspect or modify page traffic.

See [PRIVACY.md](./PRIVACY.md) for the complete policy.

## Development

```sh
npm test
npm run build
```

Load `dist/client` from `chrome://extensions` as an unpacked extension.

## temoto for Chrome integration

The extension exposes a versioned, extension-ID-allowlisted API to `temoto for Chrome`. It returns only profile identity and effective status; endpoints, PAC contents, bypass rules, authentication data, and complete profiles never cross the extension boundary.

Both unpacked extensions use public manifest keys so their development IDs remain stable. Before a Chrome Web Store handoff, reserve both store items, replace the two manifest keys with the public keys issued by the Developer Dashboard, and update the companion IDs in `public/manifest.json`, `public/companion-api.js`, and `../temoto-chrome/src/proxy-companion.js`. Then rebuild and test both store-keyed packages together.

Create the Chrome Web Store ZIP:

```sh
npm run package
```
