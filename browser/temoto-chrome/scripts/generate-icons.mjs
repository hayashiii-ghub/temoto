import { mkdir, writeFile } from "node:fs/promises";
import { createPanelIcon } from "./panel-icon.mjs";
import { createToolbarIcon } from "./toolbar-icon.mjs";

const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await writeFile(new URL(`icon-${size}.png`, directory), createPanelIcon(size));
}
for (const background of ["light", "dark"]) {
  for (const size of [16, 24, 32, 48]) {
    await writeFile(new URL(`toolbar-${background}-${size}.png`, directory), createToolbarIcon(size, background));
  }
}
console.log("Generated temoto Chrome panel and toolbar icons.");
