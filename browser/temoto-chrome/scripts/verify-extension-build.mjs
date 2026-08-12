import { access, readFile } from "node:fs/promises";
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
  "dist/client/content/selection.js",
  "dist/client/content/measure.js",
];

await Promise.all(required.map((file) => access(resolve(root, file))));
const manifest = JSON.parse(await readFile(resolve(root, "dist/client/manifest.json"), "utf8"));
const videoSpeedScript = manifest.content_scripts?.find((entry) => entry.js?.includes("content/video-speed.js"));
if (
  manifest.manifest_version !== 3
  || manifest.action?.default_popup !== "index.html"
  || !videoSpeedScript?.all_frames
  || !videoSpeedScript.matches?.includes("http://*/*")
  || !videoSpeedScript.matches?.includes("https://*/*")
) {
  throw new Error("Extension manifest verification failed");
}
console.log(`Verified temoto extension build (${required.length} required files).`);
