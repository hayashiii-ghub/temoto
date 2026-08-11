# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product decisions

- The umbrella brand is lowercase `temoto`; this package and its in-product header both read `temoto for Chrome`.
- Use `/Users/hayashi/.codex/generated_images/019fef3f-0a29-76e1-a0f8-a4bf4df82b14/exec-98a56230-b922-4df8-bc2b-cffb65dfe8dc.png` as the latest visual source, modified by the user's explicit polish feedback below.
- Preserve the established near-black, charcoal, off-white, muted-gray, translucent-border, softly rounded visual system.
- Keep the Chrome popup a compact 440px square and use the same translucent, glass-like charcoal surfaces as `temoto for macOS`; avoid dense black slabs.
- Render the supplied two-layer temoto mark as a tightly cropped vector with no CSS color filter so it stays crisp at toolbar-popup scale.
- The Chrome home surface includes Color Picker, Screenshot, Video Speed, Environment Switcher, Site Reset, and Measure / Inspect.
- Screenshot MVP includes selected-region and visible-viewport capture, clipboard copy, and PNG download; full-page capture is deferred.
- Proxy is a separate future `temoto Proxy` companion because the mandatory Chrome proxy permission is too broad for the core extension.
- Keep everyday actions in the popup and use the Chrome side panel for persistent detail and project configuration.
- The popup home is a 440 × 440 square English-only launcher with six equal tools in a 3 × 2 grid; use only thin dividers, with no individual card borders, backgrounds, or corner radii. Do not show the current-page/video status strip or Proxy on this surface.
- Keep the launcher header compact: a 26px temoto mark, a single-line `temoto for Chrome` lockup with `for Chrome` in muted purple, and a borderless Settings cell separated only by a vertical divider.
- Use the native system sans-serif stack for crisp English UI and a consistent light-weight Phosphor icon set with matched optical sizes.
- Chrome app-icon PNGs must use the enlarged temoto mark so the icon reads at the same visual scale as neighboring extensions.
- Use the muted-purple temoto mark on a fully transparent background for both extension-list/app icons and the 16/32px toolbar action icon; Chromium/Comet may require a full browser restart before manifest icon and version changes leave its UI cache.
- Selecting a launcher card replaces the grid with that tool's full-popup view and a clear Back action. Video availability is communicated only by the Video Speed card badge (`1.75x` or `No video`).
