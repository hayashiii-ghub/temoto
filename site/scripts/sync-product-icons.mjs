import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const siteRoot = resolve(import.meta.dirname, "..");
const publicRoot = resolve(siteRoot, "public");

await copyFile(
  resolve(siteRoot, "../browser/temoto-chrome/public/icons/icon-128.png"),
  resolve(publicRoot, "product-chrome-icon.png"),
);

await copyFile(
  resolve(siteRoot, "../browser/temoto-chrome/store/assets/screenshot-launcher-1280x800.jpg"),
  resolve(publicRoot, "product-chrome-launcher.jpg"),
);
console.log("Synced temoto product assets from the main Chrome extension.");
