# Chrome Web Store submission copy

## Product

**Name:** temoto Proxy

**Summary:** Safe, visible and reversible proxy profiles for web development.

**Description**

temoto Proxy turns Chrome's proxy configuration into named development workspaces.

- Switch HTTP, HTTPS, SOCKS4 and SOCKS5 profiles from one compact popup.
- Route selected domains through a local proxy or connect them directly.
- Use fixed, generated-rule or advanced PAC configurations.
- Detect policy and extension conflicts before changing Chrome.
- Clear temoto's setting safely without forcing another connection mode.
- Keep authenticated proxy passwords in session memory only.
- Share effective status and active profile identity with the separately installed temoto for Chrome companion, and let it open this extension's manager through an extension-ID-allowlisted local API.
- Diagnose a route with a credential-free request to a validated public URL without following redirects.
- Import and export team profiles without credentials; imported test URLs reset to the public default, and replacement clears session passwords.
- Opt into isolated incognito behavior explicitly.

temoto Proxy has no analytics service and does not inspect or transmit page traffic.

## Privacy policy URL after this branch is merged

https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-proxy/PRIVACY.md

## Graphic assets

- Store icon: `dist/client/icons/icon-128.png` after running `npm run build` (128 × 128 PNG).
- Required screenshot: `store/assets/screenshot-manager-1280x800.png` (1280 × 800 PNG).
- Popup screenshot: `store/assets/screenshot-popup-1280x800.jpg` (1280 × 800 JPEG).
- Optional promotion video and promotional tiles may be omitted for the initial submission.

## Single purpose

Allow web developers to configure, switch, verify and safely clear Chrome proxy routes as local named profiles.

## Permission justifications

- `proxy`: the core product capability used to read, apply, verify and clear Chrome proxy settings.
- `storage`: stores profiles locally and holds passwords in session-only extension storage.
- `webRequest`: bounds authenticated proxy attempts and removes retry state when a request ends.
- `webRequestAuthProvider`: supplies user-entered session credentials only for a proxy authentication challenge from an explicitly allowed proxy host.
- `<all_urls>`: required for authenticated proxy challenges from explicit proxy hosts and a user-requested, validated public diagnostic URL. It is not used to collect browsing activity or page content.

## Reviewer instructions

No account or temoto-operated server is required.

1. Open the profile manager and inspect the preconfigured `Local proxy` profile.
2. Start a disposable local HTTP proxy on `127.0.0.1:8080`, or edit the profile to another reviewer-controlled proxy.
3. Save and activate the profile. Confirm the toolbar badge reads `ON` and the popup identifies the profile.
4. Use Test to issue a credential-free `HEAD` request to the selected public diagnostic URL. Redirects are not followed.
5. Choose Turn off safely. Confirm temoto clears its control and reports Proxy off.
6. Create a domain-routing profile and inspect the ordered proxy/direct rule controls.
7. Export profiles and confirm the JSON contains no password or authentication username.
8. Authentication is optional. If tested, add the proxy host to Allowed proxy hosts; credentials remain available only for the current Chrome session.
9. Incognito remains untouched unless Chrome's Allow in Incognito setting and the in-product toggle are both enabled.

## Release checklist

- [x] Reserve the store item with the `0.0.0.1` bootstrap ZIP and record Item ID `hohabmdadcdkifcmbclkgnomhhlllnbb` and its public key.
- [ ] Run `npm run check`.
- [ ] Run `npm run package` and confirm `manifest.json` is at the ZIP root.
- [ ] Load `dist/client` in the current stable Google Chrome release.
- [ ] Verify activation and Off with a disposable reviewer-controlled proxy.
- [ ] Verify wrong credentials stop retrying and produce a visible failure.
- [ ] Verify another proxy extension produces a visible conflict without being overwritten.
- [ ] Capture store screenshots from the actual extension.
- [ ] Publish `PRIVACY.md` at a stable public URL.
- [ ] Complete Chrome Web Store Limited Use disclosures truthfully.
- [x] Reserve both Chrome Web Store items and replace the development keys/IDs with the store-issued identities.
