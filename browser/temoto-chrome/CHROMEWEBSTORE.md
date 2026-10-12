# Chrome Web Store readiness — temoto for Chrome

Last updated: 2026-10-13

The four-tool changes are local development work. Source version **1.1.0** is unchanged; a release version has not been selected. No upload, submission, review result, or publication is claimed for this change.

## Store listing

[store/listing.md](./store/listing.md) remains the authoritative English copy, name, summary, detailed description, primary language, single purpose, suggested category, and reviewer instructions. Keep those fields there rather than maintaining duplicate listing prose here.

Source identity: `temoto for Chrome`, Store Item ID `gcncgknjklghkoeiapcbdghodepnllid`.

## Graphics and assets

Use the existing [Store capture workflow](../shared/STORE-CAPTURE.md) and the filenames in [listing.md](./store/listing.md#graphic-assets).

| Asset | Dimensions | Current readiness |
| --- | --- | --- |
| Store icon | 128 × 128 PNG | Existing source; recheck final package |
| English launcher screenshot | 1280 × 800 JPEG | Four-tool recapture and image review complete (local source) |
| Small promo tile | 440 × 280 JPEG | Existing brand-only tile retained; final package review pending |
| Additional tool screenshots / marquee | Optional | Not required for this source task |

## Permissions justification

The final source uses `activeTab`, `scripting`, `storage`, `clipboardWrite`, and HTTP(S) content-script access for local Video Speed controls and the opted-in video bridge. Its packaged badge font is web-accessible on HTTP(S) pages; it introduces no new permission or remote font request. Exact justifications remain in [listing.md](./store/listing.md#privacy-practices); verify them against the final packaged manifest before uploading.

## Privacy and data use

The local policy draft is [PRIVACY.md](./PRIVACY.md). Data handled locally includes requested screenshots and computed CSS, current-page/video state, picked colors and recent history, and color-format preferences. Screenshot provides Visible area and Full page with automatic preparation and no configurable capture options. Screenshots expire after one hour and are removed on the next capture save/load, or by the preview's Close action. Dashboard disclosure guidance and certification checks remain in [listing.md](./store/listing.md#privacy-practices).

Policy URL for release: https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md. Public availability of this updated draft is pending merge/publication and must be checked before submission.

## Distribution and developer details

Keep the existing Store item. Publisher name, public contact email, category, visibility, and regions have not been read from the live dashboard in this task; preserve existing values unless the user authorizes a change and verify them at release time.

- Support: https://github.com/hayashiii-ghub/temoto/issues
- Homepage: https://temoto.haygsiiii.chatgpt.site

## Version history

| Source/change | Date | Scope | Status |
| --- | --- | --- | --- |
| Four-tool changes; manifest still 1.1.0 | 2026-10-12 | Focus on Color Picker, Screenshot, CSS, and Video Speed; reduce the core environment and reset surfaces | Local draft, not submitted |

The [2026-09-13 handoff](../STORE-HANDOFF-2026-09-13.md) records earlier preparation evidence. It does not establish live Store status for this work.

## Local verification

After the two-mode screenshot simplification on 2026-10-13: 86 core tests, build verification, 4 Sites packaging tests, site lint, and 8 site tests passed. Native Chrome captured the visible area (2912 × 1692) and the complete 2400 CSS-pixel fixture (2912 × 4800) without options; the saved full-page PNG includes all three sections and the source scroll position returned to zero. The built preview also verified a forced CSS startup failure inside the CSS row and a successful Retry. The installed local Chrome build was refreshed; no Store or website deployment was performed.

English-only UI checks on 2026-10-13, before the two-mode screenshot simplification: 90 core tests, build verification, and 4 Sites packaging tests passed. The compact launcher, direct CSS start, and popup shrink after expanding capture options were verified in the locally installed Chrome build. The video badge uses a sans fallback if its bundled font is unavailable; actual Geist rendering on page badges is not confirmed. Store and website images below still show the earlier grid and require recapture before a release of this simplified UI.

The checks below were verified on 2026-10-12 for the earlier four-tool source, before the English-only conversion. They do not replace final-source checks or imply publication:

- Chrome checks: 81 tests, build verification, and 4 Sites packaging tests passed.
- Site checks: lint, build, and 8 rendered-HTML tests passed. The production preview at `http://127.0.0.1:4305/` rendered in Google Chrome with no captured warnings or errors.
- The built `dist/client` was loaded into the user's Chrome as the unpacked version of the reserved core item. The Store listing has not been updated by this task.
- Native Chrome checks covered color picking and history, CSS selection/copy/exit, region/viewport/full-page capture, image copy, Fit/100% preview, reload recovery, and a completed PNG export (2912 × 1692).
- Video checks covered a loaded HTML5 sample video, a matching 1.25× rate and badge, and a new video starting at its own 1×. The fixture also confirmed popup control at 2× and the D shortcut at 2.25×.
- Site development preview still encounters a Node-to-Miniflare `fetch failed`; the standard production preview avoids that development transport and rendered successfully. No runtime configuration or dependency change was made.

## Review notes

- No new Store review or rejection is recorded in this task.
- CSS provides computed declarations for the selected element, not the original stylesheet or complete layout reconstruction.
- User speed commands remain 0.25–5×; observed actual rates may be outside that range and must still be displayed accurately.
- Browser-tab closure can leave a screenshot record until expiry cleanup; the preview's Close action removes it immediately.
- Broader stable-Chrome QA (including third-party players, long pages, and frame boundaries), final artwork review, version selection, packaging, public policy verification, and dashboard checks remain release steps. Follow the [submission checklist](./store/listing.md#submission-checklist).
