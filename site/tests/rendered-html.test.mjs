import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { createTemotoIcon } from "../../browser/temoto-proxy/scripts/icon-utils.mjs";

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

function withoutBreakHints(html) {
  return html
    .replace(/<wbr\s*\/?\s*>/g, "")
    .replace(/<\/?span\b[^>]*>/g, "");
}

test("renders the English temoto landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const text = withoutBreakHints(html);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>temoto — Browser tools, close at hand\.<\/title>/);
  assert.match(text, /Browser tools\./);
  assert.match(text, /Close at hand\./);
  assert.match(text, /Check the page you(?:&#x27;|')re on\./);
  assert.match(text, /Four tools, one launcher\./);
  assert.match(text, /Choose a route\./);
  assert.match(text, /Know what(?:&#x27;|')s active\./);
  assert.match(text, /Permissions, plainly\./);
  assert.match(text, /Install only what you need\./);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /v1 · Chrome 116\+/);
  assert.match(html, /v1\.1 · Chrome 116\+/);
  assert.doesNotMatch(text, /[\u3040-\u30ff\u3400-\u9fff]/);
  assert.doesNotMatch(html, /Context by temoto|temoto for macOS|ShelfDrop|DMG|Option \+ Tab|href="\/context(?:[#?"])/);
});

test("includes public metadata and primary links", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:image" content="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/og-temoto\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/temoto-mark\.svg" type="image\/svg\+xml"/);
  assert.equal((html.match(/class="brandMark"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /not yet in the Store version|New (?:launcher|Proxy) preview/);
  assert.doesNotMatch(html, /\/_vinext\/image/);
  assert.match(html, /The Chrome launcher\./);
  assert.match(html, /The active profile, at a glance\./);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-chrome/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-proxy/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-for-chrome\/gcncgknjklghkoeiapcbdghodepnllid/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-proxy\/hohabmdadcdkifcmbclkgnomhhlllnbb/);
  assert.match(html, /class="skipLink" href="#content">Skip to content/);
  assert.match(html, /<nav class="topRail wrap" aria-label="Primary">/);
  assert.match(html, /<section class="hero" id="top"/);
  assert.match(html, /<section class="productIndex" id="products"/);
  assert.match(html, /<section class="productChapter chromeChapter" id="chrome"/);
  assert.match(html, /<section class="productChapter proxyChapter" id="proxy"/);
  assert.match(html, /<section class="section installSection" id="install"/);
});

test("uses site-specific UI captures and retains canonical store assets", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const name of ["chrome-launcher", "proxy-popup"]) {
    const image = readFileSync(new URL(`../public/showcase/${name}.png`, import.meta.url));
    const revision = createHash("sha256").update(image).digest("hex").slice(0, 12);
    assert.ok(source.includes(`src="/showcase/${name}.png?v=${revision}"`), `${name} URL must follow its image content`);
  }
  assert.doesNotMatch(source, /proxy-manager|manager-shot/);
  assert.equal(source.match(/<Image\b/g)?.length, 2);
  assert.doesNotMatch(source, /<video\b|ChromePreview|ProxyPreview|chromeToolIcon|CSSProperties/);
  assert.match(source, /className="proxyGallery">[\s\S]*?<figure[\s\S]*?<\/figure>\s*<ProxyRouteDemo \/>/);

  const pairs = [
    ["../public/product-chrome-launcher.jpg", "../../browser/temoto-chrome/store/assets/screenshot-launcher-1280x800.jpg"],
    ["../public/product-proxy-popup.jpg", "../../browser/temoto-proxy/store/assets/screenshot-popup-1280x800.jpg"],
    ["../public/product-proxy-manager.png", "../../browser/temoto-proxy/store/assets/screenshot-manager-1280x800.png"],
  ];
  for (const [siteAsset, productAsset] of pairs) {
    assert.deepEqual(readFileSync(new URL(siteAsset, import.meta.url)), readFileSync(new URL(productAsset, import.meta.url)));
  }
  assert.deepEqual(readdirSync(new URL("../public/showcase/", import.meta.url)).sort(), ["chrome-launcher.png", "proxy-popup.png"]);
  for (const [name, width, height] of [["chrome-launcher", 416, 500], ["proxy-popup", 416, 500]]) {
    const png = readFileSync(new URL(`../public/showcase/${name}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
});

test("keeps the product chapters responsive without horizontal overflow rules", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.productIndex \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.demo-selector \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.productShot img \{[^}]*width: 100%;[^}]*height: auto;[^}]*display: block;/);
  assert.match(css, /@media \(max-width: 767px\) \{[\s\S]*\.proxyGallery \{ grid-template-columns: 1fr;/);
  assert.match(css, /\.demo-selector \{ grid-template-columns: 1fr;/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /overflow-x:\s*(hidden|clip)/);
});

test("server HTML exposes four tools and computed CSS with privacy boundaries without JavaScript", async () => {
  const html = await (await render()).text();
  const featureList = /<dl class="feature-list">([\s\S]*?)<\/dl>/.exec(html)?.[1] || "";
  for (const feature of ["Color Picker", "Screenshot", "CSS", "Video Speed"]) assert.ok(featureList.includes(feature));
  assert.equal((featureList.match(/<dt>/g) ?? []).length, 4);
  assert.match(html, /latest eight colors/);
  assert.match(html, /Fit or 100%/);
  assert.match(featureList, /Capture the visible area or the full page/);
  assert.doesNotMatch(html, /selected region|Capture a region|Force reveal|Capture options/i);
  assert.match(html, /Copy grouped CSS or a unique selector/);
  assert.match(html, /0\.25× to 5×/);
  assert.doesNotMatch(html, /Switch Origin|Site Reset|Six tools|Six page tools|side panel/);
  assert.match(html, /<noscript>[\s\S]*data-scene="capture"[\s\S]*data-scene="inspect"/);
  assert.match(html, /Illustrative demo/);
  assert.match(html, /temoto override cleared/);
  assert.match(html, /Demo result: connection OK/);
  assert.match(html, /browser\/temoto-chrome\/PRIVACY.md/);
  assert.match(html, /browser\/temoto-proxy\/PRIVACY.md/);
  assert.equal((html.match(/<details\b/g) ?? []).length, 8);
  assert.match(html, /padding: 24px/);
  assert.match(html, /font-size: 16px/);
  assert.match(html, /Copy grouped CSS/);
  assert.doesNotMatch(html, /<button[^>]*aria-label="(?:Pause|Replay|Play demo)/);
});

test("product icons are synced from each Chrome extension", () => {
  const siteChromeIcon = readFileSync(new URL("../public/product-chrome-icon.png", import.meta.url));
  const extensionChromeIcon = readFileSync(new URL("../../browser/temoto-chrome/public/icons/icon-128.png", import.meta.url));
  const siteProxyIcon = readFileSync(new URL("../public/product-proxy-icon.png", import.meta.url));

  assert.deepEqual(siteChromeIcon, extensionChromeIcon);
  assert.deepEqual(siteProxyIcon, createTemotoIcon(128));
});

test("site Proxy mark uses an outline of the same Joint geometry", () => {
  const solid = readFileSync(new URL("../public/temoto-mark.svg", import.meta.url), "utf8");
  const outline = readFileSync(new URL("../public/temoto-proxy-mark.svg", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(outline, /fill="none" stroke="currentColor"/);
  assert.deepEqual([...outline.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]), [...solid.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]));
  assert.match(css, /\.chromeMark \{ background-image: url\('\/temoto-mark.svg'\); \}/);
  assert.match(css, /\.proxyMark \{ background-image: url\('\/temoto-proxy-mark.svg'\); \}/);
});

test("OG image remains 1200x630 and references both product icons", () => {
  const png = readFileSync(new URL("../public/og-temoto.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);

  const source = readFileSync(new URL("../scripts/og.html", import.meta.url), "utf8");
  assert.match(source, /\.\.\/public\/product-chrome-icon\.png/);
  assert.match(source, /\.\.\/public\/product-proxy-icon\.png/);
  assert.doesNotMatch(source, /macOS|THREE TOOLS/);
});
