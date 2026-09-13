# temoto logo concepts — 2026-09-12

Three exploratory raster concept boards generated with the built-in image generation tool. These boards are design history, not production artwork. B / JOINT was selected and developed into the shared vector mark described below; A and C were not adopted. This directory is outside the website and extension build inputs.

- A / CRADLE: a receiving shape, tools within reach. `a-cradle.png`
- B / JOINT: two pieces with a diagonal joint. `b-joint.png`
- C / LETTERFORM: a combined t/m letterform. `c-letterform.png`

The first drafts had glow/halo artifacts. The saved boards are the cleaned-up white-background revisions.

## Selected direction: B / JOINT

The user selected B. `b-joint.svg` is a manually constructed, transparent, two-path vector mark based on that concept. Both sides of the diagonal gap are parallel at 30 degrees (rounded to three decimal places). It uses a 160 × 160 viewBox with an 8-unit top/bottom safe margin and a default color of #9974f8. Inline SVG consumers may override `color`; image consumers may use the SVG as a monochrome mask.

`b-joint-preview.html` shows the mark at 16/24/32/48/64px on light and dark backgrounds. Its wordmark examples use the existing UI's Geist Variable font, not a traced recreation of the generated concept's lettering. The bundled preview font is accompanied by `geist-LICENSE.txt`.

The selected mark is now implemented in the local website and both extension builds. The canonical source is `browser/shared/temoto-mark.svg`: the core extension uses a solid mark, while Proxy uses its hollow counterpart with a stronger inward stroke at 16px. `b-joint-preview.html` preserves the original study, not the current product lockups. Release ZIP creation, Store submission, and public deployment remain separate steps.

## Generation prompts

### A / CRADLE

```text
Use case: logo-brand. Create ONE polished logo concept presentation board for the lowercase brand "temoto", practical developer tools that stay close at hand, and its separate companion "temoto Proxy". This is brand exploration, not final production artwork. Style: original premium Swiss/Bauhaus-influenced graphic design, flat vector-friendly shapes, strong silhouette readable as a 16-32px toolbar icon, restrained and confident, not a tech startup cliché. Palette strictly near-black #080808, off-white #f4f4f2, and purple #9974f8, minor gray labels. No green, yellow, red, gradients, 3D, shadows, mockups, photography, texture, ornamental grids, chrome browser logo, hand drawing, lightning, stars, infinity loops, generic code brackets. Square 1024x1024 board. Plain near-black background, generous but intentional negative space. Small concept label at top left. Large purple standalone symbol in upper central area. Below, one horizontal lockup with same symbol and bold geometric off-white lowercase wordmark "temoto"; below that a smaller lockup with the exact same symbol and exact text "temoto Proxy", "Proxy" purple. Bottom slim strip of small single-color applications on dark and off-white backgrounds demonstrating the SAME logo silhouette. All repetitions must be geometrically consistent. No invented tagline or explanatory text. Precisely spell temoto t-e-m-o-t-o.
Text label (verbatim): "A / CRADLE".
Concept A CRADLE: An asymmetric open receiving shape, suggesting keeping a useful object within reach. Use one thick open U / cupped-square silhouette with gently rounded OUTSIDE bottom corners, squared inner negative space, and a small solid square hovering close to the opening, slightly off-center. Make the dot/square and cup feel like one memorable compact icon, not a download tray or shopping bag. The cue is a quiet Japanese tool resting in its place. Deliberately soft geometry compared with a sharp monogram. Wordmark is sturdy geometric grotesk with optically softened corners, compact, no stylized illegibility.
```

### B / JOINT

```text
Use case: logo-brand. Create ONE polished logo concept presentation board for the lowercase brand "temoto", practical developer tools that stay close at hand, and its separate companion "temoto Proxy". This is brand exploration, not final production artwork. Style: original premium Swiss/Bauhaus-influenced graphic design, flat vector-friendly shapes, strong silhouette readable as a 16-32px toolbar icon, restrained and confident, not a tech startup cliché. Palette strictly near-black #080808, off-white #f4f4f2, and purple #9974f8, minor gray labels. No green, yellow, red, gradients, 3D, shadows, mockups, photography, texture, ornamental grids, chrome browser logo, hand drawing, lightning, stars, infinity loops, generic code brackets. Square 1024x1024 board. Plain near-black background, generous but intentional negative space. Small concept label at top left. Large purple standalone symbol in upper central area. Below, one horizontal lockup with same symbol and bold geometric off-white lowercase wordmark "temoto"; below that a smaller lockup with the exact same symbol and exact text "temoto Proxy", "Proxy" purple. Bottom slim strip of small single-color applications on dark and off-white backgrounds demonstrating the SAME logo silhouette. All repetitions must be geometrically consistent. No invented tagline or explanatory text. Precisely spell temoto t-e-m-o-t-o.
Text label (verbatim): "B / JOINT".
Concept B JOINT: Invent a bold engineered compact lowercase t-like joint made from TWO interlocking solid angular pieces, separated by a clear diagonal slit at 30 degrees. The whole mark should form a balanced roughly square silhouette, like a precise joinery connection viewed front-on, with one distinctive cut that remains clear at small sizes. Communicates useful tools connecting naturally. NOT two generic parallel slashes, NOT a plus sign, not a chain or an infinity symbol, no extruded 3D. Sharp ends, large confident masses, negative space with personality. The lowercase t recognition should be subtle, not just a font glyph. Wordmark: bold tightly kerned geometric neo-grotesk, precise with one modest angular detail echoing the cut.
```

### C / LETTERFORM

```text
Use case: logo-brand. Create ONE polished logo concept presentation board for the lowercase brand "temoto", practical developer tools that stay close at hand, and its separate companion "temoto Proxy". This is brand exploration, not final production artwork. Style: original premium Swiss/Bauhaus-influenced graphic design, flat vector-friendly shapes, strong silhouette readable as a 16-32px toolbar icon, restrained and confident, not a tech startup cliché. Palette strictly near-black #080808, off-white #f4f4f2, and purple #9974f8, minor gray labels. No green, yellow, red, gradients, 3D, shadows, mockups, photography, texture, ornamental grids, chrome browser logo, hand drawing, lightning, stars, infinity loops, generic code brackets. Square 1024x1024 board. Plain near-black background, generous but intentional negative space. Small concept label at top left. Large purple standalone symbol in upper central area. Below, one horizontal lockup with same symbol and bold geometric off-white lowercase wordmark "temoto"; below that a smaller lockup with the exact same symbol and exact text "temoto Proxy", "Proxy" purple. Bottom slim strip of small single-color applications on dark and off-white backgrounds demonstrating the SAME logo silhouette. All repetitions must be geometrically consistent. No invented tagline or explanatory text. Precisely spell temoto t-e-m-o-t-o.
Text label (verbatim): "C / LETTERFORM".
Concept C LETTERFORM: Typography-led identity, a custom lowercase "temoto" wordmark whose distinctive t and m construction is the source of a standalone tm monogram. Draw t and m from broad continuous rounded strokes on a strict baseline; m has two low arches, t has a short asymmetric crossbar with a blunt squared end. The standalone mark interlocks the t stem and first m stem into ONE compact rhythmic shape, a recognizable authored letterform, not just typing "tm", not a badge. The full wordmark should feel tactile and friendly but not bubbly or childish; balance circular o counters with narrow t/e shapes. The monogram is purple, wordmark off-white. This must look significantly different from an abstract angular geometric mark or a receiving tray. Prioritize beautiful custom type and a quiet confident silhouette.
```

## Cleanup prompt (applied separately to each initial board)

```text
Edit this logo concept board. Preserve the EXACT symbol design and wordmark letter shapes. Fix ONLY rendering and presentation: redraw as a perfectly clean flat vector-style PRINTED POSTER on a completely SOLID OPAQUE WHITE #ffffff canvas, ALL pixels of the backdrop fully opaque. NO transparency anywhere, NO alpha cutout, NO black background. Remove ALL glows, ALL shadows, ALL noise, ALL grain, ALL gradients, ALL halos, ALL bevels and raster artifacts. Fill symbol shapes with a single uniform solid purple #9974f8. Fill "temoto" wordmark in solid near-black #080808; keep "Proxy" purple. Labels gray. Keep the main large standalone mark, "temoto" lockup, "temoto Proxy" lockup and small A/B/C concept title arranged cleanly with generous margins. Bottom row: only two small flat instances of the SAME symbol, one purple on white and one pure black on white. NO squircle app tiles, NO 3D mockups. A crisp opaque white page of print artwork, not a transparent logo asset. Maintain precise existing spelling and original geometry.
```
