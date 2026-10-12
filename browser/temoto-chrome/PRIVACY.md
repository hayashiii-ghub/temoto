# Privacy Policy for temoto for Chrome

Last updated: October 12, 2026 (local draft for the four-tool changes; not yet published)

This policy describes the four-tool source under development. It does not confirm the behavior of the currently published Chrome Web Store package.

temoto for Chrome provides Color Picker, Screenshot, CSS, and Video Speed for the page the user is viewing.

## Data the extension handles

Depending on the tool, the extension may process:

- The current page URL, origin, hostname, title, the number of HTML5 videos, and their current playback rates.
- A color chosen through Chrome's screen eyedropper, its HEX/RGB/HSL representations, and the latest eight picked colors.
- Pixels from a user-requested visible-area or full-page screenshot.
- A selected element's dimensions, computed spacing, typography, colors, borders, and a generated unique CSS selector.
- The user's preferred color format.
- On pages that explicitly opt into the optional video bridge: extension availability/version, a requested video speed, and the local operation's result.

## How data is used

Data is used only for the requested tools. temoto does not collect browsing history or record keystrokes.

- Current-page details are read when the popup opens and when video state changes so controls reflect the page's actual state.
- A local key handler processes `G`, `D`, and `S` on HTTP(S) pages without requiring the popup. It ignores editable fields and modifier-key combinations and does not retain key events. Video badges and popup controls follow each video's actual rate without applying a previously selected rate to later videos.
- On pages declaring `meta[name="temoto-webmcp"][content="enabled"]`, a local bridge lets the page check extension availability and request video-speed changes in that tab. Browsers supporting WebMCP may expose the same two actions as page tools. The bridge returns only availability/version or the speed-change result to the requesting page; it does not expose other tabs, screenshots, picked colors, or saved preferences.
- Screenshot pixels render the local preview and the user-requested clipboard image or PNG download.
- Selected element details render the CSS inspector and the user-requested copied CSS declarations or selector.

## Storage and retention

- The last picked color, up to eight unique recent colors, and preferred color format are stored using `chrome.storage.local` until changed, cleared through Chrome, or removed by uninstalling the extension.
- Temporary capture coordination metadata is held in `chrome.storage.session` to prevent overlapping captures; it is not retained across browser sessions.
- Each screenshot has its own capture ID in the extension's local IndexedDB. Loading the preview does not delete it, so that preview can reload. The preview's Close action deletes its capture. A capture expires one hour after creation; expired records are deleted on the next capture save or load. Closing the browser tab directly can leave the record until that expiry cleanup.
- Current-page details, video state, and inspected element results are processed in memory and are not saved as a browsing log. Selected playback rates are not carried into later videos.
- Copy and PNG download actions place the result in the user's clipboard or chosen download location, where it follows the user's own retention choices.

## Data sharing and transmission

temoto does not transmit page content, screenshots, colors, or settings to the developer or an external server. The optional video bridge returns only the limited local results described above to the requesting page. temoto does not use accounts, analytics, or advertising, sell data, or use data for creditworthiness or lending. All executable code is bundled with the extension.

## Permissions

- `activeTab`: temporarily access the current tab after the user opens the extension through Chrome.
- `scripting`: detect/control video, prepare requested captures and inspect the selected element's CSS.
- `storage`: save picked colors, the recent color history, and preferred color format locally; hold temporary capture coordination metadata in session storage.
- `clipboardWrite`: copy user-selected color values, screenshots, CSS declarations, and selectors.
- Website access on HTTP(S) pages: load local Video Speed shortcuts and badges in page frames and enable the limited video bridge on explicitly opted-in top-level pages. A bundled font is exposed to these pages only to render the local video badge; no remote font service is used. This access is not used to transmit browsing activity or page content.

Color picking, screenshots, and CSS inspection remain user initiated. The core extension does not request proxy or site-data-clearing access.

## User control

Users choose each page tool, can exit CSS inspection with Esc, and can delete a screenshot with its preview's Close action. Chrome provides controls to clear extension data, manage site access, or uninstall temoto.

## Limited Use

Information received from Chrome APIs is used only for temoto's stated user-facing tools, following the Chrome Web Store User Data Policy and its Limited Use requirements. It is not transferred for unrelated purposes.

## Changes and contact

Before release, publish this policy and align the Chrome Web Store privacy declarations with the released source. Questions can be submitted through the project's [GitHub issue tracker](https://github.com/hayashiii-ghub/temoto/issues).
