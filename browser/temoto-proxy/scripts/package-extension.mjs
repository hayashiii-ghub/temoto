import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const buildRoot = resolve(root, "dist/client");
const releaseRoot = resolve(root, "release");
const manifest = JSON.parse(readFileSync(resolve(buildRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
if (manifest.version !== packageJson.version) throw new Error(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
mkdirSync(releaseRoot, { recursive: true });
const filename = `temoto-proxy-v${manifest.version}.zip`;
const archive = resolve(releaseRoot, filename);
rmSync(archive, { force: true });
const zip = spawnSync("zip", ["-qr", archive, "."], { cwd: buildRoot, encoding: "utf8" });
if (zip.status !== 0) throw new Error(zip.stderr || "Could not create extension ZIP");
const entries = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
if (entries.status !== 0 || !entries.stdout.split("\n").includes("manifest.json")) throw new Error("Package does not contain manifest.json at its root");
console.log(`Created release/${filename}`);
