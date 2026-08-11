# Chrome Web Store submission copy

## Product details

**Name**

temoto for Chrome

**Primary language**

English

**Suggested category**

Choose the closest current dashboard category for developer productivity/tools.

**Summary**

Color, capture, video speed, environment switching, site reset, and page inspection for web developers.

**Detailed description**

Developer utilities, right where you need them.

temoto for Chrome brings six common page-testing tools into one focused popup:

- Pick any on-screen color and copy its hex value.
- Capture the visible page or a selected region, then copy or save a PNG.
- Detect HTML5 video and set an exact playback speed.
- Move between Local, Staging, and Production without losing the current path, query, or hash.
- Reset cache, cookies, storage, and service workers for the current site only when requested.
- Measure an element and copy a compact CSS selector.

temoto runs on demand. It does not monitor browsing in the background, request persistent access to every site, transmit page data, or use analytics. Site Reset asks for its optional permission only when you choose that tool.

## Privacy practices

**Single purpose description**

Provide web developers with on-demand tools for inspecting and testing the current page without background monitoring or remote data collection.

**Permission justifications**

- `activeTab`: Grants temporary access to the current tab after the user opens temoto or selects a tool. This avoids persistent host permissions.
- `scripting`: Runs the user-requested video detection/control, capture selection overlay, and Measure / Inspect tool in the current tab.
- `storage`: Stores user-configured environment origins, the last selected color and speed, and a requested screenshot briefly in session storage while its preview opens.
- `sidePanel`: Opens persistent settings and environment configuration without keeping the popup open.
- `clipboardWrite`: Copies a user-selected color, screenshot, or CSS selector only after a user action.
- Optional `browsingData`: Requested only when the user runs Site Reset, then used to clear cache, cookies, storage, and service workers for the displayed current origin.

**Data-use disclosure guidance**

- Disclose website content because screenshot pixels and selected element details are processed locally.
- Disclose web browsing activity/current-page information because the active URL, origin, hostname, and title are read for user-facing tools.
- State that this data is processed locally, is not transmitted to the developer or third parties, and is not used for advertising, analytics, or unrelated purposes.
- Complete every Limited Use certification checkbox truthfully.

**Privacy policy URL after this branch is merged**

https://github.com/hayashiii-ghub/shelfdrop/blob/main/browser/temoto-chrome/PRIVACY.md

## Graphic assets

- Store icon: `public/icons/icon-128.png` (128 × 128 PNG).
- Required screenshot: `store/assets/screenshot-launcher-1280x800.jpg` (1280 × 800 JPEG).
- Required small promo tile: `store/assets/promo-small-440x280.jpg` (440 × 280 JPEG).
- Optional marquee promo tile: 1400 × 560 PNG or JPEG.
- Up to five screenshots may be supplied. Show the actual popup and core tools rather than feature claims that are not implemented.

## Reviewer test instructions

No account or credentials are required.

1. Open a regular web page and click the temoto toolbar icon.
2. Color Picker opens Chrome's native eyedropper and copies the chosen hex value.
3. Screenshot can capture the visible viewport or a selected region and opens a local preview with Copy and Save PNG actions.
4. On a page with an HTML5 video, Video Speed changes the playback rate. A page without video shows `No video`.
5. Settings stores Local, Staging, and Production origins locally. Environment Switcher preserves the current path, query, and hash.
6. Measure / Inspect highlights the element under the pointer and copies its selector when clicked.
7. Site Reset requests the optional `browsingData` permission, clears data only for the displayed current origin, and reloads the tab.

## Submission checklist

- [ ] Verify all six tools in the current stable Google Chrome release, not only another Chromium browser.
- [ ] Run `npm test`, `npm run test:sites`, and `npm run package`.
- [ ] Upload the ZIP from `release/`; confirm `manifest.json` is at the ZIP root.
- [ ] Upload the required screenshot and 440 × 280 small promo tile.
- [ ] Use the single-purpose text and permission justifications above in the Privacy tab.
- [ ] Make the privacy policy URL publicly accessible after merge.
- [ ] Select the intended regions and visibility in Distribution.
- [ ] Enable deferred publishing if manual control after review is preferred.
- [ ] Recheck the manifest name, description, version, icons, and minimum Chrome version before upload.
