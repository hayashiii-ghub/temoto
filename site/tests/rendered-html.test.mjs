import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createTemotoIcon } from "../../browser/temoto-proxy/scripts/icon-utils.mjs";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /<title>temoto — 作業の途中を、手元に。<\/title>/);
  assert.match(html, /<wbr\s*\/?/);
  assert.match(htmlWithoutBreakHints, /作業の途中を、手元に。/);
  assert.match(htmlWithoutBreakHints, /使う場所に合わせた、3つのtemoto。/);
  assert.match(html, /temoto for macOS/);
  assert.equal(html.match(/class="macAppIcon" aria-hidden="true"/g)?.length, 2);
  assert.match(html, /class="transferAppIcon"/);
  assert.doesNotMatch(html, /transferShelf/);
  assert.match(html, /class="menuBarIcon" aria-hidden="true"/);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /v1\.1\.4/);
  assert.match(html, /0\.1\.7/);
  assert.match(html, /Option \+ Tab/);
  assert.match(html, /Option \+ Shift \+ Tab/);
  assert.match(htmlWithoutBreakHints, /好きな場所へ取り出す/);
  assert.match(htmlWithoutBreakHints, /画面の上か、メニューバーか。/);
  assert.match(htmlWithoutBreakHints, /DMGからインストール/);
  assert.match(htmlWithoutBreakHints, /一行で導入・更新/);
  assert.match(htmlWithoutBreakHints, /クリップボードを自動で監視することはありません/);
  assert.match(htmlWithoutBreakHints, /Chrome Web Storeへ提出済みで、現在審査中です/);
  assert.match(htmlWithoutBreakHints, /ストアで審査中/);
  assert.match(htmlWithoutBreakHints, /接続先を、見えるプロファイルに。/);
  assert.match(htmlWithoutBreakHints, /認証パスワードはブラウザのセッション中だけ保持します/);
  assert.doesNotMatch(html, /temotoMark/);
  assert.match(html, /chromeMark/);
  assert.match(html, /proxyMark/);
  assert.doesNotMatch(html, /<svg[^>]+(?:chromeMark|proxyMark)/);
  assert.match(html, /chromeToolIcon/);
  assert.match(html, /M222,67\.34/);
  assert.match(html, /shelfIcon/);
  assert.match(html, /M52\.44,36/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  assert.doesNotMatch(html, /KEEP IT CLOSE/);
  assert.doesNotMatch(html, /Keep it close/);
  assert.doesNotMatch(html, /chromeGlyph|fileMark-file|actionClipboard/);
  assert.doesNotMatch(html, /ShelfDrop|v1\.0\.0|ALWAYS ON TOP|FLOATING SHELF FOR MACOS/);
});

test("公開用メタデータと主要リンクを含む", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:image" content="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/og-temoto\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/temoto\.haygsiiii\.chatgpt\.site\/favicon\.png" type="image\/png"/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/releases\/latest\/download\/temoto-macos\.dmg/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-chrome/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/tree\/main\/browser\/temoto-proxy/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto/);
  assert.match(html, /class="navGitHub"[^>]*aria-label="GitHub"/);
  assert.match(html, /class="skipLink" href="#content"/);
  assert.match(html, /<header class="siteHeader" id="top">/);
  assert.match(html, /<main id="content">/);
  assert.match(html, /class="mobileProductNav"/);
  assert.match(html, /Chrome版のソースを見る（審査中）/);
  assert.match(html, /Proxy版のソースを見る（審査中）/);
  assert.match(html, /blob\/main\/script\/install_latest\.sh/);
});

test("faviconは完成済みのmacOSアプリアイコンを使う", () => {
  const favicon = readFileSync(new URL("../public/favicon.png", import.meta.url));
  const appIcon = readFileSync(new URL("../../Assets/ShelfDrop.png", import.meta.url));
  assert.deepEqual(favicon, appIcon);
});

test("メニューバー表示は完成済みのテンプレートアイコンを使う", () => {
  const siteIcon = readFileSync(new URL("../public/menu-bar-template.svg", import.meta.url));
  const appIcon = readFileSync(new URL("../../Assets/MenuBarTemplate.svg", import.meta.url));
  assert.deepEqual(siteIcon, appIcon);
});

test("OG画像は1200x630のPNGである", () => {
  const png = readFileSync(new URL("../public/og-temoto.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("ChromeとProxyの商品アイコンは同じ表示寸法を使う", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.productVisual \.chromeMark,\s*\.productVisual \.proxyMark \{ width: 98px; height: 98px; \}/);
  assert.match(css, /\.chromeMark \{ background: url\("\/product-chrome-icon\.png"\) center \/ contain no-repeat; \}/);
  assert.match(css, /\.proxyMark \{ background: url\("\/product-proxy-icon\.png"\) center \/ contain no-repeat; \}/);
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

test("OG画像のソースも3製品の正規素材を参照する", () => {
  const source = readFileSync(new URL("../scripts/og.html", import.meta.url), "utf8");
  assert.match(source, /\.\.\/public\/favicon\.png/);
  assert.match(source, /\.\.\/public\/product-chrome-icon\.png/);
  assert.match(source, /\.\.\/public\/product-proxy-icon\.png/);
});

test("ページ上部ではモバイルナビのトップ項目を優先する", () => {
  const source = readFileSync(new URL("../app/ProductNavigation.tsx", import.meta.url), "utf8");
  assert.match(source, /window\.scrollY < \(topSection\?\.offsetHeight \?\? 1\)/);
  assert.match(source, /if \(isAtPageTop\(\)\) \{\s*setActiveId\("top"\);\s*return;/);
  assert.match(source, /window\.addEventListener\("scroll", syncTopState, \{ passive: true \}\)/);
});
