import { mkdir, writeFile } from "node:fs/promises";
import { createTemotoIcon } from "../../shared/icon-utils.mjs";

const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await writeFile(new URL(`icon-${size}.png`, directory), createTemotoIcon(size));
}
console.log("Generated transparent Joint icons for temoto.");
