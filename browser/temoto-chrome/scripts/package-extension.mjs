import { spawnSync } from "node:child_process";
import { cpSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const existingArchiveError = (path) => new Error(`Release archive already exists: ${path}. Choose a new release version instead of replacing it.`);

export function packageExtension(projectRoot = resolve(import.meta.dirname, "..")) {
  const buildRoot = resolve(projectRoot, "dist/client");
  const releaseRoot = resolve(projectRoot, "release");
  const manifest = JSON.parse(readFileSync(resolve(buildRoot, "manifest.json"), "utf8"));
  const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
  const archiveVersion = manifest.version;

  if (manifest.version !== packageJson.version) {
    throw new Error(`Version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
  }

  const archivePath = resolve(releaseRoot, `temoto-v${archiveVersion}.zip`);
  if (existsSync(archivePath)) throw existingArchiveError(archivePath);

  mkdirSync(releaseRoot, { recursive: true });
  // Keep the temporary ZIP on the destination filesystem for exclusive publication.
  const temporaryRoot = mkdtempSync(resolve(releaseRoot, ".temoto-package-"));
  try {
    const archiveRoot = resolve(temporaryRoot, "client");
    const temporaryArchive = resolve(temporaryRoot, "extension.zip");
    const archiveManifest = { ...manifest, version: archiveVersion };
    delete archiveManifest.key;
    cpSync(buildRoot, archiveRoot, { recursive: true });
    cpSync(resolve(projectRoot, "public/icons"), resolve(archiveRoot, "icons"), { recursive: true });
    rmSync(resolve(archiveRoot, "fonts/README.md"), { force: true });
    writeFileSync(resolve(archiveRoot, "manifest.json"), `${JSON.stringify(archiveManifest, null, 2)}\n`);

    const zip = spawnSync("zip", ["-qr", temporaryArchive, "."], { cwd: archiveRoot, encoding: "utf8" });
    if (zip.status !== 0) {
      throw new Error(zip.error?.message || zip.stderr || "Could not create the extension ZIP");
    }

    const integrity = spawnSync("unzip", ["-t", temporaryArchive], { encoding: "utf8" });
    if (integrity.status !== 0) throw new Error("Packaged ZIP failed its integrity check");
    const entries = spawnSync("unzip", ["-Z1", temporaryArchive], { encoding: "utf8" });
    if (entries.status !== 0 || !entries.stdout.split("\n").includes("manifest.json")) {
      throw new Error("Packaged ZIP does not contain manifest.json at its root");
    }
    const packagedManifest = spawnSync("unzip", ["-p", temporaryArchive, "manifest.json"], { encoding: "utf8" });
    const packagedManifestJson = packagedManifest.status === 0 ? JSON.parse(packagedManifest.stdout) : null;
    if (!packagedManifestJson || packagedManifestJson.version !== archiveVersion || "key" in packagedManifestJson) {
      throw new Error(`Packaged ZIP must contain manifest version ${archiveVersion} without a key field`);
    }

    try {
      // link() creates the final name atomically and cannot overwrite a concurrent ZIP.
      linkSync(temporaryArchive, archivePath);
    } catch (error) {
      if (error.code === "EEXIST") throw existingArchiveError(archivePath);
      throw error;
    }
    return archivePath;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const archivePath = packageExtension();
  console.log(`Created release/${basename(archivePath)}`);
}
