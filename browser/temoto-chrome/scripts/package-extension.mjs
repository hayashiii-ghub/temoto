import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const buildRoot = resolve(projectRoot, "dist/client");
const releaseRoot = resolve(projectRoot, "release");
const manifest = JSON.parse(readFileSync(resolve(buildRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));

if (manifest.version !== packageJson.version) {
  throw new Error(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
}

mkdirSync(releaseRoot, { recursive: true });
const filename = `temoto-for-chrome-v${manifest.version}.zip`;
const archivePath = resolve(releaseRoot, filename);
rmSync(archivePath, { force: true });

const zip = spawnSync("zip", ["-qr", archivePath, "."], {
  cwd: buildRoot,
  encoding: "utf8",
});

if (zip.status !== 0) {
  throw new Error(zip.stderr || "Could not create the extension ZIP");
}

const entries = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
if (entries.status !== 0 || !entries.stdout.split("\n").includes("manifest.json")) {
  throw new Error("Packaged ZIP does not contain manifest.json at its root");
}

console.log(`Created release/${filename}`);
