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

test("ShelfDropのランディングページをサーバーレンダリングする", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>ShelfDrop — 移動する前に、置いておく。<\/title>/);
  assert.match(html, /無料でダウンロード/);
  assert.match(html, /v0\.5\.1/);
  assert.match(html, /Option \+ Tab/);
  assert.match(html, /好きな場所へ取り出す/);
  assert.match(html, /DMGからインストール/);
  assert.match(html, /一行で導入・更新/);
  assert.match(html, /クリップボードを自動で監視することはありません/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("公開用メタデータと主要リンクを含む", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /property="og:image" content="https:\/\/shelfdrop\.haygsiiii\.chatgpt\.site\/og\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /github\.com\/hayashiii-ghub\/shelfdrop\/releases\/latest\/download\/ShelfDrop-macos\.dmg/);
  assert.match(html, /github\.com\/hayashiii-ghub\/shelfdrop/);
});
