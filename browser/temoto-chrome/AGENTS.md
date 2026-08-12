# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product decisions

- The umbrella brand is lowercase `temoto`; this package and its in-product header both read `temoto for Chrome`.
- Use `/Users/hayashi/.codex/generated_images/019fef3f-0a29-76e1-a0f8-a4bf4df82b14/exec-98a56230-b922-4df8-bc2b-cffb65dfe8dc.png` as the latest visual source, modified by the user's explicit polish feedback below.
- Preserve the established near-black, charcoal, off-white, muted-gray, translucent-border, softly rounded visual system.
- Keep the Chrome popup a compact 416px square and use the same translucent, glass-like charcoal surfaces as `temoto for macOS`; avoid dense black slabs.
- Render the two-layer temoto mark as a tightly cropped vector with a solid upper block and outlined lower block; use no CSS color filter so it stays crisp at toolbar-popup scale.
- The Chrome home surface includes Color Picker, Screenshot, Video Speed, Environment Switcher, Site Reset, and Measure / Inspect.
- Screenshot includes selected-region, visible-viewport, and full-page capture with clipboard copy and PNG download.
- Keep lazy-content preloading and animation freezing automatic; expose only Delay and Force reveal inside a collapsed Capture options section.
- Proxy is a separate future `temoto Proxy` companion because the mandatory Chrome proxy permission is too broad for the core extension.
- Keep everyday actions in the popup and use the Chrome side panel for persistent detail and project configuration.
- The popup home is a 416 × 416 square English-only launcher with six equal tools in a 3 × 2 grid; use only thin dividers, with no individual card borders, backgrounds, or corner radii. Do not show the current-page/video status strip or Proxy on this surface.
- Keep the launcher header compact: use a single-line `temoto for Chrome` wordmark with white `temoto`, purple `for Chrome`, and no separate temoto mark beside it. Keep the borderless Settings cell separated by a vertical divider.
- Use locally bundled Geist Sans Variable for the English UI and wordmark, keeping IBM Plex Mono for numbers and technical labels. Pair it with a consistent light-weight Phosphor icon set with matched optical sizes.
- Chrome app-icon PNGs use optical sizing: rasterize the 48/128px extension-list icons at 108% of `temoto-mark.svg` with a 2% downward offset to balance their margins, while keeping the 16/32px manifest and toolbar action icons at the SVG's 100% scale so small sizes do not clip.
- Keep the Chrome extension mark purple `#9974F8` and use the macOS mark's slender proportions, 30-degree angle, and two-block spacing, but square off both ends and fill both blocks for Chrome. Compensate only its visual scale for the transparent Chrome icon surface; use the same purple for UI accents and the full `for Chrome` descriptor. Keep extension-list/app icons and the 16/32px toolbar action icon fully transparent; Chromium/Comet may require a full browser restart before manifest icon and version changes leave its UI cache.
- Selecting a launcher card replaces the grid with that tool's full-popup view and a clear Back action. Video availability is communicated only by the Video Speed card badge (`1.75x` or `No video`).
- Keep every tool-detail header at the launcher's 60px height: use the full 60 × 60px area left of the divider as the Back button, then show a small Phosphor SVG beside the tool title. Tool bodies use one shared top-aligned description-and-controls rhythm with no oversized framed feature icons.
- Extend the launcher's strict grid language through every tool detail: content runs edge to edge with no outer card padding, functional areas are fixed-height rows or equal grid cells separated by 1px rules, and standalone rounded cards or white floating primary buttons are avoided. Use muted purple for selection and red only for destructive actions.
- Apply the same strict grid to Settings: the side panel fills its native width, uses label/input columns and full-width rows separated by 1px rules, and avoids rounded forms, cards, and floating save buttons. On wide previews only, cap the content grid at 640px.
- While Inspect is active, show a compact persistent top guide for click-to-copy and Esc-to-exit, and use a crosshair cursor until cleanup.
- Video Speed uses page shortcuts `G` to toggle 1× / 1.5×, `D` for +0.25×, and `S` for −0.25×, capped at 5×; its slider dedicates roughly two-thirds of its travel to 0.25–2× and the final third to 2–5×. Show each video's current speed in a subtle, pointer-transparent badge at its top-left. Load these shortcuts and badges automatically in every HTTP(S) frame without requiring the popup to open; the approved persistent site access is used only for these local video controls, which ignore editable fields and modifier-key combinations.
