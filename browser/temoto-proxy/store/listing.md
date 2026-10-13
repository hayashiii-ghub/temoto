# Chrome Web Store submission copy

Popup-only revisions are local source work as of **2026-10-13**. The source version remains **1.2.0**; no new package upload, submission, or publication is claimed. The [2026-09-13 handoff](../../STORE-HANDOFF-2026-09-13.md) records earlier preparation, not verification of this UI. [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md) tracks the remaining release work.

## Product

**Name:** temoto Proxy

**Summary:** Save, edit and switch development proxy profiles from one compact Chrome popup.

**Description**

temoto Proxy keeps connection setup and switching in the Chrome toolbar popup.

Use + to add a Fixed proxy or PAC URL. Enter the connection details, save, then choose the profile to activate it. Edit a saved profile directly in the popup; no separate manager tab is needed.

Existing HTTP, HTTPS, SOCKS4, SOCKS5, domain routing, protocol-specific endpoints, and inline PAC settings remain editable. Older profile exports can still be imported without flattening those advanced settings.

Off clears temoto's Chrome override and lets the underlying connection setting take effect. Effective status, conflicts, scope, missing credentials, and actual failures remain visible. Saving an active profile reapplies its updated setting.

The editor contains Connection test for the active profile. Home Options contains Import, Export, and explicitly enabled Incognito access. Unfinished edits restore during the same browser session with passwords excluded from drafts.

Profiles and authentication usernames stay locally in Chrome. Passwords are session-only. Export excludes authentication usernames and passwords; endpoints, rules, PAC content, and other connection settings remain included.

temoto has no analytics or traffic-content collection. It configures proxies supplied by the user; it does not provide a proxy server, VPN service, or country-based exit locations. The interface is English-only.

## Privacy policy URL

Publish and verify the updated local policy before submitting the new source:

https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-proxy/PRIVACY.md

## Graphic assets

- Store icon: `dist/client/icons/icon-128.png` after `npm run build` (128 × 128 PNG).
- Popup screenshot: `store/assets/screenshot-popup-1280x800.jpg` (1280 × 800 JPEG); refresh for the popup-only home.
- Retired manager screenshot: `store/assets/screenshot-manager-1280x800.png`; retain as historical release material, not current UI artwork.
- Small promo tile: `store/assets/promo-small-440x280.jpg` (440 × 280 JPEG).
- Existing localized/manager images and their website copies remain historical material. Do not delete them as part of this source change.

New home and inline-editor screenshots are pending. Use the existing Store capture workflow and inspect saved pixels before updating the listing. The current public images do not establish that this UI is released.

## Single purpose

Allow web developers to configure, switch, verify, and clear Chrome proxy routes as local named profiles inside the popup.

## Permission justifications

- `proxy`: read, apply, verify, and clear the user's selected Chrome proxy setting.
- `storage`: keep profiles and usernames locally, and passwords/password-free editing drafts in session storage.
- `webRequest`: receive proxy-authentication and completion events needed to bound retry state.
- `webRequestAuthProvider`: answer proxy authentication after explicit configuration and allowed-host checks.
- `<all_urls>`: support those proxy challenges and user-requested public diagnostics; no browsing-history or page-content collection.

The companion API returns only allowlisted effective-status/profile-identity summaries. Legacy OPEN_MANAGER requests receive an instruction to open the Chrome toolbar popup; the API does not open tabs or expose configuration/credentials.

## Reviewer instructions

No account or temoto-operated server is required. Network-changing checks use a reviewer-controlled disposable proxy.

1. Open the toolbar popup. Confirm home state, +, profile activation, separate Edit, Off, and collapsed Options, with no manager/options page.
2. Add a Fixed profile for the disposable proxy, Save, then choose it on home. Verify active state and a safe Off operation.
3. Add a PAC URL profile. Edit existing/imported domain-routing, per-protocol, and inline-PAC profiles; confirm all saved fields survive editing and save.
4. Close and reopen the popup during an edit. Confirm draft restore, password omission, Cancel/discard, and active-profile Save & reapply behavior.
5. Run Save & test inside the active profile's editor. Confirm HTTP result, elapsed time, page credentials omitted, and no followed redirects. Home has no Test action.
6. Use editor Profile actions: Duplicate copies the saved profile; Delete requires inline confirmation and clears an active override first.
7. Export and inspect that no authentication username/password is included. Import offers Merge or Replace all; imported Test URLs reset and replacement clears session passwords.
8. Authentication responds only to allowed proxy hosts while temoto owns the matching effective setting. A username change without a new password clears old credentials; missing credentials stay visible.
9. Incognito requires both Chrome permission and explicit Options opt-in. Verify session-only/persistent choice and Off without overwriting other settings.
10. Verify the companion summary boundary and OPEN_MANAGER compatibility error; neither opens a tab or exposes connection details.

## Release checklist

- [x] Preserve reserved Item ID `hohabmdadcdkifcmbclkgnomhhlllnbb` and its source public key.
- [ ] Run `npm run check` and review final popup-only output; do not package manager.html or options_ui.
- [ ] Check New/Edit/draft restore and legacy-profile round trips in current stable Chrome.
- [ ] Verify real activation, Off, conflicts, authentication, and Incognito with a disposable controlled proxy.
- [ ] Recapture and review English popup home and inline-editor artwork; current images remain old.
- [ ] Select the release version and produce/review a new authorized ZIP without overwriting an earlier submitted package.
- [ ] Publish the matching privacy policy and review dashboard data-use declarations.
- [ ] Obtain submission/publication authorization, upload the correct package and artwork, and verify the public Store state separately.
