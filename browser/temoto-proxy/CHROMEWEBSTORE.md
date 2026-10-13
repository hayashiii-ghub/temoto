# Chrome Web Store readiness — temoto Proxy

Last updated: 2026-10-13

This is the retained legacy standalone extension, rather than a second main product. Simple Proxy switching is now developed in [temoto for Chrome](../temoto-chrome/). Its code, profiles, and credentials are preserved for existing users and explicit migration.

The legacy popup-only editor is local source work. Source version **1.2.0** is unchanged. No upload, submission, or publication of these changes is claimed. No new legacy release is authorized by the main-extension integration.

[store/listing.md](./store/listing.md) remains the authoritative product copy, permission justification, reviewer instructions, and release checklist. [PRIVACY.md](./PRIVACY.md) includes the password-free browser-session drafts.

## Source changes

- Add/Edit lives inside the toolbar popup; the standalone manager and options_ui entry are removed.
- New profiles begin as Fixed proxy or PAC URL. Existing routing, per-protocol, and inline-PAC schemas remain editable/importable.
- Home retains effective state, profile activation and Off; Options retains Import/Export/Incognito.
- Connection tests live in the editor; draft restore excludes passwords.
- The companion supports GET_SUMMARY. Legacy OPEN_MANAGER returns a toolbar instruction without opening a page.

## Local verification completed

- `npm run check`: build, TypeScript check, and 53 tests passed.
- Local browser preview: add/edit, invalid input, password-free draft restore, and existing routing/per-protocol/inline-PAC preservation passed at 416px width.
- Website lint and all 8 tests passed after copy updates.

## If a separate legacy release is authorized

- Verify the installed extension's popup/editor/draft and legacy profiles in stable Chrome.
- Review real proxy activation, Off, authentication, conflicts, and Incognito against a controlled disposable proxy.
- Recapture the current popup home and inline editor. Existing Store manager images and website copies remain historical material and are not current release evidence.
- Select a release version, prepare an authorized ZIP, and verify matching public policy/listing/dashboard declarations.
- Treat package creation, submission, review, and public availability as separate states requiring their own evidence.

Reserved Store Item ID: `hohabmdadcdkifcmbclkgnomhhlllnbb`. The [2026-09-13 handoff](../STORE-HANDOFF-2026-09-13.md) records older preparation only.
