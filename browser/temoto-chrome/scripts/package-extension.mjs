import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const buildRoot = resolve(projectRoot, "dist/client");
const releaseRoot = resolve(projectRoot, "release");
const manifest = JSON.parse(readFileSync(resolve(buildRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const storeBootstrap = process.argv.includes("--store-bootstrap");
const archiveVersion = storeBootstrap ? "0.0.0.1" : manifest.version;

if (manifest.version !== packageJson.version) {
  throw new Error(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
}

mkdirSync(releaseRoot, { recursive: true });
const filename = storeBootstrap
  ? `temoto-for-chrome-store-bootstrap-v${archiveVersion}.zip`
  : `temoto-for-chrome-v${archiveVersion}.zip`;
const archivePath = resolve(releaseRoot, filename);
rmSync(archivePath, { force: true });
const temporaryRoot = mkdtempSync(resolve(tmpdir(), "temoto-chrome-package-"));
const archiveRoot = resolve(temporaryRoot, "client");
const archiveManifest = { ...manifest, version: archiveVersion };
delete archiveManifest.key;
cpSync(buildRoot, archiveRoot, { recursive: true });
writeFileSync(resolve(archiveRoot, "manifest.json"), `${JSON.stringify(archiveManifest, null, 2)}\n`);

const zip = spawnSync("zip", ["-qr", archivePath, "."], {
  cwd: archiveRoot,
  encoding: "utf8",
});

rmSync(temporaryRoot, { recursive: true, force: true });

if (zip.status !== 0) {
  throw new Error(zip.stderr || "Could not create the extension ZIP");
}

const entries = spawnSync("unzip", ["-Z1", archivePath], { encoding: "utf8" });
if (entries.status !== 0 || !entries.stdout.split("\n").includes("manifest.json")) {
  throw new Error("Packaged ZIP does not contain manifest.json at its root");
}
const packagedManifest = spawnSync("unzip", ["-p", archivePath, "manifest.json"], { encoding: "utf8" });
const packagedManifestJson = packagedManifest.status === 0 ? JSON.parse(packagedManifest.stdout) : null;
if (!packagedManifestJson || packagedManifestJson.version !== archiveVersion || "key" in packagedManifestJson) {
  throw new Error(`Packaged ZIP must contain manifest version ${archiveVersion} without a key field`);
}

console.log(`Created release/${filename}`);
