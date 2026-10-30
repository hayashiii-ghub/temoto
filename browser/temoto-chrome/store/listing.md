# Chrome Web Store submission copy

On **2026-10-28**, the developer dashboard package details showed published version **1.2.2** and draft **1.2.3**; the draft status explicitly said it was not published. Version **1.2.4** restores square corners to the popup controls and capture preview and removes the pale fringe around the extension icon; it changes no functionality, permissions, or data handling. It was submitted for review on **2026-10-28** with automatic publication after approval enabled. On **2026-10-29**, the dashboard showed version **1.2.4** as published.

Version **1.2.5** was submitted for review on **2026-10-29** at approximately **19:00 JST** with the current app logo and Chrome icon colors. Its checked ZIP and refreshed English graphics were uploaded and saved. The submission receipt and version **1.2.5 Awaiting review** status were verified, and automatic publication after approval was enabled. The developer dashboard showed 1.2.5 as published on **2026-10-30**.

This is the authoritative listing, permission, privacy-disclosure, and reviewer copy. The [historical Store notes](https://github.com/hayashiii-ghub/temoto/blob/92f621abd979fdfe2dcfaef3ecf5bbd602522be6/browser/temoto-chrome/CHROMEWEBSTORE.md) and [2026-09-13 handoff](https://github.com/hayashiii-ghub/temoto/blob/92f621abd979fdfe2dcfaef3ecf5bbd602522be6/browser/STORE-HANDOFF-2026-09-13.md) describe earlier source states.

## Product details

**Name**

temoto

**Primary language**

English

The submitted 1.2.5 package contains only `_locales/en`. The dashboard and uploaded 1.2.4 draft were confirmed to use English only on 2026-10-28. The uploaded 1.2.5 draft was also confirmed to use English only on 2026-10-29 before submission. Japanese copy and assets are retained below as local reference material; do not add a Japanese package catalog to restore the old listing locale.

**Suggested category**

Choose the closest current dashboard category for developer productivity/tools when preparing the release.

**Summary (English)**

Color Picker, screenshots, CSS, video speed and proxy switching.

**Detailed description (English)**

Five tools, close at hand. Automatically follows your browser’s light or dark appearance.

• Color Picker — Pick a color and copy HEX, RGB or HSL.
• Screenshot — Capture the visible area or full page. Copy or save a PNG.
• CSS — Inspect an element and copy its computed styles.
• Video Speed — Adjust playback speed with popup controls or G / D / S shortcuts.
• Proxy — Switch saved Fixed or PAC URL profiles using your own proxy server.

No account, ads or analytics. Page content, screenshots and settings are not sent to the developer. Proxy affects regular Chrome windows and routes traffic through your chosen server.

Support: https://github.com/hayashiii-ghub/temoto/issues

**Summary (Japanese)**

色の取得、スクリーンショット、CSS確認、動画速度、シンプルなProxy切替を、ひとつのコンパクトなChromeツールに。

**Detailed description (Japanese)**

5つの道具を、手元に。

temotoは、Color Picker、Screenshot、CSS、Video Speed、Proxyをひとつのポップアップにまとめた拡張機能です。操作画面は英語です。

Color Picker：画面上の色を取得し、HEX・RGB・HSLでコピーできます。取得した直近8色をローカルに保存し、あとから選び直せます。

Screenshot：表示範囲またはページ全体を撮影できます。Fitまたは100%表示で確認し、画像のコピーやPNG保存ができます。撮影前の準備は自動で行われ、設定は不要です。

CSS：ページ上の要素を選び、寸法、余白、文字、色、境界線を確認できます。項目ごとのCSS宣言や、要素を特定するセレクターを別々にコピーできます。表示するのは選択要素の計算済みスタイルで、ページの元のスタイルシートではありません。

Video Speed：ポップアップから0.25〜5倍速で操作できます。Gキーで1倍／1.5倍を切り替え、Dキーで0.25倍上げ、Sキーで0.25倍下げられます。動画が切り替わっても、その動画自身の再生速度を保ちます。ポップアップと動画上の小さな表示は実際の速度に追従し、ページ側が操作範囲外の速度に設定した場合も、その値を表示します。

Proxy：HTTP・HTTPS・SOCKS4・SOCKS5のいずれか1つの接続先を持つFixedプロファイル、またはPAC URLに名前を付けて保存できます。追加、編集、削除ができ、保存済みプロファイルをクリックすると適用されます。新規追加や使用していないプロファイルの保存だけでは、接続は変わりません。使用中のプロファイルはSave & reapplyで保存すると、変更がすぐに再適用されます。Offはtemotoの上書きを解除し、Chromeの元の設定が使える状態に戻します。Proxyの設定は通常のChromeウィンドウ全体に適用されます。シークレットモードの設定、独自の認証処理、接続診断、ドメイン別ルール、インポート／エクスポートは提供しません。ProxyサーバーやPAC URLはご自身で用意してください。

旧temoto Proxyから移行する場合は、先に旧拡張機能でOffを選び、必要なFixed接続先やPAC URLをtemotoで作り直してください。自動移行や自動適用は行いません。旧プロファイルと認証情報は、旧拡張機能に残ります。

Chromeのツールバーからtemotoを開き、使いたい道具を選びます。Backで5つの道具の一覧に戻れます。色の取得、撮影、CSS確認は、選択したときに動作します。動画のショートカットは、対応ページでポップアップを開かずに使えます。

temotoは各ツールをローカルで処理し、ページの内容、スクリーンショット、設定を開発者へ送信しません。Proxyを選ぶとChromeの通信は指定したサーバーを経由し、選択したPAC URLは必要に応じてChromeが取得します。アカウント、アクセス解析、広告はありません。HTTP(S)ページへの継続的なアクセスは、ローカルの動画速度操作と、明示的に有効化されたページの限定的な動画連携に使います。この連携で行えるのは、要求元タブでの拡張機能の有無の確認と動画速度の操作だけです。

サポート・ソースコード：https://github.com/hayashiii-ghub/temoto

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

**Privacy policy URL (updated public content verified)**

https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md

## Graphic assets

The 1.2.3 launcher keeps hover highlights evenly inset and row dividers visible. Its English launcher screenshot and small promo tile were refreshed locally on 2026-10-28 with the T-panel mark and current light UI. Both exports are sRGB JPEGs without alpha; their dimensions and rendered contents were checked. The existing launcher screenshot and promo tile were retained for 1.2.4; its 128px Store icon was replaced with the fringe-free panel render and saved before submission.

The 1.2.5 graphics use the current 128px icon and freshly captured English screenshot and promo tile. The text, layout and five-tool launcher are preserved; the app logo and icon outline colors reflect the current build. Both JPEGs use sRGB and have no alpha. All three assets were uploaded and saved in the existing Store item on 2026-10-29. The old common screenshot was removed, leaving exactly one current English screenshot.

- Store icon: `public/icons/icon-128.png` (128 × 128 PNG).
- Launcher screenshot: `store/assets/screenshot-launcher-1280x800.jpg` (1280 × 800 JPEG).
- Small promo tile: `store/assets/promo-small-440x280.jpg` (440 × 280 JPEG).
- Optional marquee promo tile: 1400 × 560 PNG or JPEG.

The site showcase is a current 360 × 326 PNG; the OG and X metadata share the refreshed 1200 × 630 PNG. The Japanese launcher and legacy standalone Proxy images remain historical material. Use the existing [Store capture workflow](../../../AGENTS.md#assets-capture-and-release) for subsequent artwork; captures do not prove native Chrome permission handling or real proxy traffic.

On 2026-10-14, old common Store screenshots were removed, leaving one latest English image. The canonical 128 × 128 PNG icon was uploaded again and saved. The existing small promo tile visually matched the current asset and was retained. A Japanese screenshot had been saved before upload, but it is not displayed by the English-only 1.2.0 draft and remains local reference material.

## Reviewer test instructions

No temoto account is required. The four page tools need no credentials. Use a disposable proxy/PAC supplied by the reviewer to test routing; the extension supplies no proxy service and stores no custom authentication credentials.

**Dashboard additional instructions (453 characters; 500-character limit)**

The following shortened instructions have been saved in the dashboard:

No login required. Open temoto on an HTTP(S) page: pick/copy a color; capture Visible area/Full page, reload preview, Copy/Save PNG; select CSS and press Esc to exit; use Video Speed and G/D/S on HTML5 video. Proxy: add a disposable Fixed endpoint or PAC URL. Saving does not activate it; click its row to apply, edit with Save & reapply, then Off. Use your own test proxy; none is supplied. Proxy affects regular windows only and stores no credentials.

**Full reviewer test steps**

1. Open an HTTP(S) page and click the temoto toolbar icon. Confirm the launcher has exactly Color Picker, Screenshot, CSS, Video Speed, and Proxy. Its controls and page overlays remain English when Chrome or the page uses another language. Change the light/dark preference and verify that the popup, capture preview, CSS inspector and video badges follow it. Check the fixed dark-outline icon with a white panel and transparent corners against standard light and dark toolbars; its appearance can vary with custom Chrome themes.
2. Pick a color with Chrome's native eyedropper. Confirm HEX/RGB/HSL copy, revisit the tool, and check that only actual picks enter the latest-eight history. Selecting a history color must not create a duplicate.
3. Capture the visible area and the full page. Confirm that these are the only two capture actions, with no Capture options section. Confirm separate capture previews, image dimensions, Fit/100% zoom, Copy, and Save PNG. Reload a preview within an hour to confirm it retains its own capture; its Close action deletes that capture.
4. Start CSS inspection, select an element, inspect size, margin/padding, font, colors, and borders, then copy one group or all groups. Copy the unique selector separately. Esc exits; selected-element data is not saved as a page log.
5. On a page with HTML5 video, use the popup and G/D/S shortcuts. Confirm commands stay within 0.25–5× and controls/badges follow actual page rate changes. Changing or inserting a video must keep its own rate; external rates outside the control range must be displayed accurately. Editable fields and modifier combinations must keep normal typing behavior. A page without video shows No video.
6. Open Proxy, save a named Fixed endpoint or PAC URL, and confirm that saving does not activate it. Click a saved profile to activate it for regular Chrome windows, edit inactive profiles without changing the connection, verify active edits use Save & reapply, delete profiles, and select Off to clear temoto's override. Verify incognito is unchanged and an underlying Chrome/system setting can take effect after Off. Confirm policy/extension conflicts and failures are shown honestly. Do not configure real production traffic for this check.
7. Optional video bridge check: use the opted-in fixture to check extension availability and set video speed in the requesting tab. Confirm that it exposes no screenshots, picked colors, preferences, or other-tab controls.

## 1.2.0 submission record

- [x] Preserve the existing source identity, Item ID `gcncgknjklghkoeiapcbdghodepnllid`, and its public key.
- [x] Select **1.2.0** as the release version; the source manifest and package version are 1.2.0. The update was published; the public listing showed 1.2.0 on 2026-10-15.
- [x] Complete native 1.2.0 QA: Color HEX/RGB/HSL copy and format persistence passed, and the user manually confirmed successful new-color acquisition. Screenshot, CSS, Video Speed, restricted-page, and controlled Proxy checks passed; see [CHROMEWEBSTORE.md](https://github.com/hayashiii-ghub/temoto/blob/92f621abd979fdfe2dcfaef3ecf5bbd602522be6/browser/temoto-chrome/CHROMEWEBSTORE.md#integration-verification).
- [x] Run final 1.2.0 `npm test` (**125 passed**), `npm run build` (checks for **20 required extension files** passed), and `npm run test:sites` (**4 passed**) on 2026-10-14, including the capture error recovery fix. The redesigned landing page separately passed lint/build and all 6 tests on 2026-10-14.
- [x] Review the refreshed five-row English/Japanese launcher JPEGs. Browser preview covered Fixed/PAC URL creation, save/edit/activation/Off/delete, active Save & reapply, unfinished-draft reload, and validation-error focus.
- [x] Obtain the user's authorization for the added Proxy permission, load native Chrome 1.2.0, and verify Fixed/PAC routing, Off, draft restoration, inactive save-only behavior, active Save & reapply, and deletion. Leave Proxy Off with all test profiles deleted.
- [x] Save one latest English/common screenshot after deleting the old images, upload the canonical 128 × 128 PNG icon, and retain the visually matching existing promo tile. Japanese artwork remains local reference only for this English-only draft.
- [x] Package and check `release/temoto-for-chrome-v1.2.0.zip`: **177,102 bytes**, SHA-256 `620aa17207726459c86ddc2348c0bbe433020253749c8003c36e874c6633b071`; manifest identity, version, permissions, and root layout checked.
- [x] Upload the final 1.2.0 ZIP to the existing Store item; the new `proxy` justification field appeared. Confirm draft version 1.2.0 in the dashboard and public version 1.1.0.
- [x] Save the English detailed description, canonical homepage, single purpose, all permission justifications, corrected temoto privacy URL, and shortened reviewer instructions. Retain the existing Website content/Web history selections, No remote code setting, and three checked certifications. Previously saved Japanese fields are not displayed by the current English-only draft.
- [x] Unpublish the former standalone temoto Proxy; retain its source and existing profiles/credentials for manual migration.
- [x] Push the release source and 1.2.0 privacy policy to `origin/main` in commit `8764534`.
- [x] Confirm GitHub Chrome, website, and legacy Proxy checks for source commit 8764534 all passed.
- [x] Confirm the updated public privacy policy content: GitHub shows commit 8764534, the October 14, 2026 date, and version 1.2.0 text.
- [x] Confirm and retain the existing free pricing, public visibility, and all-region distribution. Public visibility does not mean the new version has been published.
- [x] Submit the update for review and verify the submission receipt and Awaiting review status. Automatic publication after approval remains enabled with the user's explicit authorization.
- [x] Confirm the public 1.2.0 Store release after automatic publication: the public listing showed 1.2.0 on 2026-10-15.

## 1.2.4 submission record

- 2026-10-28: restored square corners in the popup controls, hover backgrounds and capture preview. Kept the icon outline and dividers while moving its white fill inside the black border to remove a pale outer fringe.
- Final Chrome checks: `npm test` **150 passed**, `npm run package` build verification passed, `npm run test:sites` **4 passed**. The fringe regression test fails against the previous 48px/128px icon renders and passes against the updated source.
- Store ZIP: `release/temoto-v1.2.4.zip`, **188,105 bytes**, SHA-256 `17237cf219679f827e66d84a646128be2c0ecfe18b844121f52b936b232c9f2d`. Root manifest is 1.2.4 without `key`; all other manifest values match 1.2.3. Existing release ZIPs were preserved.
- Existing unpacked Chrome extension updated to **1.2.4**. Its loaded 128px icon hash matches the packaged source. The former build and icons are retained outside the repository in the local release outputs.
- Dashboard package page confirmed draft **1.2.4** and published **1.2.2** before submission. Replaced and saved only the Store icon; retained English copy, screenshot, promo, privacy/distribution settings and reviewer instructions.
- The final submission dialog had automatic publication after approval checked. The receipt explicitly confirmed submission for review. Public availability had not yet been separately verified at that point.
- 2026-10-29: the dashboard package page showed version **1.2.4** as published before the 1.2.5 upload, so review cancellation was no longer needed.

## 1.2.5 submission record

- 2026-10-29: prepared from main commit `a9f6bac`, including the filled app panel mark with reversed light/dark colors and the Chrome icon outlines and dividers in `#202124`. The icon shapes, white panels, dimensions and transparency are preserved. Tools, permissions and data handling are unchanged.
- Candidate versions match in `package.json`, `package-lock.json` and the source manifest. Chrome checks: `npm test` **150 passed**, `npm run package` build verification passed, and `npm run test:sites` **4 passed**.
- Store ZIP: `release/temoto-v1.2.5.zip`, **188,182 bytes**, SHA-256 `34e7d2860b0be4a2fa986c020d8f081d9f5bf2b03f64bd13f3f5958160057e1b`. ZIP integrity passed; its root manifest is 1.2.5 without `key`. Every packaged runtime file and all eight PNG icons match the candidate build/source. No TS/TSX source, tests, node_modules, .env files, source maps or Store artwork are included.
- Refreshed `store/assets/screenshot-launcher-1280x800.jpg` and `promo-small-440x280.jpg` from the built light UI using the existing capture stage. Their dimensions, sRGB color space, lack of alpha, fonts, labels and five-tool layout were checked. Previous English images are retained in the local preparation outputs.
- Suggested update note: Updated app logos and Chrome icon colors. No changes to tools, permissions or privacy.
- This candidate has not been installed in the user's Chrome.
- 2026-10-29: during an earlier attempt, with the user's authorization, attempted to cancel the 1.2.4 review before replacing it with 1.2.5. The dashboard returned “キャンセル中にエラーが発生しました。しばらくしてからもう一度お試しください。” Refreshing and retrying returned the same error, and the visible status remained Awaiting review. Cancellation was not confirmed. During that earlier attempt, the prepared 1.2.5 ZIP and graphics were not uploaded, and 1.2.5 was not submitted. No workaround was used, and the candidate files remained unchanged.
- Later on 2026-10-29, the dashboard showed published version **1.2.4**, so cancellation was no longer needed. Uploaded the checked 1.2.5 ZIP and confirmed draft **1.2.5**, published **1.2.4**, English-only language and unchanged permissions before submission.
- Replaced the 128px Store icon, common English screenshot and small promo tile with the prepared files. Removed the previous common screenshot, leaving exactly one current screenshot. Saving was confirmed by the disabled Save button and enabled Submit for Review button. Existing English listing copy was retained.
- At approximately **19:00 JST**, submitted 1.2.5 for review with the automatic-publication-after-approval checkbox checked. The receipts “この 拡張機能 は審査のために送信されました。” and “アイテムを送信しました。” were verified. The item list then showed **temoto version 1.2.5** with **Awaiting review** status; its screenshot was saved in the local preparation outputs. Public availability had not yet been verified at that point.
- 2026-10-30: the developer dashboard showed version **1.2.5** as published.

## 1.2.6 submission record

The toolbar icon uses less padding so it appears larger, with size-specific rendering to retain crisp dividers. The Store icon, functionality, permissions, and data handling are unchanged.

- 2026-10-30: verified `npm test` (150 passed), `npm run package` and `npm run test:sites` (4 passed) under Node 22.23.4. Store ZIP SHA-256: `04c9173c2238fa7bd6247720153bf6f8e22f79ee0d88d7983c37465529e5efc3`.
- Submitted version **1.2.6** for review and confirmed the submission receipt. The initial submission had automatic publication off. Version **1.2.5** was published when the submission was made.
- 2026-10-30: canceled the initial review and resubmitted version **1.2.6** with automatic publication after approval enabled. The submission receipt and Awaiting review status were confirmed. Public availability remains unverified.
