import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const buildRoot = resolve(root, "dist/client");
const required = [
  "manifest.json",
  "service-worker.js",
  "proxy-core.js",
  "proxy-runtime.js",
  "companion-api.js",
  "extension-api.js",
  "popup.html",
  "popup.js",
  "popup-tokens.css",
  "manager.html",
  "manager.js",
  "styles.css",
  "fonts/geist-latin-wght-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "icons/sliders-horizontal-light.svg",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
  "_locales/en/messages.json",
  "_locales/ja/messages.json"
];

await Promise.all(required.map((file) => access(resolve(buildRoot, file))));
const manifest = JSON.parse(await readFile(resolve(buildRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const requiredPermissions = ["proxy", "storage", "webRequest", "webRequestAuthProvider"];
if (
  manifest.manifest_version !== 3
  || manifest.action?.default_popup !== "popup.html"
  || manifest.default_locale !== "en"
  || manifest.version !== packageJson.version
  || manifest.side_panel
  || manifest.background?.service_worker !== "service-worker.js"
  || !manifest.host_permissions?.includes("<all_urls>")
  || manifest.externally_connectable?.ids?.length !== 1
  || requiredPermissions.some((permission) => !manifest.permissions?.includes(permission))
  || manifest.permissions?.includes("sidePanel")
  || manifest.incognito !== "spanning"
) throw new Error("Extension manifest verification failed");

const worker = await readFile(resolve(buildRoot, "service-worker.js"), "utf8");
if (!worker.includes('scope: "regular_only"') && !(await readFile(resolve(buildRoot, "proxy-runtime.js"), "utf8")).includes('scope: "regular_only"')) {
  throw new Error("Regular proxy settings must be isolated with regular_only");
}
console.log(`Verified temoto Proxy build (${required.length} required files).`);
