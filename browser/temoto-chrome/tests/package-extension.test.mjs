import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import test from "node:test";
import { packageExtension } from "../scripts/package-extension.mjs";

const version = "9.8.7";
const filename = `temoto-v${version}.zip`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "temoto-package-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = {
    manifest_version: 3,
    name: "Packaging fixture",
    version,
    key: "development-only-public-key",
    action: { default_popup: "index.html" },
  };
  const files = {
    "package.json": `${JSON.stringify({ version })}\n`,
    "dist/client/manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "dist/client/index.html": "<!doctype html><title>Packaging fixture</title>\n",
    "dist/client/fonts/geist-latin-wght-normal.woff2": Buffer.from("fixture font bytes"),
    "dist/client/fonts/LICENSE-Geist.txt": "Fixture font license must remain bundled.\n",
    "dist/client/fonts/README.md": "Source notes are not a runtime asset.\n",
  };
  for (const size of [16, 32, 48, 128]) {
    files[`dist/client/icons/icon-${size}.png`] = Buffer.from(`stale built icon ${size}`);
    files[`public/icons/icon-${size}.png`] = Buffer.from(`canonical source icon ${size}`);
  }
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
  return { root, archive: join(root, "release", filename), files };
}

function releaseEntries(root) {
  const release = join(root, "release");
  return existsSync(release) ? readdirSync(release).sort() : [];
}

function unzip(archive, args) {
  const result = spawnSync("unzip", [...args, archive], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
  return result.stdout;
}

function archiveMember(archive, member) {
  const result = spawnSync("unzip", ["-p", archive, member]);
  assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message);
  return result.stdout;
}

function executable(name) {
  for (const directory of (process.env.PATH || "").split(delimiter)) {
    const candidate = resolve(directory, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue to the next PATH entry.
    }
  }
  throw new Error(`Required test executable not found: ${name}`);
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function withFakeZip(root, body, run) {
  const directory = join(root, "fake-bin");
  const script = join(root, "fake-zip.mjs");
  mkdirSync(directory);
  writeFileSync(script, body);
  writeFileSync(join(directory, "zip"), `#!/bin/sh\nexec ${shellQuote(process.execPath)} ${shellQuote(script)} "$@"\n`, { mode: 0o755 });
  const previousPath = process.env.PATH;
  process.env.PATH = `${directory}${delimiter}${previousPath || ""}`;
  try {
    return run();
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  }
}

test("refuses an existing same-version archive without changing any release bytes", (t) => {
  const { root, archive } = fixture(t);
  mkdirSync(join(root, "release"));
  const existing = Buffer.from("already submitted archive bytes");
  const previous = Buffer.from("previous release archive bytes");
  const previousArchive = join(root, "release", "temoto-v9.8.6.zip");
  writeFileSync(archive, existing);
  writeFileSync(previousArchive, previous);

  assert.throws(() => packageExtension(root));

  assert.deepEqual(readFileSync(archive), existing);
  assert.deepEqual(readFileSync(previousArchive), previous);
  assert.deepEqual(releaseEntries(root), ["temoto-v9.8.6.zip", filename]);
});

test("publishes a valid keyless archive with canonical icons without modifying source files", (t) => {
  const { root, archive, files } = fixture(t);

  assert.equal(packageExtension(root), archive);

  unzip(archive, ["-tqq"]);
  const entries = unzip(archive, ["-Z1"]).trim().split("\n");
  assert.ok(entries.includes("manifest.json"));
  const manifest = JSON.parse(archiveMember(archive, "manifest.json").toString());
  assert.equal(manifest.version, version);
  assert.equal("key" in manifest, false);
  assert.equal(entries.includes("fonts/README.md"), false);
  for (const name of ["fonts/geist-latin-wght-normal.woff2", "fonts/LICENSE-Geist.txt"]) {
    assert.deepEqual(archiveMember(archive, name), readFileSync(join(root, "dist/client", name)));
  }
  for (const size of [16, 32, 48, 128]) {
    const name = `icons/icon-${size}.png`;
    assert.deepEqual(archiveMember(archive, name), readFileSync(join(root, "public", name)));
  }
  for (const [name, content] of Object.entries(files)) {
    assert.deepEqual(readFileSync(join(root, name)), Buffer.from(content), `${name} was modified`);
  }
  assert.deepEqual(releaseEntries(root), [filename]);
});

test("a version mismatch leaves no archive or staging directory", (t) => {
  const { root, archive } = fixture(t);
  writeFileSync(join(root, "package.json"), JSON.stringify({ version: "9.8.8" }));

  assert.throws(() => packageExtension(root));

  assert.equal(existsSync(archive), false);
  assert.deepEqual(releaseEntries(root), []);
});

test("a preparation failure removes staging and never publishes an archive", (t) => {
  const { root, archive } = fixture(t);
  rmSync(join(root, "public/icons"), { recursive: true });

  assert.throws(() => packageExtension(root));

  assert.equal(existsSync(archive), false);
  assert.deepEqual(releaseEntries(root), []);
});

test("a zip command that reports success but produces corrupt bytes cannot publish", (t) => {
  const { root, archive } = fixture(t);
  const marker = join(root, "fake-zip-was-called");
  withFakeZip(root, `
    import { writeFileSync } from "node:fs";
    const archive = process.argv.slice(2).find((argument) => argument.endsWith(".zip"));
    if (!archive) throw new Error("Missing ZIP output argument");
    writeFileSync(archive, "not a ZIP archive");
    writeFileSync(${JSON.stringify(marker)}, "called");
  `, () => assert.throws(() => packageExtension(root)));

  assert.equal(readFileSync(marker, "utf8"), "called");
  assert.equal(existsSync(archive), false);
  assert.deepEqual(releaseEntries(root), []);
});

test("a competing publication after preparation keeps the winner and removes the losing staging directory", (t) => {
  const { root, archive } = fixture(t);
  const realZip = executable("zip");
  const winnerSnapshot = join(root, "winner-snapshot.zip");
  writeFileSync(join(root, "winner.txt"), "The competing writer published this archive.\n");
  // Inject the competing writer after the initial existence check, without a timing race.
  withFakeZip(root, `
    import { spawnSync } from "node:child_process";
    import { constants, copyFileSync, readFileSync, writeFileSync } from "node:fs";
    const output = process.argv.slice(2).find((argument) => argument.endsWith(".zip"));
    const candidate = spawnSync(${JSON.stringify(realZip)}, process.argv.slice(2));
    if (candidate.status !== 0) process.exit(candidate.status || 1);
    copyFileSync(output, ${JSON.stringify(archive)}, constants.COPYFILE_EXCL);
    const winner = spawnSync(${JSON.stringify(realZip)}, ["-q", ${JSON.stringify(archive)}, "winner.txt"], { cwd: ${JSON.stringify(root)} });
    if (winner.status !== 0) process.exit(winner.status || 1);
    writeFileSync(${JSON.stringify(winnerSnapshot)}, readFileSync(${JSON.stringify(archive)}));
  `, () => assert.throws(() => packageExtension(root)));

  assert.deepEqual(readFileSync(archive), readFileSync(winnerSnapshot));
  assert.equal(archiveMember(archive, "winner.txt").toString(), "The competing writer published this archive.\n");
  unzip(archive, ["-tqq"]);
  assert.deepEqual(releaseEntries(root), [filename]);
});
