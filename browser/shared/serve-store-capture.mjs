// Local-only capture stage. It renders built product UI, never ships in either ZIP.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const browserRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = resolve(browserRoot, "../site/public");
const port = Number(process.env.TEMOTO_CAPTURE_PORT || 4190);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff": "font/woff", ".woff2": "font/woff2" };

function stage(url) {
  const proxy = url.searchParams.get("product") === "proxy";
  const promo = url.searchParams.get("mode") === "promo";
  const ja = url.searchParams.get("lang") === "ja";
  const locale = ja ? "ja" : "en";
  const name = proxy ? "temoto Proxy" : "temoto";
  const mark = proxy ? "/brand/temoto-proxy-mark.svg" : "/brand/temoto-mark.svg";
  const title = proxy
    ? (ja ? "開発用プロキシを、<br>切り替える。" : "Your proxy.<br>One clear view.")
    : (ja ? "4つのツールを、<br>ひとつに。" : "Four tools.<br>One popup.");
  const copy = proxy
    ? (ja ? "プロファイルを選び、有効な接続を確認。<br>使い終わったら、安全にオフ。" : "Choose a profile. See what is active.<br>Clear temoto’s override when you’re done.")
    : (ja ? "色の取得、画面撮影、CSS検証、<br>動画速度の操作。" : "Color, capture, CSS inspection,<br>and video speed.");
  const src = proxy ? `/proxy/popup.html?lang=${locale}` : `/chrome/index.html?lang=${locale}`;
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${name} — Store capture</title><style>
  @font-face {font-family:Geist;src:url('/brand/Geist-Variable.woff2') format('woff2');font-weight:100 900;font-display:block}
  *{box-sizing:border-box}html,body{margin:0;background:#080808;color:#f4f4f2;font-family:Geist,-apple-system,BlinkMacSystemFont,sans-serif}
  body{width:${promo ? 440 : 1280}px;height:${promo ? 280 : 800}px;overflow:hidden}
  header{position:absolute;top:66px;left:72px;display:flex;align-items:center;gap:14px;font-size:32px;font-weight:700;letter-spacing:-.045em}
  header img{width:45px;height:45px}.copy{position:absolute;left:72px;top:246px;width:650px}h1{margin:0;font-size:${ja ? 52 : 76}px;font-weight:650;line-height:1.15;letter-spacing:-.045em}p{margin:34px 0 0;font-size:${ja ? 18 : 21}px;line-height:1.7;color:#a6a6a3}
  iframe{position:absolute;right:72px;top:150px;width:416px;height:500px;border:0;background:#080808}
  footer{position:absolute;left:72px;bottom:63px;color:#a6a6a3;font-size:14px}.promo{height:280px;display:flex;align-items:center;justify-content:center;gap:22px}.promo img{width:118px;height:136px}.promo strong{font-size:${proxy ? 36 : 48}px;line-height:1.1;letter-spacing:-.055em}.promo small{display:block;font-size:25px;font-weight:500;margin-top:6px;color:#bda5ff}
  </style></head><body>${promo ? `<main class="promo"><img src="${mark}" alt=""><strong>temoto${proxy ? "<small>Proxy</small>" : ""}</strong></main>` : `<header><img src="${mark}" alt="">${name}</header><main><section class="copy"><h1>${title}</h1><p>${copy}</p></section><iframe title="${name} popup" src="${src}"></iframe></main><footer>${ja ? "サンプルページ・プロファイルでの表示" : "Shown with a sample page or profile"}</footer>`}</body></html>`;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    response.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(stage(url));
      return;
    }
    let root, relative;
    if (url.pathname.startsWith("/proxy/")) {
      root = resolve(browserRoot, "temoto-proxy/dist/client");
      relative = url.pathname.slice(7);
    } else if (url.pathname.startsWith("/brand/")) {
      const files = { "Geist-Variable.woff2": "brand/Geist-Variable.woff2", "temoto-mark.svg": "temoto-mark.svg", "temoto-proxy-mark.svg": "temoto-proxy-mark.svg" };
      root = siteRoot;
      relative = files[url.pathname.slice(7)];
      if (!relative) throw new Error("Unknown brand asset");
    } else {
      root = resolve(browserRoot, "temoto-chrome/dist/client");
      relative = url.pathname.startsWith("/chrome/") ? url.pathname.slice(8) : url.pathname.slice(1);
    }
    const file = resolve(root, decodeURIComponent(relative));
    if (!file.startsWith(root + sep)) throw new Error("Invalid path");
    const body = await readFile(file);
    response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Store capture stage: http://127.0.0.1:${port}/`));
