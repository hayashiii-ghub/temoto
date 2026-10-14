# Privacy Policy for temoto for Chrome

Last updated: October 14, 2026

This policy applies to temoto for Chrome version 1.2.0 and describes its data handling. It does not confirm the behavior of earlier Chrome Web Store versions.

temoto for Chrome provides Color Picker, Screenshot, CSS, Video Speed, and simple Proxy switching. Proxy applies across regular Chrome windows; the other tools operate on the page the user is viewing.

## Data the extension handles

Depending on the tool, the extension may process:

- The current page URL, origin, hostname, title, the number of HTML5 videos, and their current playback rates.
- A color chosen through Chrome's screen eyedropper, its HEX/RGB/HSL representations, and the latest eight picked colors.
- Pixels from a user-requested visible-area or full-page screenshot.
- A selected element's dimensions, computed spacing, typography, colors, borders, and a generated unique CSS selector.
- The user's preferred color format.
- User-entered proxy profile names, a single fixed endpoint or PAC URL, selected profile state, and Chrome's effective proxy setting. Proxy does not store authentication usernames or passwords.
- On pages that explicitly opt into the optional video bridge: extension availability/version, a requested video speed, and the local operation's result.

## How data is used

Data is used only for the requested tools. temoto does not collect browsing history or record keystrokes.

- Current-page details are read when the popup opens and when video state changes so controls reflect the page's actual state.
- A local key handler processes `G`, `D`, and `S` on HTTP(S) pages without requiring the popup. It ignores editable fields and modifier-key combinations and does not retain key events. Video badges and popup controls follow each video's actual rate without applying a previously selected rate to later videos.
- On pages declaring `meta[name="temoto-webmcp"][content="enabled"]`, a local bridge lets the page check extension availability and request video-speed changes in that tab. Browsers supporting WebMCP may expose the same two actions as page tools. The bridge returns only availability/version or the speed-change result to the requesting page; it does not expose other tabs, screenshots, picked colors, or saved preferences.
- Screenshot pixels render the local preview and the user-requested clipboard image or PNG download.
- Selected element details render the CSS inspector and the user-requested copied CSS declarations or selector.
- Saved proxy profiles let the user switch regular Chrome windows. Adding or saving an inactive profile does not change routing. Selecting a profile applies it, and saving edits to the active profile uses Save & reapply to update its current setting. Off clears temoto's override. Integrated Proxy performs no connection diagnostics and provides no custom authentication handler.

## Storage and retention

- The last picked color, up to eight unique recent colors, and preferred color format are stored using `chrome.storage.local` until changed, cleared through Chrome, or removed by uninstalling the extension.
- Proxy names, fixed endpoints or PAC URLs, and selected profile state are stored in `chrome.storage.local` until edited, deleted, cleared through Chrome, or removed by uninstalling temoto. There is no automatic import from the legacy Proxy extension, and its existing storage is not changed.
- Unfinished Proxy editor fields are kept without passwords in `chrome.storage.session` for the current Chrome session and restored when the popup reopens. Save, Cancel, or Delete clears the draft. Drafts alone do not change the effective proxy setting.
- Temporary capture coordination metadata is held in `chrome.storage.session` to prevent overlapping captures; it is not retained across browser sessions.
- Each screenshot has its own capture ID in the extension's local IndexedDB. Loading the preview does not delete it, so that preview can reload. The preview's Close action deletes its capture. A capture expires one hour after creation; expired records are deleted on the next capture save or load. Closing the browser tab directly can leave the record until that expiry cleanup.
- Current-page details, video state, and inspected element results are processed in memory and are not saved as a browsing log. Selected playback rates are not carried into later videos.
- Copy and PNG download actions place the result in the user's clipboard or chosen download location, where it follows the user's own retention choices.

## Data sharing and transmission

temoto does not upload page content, screenshots, colors, or settings to the developer. When the user activates a proxy profile, Chrome routes browser traffic through that user-supplied proxy; the proxy operator handles that traffic. Chrome may fetch a user-supplied PAC URL to apply its routing script. temoto does not inspect or record those traffic contents. The optional video bridge returns only the limited local results described above to the requesting page. temoto does not use accounts, analytics, or advertising, sell data, or use data for creditworthiness or lending. All executable code is bundled with the extension.

## Permissions

- `activeTab`: temporarily access the current tab after the user opens the extension through Chrome.
- `scripting`: detect/control video, prepare requested captures and inspect the selected element's CSS.
- `storage`: save picked colors, the recent color history, preferred color format, and proxy profiles/state locally; hold temporary capture coordination metadata and password-free Proxy editor drafts in session storage.
- `proxy`: read, apply, verify, and clear user-selected proxy configuration for regular Chrome windows. This is a required permission and affects browser-wide routing rather than a single tab.
- `clipboardWrite`: copy user-selected color values, screenshots, CSS declarations, and selectors.
- Website access on HTTP(S) pages: load local Video Speed shortcuts and badges in page frames and enable the limited video bridge on explicitly opted-in top-level pages. A bundled font is exposed to these pages only to render the local video badge; no remote font service is used. This access is not used to transmit browsing activity or page content.

Color picking, screenshots, CSS inspection, and proxy activation remain user initiated. Proxy uses `regular_only` and does not configure incognito. It adds no host permissions, `webRequest`, or `webRequestAuthProvider`; the existing HTTP(S) page access is for Video Speed. temoto does not request site-data-clearing access.

## User control

Users choose each tool, can exit CSS inspection with Esc, can delete a screenshot with its preview's Close action, and can edit/delete proxy profiles or clear temoto's proxy override with Off. Off does not force direct mode or erase another provider's settings. Chrome provides controls to clear extension data, manage site access, or uninstall temoto.

## Limited Use

Information received from Chrome APIs is used only for temoto's stated user-facing tools, following the Chrome Web Store User Data Policy and its Limited Use requirements. It is not transferred for unrelated purposes.

## Changes and contact

We will update this policy if the extension's data handling changes. Questions can be submitted through the project's [GitHub issue tracker](https://github.com/hayashiii-ghub/temoto/issues).
