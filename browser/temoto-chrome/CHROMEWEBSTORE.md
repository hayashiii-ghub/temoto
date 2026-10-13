# Chrome Web Store readiness — temoto for Chrome

Last updated: 2026-10-14

The five-tool integration is local development work. Proxy is now a simple switcher inside the main extension; the retained standalone source and its saved data are for existing users and migration. Source version **1.1.0** is unchanged; a release version has not been selected. No upload, submission, review result, or publication is claimed for this change.

## Store listing

[store/listing.md](./store/listing.md) remains the authoritative English copy, name, summary, detailed description, primary language, single purpose, suggested category, and reviewer instructions. Keep those fields there rather than maintaining duplicate listing prose here.

Source identity: `temoto for Chrome`, Store Item ID `gcncgknjklghkoeiapcbdghodepnllid`.

## Graphics and assets

Use the existing [Store capture workflow](../shared/STORE-CAPTURE.md) and the filenames in [listing.md](./store/listing.md#graphic-assets).

| Asset | Dimensions | Current readiness |
| --- | --- | --- |
| Store icon | 128 × 128 PNG | Existing source; recheck final package |
| English/Japanese launcher screenshots | 1280 × 800 JPEG | Five-row built-UI recapture and saved-image review completed locally on 2026-10-13 |
| Small promo tile | 440 × 280 JPEG | Existing brand-only tile retained; final package review pending |
| Additional tool screenshots / marquee | Optional | Not required for this source task |

## Permissions justification

The final source uses `activeTab`, `scripting`, `storage`, `clipboardWrite`, required `proxy`, and HTTP(S) content-script access for local Video Speed controls and the opted-in video bridge. Its packaged badge font is web-accessible on HTTP(S) pages; it introduces no new permission or remote font request. Proxy affects regular Chrome windows across tabs through `regular_only`; adding a profile does not activate it and Off clears temoto's override. No new proxy host access, `webRequest`, or `webRequestAuthProvider` is needed. Exact justifications remain in [listing.md](./store/listing.md#privacy-practices); verify them against the final packaged manifest before uploading.

## Privacy and data use

The local policy draft is [PRIVACY.md](./PRIVACY.md). Data handled locally includes requested screenshots and computed CSS, current-page/video state, picked colors and recent history, color-format preferences, and named simple proxy profiles/state. Integrated Proxy stores no usernames or passwords, performs no diagnostics, and does not configure incognito. Screenshot provides Visible area and Full page with automatic preparation and no configurable capture options. Screenshots expire after one hour and are removed on the next capture save/load, or by the preview's Close action. Dashboard disclosure guidance and certification checks remain in [listing.md](./store/listing.md#privacy-practices).

Policy URL for release: https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md. Public availability of this updated draft is pending merge/publication and must be checked before submission.

## Distribution and developer details

Keep the existing Store item. Publisher name, public contact email, category, visibility, and regions have not been read from the live dashboard in this task; preserve existing values unless the user authorizes a change and verify them at release time.

- Support: https://github.com/hayashiii-ghub/temoto/issues
- Homepage: https://temoto.hayashiii-gpt.chatgpt.site

## Version history

| Source/change | Date | Scope | Status |
| --- | --- | --- | --- |
| Five-tool integration; manifest still 1.1.0 | 2026-10-13 | Color Picker, Screenshot, CSS, Video Speed, and simple Fixed/PAC URL Proxy switching | Local draft, not submitted |
| Earlier four-tool cleanup | 2026-10-12 | Remove environment and reset surfaces | Historical local verification below |

The [2026-09-13 handoff](../STORE-HANDOFF-2026-09-13.md) records earlier preparation evidence. It does not establish live Store status for this work.

## Integration verification

Completed locally on 2026-10-13 for the integrated source:

- Core `npm test`: 104 tests passed; `npm run build`: build and checks for 20 required extension files passed; `npm run test:sites`: 4 tests passed.
- Website lint, build, and all 8 rendered-HTML tests passed. Production preview at 1440px and 390px showed no horizontal overflow, broken images, or captured console warnings/errors.
- Draft tests verify that embedded endpoint credentials are excluded from session storage, including when restoring an older draft.
- Browser preview verified Fixed/PAC URL creation, save, edit, activation, Off, deletion, active-profile Save & reapply, unfinished-draft reload, and focus on validation errors. This preview does not apply Chrome's real proxy setting.
- The built five-row launcher was recaptured as the site's 416 × 402 PNG (SHA-256 prefix `47ae7d5e3c53`) and English/Japanese Store JPEGs at 1280 × 800. Formats, dimensions, and saved-image appearance were checked. The single-product OG image is an updated 1200 × 630 PNG.

The integrated build has not yet received the added permission in native Chrome, and real-network Proxy QA remains pending. Earlier four-tool installed-Chrome results below do not verify this new runtime or permission. Required permission disclosure and the updated public policy must match the final package before an authorized release. The source integration and website update are separate from a version bump, ZIP update, or Store submission; none of those extension release steps has been performed.

The redesigned landing page passed lint, a production build, and all 6 site tests on 2026-10-14. Its Store action explicitly identifies the page as a preview of the next extension update.

Migration is manual: Off in the legacy extension, then recreate the necessary Fixed endpoints or PAC URLs in temoto. Existing legacy profiles and credentials remain untouched.

## Historical local verification

The following checks concern source states before Proxy integration and do not establish native-Chrome verification of the five-tool build.

After the two-mode screenshot simplification on 2026-10-13: 86 core tests, build verification, 4 Sites packaging tests, site lint, and 8 site tests passed. Native Chrome captured the visible area (2912 × 1692) and the complete 2400 CSS-pixel fixture (2912 × 4800) without options; the saved full-page PNG includes all three sections and the source scroll position returned to zero. The built preview also verified a forced CSS startup failure inside the CSS row and a successful Retry. The installed local Chrome build was refreshed; no Store or website deployment was performed.

English-only UI checks on 2026-10-13, before the two-mode screenshot simplification: 90 core tests, build verification, and 4 Sites packaging tests passed. The compact launcher, direct CSS start, and popup shrink after expanding capture options were verified in the locally installed Chrome build. The video badge used a sans fallback if its bundled font was unavailable; actual Geist rendering on page badges was not confirmed. At that stage, Store and website images still showed the earlier grid and needed recapture. The later five-row artwork described above replaces those launcher images.

The checks below were verified on 2026-10-12 for the earlier four-tool source, before the English-only conversion. They do not replace final-source checks or imply publication:

- Chrome checks: 81 tests, build verification, and 4 Sites packaging tests passed.
- Site checks: lint, build, and 8 rendered-HTML tests passed. The production preview at `http://127.0.0.1:4305/` rendered in Google Chrome with no captured warnings or errors.
- The built `dist/client` was loaded into the user's Chrome as the unpacked version of the reserved core item. The Store listing has not been updated by this task.
- Native Chrome checks covered color picking and history, CSS selection/copy/exit, region/viewport/full-page capture, image copy, Fit/100% preview, reload recovery, and a completed PNG export (2912 × 1692).
- Video checks covered a loaded HTML5 sample video, a matching 1.25× rate and badge, and a new video starting at its own 1×. The fixture also confirmed popup control at 2× and the D shortcut at 2.25×.
- At that stage, the site development preview encountered a Node-to-Miniflare `fetch failed`; the standard production preview avoided that development transport and rendered successfully. No runtime configuration or dependency change was made.

## Review notes

- No new Store review or rejection is recorded in this task.
- CSS provides computed declarations for the selected element, not the original stylesheet or complete layout reconstruction.
- User speed commands remain 0.25–5×; observed actual rates may be outside that range and must still be displayed accurately.
- Browser-tab closure can leave a screenshot record until expiry cleanup; the preview's Close action removes it immediately.
- Broader stable-Chrome QA (including third-party players, long pages, and frame boundaries), final artwork review, version selection, packaging, public policy verification, and dashboard checks remain release steps. Follow the [submission checklist](./store/listing.md#submission-checklist).
