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

test("temotoのブランドハブをサーバーレンダリングする", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const htmlWithoutBreakHints = withoutBreakHints(html);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>temoto — Chromeの作業を、手元で整える。<\/title>/);
  assert.match(html, /<wbr\s*\/?/);
  assert.match(htmlWithoutBreakHints, /ページを試す6つの道具と、開発用プロキシ。役割を分けた2つの拡張です。/);
  assert.match(htmlWithoutBreakHints, /Chromeの作業を、手元で整える。/);
  assert.match(html, /<h1 id="products-title">/);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /0\.2\.0/);
  assert.match(html, /1\.1\.0/);
  assert.match(htmlWithoutBreakHints, /Chrome Web Storeで公開中です/);
  assert.match(htmlWithoutBreakHints, /Chromeに追加/);
  assert.doesNotMatch(htmlWithoutBreakHints, /審査中/);
  assert.match(htmlWithoutBreakHints, /実際の速度をバッジに表示します/);
  assert.match(htmlWithoutBreakHints, /接続先を、見えるプロファイルに。/);
  assert.match(htmlWithoutBreakHints, /temoto for Chromeには有効状態だけを共有し、詳細操作はProxy側で行います/);
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
  assert.doesNotMatch(html, /KEEP IT CLOSE/);
  assert.doesNotMatch(html, /Keep it close/);
  assert.doesNotMatch(html, /chromeGlyph|fileMark-file|actionClipboard/);
  assert.doesNotMatch(html, /Context by temoto|temoto for macOS|ShelfDrop|DMG|Option \+ Tab|href="\/context(?:[#?"])/);
});

test("公開用メタデータと主要リンクを含む", async () => {
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
  assert.match(html, /class="skipLink" href="#content"/);
  assert.match(html, /<main id="content">/);
  assert.match(html, /<div id="top"><\/div>/);
  assert.doesNotMatch(html, /class="siteHeader"|class="navLinks"|class="navGitHub"/);
  assert.doesNotMatch(html, /class="mobileProductNav"/);
  assert.match(html, /Chrome版をインストール/);
  assert.match(html, /Proxy版をインストール/);
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

test("ページは2製品の共通ショーケースから始まる", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /function HubScene|<HubScene \/>/);
  assert.doesNotMatch(css, /\.hubScene|\.hubPane/);
  assert.doesNotMatch(source, /signalStrip|MACOS SHELF|CHROME TOOLS|PROXY PROFILES/);
  assert.doesNotMatch(css, /\.signalStrip|\.signalInner/);
  assert.doesNotMatch(css, /font-zen-old-mincho/);
  assert.doesNotMatch(layout, /Zen_Old_Mincho/);
  assert.doesNotMatch(source, /<section className="hero"/);
  assert.doesNotMatch(css, /\.hero\s*\{|\.heroInner|\.heroTitleLine|\.heroActions/);
  assert.match(source, /<section className="productOverview" id="products" aria-labelledby="products-title">/);
  assert.match(source, /<h1 id="products-title"><JapaneseText>Chromeの作業を、手元で整える。<\/JapaneseText><\/h1>/);
  assert.doesNotMatch(source, /CHOOSE A TOOL/);
});

test("2製品は実画面を使う共通ショーケースで配置する", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(source.match(/<ProductShowcaseCard\b/g)?.length, 2);
  assert.match(source, /visual=\{<ChromePreview compact \/>\}/);
  assert.match(source, /visual=\{<ProxyPreview compact \/>\}/);
  assert.match(css, /\.productShowcase \{[^}]*grid-template-columns: repeat\(2,/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.productShowcase \{ grid-template-columns: 1fr; \}/);
  assert.doesNotMatch(source, /macos|MacAppIcon|ShelfPreview/);
  assert.doesNotMatch(css, /isMacos|macAppIcon|shelfScene/);
  assert.doesNotMatch(css, /\.productPick|\.productCard|\.productVisual/);
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
  assert.doesNotMatch(source, /macOS|THREE TOOLS/);
});
