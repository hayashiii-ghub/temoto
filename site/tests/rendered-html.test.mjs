import assert from "node:assert/strict";
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

test("temotoのランディングページをサーバーレンダリングする", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const htmlWithoutBreakHints = html
    .replace(/<wbr\s*\/?\s*>/g, "")
    .replace(/<\/?span\b[^>]*>/g, "");
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>temoto — 移動する前に、置いておく。<\/title>/);
  assert.match(html, /無料でダウンロード/);
  assert.match(html, /<wbr\s*\/?/);
  assert.match(html, /v1\.0\.0/);
  assert.match(html, /Option \+ Tab/);
  assert.match(htmlWithoutBreakHints, /好きな場所へ取り出す/);
  assert.match(htmlWithoutBreakHints, /DMGからインストール/);
  assert.match(htmlWithoutBreakHints, /一行で導入・更新/);
  assert.match(htmlWithoutBreakHints, /クリップボードを自動で監視することはありません/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("公開用メタデータと主要リンクを含む", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:image" content="https:\/\/shelfdrop\.haygsiiii\.chatgpt\.site\/og-temoto\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="icon" href="https:\/\/shelfdrop\.haygsiiii\.chatgpt\.site\/favicon\.svg" type="image\/svg\+xml"/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto\/releases\/latest\/download\/temoto-macos\.dmg/);
  assert.match(html, /github\.com\/hayashiii-ghub\/temoto/);
});
