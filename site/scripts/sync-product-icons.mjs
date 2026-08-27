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

await copyFile(
  resolve(siteRoot, "../browser/temoto-chrome/store/assets/screenshot-launcher-1280x800.jpg"),
  resolve(publicRoot, "product-chrome-launcher.jpg"),
);
await copyFile(
  resolve(siteRoot, "../browser/temoto-proxy/store/assets/screenshot-popup-1280x800.jpg"),
  resolve(publicRoot, "product-proxy-popup.jpg"),
);
await copyFile(
  resolve(siteRoot, "../browser/temoto-proxy/store/assets/screenshot-manager-1280x800.png"),
  resolve(publicRoot, "product-proxy-manager.png"),
);

console.log("Synced Chrome and Proxy product assets from their extension sources.");
