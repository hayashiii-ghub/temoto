import { cp, mkdtemp, rename, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import Home from "../src/page";

export const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const distRoot = join(siteRoot, "dist");
const siteURL = "https://temoto.shigoto.dev";
const description = "Color Picker, Screenshot, CSS, Video Speed, and simple Proxy switching in one Chrome extension.";
function assetURL(filename: string): string {
  const hash = createHash("sha256").update(readFileSync(join(siteRoot, "public", filename))).digest("hex").slice(0, 12);
  return `/${filename}?v=${hash}`;
}

function renderDocument(scripts: string[], styles: string[]): string {
  const imageURL = `${siteURL}${assetURL("og-temoto.png")}`;
  const markURL = assetURL("temoto-mark.svg");
  const faviconURL = assetURL("favicon-32.png");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#202124" media="(prefers-color-scheme: dark)">
<title>temoto</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${siteURL}/">
<link rel="icon" href="${faviconURL}" type="image/png" sizes="32x32">
<link rel="icon" href="${markURL}" type="image/svg+xml" sizes="any">
<meta property="og:title" content="temoto">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${siteURL}/">
<meta property="og:image" content="${imageURL}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="temoto">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="temoto">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageURL}">
${styles.map(url => `<link rel="stylesheet" href="${url}">`).join("\n")}
</head>
<body>
<div id="app" data-brand-mark-url="${markURL}">${renderToString(<Home brandMarkUrl={markURL} />)}</div>
${scripts.map(url => `<script type="module" src="${url}"></script>`).join("\n")}
</body>
</html>
`;
}

export async function buildSite(): Promise<void> {
  const staging = await mkdtemp(join(siteRoot, ".site-build-"));
  try {
    await cp(join(siteRoot, "public"), staging, { recursive: true });
    const result = await Bun.build({
      entrypoints: [join(siteRoot, "src/client.tsx")],
      outdir: staging,
      naming: "assets/[name]-[hash].[ext]",
      target: "browser",
      external: ["/brand/*"],
      minify: true,
      define: { "process.env.NODE_ENV": '"production"' },
    });
    if (!result.success) throw new AggregateError(result.logs, "Browser build failed");
    const paths = result.outputs.map(output => `/${relative(staging, output.path)}`);
    const scripts = paths.filter(path => path.endsWith(".js"));
    const styles = paths.filter(path => path.endsWith(".css"));
    await Bun.write(join(staging, "index.html"), renderDocument(scripts, styles));
    await rm(distRoot, { recursive: true, force: true });
    await rename(staging, distRoot);
    console.log(`Built ${relative(siteRoot, distRoot)}/index.html and browser assets.`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (import.meta.main) await buildSite();
