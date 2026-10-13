# Privacy policy for temoto Proxy

Last updated: October 13, 2026 (local draft for the popup-only source)

This policy describes only the retained legacy standalone extension; it does not confirm that its source changes have been published to the Chrome Web Store. The main extension's integrated simple switcher is covered by [its own policy](../temoto-chrome/PRIVACY.md).

Migration does not read, delete, import, or activate this extension's stored profiles or session credentials. Users first select Off here, then recreate needed Fixed endpoints or PAC URLs in the main extension.

temoto Proxy manages development proxy profiles locally. It does not send browsing data, page content, request/response bodies, or analytics to the developer.

## Local storage and drafts

Saved profile names, endpoints, routing rules, bypass entries, PAC configuration, diagnostic URLs, authentication usernames, and selected/active state remain in Chrome's local extension storage.

Passwords are held only in Chrome's in-memory session storage and disappear when the browser session ends. A username change without a new password clears the old session credentials; matching usernames may retain an existing session password. Exported profiles omit authentication usernames and passwords.

Unfinished popup edits are kept in browser-session storage so closing and reopening the popup can restore them. Drafts exclude passwords. Saving or canceling an edit removes its draft; closing the popup does not apply the draft's network changes.

## Network access

Activating a profile tells Chrome to send matching browser traffic through the user's selected proxy. temoto does not inspect or retain that traffic's contents. A user-provided remote PAC URL is fetched by Chrome as part of the selected configuration.

A user-requested connection test sends an HTTP HEAD request to a validated public URL with page credentials omitted and redirects disabled. It displays HTTP status and elapsed time locally. Proxy-authentication challenges are handled separately; the test does not identify exit IP or country. Destination validation rejects localhost names and literal private-address forms; the test uses only an accepted HTTP(S) URL. No temoto-operated test endpoint is used.

Proxy authentication is answered only for an allowed host while temoto owns the unchanged effective setting. The session username must match the saved profile. Attempts are bounded to prevent retry loops.

The companion API accepts only the allowlisted core extension ID and returns limited effective status and profile identity. It never returns endpoints, rules, PAC content, authentication data, or complete profiles. Legacy OPEN_MANAGER calls return an instruction to open the toolbar popup instead of opening a tab.

## Permissions and scope

- `proxy`: read, apply, verify, and clear the selected Chrome proxy setting.
- `storage`: store profiles locally and passwords/password-free drafts in session storage.
- `webRequest`: receive proxy-authentication and request-completion events needed to bound retries.
- `webRequestAuthProvider`: answer explicitly configured proxy challenges.
- `<all_urls>`: support those challenges and user-requested diagnostics. It is not used to collect browsing history or page content.

Regular windows use `regular_only`. Incognito changes require both Chrome's Allow in Incognito access and the popup's explicit opt-in, with session-only or persistent scope. Off clears temoto's regular and accessible incognito overrides, allowing underlying Chrome/system settings to take effect.

## Sharing and deletion

Export creates a local JSON file without authentication usernames or passwords; connection configuration such as endpoints and PAC content remains in it. Import resets test destinations to the public default. Replacement clears the active setting first and removes all session passwords.

Deleting a profile removes it from extension storage; deleting an active profile clears its override first. Disabling or uninstalling the extension removes its control of Chrome's proxy setting.
