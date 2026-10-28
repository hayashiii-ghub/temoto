import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "bun:test";

const storeUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";

function render() {
  return readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
}

function textContent(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag: string, name: string) {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? "";
}

function pngSize(file: URL) {
  const png = readFileSync(file);
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "file must contain PNG bytes");
  return { png, width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("renders the selected English landing-page message without JavaScript", async () => {
  const html = render();
  const text = textContent(html);
  assert.match(html, /<html lang="en">/);
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "";
  assert.equal(textContent(heading), "Less friction. More doing.");
  assert.doesNotMatch(html, /A small toolkit/);
  assert.match(text, /Free · Open source · No account/);
  assert.match(text, /Color, capture, CSS, video, proxy\. All close at hand\./);
  assert.doesNotMatch(text, /[\u3040-\u30ff\u3400-\u9fff]/);
  assert.doesNotMatch(text, /Switch Origin|Site Reset|selected.region capture|authenticated proxy profiles|domain routing|connection diagnostics|built.in VPN|temoto for macOS|ShelfDrop/i);
});

test("keeps public metadata, one Store action and footer resources", async () => {
  const html = render();
  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "";
  assert.match(title, /temoto/i);
  assert.match(html, /name="description" content="[^"]+"/);
  const ogHash = createHash("sha256").update(readFileSync(new URL("../public/og-temoto.png", import.meta.url))).digest("hex").slice(0, 12);
  assert.ok(html.includes(`property="og:image" content="https://temoto.shigoto.dev/og-temoto.png?v=${ogHash}"`));
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="\/temoto-mark\.svg" type="image\/svg\+xml"/);
  assert.match(html, /<img\b[^>]*src="\/temoto-mark\.svg"/);

  const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  const storeLinks = links.filter(link => attribute(link, "href").startsWith("https://chromewebstore.google.com/"));
  assert.equal(storeLinks.length, 1, "the page should have one Chrome Store action");
  assert.equal(attribute(storeLinks[0], "href"), storeUrl);
  assert.equal(textContent(storeLinks[0]), "Add to Chrome");
  assert.equal(attribute(storeLinks[0], "aria-describedby"), "");
  assert.doesNotMatch(html, /chromewebstore\.google\.com\/detail\/temoto-proxy/);

  const footer = /<footer\b[^>]*>([\s\S]*?)<\/footer>/.exec(html)?.[1] ?? "";
  assert.match(footer, /href="https:\/\/github\.com\/hayashiii-ghub\/temoto"[^>]*>GitHub<\/a>/);
  assert.match(footer, /href="https:\/\/github\.com\/hayashiii-ghub\/temoto\/blob\/main\/browser\/temoto-chrome\/PRIVACY\.md"[^>]*>Privacy<\/a>/);
  assert.equal(textContent(footer), "temoto GitHub Privacy");
});

test("ships browser bundles and font assets without a server runtime", () => {
  const html = render();
  const assetURLs = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\/assets\/[^"\n]+)"/g)].map(match => match[1]);
  assert.ok(assetURLs.some(url => url.endsWith(".js")), "hydration bundle must be linked");
  assert.ok(assetURLs.some(url => url.endsWith(".css")), "page styles must be linked");
  for (const url of assetURLs) {
    const asset = readFileSync(new URL(`../dist${url}`, import.meta.url), "utf8");
    assert.ok(asset.length > 0, `${url} must be available`);
    if (url.endsWith(".css")) {
      for (const match of asset.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)) {
        assert.ok(readFileSync(new URL(`../dist${match[1]}`, import.meta.url)).length > 0, `${match[1]} must be deployed`);
      }
    }
  }
  assert.match(html, /rel="canonical" href="https:\/\/temoto\.shigoto\.dev\/"/);
  assert.doesNotMatch(html, /_vinext|_next|chatgpt\.site|server\/index/);
});

test("renders the five launcher tools and sample playback rate without JavaScript", async () => {
  const html = render();
  const tools = ["Color Picker", "Screenshot", "CSS", "Video Speed", "Proxy"];
  const lists = [...html.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => match[2]);
  const launcher = lists.find(list => tools.every(tool => textContent(list).includes(tool)));
  assert.ok(launcher, "the launcher must expose all five tool names in server HTML");
  const rows = [...launcher.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => textContent(match[1]));
  assert.equal(rows.length, 5);
  for (const tool of tools) assert.ok(rows.some(row => row.includes(tool)), `${tool} must have a launcher row`);
  assert.match(rows.find(row => row.includes("Video Speed")) ?? "", /1\.5×/);
});

test("keeps rendered assets, font licenses and OG source dependencies available", async () => {
  const html = render();
  const dependencies = new Set<string>();
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const source = attribute(match[0], "src");
    if (source.startsWith("/")) dependencies.add(new URL(`../public${source}`, import.meta.url).href);
  }
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  for (const match of css.matchAll(/url\("(\/[^"\n]+)"\)/g)) {
    dependencies.add(new URL(`../public${match[1]}`, import.meta.url).href);
  }
  const ogSource = new URL("../scripts/og.html", import.meta.url);
  const og = readFileSync(ogSource, "utf8");
  for (const match of og.matchAll(/(?:src="|url\(")(\.\.\/public\/[^"\n]+)"/g)) {
    dependencies.add(new URL(match[1], ogSource).href);
  }
  assert.ok(dependencies.size > 0, "the page and OG source must declare local assets");
  for (const dependency of dependencies) {
    assert.ok(readFileSync(new URL(dependency)).length > 0, `${dependency} must be available`);
  }
  for (const license of ["brand/Geist-LICENSE.txt", "brand/Inter-OFL.txt", "tools/PHOSPHOR-LICENSE"]) {
    assert.ok(readFileSync(new URL(`../public/${license}`, import.meta.url)).length > 0, `${license} must be retained`);
  }
});

test("keeps the share image as a 1200x630 PNG", () => {
  const { width, height } = pngSize(new URL("../public/og-temoto.png", import.meta.url));
  assert.equal(width, 1200);
  assert.equal(height, 630);
});
