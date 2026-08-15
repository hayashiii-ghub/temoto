import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
  assert.match(html, /<title>temoto — 手元に、置いておく。<\/title>/);
  assert.match(html, /<wbr\s*\/?/);
  assert.match(htmlWithoutBreakHints, /手元に、置いておく。/);
  assert.match(htmlWithoutBreakHints, /使う場所に合わせた、3つのtemoto。/);
  assert.match(html, /temoto for macOS/);
  assert.match(html, /temoto for Chrome/);
  assert.match(html, /temoto Proxy/);
  assert.match(html, /v1\.1\.3/);
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
  assert.match(html, /temotoMark/);
  assert.match(html, /scale\(1\.68\)/);
  assert.match(html, /rotate\(30 512 400\)/);
  assert.match(html, /rotate\(30 512 600\)/);
  assert.match(html, /chromeMark/);
  assert.match(html, /chromeToolIcon/);
  assert.match(html, /M222,67\.34/);
  assert.match(html, /shelfIcon/);
  assert.match(html, /M52\.44,36/);
  assert.match(html, /#9974f8/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
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
});

test("faviconは完成済みのmacOSアプリアイコンを使う", () => {
  const favicon = readFileSync(new URL("../public/favicon.png", import.meta.url));
  const appIcon = readFileSync(new URL("../../Assets/ShelfDrop.png", import.meta.url));
  assert.deepEqual(favicon, appIcon);
});

test("OG画像は1200x630のPNGである", () => {
  const png = readFileSync(new URL("../public/og-temoto.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});
