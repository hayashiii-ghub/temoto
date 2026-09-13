import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "dist/client/manifest.json",
  "dist/client/index.html",
  "dist/client/sidepanel.html",
  "dist/client/capture.html",
  "dist/client/service-worker.js",
  "dist/client/capture-store.js",
  "dist/client/capture-utils.js",
  "dist/client/content/video-speed.js",
  "dist/client/content/webmcp.js",
  "dist/client/content/webmcp-provider.js",
  "dist/client/content/selection.js",
  "dist/client/content/measure.js",
  "dist/client/icons/icon-16.png",
  "dist/client/icons/icon-32.png",
  "dist/client/icons/icon-48.png",
  "dist/client/icons/icon-128.png",
  "dist/client/_locales/en/messages.json",
  "dist/client/_locales/ja/messages.json",
];

await Promise.all(required.map((file) => access(resolve(root, file))));
const manifest = JSON.parse(await readFile(resolve(root, "dist/client/manifest.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const videoSpeedScript = manifest.content_scripts?.find((entry) => entry.js?.includes("content/video-speed.js"));
const webMcpScript = manifest.content_scripts?.find((entry) => entry.js?.includes("content/webmcp.js"));
const webMcpProviderScript = manifest.content_scripts?.find((entry) => entry.js?.includes("content/webmcp-provider.js"));
if (
  manifest.manifest_version !== 3
  || manifest.action?.default_popup !== "index.html"
  || manifest.action?.default_icon?.["16"] !== "icons/icon-16.png"
  || manifest.action?.default_icon?.["32"] !== "icons/icon-32.png"
  || manifest.default_locale !== "en"
  || manifest.version !== packageJson.version
  || !videoSpeedScript?.all_frames
  || !videoSpeedScript.matches?.includes("http://*/*")
  || !videoSpeedScript.matches?.includes("https://*/*")
  || !webMcpScript
  || webMcpScript.all_frames
  || !webMcpScript.matches?.includes("http://*/*")
  || !webMcpScript.matches?.includes("https://*/*")
  || webMcpScript.world === "MAIN"
  || !webMcpProviderScript
  || webMcpProviderScript.world !== "MAIN"
  || webMcpProviderScript.all_frames
  || !webMcpProviderScript.matches?.includes("http://*/*")
  || !webMcpProviderScript.matches?.includes("https://*/*")
) {
  throw new Error("Extension manifest verification failed");
}
// The approved theme is the default; never reintroduce study assets or switches.
const clientRoot = resolve(root, "dist/client");
for (const file of await readdir(clientRoot, { recursive: true })) {
  if (!/\.(?:html|css|js)$/.test(file)) continue;
  const content = await readFile(resolve(clientRoot, file), "utf8");
  if (/study/i.test(file) || /studyScreen|site-study|proxy-study|--temoto-study-/.test(content)) {
    throw new Error(`Local visual study leaked into extension build: ${file}`);
  }
}
console.log(`Verified temoto extension build (${required.length} required files; no local study assets).`);
