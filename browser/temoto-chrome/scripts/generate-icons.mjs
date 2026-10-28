import { mkdir, writeFile } from "node:fs/promises";
import { createPanelIcon } from "./panel-icon.mjs";

const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await writeFile(new URL(`icon-${size}.png`, directory), createPanelIcon(size));
}
console.log("Generated temoto Chrome panel icons.");
