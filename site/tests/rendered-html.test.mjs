import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.match(text, /Test the page\./);
  assert.match(text, /Switch the route\./);
  assert.match(text, /Choose your temoto/);
  assert.match(text, /Check the page that is already open\./);
  assert.match(text, /Know what the browser is routed through\./);
  assert.match(text, /You choose when temoto touches the page\./);
  assert.match(text, /Two extensions\. Install only what you need\./);
  assert.match(text, /Keep the next check small\./);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /0\.2\.0/);
  assert.match(html, /1\.1\.0/);
  assert.doesNotMatch(text, /[\u3040-\u30ff\u3400-\u9fff]/);
  assert.doesNotMatch(html, /Context by temoto|temoto for macOS|ShelfDrop|DMG|Option \+ Tab|href="\/context(?:[#?"])/);
});

test("includes public metadata and primary links", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:image" content="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/og-temoto\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/product-chrome-icon\.png" type="image\/png"/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-chrome/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-proxy/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-for-chrome\/gcncgknjklghkoeiapcbdghodepnllid/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-proxy\/hohabmdadcdkifcmbclkgnomhhlllnbb/);
  assert.match(html, /class="skipLink" href="#content">Skip to content/);
  assert.match(html, /<nav class="topRail" aria-label="Primary">/);
  assert.match(html, /<section class="hero" id="top"/);
  assert.match(html, /<section class="productIndex" id="products"/);
  assert.match(html, /<section class="productChapter chromeChapter" id="chrome"/);
  assert.match(html, /<section class="productChapter proxyChapter" id="proxy"/);
  assert.match(html, /<section class="section installSection" id="install"/);
});

test("uses canonical static product screenshots and no video", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /src="\/product-chrome-launcher\.jpg"/);
  assert.match(source, /src="\/product-proxy-popup\.jpg"/);
  assert.match(source, /src="\/product-proxy-manager\.png"/);
  assert.equal(source.match(/<Image\b/g)?.length, 3);
  assert.doesNotMatch(source, /<video\b|<source\b|ChromePreview|ProxyPreview|chromeToolIcon|CSSProperties/);

  const pairs = [
    ["../public/product-chrome-launcher.jpg", "../../browser/temoto-chrome/store/assets/screenshot-launcher-1280x800.jpg"],
    ["../public/product-proxy-popup.jpg", "../../browser/temoto-proxy/store/assets/screenshot-popup-1280x800.jpg"],
    ["../public/product-proxy-manager.png", "../../browser/temoto-proxy/store/assets/screenshot-manager-1280x800.png"],
  ];
  for (const [siteAsset, productAsset] of pairs) {
    assert.deepEqual(readFileSync(new URL(siteAsset, import.meta.url)), readFileSync(new URL(productAsset, import.meta.url)));
  }
});

test("keeps the product chapters responsive without horizontal overflow rules", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.productIndexGrid \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.chapterIntro \{[\s\S]*grid-template-columns: minmax\(0, 1\.2fr\) minmax\(300px, \.8fr\);/);
  assert.match(css, /\.productShot img \{[^}]*width: 100%;[^}]*height: auto;[^}]*display: block;/);
  assert.match(css, /@media \(max-width: 900px\) \{[\s\S]*\.proxyGallery \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*\.hero > \.heroActions \{ grid-template-columns: 1fr; \}/);
});

test("product icons are synced from each Chrome extension", () => {
  const siteChromeIcon = readFileSync(new URL("../public/product-chrome-icon.png", import.meta.url));
  const extensionChromeIcon = readFileSync(new URL("../../browser/temoto-chrome/public/icons/icon-128.png", import.meta.url));
  const siteProxyIcon = readFileSync(new URL("../public/product-proxy-icon.png", import.meta.url));

  assert.deepEqual(siteChromeIcon, extensionChromeIcon);
  assert.deepEqual(siteProxyIcon, createTemotoIcon(128));
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
