# temoto Proxy instructions

`temoto Proxy` is the retained legacy standalone Manifest V3 extension. On 2026-10-13 the user approved simple Proxy switching in `browser/temoto-chrome/`; that main extension is now the product to present publicly. The rules below apply to this legacy source and its existing advanced profiles. Preserve its code, saved profiles, and session credentials; do not automatically migrate or activate them in the main extension.

For migration, first select Off in the legacy extension, then recreate needed Fixed endpoints or PAC URLs in temoto. The main switcher has no custom authentication, diagnostics, domain routing, import/export, or incognito configuration. Do not import this legacy runtime into its build.

## Product contract

- Treat proxy configurations as named development workspaces, not as raw browser preferences.
- Keep the effective state visible and make every state safely reversible.
- `Off` clears temoto's Chrome setting; it must not force `direct` or overwrite a lower-priority system or policy setting.
- Regular-window settings use `regular_only`. Incognito is changed only after explicit user opt-in and confirmed Chrome incognito access.
- Never collect browsing history, request bodies, response bodies, or analytics.
- Passwords are session-only and must never be exported or persisted to `chrome.storage.local`.
- Usernames may be stored with profiles; shared and exported profiles omit both usernames and passwords.
- Replace imports clear every session password, and all imports reset diagnostic URLs to the public default before profiles can be used.
- Diagnostics accept public HTTP(S) destinations only, omit credentials and response bodies, and never follow redirects.
- Keep all operations inside the popup. Do not restore a standalone manager page, options_ui entry, or side panel. Home contains effective state, scope, profile activation, Off, a header New action, and a separate Edit action per saved profile.
- Share the popup's 416px width, header and brand treatment, settings-button states, and feedback tones with `temoto` through `browser/shared/temoto-popup-tokens.css`. Fit height to content up to 580px, then scroll the profile list.
- The allowlisted companion API provides GET_SUMMARY only. Legacy OPEN_MANAGER requests return an explicit instruction to open temoto Proxy from the Chrome toolbar; they must not open a tab. Summaries may contain profile identity and effective status, never credentials, PAC contents, endpoints, bypass rules, or full configuration.

## Visual decisions

- The default popup uses the approved flat #080808, off-white and purple theme, shared with `temoto`. Keep square buttons, visible rules, strong typography and purple active-profile rows. Off and warnings/errors stay neutral, with explicit status text; do not use red, green or amber highlights. Popup profile dots are uniform lavender-gray without modifying stored profile colors.
- Keep the header `temoto Proxy` untranslated. The inline editor follows the same palette, with basic connection fields first and optional details collapsed; preserve saved profile colors without exposing color editing.
- The user requested simpler layouts and English-only controls on 2026-10-13. Keep popup content to the effective state, connection scope, active profile, actions and profile list. Remove feature descriptions, duplicate Manage/footer actions, and normal success toasts. Keep errors, conflicts, credential readiness, import consequences and explicit test results as persistent inline information.
- New profiles start with Fixed proxy or PAC URL. Existing Domain routing, protocol-specific endpoints, and inline PAC remain fully editable through Edit; never flatten or drop their saved fields. Do not offer these advanced kinds as initial new-profile choices. Accept existing schema imports.
- Keep Connection test inside the editor, not on home. Put Import, Export, and Incognito in the collapsed home Options section. Keep active-profile saves labeled Save & reapply.
- Keep Duplicate and Delete inside editor Profile actions. Duplicate copies the saved profile, not unsaved edits. Delete uses an inline confirmation and clears an active override first.
- Preserve unfinished popup drafts in browser-session storage without passwords. Closing/reopening the popup restores the draft; Cancel discards it. Drafts do not apply network changes before Save/activation.
- Use the shared Geist UI, brand and control tokens in home and the inline editor. Controls are 44px high with 13px/500 labels; full-width popup action rows are 56px high; Off spans the available home action row. Profile rows are 68px high with 15px/500 names, matching the core launcher's rhythm. Keep technical endpoints and PAC code separate from UI labels.
- Endpoint fields use a single bottom rule, not enclosing boxes. Focus strengthens that same rule in purple; do not stack a parent focus border and an inner input/select outline. Preserve native select and keyboard behavior.
- Use the hollow B/Joint counterpart of `browser/shared/temoto-mark.svg`, generated by the shared icon renderer. Preserve the canonical frame and transparency; use a 6-unit inward outline except the 16px icon’s 10-unit optical stroke.

## Validation

Run `npm run check`. Before a store handoff, also run `npm run package` and test the unpacked extension in current stable Chrome.

Do not edit generated `dist/` or `release/` files directly.
