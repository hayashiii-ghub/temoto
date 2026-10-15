import { spawn } from "node:child_process";
import { access, cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const generatedDirectories = new Set([
  "node_modules", "dist", ".next", ".vinext", ".vite", ".wrangler",
  "coverage", "out", "outputs", "work", "test-results", "playwright-report",
]);

function runVinext(buildRoot, args) {
  return new Promise((resolveBuild, reject) => {
    const child = spawn(process.execPath, [join(buildRoot, "node_modules/vinext/dist/cli.js"), "build", ...args], {
      cwd: buildRoot,
      env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveBuild();
      else reject(new Error(`vinext build failed (${signal || code})`));
    });
  });
}

export async function buildClean(sourceRoot, { args = [], runBuild = runVinext } = {}) {
  const buildRoot = await mkdtemp(join(tmpdir(), "temoto-site-build-"));
  try {
    // vinext copies every cached Google Font into dist. Build from current
    // source with a fresh cache instead of editing generated files in place.
    await cp(sourceRoot, buildRoot, {
      recursive: true,
      filter(source) {
        const parts = relative(sourceRoot, source).split(sep);
        return !generatedDirectories.has(parts[0])
          && !parts.some((part) => part === ".git" || part === ".DS_Store" || part.startsWith(".env"));
      },
    });
    await symlink(join(sourceRoot, "node_modules"), join(buildRoot, "node_modules"), "dir");
    await runBuild(buildRoot, args);

    const output = join(buildRoot, "dist");
    for (const required of ["client", "server/index.js", ".openai/hosting.json"]) {
      await access(join(output, required));
    }
    // Keep the previous output if the build fails; replace it only after all
    // required Worker/Sites artifacts were generated successfully.
    await rm(join(sourceRoot, "dist"), { recursive: true, force: true });
    await cp(output, join(sourceRoot, "dist"), { recursive: true });
  } finally {
    await rm(buildRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
  await buildClean(sourceRoot, { args: process.argv.slice(2) });
}
