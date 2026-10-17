import { watch } from "node:fs";
import { join } from "node:path";
import { buildSite, siteRoot } from "./build";
import { serveSite } from "./serve";

await buildSite();
const server = serveSite();
let timer: ReturnType<typeof setTimeout> | undefined;
let building = false;
let pending = false;
async function rebuild() {
  if (building) { pending = true; return; }
  building = true;
  try { await buildSite(); }
  catch (error) { console.error(error); }
  finally {
    building = false;
    if (pending) { pending = false; void rebuild(); }
  }
}
const watchers = ["src", "public"].map(directory => watch(join(siteRoot, directory), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => void rebuild(), 100);
}));
function close() {
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  server.stop();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
