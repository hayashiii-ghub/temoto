# Privacy Policy for temoto for Chrome

Effective date: August 11, 2026

temoto for Chrome is a toolkit for inspecting and testing the web page that the user is currently viewing. This policy explains how the extension handles data.

## Data the extension handles

Depending on the tool the user chooses, the extension may process:

- The current page URL, origin, hostname, title, and whether the page contains HTML5 video.
- The current playback speed of HTML5 video.
- Pixels from a user-requested selected-region, visible-page, or full-page screenshot.
- Element dimensions, computed visual properties, and a generated CSS selector when Measure / Inspect is active.
- User-provided Local, Staging, and Production origins.
- temoto Proxy installation state, effective status, and profile identity when the separately installed companion is available.
- The user's most recently selected color and playback speed.
- Cache, cookies, local storage, IndexedDB, Cache Storage, and service-worker registrations for the current origin when the user explicitly runs Site Reset.

## How data is used

The data above is used only to provide temoto's user-facing tools. temoto does not collect browsing history or record keystrokes.

- Current-page details are read when the popup opens so the requested tools can act on that page.
- A local key handler listens for `G`, `D`, and `S` on HTTP(S) pages so playback speed can change without opening the popup. It ignores editable fields and modifier-key combinations, processes matching keys locally, and does not retain the key events.
- Screenshot pixels are used to render the capture preview and allow the user to copy or save a PNG.
- Environment origins are used to navigate between development environments while preserving the rest of the URL.
- Site data is deleted only after the user chooses Site Reset and approves Chrome's optional permission prompt.
- Proxy status and profile identity are used only to show and operate the locally installed temoto Proxy companion. Proxy endpoints, rules, PAC contents, bypass entries, usernames, and passwords are not received by temoto for Chrome.

## Storage and retention

- Environment settings, the last selected color, and the last playback speed are stored locally using `chrome.storage.local` until the user changes them, clears extension data, or uninstalls the extension.
- A requested screenshot is stored temporarily in the extension's local IndexedDB and removed after the capture view loads or fails to load.
- Current-page details and measurement results are processed in memory and are not retained by temoto.

## Data sharing and transmission

temoto does not transmit user data to the developer or to any external server. When both temoto extensions are installed, temoto for Chrome exchanges bounded local messages with temoto Proxy for effective status, profile activation, safe Off, and opening the manager. It does not sell data, share data with third parties, use analytics, or use data for advertising, creditworthiness, or lending purposes. No remotely hosted code is executed.

## Permissions

- `activeTab`: temporarily access the current tab after a user gesture.
- `scripting`: detect and control video, show the region-selection overlay, and run Measure / Inspect on the current page.
- `storage`: save local environment settings and the user's most recently selected color and playback speed.
- `sidePanel`: show persistent environment settings and tool details.
- `clipboardWrite`: copy colors, screenshots, and CSS selectors after a user action.
- Website access on HTTP(S) pages: load the local Video Speed key handler in page frames so `G`, `D`, and `S` work without opening the popup. This access is not used to transmit page content or browsing activity.
- Optional `browsingData`: clear data only for the current origin when the user runs Site Reset. Chrome asks for this permission at that time.

The persistent website access above is required only for the always-available Video Speed shortcuts. Other page tools remain user initiated.

## User control

Users can change saved environments in Settings, clear temoto's extension data from Chrome, deny the optional Site Reset permission, or uninstall the extension at any time. Site Reset affects only the origin shown in the interface and requires an explicit user action.

## Limited Use

The use of information received from Chrome APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide or improve temoto's user-facing developer tools and is not transferred for unrelated purposes.

## Changes and contact

Material changes to these practices will be disclosed by updating this policy and the Chrome Web Store privacy declarations. Questions can be submitted through the project's [GitHub issue tracker](https://github.com/hayashiii-ghub/temoto/issues).
