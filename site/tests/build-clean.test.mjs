import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { buildClean } from "../scripts/build-clean.mjs";

async function put(root, path, contents) {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
}

async function project(t) {
  const root = await mkdtemp(join(tmpdir(), "temoto-build-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "node_modules"));
  await put(root, "app/page.tsx", "current working-tree source");
  await put(root, ".openai/hosting.json", '{"project_id":"preserved","d1":null,"r2":null}');
  await put(root, ".vinext/fonts/retired/old.woff2", "retired cache");
  await put(root, "dist/client/assets/_vinext_fonts/retired/old.woff2", "retired output");
  await put(root, ".git/config", "repository metadata");
  await put(root, ".env.local", "LOCAL_SECRET=not-a-build-input");
  await put(root, "test-results/old.txt", "test output");
  return root;
}

test("builds current source without old caches and preserves the Sites output contract", async (t) => {
  const root = await project(t);
  let staging;
  await buildClean(root, {
    runBuild: async (buildRoot) => {
      staging = buildRoot;
      assert.equal(await readFile(join(buildRoot, "app/page.tsx"), "utf8"), "current working-tree source");
      assert.equal(await readlink(join(buildRoot, "node_modules")), join(root, "node_modules"));
      for (const path of [".vinext", "dist", ".git", ".env.local", "test-results"]) {
        await assert.rejects(access(join(buildRoot, path)), { code: "ENOENT" });
      }
      await put(buildRoot, "dist/client/current.css", "current asset");
      await put(buildRoot, "dist/server/index.js", "export default {};");
      await put(buildRoot, "dist/.openai/hosting.json", await readFile(join(buildRoot, ".openai/hosting.json")));
    },
  });
  assert.equal(await readFile(join(root, "dist/client/current.css"), "utf8"), "current asset");
  assert.equal(JSON.parse(await readFile(join(root, "dist/.openai/hosting.json"), "utf8")).project_id, "preserved");
  await assert.rejects(access(join(root, "dist/client/assets/_vinext_fonts")), { code: "ENOENT" });
  assert.equal(await readFile(join(root, ".vinext/fonts/retired/old.woff2"), "utf8"), "retired cache");
  await assert.rejects(access(staging), { code: "ENOENT" });
});

test("a failed build keeps the previous output and removes its temporary directory", async (t) => {
  const root = await project(t);
  let staging;
  await assert.rejects(buildClean(root, {
    runBuild: async (buildRoot) => {
      staging = buildRoot;
      throw new Error("build failed");
    },
  }), /build failed/);
  assert.equal(await readFile(join(root, "dist/client/assets/_vinext_fonts/retired/old.woff2"), "utf8"), "retired output");
  await assert.rejects(access(staging), { code: "ENOENT" });
});
