import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createTemotoIcon } from "../../browser/temoto-proxy/scripts/icon-utils.mjs";

const siteRoot = resolve(import.meta.dirname, "..");
const publicRoot = resolve(siteRoot, "public");

await copyFile(
  resolve(siteRoot, "../browser/temoto-chrome/public/icons/icon-128.png"),
  resolve(publicRoot, "product-chrome-icon.png"),
);
await writeFile(resolve(publicRoot, "product-proxy-icon.png"), createTemotoIcon(128));

console.log("Synced Chrome and Proxy product icons from their extension sources.");
