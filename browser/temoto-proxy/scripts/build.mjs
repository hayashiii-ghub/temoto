import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createTemotoIcon } from "./icon-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "public");
const output = resolve(root, "dist/client");

await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await cp(resolve(root, "../shared/temoto-popup-tokens.css"), resolve(output, "popup-tokens.css"));
await mkdir(resolve(output, "fonts"), { recursive: true });
await cp(
  resolve(root, "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"),
  resolve(output, "fonts/geist-latin-wght-normal.woff2"),
);
for (const weight of [400, 500]) {
  await cp(
    resolve(root, `node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff2`),
    resolve(output, `fonts/ibm-plex-mono-latin-${weight}-normal.woff2`),
  );
}
await mkdir(resolve(output, "icons"), { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await writeFile(resolve(output, `icons/icon-${size}.png`), createTemotoIcon(size));
}
await writeFile(resolve(output, "icons/action-16.png"), createTemotoIcon(16));
await writeFile(resolve(output, "icons/action-32.png"), createTemotoIcon(32));

console.log("Built temoto Proxy extension in dist/client.");
