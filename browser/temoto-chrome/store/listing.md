# Chrome Web Store submission copy

Prepared locally on **2026-10-12** for the upcoming four-tool release. The source manifest remains **1.1.0**; the next release version has not been selected. These changes have not been uploaded, submitted, or published in this task. This file describes the current worktree, not the live Store package.

This is the authoritative listing, permission, privacy-disclosure, and reviewer copy. [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md) tracks readiness. The [2026-09-13 handoff](../../STORE-HANDOFF-2026-09-13.md) is historical preparation evidence for an earlier source state.

## Product details

**Name**

temoto for Chrome

**Primary language**

English

**Suggested category**

Choose the closest current dashboard category for developer productivity/tools when preparing the release.

**Summary**

Color Picker, screenshots, CSS inspection and video speed, with local color history and easy copying.

**Detailed description**

Four page tools, close at hand.

temoto for Chrome puts Color Picker, Screenshot, CSS, and Video Speed in one English-only popup.

Color Picker: pick an on-screen color and copy HEX, RGB, or HSL. Return to the latest eight picked colors, stored locally.

Screenshot: capture the visible area or the full page. Review it at Fit or 100% zoom, then copy the image or save a PNG. Capture preparation runs automatically, with no setup needed.

CSS: select an element to inspect its dimensions, spacing, typography, colors, and borders. Copy grouped CSS declarations or its unique selector separately. These are computed values for the selected element, rather than the page's original stylesheet.

Video Speed: use popup controls from 0.25× to 5×, or press G to toggle 1× / 1.5×, D to add 0.25×, and S to subtract 0.25×. Each video keeps its own rate when media changes. The popup and subtle video badges follow the actual playback speed, including a page's own rates outside the controls' range.

Open temoto from the Chrome toolbar, choose a tool, and use Back to return to the four-tool launcher. Color, screenshot, and CSS tools run when selected. Video shortcuts remain available on supported pages without opening the popup.

temoto processes tools locally and does not upload page content, screenshots, or settings. It has no accounts, analytics, or advertising. Persistent HTTP(S) page access enables local Video Speed controls and a limited video bridge on pages that explicitly opt in. That bridge provides only an extension-availability check and video-speed control in the requesting tab.

Support and source: https://github.com/hayashiii-ghub/temoto

## Privacy practices

**Single purpose description**

Provide four local tools for web developers to inspect colors and CSS, capture the current page, and control its video playback.

**Permission justifications**

- `activeTab`: Grants temporary access to the current tab when the user opens temoto through Chrome, supporting requested page tools.
- `scripting`: Reads current-page/video state, applies user-requested video speeds, prepares captures and inspects the selected element's CSS.
- Website access on HTTP(S) pages: Loads local Video Speed shortcuts and badges in page frames. The packaged badge font is available to HTTP(S) pages; it does not request a remote font service. The handler ignores editable fields and modifier-key combinations and does not record keystrokes or transmit page content. Explicitly opted-in top-level pages may also use the limited availability/video-speed bridge.
- `storage`: Saves the last picked color, up to eight recent colors, and preferred color format locally. Temporary capture coordination metadata uses browser-session storage.
- `clipboardWrite`: Copies user-selected color values, screenshots, CSS declarations, or selectors.

**Data-use disclosure guidance**

- Disclose local website-content handling because screenshot pixels and selected element details are processed.
- Disclose current-page information because URL, origin, hostname, title, and video state are read for the tools; no browsing-history log is retained.
- Disclose local picked-color history and preferences. Playback rates are observed in memory rather than carried into later videos.
- Screenshots are kept by capture ID in local IndexedDB for preview reload. The preview's Close action deletes that capture; otherwise it expires after one hour. Expired records are removed on the next capture save or load.
- State that data is not transmitted to the developer or third parties and is not used for advertising, analytics, or unrelated purposes. The opted-in video bridge returns only its limited results to the requesting page.
- Complete each dashboard disclosure and Limited Use certification truthfully for the final release package.

**Privacy policy URL (publish the updated local policy before submission)**

https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md

## Graphic assets

- Store icon: `public/icons/icon-128.png` (128 × 128 PNG).
- Launcher screenshot: `store/assets/screenshot-launcher-1280x800.jpg` (1280 × 800 JPEG).
- Small promo tile: `store/assets/promo-small-440x280.jpg` (440 × 280 JPEG).
- Optional marquee promo tile: 1400 × 560 PNG or JPEG.

Refresh the launcher screenshots using the existing [Store capture workflow](../../shared/STORE-CAPTURE.md). They must show the current compact four-tool launcher. Inspect the saved files before marking artwork ready; source changes do not verify existing images.

## Reviewer test instructions

No account or credentials are required.

1. Open an HTTP(S) page and click the temoto toolbar icon. Confirm the launcher has exactly Color Picker, Screenshot, CSS, and Video Speed. Its controls and page overlays remain English when Chrome or the page uses another language.
2. Pick a color with Chrome's native eyedropper. Confirm HEX/RGB/HSL copy, revisit the tool, and check that only actual picks enter the latest-eight history. Selecting a history color must not create a duplicate.
3. Capture the visible area and the full page. Confirm that these are the only two capture actions, with no Capture options section. Confirm separate capture previews, image dimensions, Fit/100% zoom, Copy, and Save PNG. Reload a preview within an hour to confirm it retains its own capture; its Close action deletes that capture.
4. Start CSS inspection, select an element, inspect size, margin/padding, font, colors, and borders, then copy one group or all groups. Copy the unique selector separately. Esc exits; selected-element data is not saved as a page log.
5. On a page with HTML5 video, use the popup and G/D/S shortcuts. Confirm commands stay within 0.25–5× and controls/badges follow actual page rate changes. Changing or inserting a video must keep its own rate; external rates outside the control range must be displayed accurately. Editable fields and modifier combinations must keep normal typing behavior. A page without video shows No video.
6. Optional video bridge check: use the opted-in fixture to check extension availability and set video speed in the requesting tab. Confirm that it exposes no screenshots, picked colors, preferences, or other-tab controls.

## Submission checklist

- [x] Preserve the existing source identity, Item ID `gcncgknjklghkoeiapcbdghodepnllid`, and its public key.
- [ ] Select the next release version; source is still 1.1.0 and no new release is recorded.
- [ ] Verify all four tools in current stable Google Chrome, including capture reload, clipboard, CSS selection, and media replacement.
- [ ] Run full `npm test`, `npm run build`, and `npm run test:sites` for the final source.
- [ ] Review the refreshed English launcher screenshot and the small promo tile.
- [ ] After release authorization, run `npm run package` without overwriting a previously submitted ZIP. Check the archive's manifest identity, version, permissions, and root layout.
- [ ] Publish the updated privacy policy and confirm its public URL.
- [ ] Review dashboard privacy disclosures, publisher/contact details, category, regions, and visibility for the final package.
- [ ] With explicit submission authorization, upload the ZIP, listing, and required artwork; verify the dashboard receipt.
- [ ] With explicit publication authorization, publish or release the reviewed package and verify its public Store state.
