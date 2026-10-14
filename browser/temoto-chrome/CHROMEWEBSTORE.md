# Chrome Web Store readiness — temoto for Chrome

Last updated: 2026-10-15

The five-tool **1.2.0** update was submitted to Chrome Web Store review on **2026-10-14**. It was approved and published automatically: on **2026-10-15** the public Store listing showed version **1.2.0**, updated October 14, 2026, with the five-tool description. The English listing and artwork are saved, native Chrome 1.2.0 QA is complete including the user's manual new-color eyedropper confirmation, and the source/policy were pushed as commit `8764534` with the updated public policy verified. GitHub Chrome, website, and legacy Proxy checks all passed. The package and current Store draft support English only; Japanese copy and artwork remain local reference material. The former standalone temoto Proxy has been unpublished, while its source and existing users' saved data remain available for migration.

The post-1.2.0 cleanup and font fix are packaged for the user-authorized 1.2.1 update. The published 1.2.0 ZIP is preserved unchanged.

The 2026-10-15 source follow-up loads the bundled video-badge font through the extension worker, avoiding YouTube Music's page connection-policy warning. The 132 core tests, production build, and 4 Sites tests passed. Native Chrome verified the font loaded and G/D/S controls worked; two extension reloads followed by page reloads produced no temoto font warnings. The 1.2.1 ZIP and shorter English listing were submitted for review on 2026-10-15. The receipt and **Awaiting review** status were verified; automatic publication after approval remains enabled. Its archive is `release/temoto-for-chrome-v1.2.1.zip` (176,921 bytes), SHA-256 `94ef33e00ffc2c8748932f24749493a7dff649dc2015eb4999f05175cc014559`. The dashboard shows submitted 1.2.1 and published 1.2.0 with unchanged permissions. The legacy Proxy dashboard was also checked: it remains a draft with no published version.

## Store listing

[store/listing.md](./store/listing.md) remains the authoritative English listing copy, name, summary, detailed description, primary language, single purpose, suggested category, and reviewer instructions. It also retains Japanese copy for local reference; previously saved Japanese dashboard fields are not displayed for the English-only 1.2.1 draft. Keep those fields there rather than maintaining duplicate listing prose here. Do not add a Japanese package catalog to restore the old listing locale; the approved UI and package remain English-only.

Source identity: `temoto for Chrome`, Store Item ID `gcncgknjklghkoeiapcbdghodepnllid`.

## Graphics and assets

Use the existing [Store capture workflow](../shared/STORE-CAPTURE.md) and the filenames in [listing.md](./store/listing.md#graphic-assets).

| Asset | Dimensions | Current readiness |
| --- | --- | --- |
| Store icon | 128 × 128 PNG | Canonical source icon uploaded again and saved in the dashboard |
| English launcher screenshot | 1280 × 800 JPEG | Old common images removed; one latest English image saved |
| Japanese launcher screenshot | 1280 × 800 JPEG | Local reference only; not displayed by the current 1.2.1 draft |
| Small promo tile | 440 × 280 JPEG | Existing tile visually matched the current asset and was retained |
| Additional tool screenshots / marquee | Optional | Not required for this source task |

## Permissions justification

The final source uses `activeTab`, `scripting`, `storage`, `clipboardWrite`, required `proxy`, and HTTP(S) content-script access for local Video Speed controls and the opted-in video bridge. Its packaged badge font is web-accessible on HTTP(S) pages; it introduces no new permission or remote font request. Proxy affects regular Chrome windows across tabs through `regular_only`; adding a profile does not activate it and Off clears temoto's override. No new proxy host access, `webRequest`, or `webRequestAuthProvider` is needed. The final ZIP's manifest matches these permissions, and the upload exposed the new `proxy` justification field. All permission justifications and the single-purpose description have been updated and saved; their exact copy remains in [listing.md](./store/listing.md#privacy-practices).

## Privacy and data use

The policy for versions 1.2.0 and 1.2.1 is [PRIVACY.md](./PRIVACY.md). Data handled locally includes requested screenshots and computed CSS, current-page/video state, picked colors and recent history, color-format preferences, and named simple proxy profiles/state. Integrated Proxy stores no usernames or passwords, performs no diagnostics, and does not configure incognito. Screenshot provides Visible area and Full page with automatic preparation and no configurable capture options. Screenshots expire after one hour and are removed on the next capture save/load, or by the preview's Close action. Dashboard disclosure guidance remains in [listing.md](./store/listing.md#privacy-practices). The existing Website content and Web history selections, No remote code setting, and all three checked certifications were retained.

Policy URL saved in the dashboard: https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md. The public GitHub page was checked after pushing commit `8764534`: it shows the October 14, 2026 policy date and version 1.2.0 text.

## Distribution and developer details

The dashboard's existing free pricing, public visibility, and all-region distribution were confirmed and retained. Keep the existing Store item, publisher name, public contact email, and category. Public visibility is the distribution setting; the 1.2.1 update is awaiting review and is not yet public.

- Support: https://github.com/hayashiii-ghub/temoto/issues
- Homepage: https://temoto.hayashiii-gpt.chatgpt.site

## Version history

| Source/change | Date | Scope | Status |
| --- | --- | --- | --- |
| 1.2.1 release package | 2026-10-15 | Bundled video-badge font loading fix and shorter English Store copy | Awaiting review; automatic publication after approval |
| 1.2.0 release package | 2026-10-14 | Five-tool integration, quiet restricted-page detection, and capture error recovery fix | Published; public listing showed 1.2.0 on 2026-10-15 |
| Quiet restricted-page detection; source 1.1.0 at that stage | 2026-10-14 | Disable unavailable page tools without an access-error banner on popup open | Historical local verification below |
| Five-tool integration; source 1.1.0 at that stage | 2026-10-13 | Color Picker, Screenshot, CSS, Video Speed, and simple Fixed/PAC URL Proxy switching | Historical local verification below |
| Earlier four-tool cleanup | 2026-10-12 | Remove environment and reset surfaces | Historical local verification below |

The [2026-09-13 handoff](../STORE-HANDOFF-2026-09-13.md) records earlier preparation evidence. It does not establish live Store status for this work.

## Integration verification

Final 1.2.0 verification on 2026-10-14: **125 core tests**, the production build with checks for **20 required extension files**, and **4 Sites packaging tests** passed, including the capture error recovery fix. The final archive is `release/temoto-for-chrome-v1.2.0.zip` (**177,102 bytes**), SHA-256 `620aa17207726459c86ddc2348c0bbe433020253749c8003c36e874c6633b071`. Its root layout, version, permissions, and sole English catalog were checked. The public Store listing showed **1.2.0** on 2026-10-15. GitHub Chrome, website, and legacy Proxy checks for source commit `8764534` all passed.

Native Google Chrome 1.2.0 QA on 2026-10-14:

- The user authorized the added Proxy permission. Load unpacked with the built folder selected again showed 1.2.0; Reload alone had left 1.1.0 loaded. Restricted `chrome://` pages stayed quiet with unavailable page tools disabled.
- Video controls changed 2× to an actual 2.05×; a page-set 6× appeared as 6× in the popup. A replacement video kept its own 1×, then D changed it to 1.25×. Typing `gsd` in a textbox did not change playback speed.
- CSS displayed the expected computed values. All declarations and the unique selector were copied through the native clipboard and pasted into a textarea successfully.
- Fixed and PAC profiles routed controlled test traffic. Off cleared the override and stopped access through the test route. Draft restoration, inactive save-only behavior, active Save & reapply, and deletion passed. The final state is Off with all test profiles deleted.
- Visible-area PNG save produced 2772 × 1692. Full-page PNG save produced 2772 × 4800 with all three fixture sections visually confirmed; scroll position returned from 56 to 56. Fit/100% and preview reload worked. Full-image Copy pasted into a separate test page as a decoded `image/png` at 2772 × 4800. Switching tabs with Ctrl+Tab immediately after starting a full capture interrupted it without opening a new capture tab and restored scroll position to 56.
- Color HEX/RGB/HSL clipboard copy and preferred-format persistence passed. After automation could not complete the native eyedropper interaction, the user manually confirmed successful acquisition of a new color on 2026-10-14.

Completed locally on 2026-10-13 for the integrated source:

- Core `npm test`: 104 tests passed; `npm run build`: build and checks for 20 required extension files passed; `npm run test:sites`: 4 tests passed.
- Website lint, build, and all 8 rendered-HTML tests passed. Production preview at 1440px and 390px showed no horizontal overflow, broken images, or captured console warnings/errors.
- Draft tests verify that embedded endpoint credentials are excluded from session storage, including when restoring an older draft.
- Browser preview verified Fixed/PAC URL creation, save, edit, activation, Off, deletion, active-profile Save & reapply, unfinished-draft reload, and focus on validation errors. This preview does not apply Chrome's real proxy setting.
- The built five-row launcher was recaptured as the site's 416 × 402 PNG (SHA-256 prefix `47ae7d5e3c53`) and English/Japanese Store JPEGs at 1280 × 800. Formats, dimensions, and saved-image appearance were checked. The single-product OG image is an updated 1200 × 630 PNG.

Native 1.2.0 QA is complete with the user's manual eyedropper confirmation. Earlier four-tool installed-Chrome results below are historical. The later Store submission was confirmed separately, and the public listing showed 1.2.0 on 2026-10-15.

The redesigned landing page passed lint, a production build, and all 6 site tests on 2026-10-14. Its upcoming-release notice was later removed from the Store action.

The quiet restricted-page follow-up on 2026-10-14 passed 115 core tests, the production build with all 20 required files, and 4 Sites packaging tests. Browser QA of the built popup and worker with simulated Chrome API responses verified no banner for internal pages, access denial, or passive detection failure; normal-page tools remain enabled and explicit CSS failure still appears within its row. Native Chrome installation and Store submission were not performed for this follow-up.

Migration is manual: Off in the legacy extension, then recreate the necessary Fixed endpoints or PAC URLs in temoto. Existing legacy profiles and credentials remain untouched.

## Historical local verification

The following checks concern source states before Proxy integration and do not establish native-Chrome verification of the five-tool build.

After the two-mode screenshot simplification on 2026-10-13: 86 core tests, build verification, 4 Sites packaging tests, site lint, and 8 site tests passed. Native Chrome captured the visible area (2912 × 1692) and the complete 2400 CSS-pixel fixture (2912 × 4800) without options; the saved full-page PNG includes all three sections and the source scroll position returned to zero. The built preview also verified a forced CSS startup failure inside the CSS row and a successful Retry. The installed local Chrome build was refreshed; no Store or website deployment was performed.

English-only UI checks on 2026-10-13, before the two-mode screenshot simplification: 90 core tests, build verification, and 4 Sites packaging tests passed. The compact launcher, direct CSS start, and popup shrink after expanding capture options were verified in the locally installed Chrome build. The video badge used a sans fallback if its bundled font was unavailable; actual Geist rendering on page badges was not confirmed. At that stage, Store and website images still showed the earlier grid and needed recapture. The later five-row artwork described above replaces those launcher images.

The checks below were verified on 2026-10-12 for the earlier four-tool source, before the English-only conversion. They do not replace final-source checks or imply publication:

- Chrome checks: 81 tests, build verification, and 4 Sites packaging tests passed.
- Site checks: lint, build, and 8 rendered-HTML tests passed. The production preview at `http://127.0.0.1:4305/` rendered in Google Chrome with no captured warnings or errors.
- The built `dist/client` was loaded into the user's Chrome as the unpacked version of the reserved core item. At that stage, the Store listing had not been updated.
- Native Chrome checks covered color picking and history, CSS selection/copy/exit, region/viewport/full-page capture, image copy, Fit/100% preview, reload recovery, and a completed PNG export (2912 × 1692).
- Video checks covered a loaded HTML5 sample video, a matching 1.25× rate and badge, and a new video starting at its own 1×. The fixture also confirmed popup control at 2× and the D shortcut at 2.25×.
- At that stage, the site development preview encountered a Node-to-Miniflare `fetch failed`; the standard production preview avoided that development transport and rendered successfully. No runtime configuration or dependency change was made.

## Review notes

- The submission receipt showed “この拡張機能は審査のために送信されました” and “アイテムを送信しました”. The status tab then showed “ステータス: 審査待ち” and “このドラフトは審査待ちです”. Automatic publication after approval remains enabled with the user's explicit authorization. The update was later published; the public listing showed 1.2.0 on 2026-10-15.
- CSS provides computed declarations for the selected element, not the original stylesheet or complete layout reconstruction.
- User speed commands remain 0.25–5×; observed actual rates may be outside that range and must still be displayed accurately.
- Browser-tab closure can leave a screenshot record until expiry cleanup; the preview's Close action removes it immediately.
- The automatically published 1.2.0 Store version was verified on the public listing on 2026-10-15.
