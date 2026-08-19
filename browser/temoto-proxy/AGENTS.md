# temoto Proxy instructions

`temoto Proxy` is an independent Manifest V3 Chrome extension. It shares the lowercase `temoto` brand, but it must stay separately installable from `browser/temoto-chrome/` because the required Chrome `proxy` permission affects browser-wide network settings.

## Product contract

- Treat proxy configurations as named development workspaces, not as raw browser preferences.
- Keep the effective state visible and make every state safely reversible.
- `Off` clears temoto's Chrome setting; it must not force `direct` or overwrite a lower-priority system or policy setting.
- Regular-window settings use `regular_only`. Incognito is changed only after explicit user opt-in and confirmed Chrome incognito access.
- Never collect browsing history, request bodies, response bodies, or analytics.
- Credentials are session-only and must never be exported or persisted to `chrome.storage.local`.
- Shared and exported profiles never contain secrets.
- Replace imports clear every session password, and all imports reset diagnostic URLs to the public default before profiles can be used.
- Diagnostics accept public HTTP(S) destinations only, omit credentials and response bodies, and never follow redirects.
- Keep popup actions compact and use the manager dashboard for diagnostics, profile editing, routing, PAC, authentication, and import/export. temoto Proxy does not own a Chrome side panel.
- Share the popup's 416 × 500px outer frame, header and brand treatment, settings-button states, and feedback tones with `temoto for Chrome` through `browser/shared/temoto-popup-tokens.css`, while keeping each popup's layout and product-specific job separate.
- Expose only the allowlisted `temoto for Chrome` companion API for effective-state summary and manager opening. Companion summaries may contain profile identity and effective status, but never credentials, PAC contents, endpoints, bypass rules, or full configuration.

## Validation

Run `npm run check`. Before a store handoff, also run `npm run package` and test the unpacked extension in current stable Chrome.

Do not edit generated `dist/` or `release/` files directly.
