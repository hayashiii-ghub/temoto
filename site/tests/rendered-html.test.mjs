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
  assert.match(html, /0\.1\.9/);
  assert.match(html, /1\.0\.1/);
  assert.match(html, /Option \+ Tab/);
  assert.match(html, /Option \+ Shift \+ Tab/);
  assert.match(htmlWithoutBreakHints, /好きな場所へ取り出す/);
  assert.match(htmlWithoutBreakHints, /画面の上か、メニューバーか。/);
  assert.match(htmlWithoutBreakHints, /DMGからインストール/);
  assert.match(htmlWithoutBreakHints, /一行で導入・更新/);
  assert.match(htmlWithoutBreakHints, /クリップボードを自動で監視することはありません/);
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
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-for-chrome\/gcncgknjklghkoeiapcbdghodepnllid/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/temoto-proxy\/hohabmdadcdkifcmbclkgnomhhlllnbb/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto/);
  assert.match(html, /class="navGitHub"[^>]*aria-label="GitHub"/);
  assert.match(html, /class="skipLink" href="#content"/);
  assert.match(html, /<header class="siteHeader" id="top">/);
  assert.match(html, /<main id="content">/);
  assert.doesNotMatch(html, /class="mobileProductNav"/);
  assert.match(html, /class="navLinks"[^>]*aria-label="製品ナビゲーション"/);
  assert.match(html, /Chrome版をインストール/);
  assert.match(html, /Proxy版をインストール/);
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
  assert.match(css, /\.productShowcaseMark \.macAppIcon,\s*\.productShowcaseMark \.chromeMark,\s*\.productShowcaseMark \.proxyMark \{ width: 54px; height: 54px; \}/);
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

test("Heroはコピーと製品導線だけに絞る", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const hero = source.match(/<section className="hero"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(source, /function HubScene|<HubScene \/>/);
  assert.doesNotMatch(css, /\.hubScene|\.hubPane/);
  assert.doesNotMatch(source, /signalStrip|MACOS SHELF|CHROME TOOLS|PROXY PROFILES/);
  assert.doesNotMatch(css, /\.signalStrip|\.signalInner/);
  assert.match(css, /\.heroInner \{[^}]*grid-template-columns: minmax\(0, 860px\);[^}]*text-align: center;/);
  assert.doesNotMatch(css, /font-zen-old-mincho/);
  assert.doesNotMatch(layout, /Zen_Old_Mincho/);
  assert.doesNotMatch(hero, /TEMOTO \/ THREE TOOLS/);
  assert.equal(hero.match(/className="heroTitleLine"/g)?.length, 2);
  assert.equal(hero.match(/<a\b/g)?.length, 3);
  assert.match(hero, /href="#macos">macOS を見る/);
  assert.match(hero, /href="#chrome">Chrome を見る/);
  assert.match(hero, /href="#proxy">Proxy を見る/);
  assert.match(css, /\.hero \.heroActions \{ width: 100%; margin-top: 38px; display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 12px; \}/);
  assert.match(css, /\.hero \.heroActions \.button:first-child \{ grid-column: 1 \/ -1; \}/);
});

test("3製品は実画面を使う共通ショーケースで配置する", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(source.match(/<ProductShowcaseCard\b/g)?.length, 3);
  assert.match(source, /visual=\{<ShelfPreview compact \/>\}/);
  assert.match(source, /visual=\{<ChromePreview compact \/>\}/);
  assert.match(source, /visual=\{<ProxyPreview compact \/>\}/);
  assert.match(source, /product === "macos" \? <JapaneseText>\{detail\}<\/JapaneseText> : detail/);
  assert.match(css, /\.productShowcase \{[^}]*grid-template-columns: repeat\(2,/);
  assert.match(css, /\.productShowcaseCard\.isFeatured \{[^}]*grid-column: 1 \/ -1;[^}]*grid-template-columns:/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.productShowcase \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.productShowcaseCard\.isMacos \.productShowcaseVisual \{ width: min\(430px, 100%\);/);
  assert.match(css, /\.productShowcaseCard\.isMacos \.shelfScene\.isCompact \{ width: 100%; height: auto; min-height: 0; aspect-ratio: 1;/);
  assert.match(css, /\.productShowcaseCard\.isMacos \.shelfScene\.isCompact \.appShelf \{ width: min\(430px, 88%\); max-width: none; \}/);
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

test("OG画像のソースも3製品の正規素材を参照する", () => {
  const source = readFileSync(new URL("../scripts/og.html", import.meta.url), "utf8");
  assert.match(source, /\.\.\/public\/favicon\.png/);
  assert.match(source, /\.\.\/public\/product-chrome-icon\.png/);
  assert.match(source, /\.\.\/public\/product-proxy-icon\.png/);
});

test("ページ上部では製品ナビを未選択状態に戻す", () => {
  const source = readFileSync(new URL("../app/ProductNavigation.tsx", import.meta.url), "utf8");
  assert.match(source, /window\.scrollY < \(topSection\?\.offsetHeight \?\? 1\)/);
  assert.match(source, /if \(isAtPageTop\(\)\) \{\s*setActiveId\("top"\);\s*return;/);
  assert.match(source, /window\.addEventListener\("scroll", syncTopState, \{ passive: true \}\)/);
});
