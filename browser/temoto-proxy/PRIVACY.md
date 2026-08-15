# Privacy policy for temoto Proxy

Last updated: August 14, 2026

temoto Proxy is a local Chrome extension for managing development proxy profiles. It does not transmit personal data, browsing data, page content, request bodies, response bodies, or analytics to the developer or to third parties.

## Data stored locally

The extension stores proxy profile names, endpoints, routing rules, bypass entries, PAC configuration, diagnostic URLs, authentication usernames, and UI state in Chrome's local extension storage. This data stays on the device unless the user explicitly exports profiles.

Proxy passwords are never stored in local or synchronized storage. They are held only in Chrome's in-memory session storage, are available only to extension contexts, and disappear when the browser session ends. Exported profiles omit usernames and passwords.

## Network access

When the user activates a profile, Chrome sends matching browser traffic through the proxy selected by the user. temoto Proxy does not receive or inspect the contents of that traffic.

When the user runs a connection test, the extension sends a credential-free HTTP `HEAD` request to the public URL entered by the user and displays the status and elapsed time locally. Local, private-network and metadata destinations are rejected, and redirects are not followed. No temoto-operated endpoint is used.

The extension listens for proxy authentication challenges only. It supplies session credentials only when Chrome identifies the challenge as a proxy challenge and its proxy host exactly matches a host explicitly allowed in the active profile. Authentication attempts are limited to prevent retry loops.

When the separately installed temoto for Chrome companion is present, temoto Proxy accepts local messages only from its allowlisted extension ID. It may return effective status and profile ID, name, color, and kind, and may perform an explicit profile activation, safe Off, or manager-open action. It never returns endpoints, routing rules, PAC contents, bypass entries, usernames, passwords, or complete profiles to the companion.

## Permissions

- `proxy`: reads, applies and clears Chrome proxy settings selected by the user.
- `storage`: stores profiles locally and keeps passwords in session-only storage.
- `webRequest`: receives the lifecycle events needed to bound proxy authentication attempts.
- `webRequestAuthProvider`: answers an authenticated proxy challenge after explicit user configuration.
- `<all_urls>`: allows authenticated proxy challenges for explicitly allowed proxy hosts and user-requested diagnostics for validated public destinations. It is not used to collect browsing history or page content.

## Incognito

Regular windows use Chrome's `regular_only` setting scope. Incognito settings are not changed unless the user enables both Chrome's “Allow in Incognito” access and temoto Proxy's own incognito control. The user can choose session-only or persistent incognito scope and can clear it at any time.

## Sharing and deletion

Export is initiated by the user and produces a local JSON file without secrets. Turning temoto Proxy off clears the extension's proxy override rather than forcing another connection mode. Deleting a profile removes it from extension storage; deleting an active profile clears the active override first. Disabling or uninstalling the extension also removes its control of Chrome's proxy setting.
