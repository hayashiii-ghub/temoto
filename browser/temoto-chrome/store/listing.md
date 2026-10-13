# Chrome Web Store submission copy

Prepared locally on **2026-10-13** for the upcoming five-tool integration. The source manifest remains **1.1.0**; the next release version has not been selected. These changes have not been uploaded, submitted, or published in this task. This file describes the current worktree, not the live Store package.

This is the authoritative listing, permission, privacy-disclosure, and reviewer copy. [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md) tracks readiness. The [2026-09-13 handoff](../../STORE-HANDOFF-2026-09-13.md) is historical preparation evidence for an earlier source state.

## Product details

**Name**

temoto for Chrome

**Primary language**

English

**Suggested category**

Choose the closest current dashboard category for developer productivity/tools when preparing the release.

**Summary**

Color Picker, screenshots, CSS, video speed and simple proxy switching in one compact Chrome toolkit.

**Detailed description**

Five tools, close at hand.

temoto for Chrome puts Color Picker, Screenshot, CSS, Video Speed, and Proxy in one English-only popup.

Color Picker: pick an on-screen color and copy HEX, RGB, or HSL. Return to the latest eight picked colors, stored locally.

Screenshot: capture the visible area or the full page. Review it at Fit or 100% zoom, then copy the image or save a PNG. Capture preparation runs automatically, with no setup needed.

CSS: select an element to inspect its dimensions, spacing, typography, colors, and borders. Copy grouped CSS declarations or its unique selector separately. These are computed values for the selected element, rather than the page's original stylesheet.

Video Speed: use popup controls from 0.25× to 5×, or press G to toggle 1× / 1.5×, D to add 0.25×, and S to subtract 0.25×. Each video keeps its own rate when media changes. The popup and subtle video badges follow the actual playback speed, including a page's own rates outside the controls' range.

Proxy: save named Fixed profiles with one HTTP, HTTPS, SOCKS4, or SOCKS5 endpoint, or a PAC URL. Add, edit, delete, and click a saved profile to activate it. Adding or saving an inactive profile only saves it. Editing the active profile uses Save & reapply and immediately updates its current setting. Off clears temoto's override so Chrome's underlying setting can take effect. Proxy affects all regular Chrome windows; it does not configure incognito or provide custom authentication, diagnostics, domain routing, or import/export. Supply your own proxy or PAC URL.

Moving from the old temoto Proxy: first select Off in that old extension, then recreate the needed Fixed endpoints or PAC URLs here. There is no automatic migration or activation; old profiles and credentials remain in the legacy extension.

Open temoto from the Chrome toolbar, choose a tool, and use Back to return to the five-tool launcher. Color, screenshot, and CSS tools run when selected. Video shortcuts remain available on supported pages without opening the popup.

temoto processes tools locally and does not upload page content, screenshots, or settings to the developer. Selecting a proxy routes Chrome traffic through the user's chosen server; Chrome fetches a selected PAC URL as needed. It has no accounts, analytics, or advertising. Persistent HTTP(S) page access enables local Video Speed controls and a limited video bridge on pages that explicitly opt in. That bridge provides only an extension-availability check and video-speed control in the requesting tab.

Support and source: https://github.com/hayashiii-ghub/temoto

## Privacy practices

**Single purpose description**

Provide a compact local browser-work toolkit for web developers: inspect colors and CSS, capture the page, control video playback, and switch saved Chrome proxy routes.

**Permission justifications**

- `activeTab`: Grants temporary access to the current tab when the user opens temoto through Chrome, supporting requested page tools.
- `scripting`: Reads current-page/video state, applies user-requested video speeds, prepares captures and inspects the selected element's CSS.
- Website access on HTTP(S) pages: Loads local Video Speed shortcuts and badges in page frames. The packaged badge font is available to HTTP(S) pages; it does not request a remote font service. The handler ignores editable fields and modifier-key combinations and does not record keystrokes or transmit page content. Explicitly opted-in top-level pages may also use the limited availability/video-speed bridge.
- `storage`: Saves the last picked color, up to eight recent colors, preferred color format, proxy profiles, and selected proxy state locally. Temporary capture coordination metadata and password-free Proxy editor drafts use browser-session storage. Save, Cancel, or Delete clears the draft; reopening it does not apply a proxy.
- `proxy`: Reads, applies, verifies, and clears user-selected Fixed or PAC URL configurations for regular Chrome windows. This required permission affects browser-wide routing, rather than only the current tab. Integrated Proxy does not add host permissions, `webRequest`, or `webRequestAuthProvider`; HTTP(S) page access remains for Video Speed.
- `clipboardWrite`: Copies user-selected color values, screenshots, CSS declarations, or selectors.

**Data-use disclosure guidance**

- Disclose local website-content handling because screenshot pixels and selected element details are processed.
- Disclose current-page information because URL, origin, hostname, title, and video state are read for the tools; no browsing-history log is retained.
- Disclose local picked-color history and preferences. Playback rates are observed in memory rather than carried into later videos.
- Screenshots are kept by capture ID in local IndexedDB for preview reload. The preview's Close action deletes that capture; otherwise it expires after one hour. Expired records are removed on the next capture save or load.
- Disclose locally saved proxy names, single endpoints or PAC URLs, and selected state. Integrated Proxy stores no authentication usernames or passwords and does not read or modify the legacy extension's storage.
- State that data is not uploaded to the developer or used for advertising, analytics, or unrelated purposes. User-selected proxies handle routed traffic and Chrome fetches configured PAC URLs. The opted-in video bridge returns only its limited results to the requesting page.
- Complete each dashboard disclosure and Limited Use certification truthfully for the final release package.

**Privacy policy URL (publish the updated local policy before submission)**

https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md

## Graphic assets

- Store icon: `public/icons/icon-128.png` (128 × 128 PNG).
- Launcher screenshot: `store/assets/screenshot-launcher-1280x800.jpg` (1280 × 800 JPEG).
- Small promo tile: `store/assets/promo-small-440x280.jpg` (440 × 280 JPEG).
- Optional marquee promo tile: 1400 × 560 PNG or JPEG.

The English/Japanese launcher JPEGs were recaptured locally on 2026-10-13 from the built five-row launcher at 1280 × 800. Their formats, dimensions, and saved-image appearance were checked. The site showcase is a 416 × 402 PNG with SHA-256 prefix `47ae7d5e3c53`; the single-product OG image is a refreshed 1200 × 630 PNG. Legacy standalone Proxy images remain historical material. Use the existing [Store capture workflow](../../shared/STORE-CAPTURE.md) for subsequent artwork; captures do not prove native Chrome permission handling or real proxy traffic.

## Reviewer test instructions

No temoto account is required. The four page tools need no credentials. Use a disposable proxy/PAC supplied by the reviewer to test routing; the extension supplies no proxy service and stores no custom authentication credentials.

1. Open an HTTP(S) page and click the temoto toolbar icon. Confirm the launcher has exactly Color Picker, Screenshot, CSS, Video Speed, and Proxy. Its controls and page overlays remain English when Chrome or the page uses another language.
2. Pick a color with Chrome's native eyedropper. Confirm HEX/RGB/HSL copy, revisit the tool, and check that only actual picks enter the latest-eight history. Selecting a history color must not create a duplicate.
3. Capture the visible area and the full page. Confirm that these are the only two capture actions, with no Capture options section. Confirm separate capture previews, image dimensions, Fit/100% zoom, Copy, and Save PNG. Reload a preview within an hour to confirm it retains its own capture; its Close action deletes that capture.
4. Start CSS inspection, select an element, inspect size, margin/padding, font, colors, and borders, then copy one group or all groups. Copy the unique selector separately. Esc exits; selected-element data is not saved as a page log.
5. On a page with HTML5 video, use the popup and G/D/S shortcuts. Confirm commands stay within 0.25–5× and controls/badges follow actual page rate changes. Changing or inserting a video must keep its own rate; external rates outside the control range must be displayed accurately. Editable fields and modifier combinations must keep normal typing behavior. A page without video shows No video.
6. Open Proxy, save a named Fixed endpoint or PAC URL, and confirm that saving does not activate it. Click a saved profile to activate it for regular Chrome windows, edit inactive profiles without changing the connection, verify active edits use Save & reapply, delete profiles, and select Off to clear temoto's override. Verify incognito is unchanged and an underlying Chrome/system setting can take effect after Off. Confirm policy/extension conflicts and failures are shown honestly. Do not configure real production traffic for this check.
7. Optional video bridge check: use the opted-in fixture to check extension availability and set video speed in the requesting tab. Confirm that it exposes no screenshots, picked colors, preferences, or other-tab controls.

## Submission checklist

- [x] Preserve the existing source identity, Item ID `gcncgknjklghkoeiapcbdghodepnllid`, and its public key.
- [ ] Select the next release version; source is still 1.1.0 and no new release is recorded.
- [ ] Verify all five tools in current stable Google Chrome, including capture reload, clipboard, CSS selection, media replacement, and controlled Proxy activation/Off.
- [x] Run full `npm test` (104 passed), `npm run build` (checks for 20 required extension files passed), and `npm run test:sites` (4 passed) for the integrated source on 2026-10-13. Website lint/build and all 8 tests also passed at that stage; the redesigned landing page passed lint/build and all 6 tests on 2026-10-14.
- [x] Review the refreshed five-row English/Japanese launcher JPEGs. Browser preview covered Fixed/PAC URL creation, save/edit/activation/Off/delete, active Save & reapply, unfinished-draft reload, and validation-error focus.
- [ ] Accept the added proxy permission in native Chrome and verify integrated Proxy against a controlled real network. Browser-preview operations above do not satisfy this check.
- [ ] Review the retained small promo tile against the final release package.
- [ ] After release authorization, run `npm run package` without overwriting a previously submitted ZIP. Check the archive's manifest identity, version, permissions, and root layout.
- [ ] Publish the updated privacy policy and confirm its public URL.
- [ ] Review dashboard privacy disclosures, publisher/contact details, category, regions, and visibility for the final package.
- [ ] With explicit submission authorization, upload the ZIP, listing, and required artwork; verify the dashboard receipt.
- [ ] With explicit publication authorization, publish or release the reviewed package and verify its public Store state.
