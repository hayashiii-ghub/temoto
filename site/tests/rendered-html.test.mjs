import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storeUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost/"), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

function textContent(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag, name) {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? "";
}

function pngSize(file) {
  const png = readFileSync(file);
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "file must contain PNG bytes");
  return { png, width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("renders the selected English landing-page message without JavaScript", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const text = textContent(html);
  assert.match(html, /<html lang="en">/);
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "";
  assert.equal(textContent(heading), "Less friction. More doing.");
  assert.match(text, /A small toolkit for Chrome/);
  assert.match(text, /Free · Open source · No account/);
  assert.match(text, /Color, capture, CSS, video, proxy\. All close at hand\./);
  assert.doesNotMatch(text, /[\u3040-\u30ff\u3400-\u9fff]/);
  assert.doesNotMatch(text, /Switch Origin|Site Reset|selected.region capture|authenticated proxy profiles|domain routing|connection diagnostics|built.in VPN|temoto for macOS|ShelfDrop/i);
});

test("keeps public metadata, one Store action and the upcoming-release notice", async () => {
  const html = await (await render()).text();
  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "";
  assert.match(title, /temoto/i);
  assert.match(html, /name="description" content="[^"]+"/);
  assert.match(html, /property="og:image" content="https:\/\/temoto\.hayashiii-gpt\.chatgpt\.site\/og-temoto\.png\?v=7707304e185e"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/temoto\.hayashiii-gpt\.chatgpt\.site\/temoto-mark\.svg" type="image\/svg\+xml"/);
  assert.match(html, /<img\b[^>]*src="\/temoto-mark\.svg"/);

  const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  const storeLinks = links.filter(link => attribute(link, "href").startsWith("https://chromewebstore.google.com/"));
  assert.equal(storeLinks.length, 1, "the page should have one Chrome Store action");
  assert.equal(attribute(storeLinks[0], "href"), storeUrl);
  assert.equal(textContent(storeLinks[0]), "Add to Chrome");
  assert.doesNotMatch(html, /chromewebstore\.google\.com\/detail\/temoto-proxy/);

  const footer = /<footer\b[^>]*>([\s\S]*?)<\/footer>/.exec(html)?.[1] ?? "";
  assert.match(footer, /href="https:\/\/github\.com\/hayashiii-ghub\/temoto"[^>]*>GitHub<\/a>/);
  assert.match(footer, /href="https:\/\/github\.com\/hayashiii-ghub\/temoto\/blob\/main\/browser\/temoto-chrome\/PRIVACY\.md"[^>]*>Privacy<\/a>/);
  assert.match(textContent(footer), /This is a preview of the next temoto update\. The Store link opens the current release\./);
});

test("keeps public response headers below the hosting gateway limit", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const headerBytes = Buffer.byteLength(
    [...response.headers].map(([name, value]) => `${name}: ${value}\r\n`).join(""),
  );
  assert.ok(headerBytes < 32 * 1024, `Unexpected ${headerBytes}-byte header block`);
});

test("renders the five launcher tools and sample playback rate without JavaScript", async () => {
  const html = await (await render()).text();
  const tools = ["Color Picker", "Screenshot", "CSS", "Video Speed", "Proxy"];
  const lists = [...html.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => match[2]);
  const launcher = lists.find(list => tools.every(tool => textContent(list).includes(tool)));
  assert.ok(launcher, "the launcher must expose all five tool names in server HTML");
  const rows = [...launcher.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => textContent(match[1]));
  assert.equal(rows.length, 5);
  for (const tool of tools) assert.ok(rows.some(row => row.includes(tool)), `${tool} must have a launcher row`);
  assert.match(rows.find(row => row.includes("Video Speed")), /1\.5×/);
});

test("keeps rendered assets, font licenses and OG source dependencies available", async () => {
  const html = await (await render()).text();
  const dependencies = new Set();
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const source = attribute(match[0], "src");
    if (source.startsWith("/")) dependencies.add(new URL(`../public${source}`, import.meta.url).href);
  }
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
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
