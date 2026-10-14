# temoto Proxy

This is the retained **legacy standalone extension**. Its Chrome Web Store item was unpublished on October 14, 2026. Simple Proxy switching now belongs to [temoto for Chrome](../temoto-chrome/), alongside its four page tools. The legacy source stays available for existing advanced profiles.

To move: select Off in this old extension, then recreate the needed Fixed endpoints or PAC URLs in temoto → Proxy. There is no automatic migration or activation, and the old profiles and credentials are preserved.

The legacy English-only popup still adds, edits, and switches development proxy profiles without a separate manager tab. Its feature and privacy descriptions below apply to this retained source only.

日本語の機能説明と操作例は [FEATURES.ja.md](./FEATURES.ja.md) を参照してください。

## Features

- Use the header `+` to add a Fixed proxy or PAC URL profile, and `Edit` beside a saved profile to change it.
- Click a profile to activate it. Off clears temoto's override and lets Chrome's underlying setting take effect.
- Keep existing Domain routing, per-protocol HTTP/HTTPS/fallback endpoints, inline PAC, bypass rules, and authentication settings editable. Advanced imported profiles retain the existing schema and fields.
- Run a connection test from the editor for the active profile. The test uses HEAD, omits page credentials, and does not follow redirects.
- Use collapsed home Options for Import, Export, and explicitly enabled Incognito access.
- Duplicate the saved configuration or delete a profile from editor Profile actions. Active-profile edits reapply when saved; deleting an active profile clears its override first.
- Restore unfinished popup drafts during the same browser session without retaining draft passwords.
- Show effective state, policy/extension conflicts, credential readiness, and actual failures inline.

The popup-only changes are retained source work, not a claim about the former Store package. Historical artwork remains in `store/assets/`; recapture it from the current built UI if a separate legacy release is ever authorized.

## Privacy and permissions

Profiles, connection configuration, authentication usernames, and selected state remain in `chrome.storage.local`. Passwords stay in `chrome.storage.session`; draft state also uses session storage with password fields excluded. Exported profiles omit authentication usernames and passwords but retain the connection configuration needed to reuse the profile.

The extension does not collect browsing history, request/response bodies, analytics, or telemetry. `proxy` controls the selected Chrome proxy setting; `webRequest` and `webRequestAuthProvider` handle bounded challenges from explicitly allowed proxy hosts. `<all_urls>` supports those challenges and user-requested public connection tests.

See [PRIVACY.md](./PRIVACY.md) for the full policy.

## Development and release

Runtime code lives in `src/` as strict TypeScript. The build emits browser-ready modules and the popup's HTML/CSS into `dist/client`.

```sh
npm run check
```

Load `dist/client` as an unpacked extension from `chrome://extensions`. Do not apply a real proxy merely to verify popup layout.

```sh
npm run package
```

Packaging produces a ZIP with `manifest.json` at its root and removes the manifest `key`; unpacked builds retain the reserved Store identity. [store/listing.md](./store/listing.md) is the authoritative release copy and checklist. [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md) tracks the unpublished popup-only changes.

## Companion compatibility

The extension-ID-allowlisted API still provides `GET_SUMMARY` with profile identity and effective status. It never returns endpoints, rules, PAC content, authentication data, or complete profiles. `OPEN_MANAGER` is retained only as a compatibility error directing callers to the Chrome toolbar; it does not open a page.
