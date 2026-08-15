import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const buildRoot = resolve(root, "dist/client");
const releaseRoot = resolve(root, "release");
const manifest = JSON.parse(readFileSync(resolve(buildRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const storeBootstrap = process.argv.includes("--store-bootstrap");
const archiveVersion = storeBootstrap ? "0.0.0.1" : manifest.version;
if (manifest.version !== packageJson.version) throw new Error(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
mkdirSync(releaseRoot, { recursive: true });
const filename = storeBootstrap
  ? `temoto-proxy-store-bootstrap-v${archiveVersion}.zip`
  : `temoto-proxy-v${archiveVersion}.zip`;
const archive = resolve(releaseRoot, filename);
rmSync(archive, { force: true });
let temporaryRoot = null;
let archiveRoot = buildRoot;
if (storeBootstrap) {
  temporaryRoot = mkdtempSync(resolve(tmpdir(), "temoto-proxy-store-bootstrap-"));
  archiveRoot = resolve(temporaryRoot, "client");
  cpSync(buildRoot, archiveRoot, { recursive: true });
  writeFileSync(resolve(archiveRoot, "manifest.json"), `${JSON.stringify({ ...manifest, version: archiveVersion }, null, 2)}\n`);
}
const zip = spawnSync("zip", ["-qr", archive, "."], { cwd: archiveRoot, encoding: "utf8" });
if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
if (zip.status !== 0) throw new Error(zip.stderr || "Could not create extension ZIP");
const entries = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
if (entries.status !== 0 || !entries.stdout.split("\n").includes("manifest.json")) throw new Error("Package does not contain manifest.json at its root");
const packagedManifest = spawnSync("unzip", ["-p", archive, "manifest.json"], { encoding: "utf8" });
if (packagedManifest.status !== 0 || JSON.parse(packagedManifest.stdout).version !== archiveVersion) throw new Error(`Package does not contain manifest version ${archiveVersion}`);
console.log(`Created release/${filename}`);
