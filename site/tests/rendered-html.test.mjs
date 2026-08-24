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
  const htmlWithoutBreakHints = withoutBreakHints(html);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>temoto — Browser tools, close at hand\.<\/title>/);
  assert.match(htmlWithoutBreakHints, /Keep browser work/);
  assert.match(htmlWithoutBreakHints, /close at hand\./);
  assert.match(html, /<h1 id="temoto-title">/);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /0\.2\.0/);
  assert.match(html, /1\.1\.0/);
  assert.match(htmlWithoutBreakHints, /Test the page that is already open\./);
  assert.match(htmlWithoutBreakHints, /Make every proxy route visible\./);
  assert.match(htmlWithoutBreakHints, /Local-first, because browser work is still your work\./);
  assert.match(htmlWithoutBreakHints, /Two extensions\. Install only what you need\./);
  assert.match(htmlWithoutBreakHints, /Questions, answered plainly\./);
  assert.match(htmlWithoutBreakHints, /Add to Chrome/);
  assert.match(htmlWithoutBreakHints, /No temoto account/);
  assert.match(htmlWithoutBreakHints, /Session-only credentials/);
  assert.doesNotMatch(html, /temotoMark/);
  assert.match(html, /chromeMark/);
  assert.match(html, /proxyMark/);
  assert.doesNotMatch(html, /<svg[^>]+(?:chromeMark|proxyMark)/);
  assert.match(html, /chromeToolIcon/);
  assert.match(html, /M222,67\.34/);
  assert.match(html, /class="chromeFeedback" aria-hidden="true"/);
  assert.match(html, /Switch Origin/);
  assert.match(html, /Pick from the page/);
  assert.match(html, /Region, viewport, or full/);
  assert.match(html, /Control page playback/);
  assert.match(html, /Local, staging, or production/);
  assert.match(html, /Clear the current site/);
  assert.match(html, /Measure and copy CSS/);
  assert.doesNotMatch(html, /Environments/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  assert.doesNotMatch(htmlWithoutBreakHints, /[\u3040-\u30ff\u3400-\u9fff]/);
  assert.doesNotMatch(html, /chromeGlyph|fileMark-file|actionClipboard/);
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
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto/);
  assert.match(html, /class="skipLink" href="#content">Skip to content/);
  assert.match(html, /<main id="content">/);
  assert.match(html, /<nav class="topRail" aria-label="Primary">/);
  assert.match(html, /<section class="hero" id="top"/);
  assert.match(html, /<section class="section features" id="how"/);
  assert.match(html, /<section class="section installSection" id="install"/);
  assert.match(html, /Add temoto for Chrome/);
  assert.match(html, /Add temoto Proxy/);
});

test("OG画像は1200x630のPNGである", () => {
  const png = readFileSync(new URL("../public/og-temoto.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("ChromeとProxyの商品アイコンは同じ表示寸法を使う", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.productShowcaseMark \.chromeMark,\s*\.productShowcaseMark \.proxyMark \{ width: 54px; height: 54px; \}/);
  assert.match(css, /\.chromeMark \{ background: url\("\/product-chrome-icon\.png"\) center \/ contain no-repeat; \}/);
  assert.match(css, /\.proxyMark \{ background: url\("\/product-proxy-icon\.png"\) center \/ contain no-repeat; \}/);
});

test("Chromeの画面イメージは現行popupの骨格を保つ", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.chromePopup \{[^}]*aspect-ratio: 416 \/ 500;/);
  assert.match(css, /\.chromeGrid \{[^}]*grid-template-columns: repeat\(2,[^}]*grid-template-rows: repeat\(3,/);
  assert.match(css, /\.chromeCell \{[^}]*align-items: stretch;[^}]*text-align: left;/);
  assert.match(css, /\.chromeToolIcon \{ width: 28px; height: 28px;/);
  assert.match(css, /\.chromeFeedback \{[^}]*border-top:[^}]*flex: 0 0 60px;/);
  assert.doesNotMatch(css, /\.chromeGrid \{[^}]*grid-template-columns: repeat\(3,/);
});

test("Proxyの画面イメージは現行popupの骨格とプレビュー状態を使う", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(css, /\.proxyPopup \{[^}]*aspect-ratio: 416 \/ 500;[^}]*flex-direction: column;/);
  assert.match(css, /\.proxyPopupStatus \{[^}]*flex: 0 0 34%;/);
  assert.match(css, /\.proxyPopupProfile \{[^}]*grid-template-columns: 8px minmax\(0, 1fr\) auto;/);
  assert.match(source, /<span>Proxy active<\/span>/);
  assert.match(source, /<h3>Charles local<\/h3>/);
  assert.match(source, /<span>Profiles<\/span><small>3<\/small>/);
  assert.equal(source.match(/<div className="proxyPopupProfile(?: |")/g)?.length, 3);
  assert.doesNotMatch(source, /className="proxyWindow"/);
});

test("uses the long-form LP sequence with temoto's linear design", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<nav className="topRail" aria-label="Primary">/);
  assert.match(source, /<section className="hero" id="top" aria-labelledby="temoto-title">/);
  assert.match(source, /<section className="showcaseSection" aria-label="temoto in the browser">/);
  assert.match(source, /<section className="section features" id="how" aria-label="How temoto works">/);
  assert.equal(source.match(/index: "(?:i|ii|iii|iv)\./g)?.length, 4);
  assert.match(source, /<section className="section privacy"/);
  assert.match(source, /<section className="section installSection" id="install"/);
  assert.match(source, /<section className="section faq"/);
  assert.match(source, /<section className="finalCta"/);
  assert.match(css, /\.topRail \{[^}]*border: 1px solid/);
  assert.match(css, /\.page \.button \{[^}]*border-radius: 0;/);
  assert.match(css, /\.showcaseFrame \{[^}]*grid-template-columns: repeat\(2,/);
  assert.doesNotMatch(source, /JapaneseText/);
});

test("places both real product previews in the shared showcase and feature rows", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(source.match(/<div className="showcaseProduct">/g)?.length, 2);
  assert.match(source, /<ChromePreview compact \/>/);
  assert.match(source, /<ProxyPreview compact \/>/);
  assert.match(source, /feature\.product === "chrome" \? <ChromePreview compact \/> : <ProxyPreview compact \/>/);
  assert.match(css, /\.showcaseFrame \{[^}]*grid-template-columns: repeat\(2,/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*\.showcaseFrame \{ width: 100%; min-height: 0; grid-template-columns: 1fr; transform: none; \}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*\.showcaseProduct \{ min-height: 382px;/);
  assert.doesNotMatch(source, /macos|MacAppIcon|ShelfPreview/);
});

test("商品アイコンは各Chrome拡張の正規128px素材を使う", () => {
  const siteChromeIcon = readFileSync(new URL("../public/product-chrome-icon.png", import.meta.url));
  const extensionChromeIcon = readFileSync(
    new URL("../../browser/temoto-chrome/public/icons/icon-128.png", import.meta.url),
  );
  const siteProxyIcon = readFileSync(new URL("../public/product-proxy-icon.png", import.meta.url));

  assert.deepEqual(siteChromeIcon, extensionChromeIcon);
  assert.deepEqual(siteProxyIcon, createTemotoIcon(128));
});

test("OG画像のソースも2製品の正規素材を参照する", () => {
  const source = readFileSync(new URL("../scripts/og.html", import.meta.url), "utf8");
  assert.match(source, /\.\.\/public\/product-chrome-icon\.png/);
  assert.match(source, /\.\.\/public\/product-proxy-icon\.png/);
  assert.match(source, /Keep browser work/);
  assert.match(source, /close at hand\./);
  assert.doesNotMatch(source, /macOS|THREE TOOLS/);
  assert.doesNotMatch(source, /[\u3040-\u30ff\u3400-\u9fff]/);
});
