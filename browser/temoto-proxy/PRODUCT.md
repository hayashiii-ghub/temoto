# temoto Proxy product definition

## Goal

temoto Proxy enables web developers to switch Chrome's network route as a named development workspace without needing proxy expertise or fearing a stuck, invisible or unsafe browser configuration.

The finished product is not a raw host-and-port switch. It makes the effective browser state visible, validates every change before applying it, recovers safely when a change fails, separates shareable configuration from secrets, and always provides an explicit path back to Chrome's underlying setting.

This document defines the product itself. There is no reduced MVP contract.

## Intended users

- Web and frontend developers moving among local, staging and production routes.
- QA engineers testing through development gateways.
- Developers using Charles, Proxyman, mitmproxy, SOCKS gateways or organization-managed proxy endpoints.
- Teams that need reproducible proxy configuration without distributing credentials.

Consumer VPN, anonymity, traffic inspection, response modification and operating-system-wide proxy management are outside the product purpose.

## Product invariants

1. **Safe by default:** invalid or uncontrollable settings are rejected before temoto changes Chrome.
2. **Always reversible:** Off calls `chrome.proxy.settings.clear` and never forces `direct`, `system` or another replacement mode.
3. **Effective state is visible:** the UI distinguishes Off, active, changed, conflicting, policy-controlled and orphaned states.
4. **Local first:** there is no temoto service, telemetry endpoint, analytics pipeline or browsing-data collection.
5. **Secrets stay separate:** passwords are session-only; exports contain neither passwords nor usernames.
6. **Explicit scope:** regular windows use `regular_only`; incognito requires both Chrome access and an in-product opt-in.
7. **Failure preserves truth:** failed activation or clearing does not claim success, and failed reconfiguration restores the preceding effective setting when Chrome permits it.

## Functional requirements

### Profiles and routing

- Create, edit, duplicate, delete, activate and deactivate named profiles.
- Support HTTP, HTTPS, SOCKS4 and SOCKS5 proxy endpoints.
- Support one endpoint for all traffic or independent HTTP, HTTPS and fallback endpoints.
- Support Chrome bypass patterns for fixed profiles.
- Support ordered host or URL routing rules with proxy/direct actions and a declared fallback action.
- Compile visual routing rules into a deterministic local PAC script.
- Support advanced inline PAC scripts and explicit HTTP(S) PAC URLs.
- Warn before mandatory PAC behavior that can prevent direct fallback.

### Authentication

- Support authenticated proxy challenges without observing page authentication challenges.
- Keep passwords only in `chrome.storage.session`.
- Restrict credentials to proxy challenges whose host exactly matches an explicit allowed-host list.
- Bound automatic credential attempts to prevent authentication loops.
- Make missing session credentials visible after Chrome restarts.

### State, recovery and conflicts

- Show the active profile in the popup, manager and toolbar badge.
- Read Chrome's effective value and `levelOfControl` rather than trusting saved UI state.
- Refuse to overwrite a higher-priority extension or administrator policy.
- Verify Chrome's setting after activation.
- Restore the previous effective proxy after a failed reconfiguration.
- Keep the last truthful active state if Off fails.
- Clear an active proxy before deleting or replacing its profile.
- Remain correct across Manifest V3 service-worker suspension and restart.

### Diagnostics and sharing

- Run a user-requested, credential-free HTTP `HEAD` request to a validated public diagnostic URL without following redirects.
- Report reachability, HTTP status, elapsed time and final URL locally.
- Export all profiles as versioned JSON without secrets.
- Merge or replace profiles from a validated temoto Proxy export.
- Prevent an import from writing unknown fields or credentials into the normalized profile schema, reset imported diagnostic URLs, and clear all session passwords during replacement.

### Incognito

- Leave incognito unchanged by default.
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
- Every error returned by Chrome reaches a visible UI status or toast.

### Performance

- Popup rendering and switching do not depend on a remote network request.
- The background worker is event-driven and does not poll or remain artificially alive.
- Routing-rule generation is bounded to 200 rules and bypass lists to 200 entries.

### Accessibility and compatibility

- All controls have accessible names and keyboard-focus treatment.
- State is communicated by text as well as color.
- The extension targets Manifest V3 and Chrome 116 or later on macOS and Windows.
- The popup remains usable at its fixed 416-pixel width; the manager adapts below 820 pixels.

## Completion evidence

The release gate is:

1. `npm test` passes core transformation, validation, authentication, conflict, rollback, Off, import/export, incognito and diagnostic tests.
2. `npm run build` emits and verifies every required Manifest V3 file and icon.
3. Browser visual verification covers popup active/Off/profile-switch states and manager fixed/routing/PAC/auth/incognito states.
4. `npm run package` produces a ZIP with `manifest.json` at its root.
5. The unpacked build loads without extension errors in current stable Chrome, and a reviewer manually verifies activation and Off against a disposable local proxy.

Items 1–4 are automatable in this repository. Item 5 is a release safety gate because it changes the browser's real network setting.
