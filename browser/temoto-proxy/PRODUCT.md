# temoto Proxy product definition

## Legacy scope

This source is retained for existing users and advanced-profile migration. The main product is now [temoto for Chrome](../temoto-chrome/), with simple Proxy switching integrated as its fifth tool. Do not present this standalone extension as a second main product or automatically migrate/apply its saved settings.

Select Off here before recreating needed Fixed endpoints or PAC URLs in temoto. Existing profiles and credentials are preserved. The requirements below describe only the retained legacy runtime.

## Goal

The legacy temoto Proxy lets web developers add, edit, and switch named Chrome proxy profiles inside the toolbar popup.

The popup shows effective state and scope, validates profile inputs, separates saved configuration from session passwords, and provides Off to clear temoto's override.

This document describes the current popup-only source. Previously published packages and historical artwork may still contain the retired manager page.

## Intended users

- Web and frontend developers moving among local, staging and production routes.
- QA engineers testing through development gateways.
- Developers using Charles, Proxyman, mitmproxy, SOCKS gateways or organization-managed proxy endpoints.
- Teams that need reproducible proxy configuration without distributing credentials.

Consumer VPN, anonymity, traffic inspection, response modification and operating-system-wide proxy management are outside the product purpose.

## Product invariants

1. **Validated changes:** malformed profile inputs and uncontrollable settings are rejected before applying a Chrome setting.
2. **Always reversible:** Off calls `chrome.proxy.settings.clear` and never forces `direct`, `system` or another replacement mode.
3. **Effective state is visible:** the UI distinguishes Off, active, changed, conflicting, policy-controlled and orphaned states.
4. **Local first:** there is no temoto service, telemetry endpoint, analytics pipeline or browsing-data collection.
5. **Secrets stay separate:** passwords are session-only; exports contain neither passwords nor usernames.
6. **Explicit scope:** regular windows use `regular_only`; incognito requires both Chrome access and an in-product opt-in.
7. **Failure preserves truth:** failed activation or clearing does not claim success, and failed reconfiguration restores the preceding effective setting when Chrome permits it.

## Functional requirements

### Profiles and routing

- Create basic Fixed proxy and PAC URL profiles with the popup header New action.
- Edit saved profiles through their separate Edit action; selecting a home profile activates it.
- Duplicate saved configurations, not unsaved drafts. Confirm deletion inline; clear an active override before deleting its profile.
- Support HTTP, HTTPS, SOCKS4 and SOCKS5 proxy endpoints.
- Support one endpoint for new Fixed profiles. Preserve full editing of existing protocol-specific HTTP, HTTPS and fallback endpoints.
- Support Chrome bypass patterns for fixed profiles.
- Preserve full editing and import of existing ordered host/URL routing profiles with proxy/direct actions and a declared fallback. Domain routing is not an initial new-profile choice.
- Compile visual routing rules into a deterministic local PAC script.
- Offer explicit HTTP(S) PAC URLs for new profiles; retain full editing/import of existing inline PAC scripts.
- Keep the Block direct fallback choice explicit for PAC profiles.

### Authentication

- Support authenticated proxy challenges without observing page authentication challenges.
- Keep passwords only in `chrome.storage.session`; usernames may remain in saved local profiles.
- Clear old session credentials when the saved username changes without a replacement password; retain matching credentials on same-username blank saves.
- Restrict credentials to proxy challenges whose host exactly matches an explicit allowed-host list.
- Bound automatic credential attempts to prevent authentication loops.
- Make missing session credentials visible after Chrome restarts.

### State, recovery and conflicts

- Show effective state and the active profile in popup home and the toolbar badge; keep errors and conflicts as visible inline information.
- Read Chrome's effective value and `levelOfControl` rather than trusting saved UI state.
- Refuse to overwrite a higher-priority extension or administrator policy.
- Verify Chrome's setting after activation.
- Restore the previous effective proxy after a failed reconfiguration.
- Keep the last truthful active state if Off fails.
- Clear an active proxy before deleting or replacing its profile.
- Remain correct across Manifest V3 service-worker suspension and restart.

### Diagnostics and sharing

- Run connection tests only from the profile editor for an active profile. Use HTTP HEAD with page credentials omitted and redirects disabled. Proxy authentication is handled separately.
- Report reachability, HTTP status, elapsed time and final URL locally.
- Keep Import/Export in collapsed home Options. Export versioned JSON without authentication usernames or passwords; connection endpoints, rules, PAC content, and other configuration remain included.
- Merge or replace profiles from a validated temoto Proxy export.
- Normalize imported profiles, ignore password fields, reset imported diagnostic URLs, and clear all session passwords during replacement. Continue accepting the existing schema and advanced profile kinds.

### Popup editing and companion compatibility

- Do not provide manager.html, options_ui, or a side panel.
- Persist unfinished draft fields in browser-session storage with passwords excluded; restore them when the popup reopens.
- Save or Cancel clears the draft; unfinished edits never apply network changes merely because the popup closes.
- GET_SUMMARY remains extension-ID allowlisted and limited to effective status/profile identity.
- Legacy OPEN_MANAGER returns an explicit toolbar instruction rather than opening a tab.

### Incognito

- Keep Incognito inside home Options and leave it unchanged by default.
- Detect whether Chrome has granted “Allow in Incognito”.
- Apply the active profile only after explicit in-product opt-in.
- Support session-only and persistent incognito scopes.
- Clear both possible incognito scopes when turning temoto off.

## Non-functional requirements

### Security and privacy

- No remote extension code and no remotely controlled behavior other than an explicit user-provided PAC URL.
- No traffic bodies, browsing history, analytics or telemetry are collected.
- User-provided profile text is rendered with DOM text APIs, not inserted as HTML.
- Inputs are length-bounded and normalized before generating Chrome configuration or PAC source.
- Authentication never answers a non-proxy challenge or a challenge from an unlisted host.

### Reliability

- Configuration generation is deterministic and independently testable.
- Chrome mutation paths use read, validate, set/clear and verify steps.
- Persistent state uses `chrome.storage.local`; runtime secrets use `chrome.storage.session`.
- Chrome errors are reported inline. Do not reserve a notification rail or show routine success toasts.

### Performance

- Popup rendering and switching do not depend on a remote network request.
- The background worker is event-driven and does not poll or remain artificially alive.
- Routing-rule generation is bounded to 200 rules and bypass lists to 200 entries.

### Accessibility and compatibility

- All controls have accessible names and keyboard-focus treatment.
- State is communicated by text as well as color.
- The extension targets Manifest V3 and Chrome 116 or later on macOS and Windows.
- Home and inline editing remain usable at the 416-pixel popup width, with content-sized height up to 580px and scrolling when needed.

## Completion evidence

The release gate is:

1. `npm test` passes core transformation, validation, authentication, conflict, rollback, Off, import/export, incognito and diagnostic tests.
2. `npm run build` emits and verifies every required Manifest V3 file and icon.
3. Browser visual verification covers home active/Off states, New/Edit/Cancel, password-free draft restore, Fixed/PAC URL creation, legacy routing/per-protocol/inline-PAC editing, import/export, authentication, and incognito. Historical manager artwork is not evidence for this UI.
4. `npm run package` produces a ZIP with `manifest.json` at its root.
5. The unpacked build loads without extension errors in current stable Chrome, and a reviewer manually verifies activation and Off against a disposable local proxy.

Items 1–4 are automatable in this repository. Item 5 is a release safety gate because it changes the browser's real network setting.
