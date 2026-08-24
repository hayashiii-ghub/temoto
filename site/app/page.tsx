import type { CSSProperties, ReactNode } from "react";

import { JapaneseText } from "./JapaneseText";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeSourceUrl = `${repositoryUrl}/tree/main/browser/temoto-chrome`;
const proxySourceUrl = `${repositoryUrl}/tree/main/browser/temoto-proxy`;
const chromeStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";
const proxyStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb";
const chromeVersion = "0.2.0";
const proxyVersion = "1.1.0";

const chromeTools = [
  {
    name: "Color Picker",
    path: "M222,67.34a33.81,33.81,0,0,0-10.64-24.25C198.12,30.56,176.68,31,163.54,44.18L142.82,65l-.63-.63a22,22,0,0,0-31.11,0l-9,9a14,14,0,0,0,0,19.81l3.47,3.47L53.14,149.1a37.81,37.81,0,0,0-9.84,36.73l-8.31,19a11.68,11.68,0,0,0,2.46,13A13.91,13.91,0,0,0,47.32,222,14.15,14.15,0,0,0,53,220.82L71,212.92a37.92,37.92,0,0,0,35.84-10.07l52.44-52.46,3.47,3.48a14,14,0,0,0,19.8,0l9-9a22.06,22.06,0,0,0,0-31.13l-.66-.65L212,91.85A33.76,33.76,0,0,0,222,67.34Zm-123.61,127a26,26,0,0,1-26,6.47,6,6,0,0,0-4.17.24l-20,8.75a2,2,0,0,1-2.09-.31l9.12-20.9a5.94,5.94,0,0,0,.19-4.31A25.91,25.91,0,0,1,56,166h70.78ZM138.78,154H65.24l48.83-48.84,36.76,36.78Zm64.77-70.59L178.17,108.9a6,6,0,0,0,0,8.47l4.88,4.89a10,10,0,0,1,0,14.15l-9,9a2,2,0,0,1-2.82,0l-60.69-60.7a2,2,0,0,1,0-2.83l9-9a10,10,0,0,1,14.14,0l4.89,4.89a6,6,0,0,0,4.24,1.75h0a6,6,0,0,0,4.25-1.77L172,52.66c8.57-8.58,22.51-9,31.07-.85a22,22,0,0,1,.44,31.57Z",
    text: "画面の色を選んで、hexをコピーします。",
    previewDescription: "Pick from the page",
  },
  {
    name: "Screenshot",
    path: "M150,40a6,6,0,0,1-6,6H112a6,6,0,0,1,0-12h32A6,6,0,0,1,150,40Zm-6,170H112a6,6,0,0,0,0,12h32a6,6,0,0,0,0-12ZM208,34H184a6,6,0,0,0,0,12h24a2,2,0,0,1,2,2V72a6,6,0,0,0,12,0V48A14,14,0,0,0,208,34Zm8,72a6,6,0,0,0-6,6v32a6,6,0,0,0,12,0V112A6,6,0,0,0,216,106Zm0,72a6,6,0,0,0-6,6v24a2,2,0,0,1-2,2H184a6,6,0,0,0,0,12h24a14,14,0,0,0,14-14V184A6,6,0,0,0,216,178ZM40,150a6,6,0,0,0,6-6V112a6,6,0,0,0-12,0v32A6,6,0,0,0,40,150Zm32,60H48a2,2,0,0,1-2-2V184a6,6,0,0,0-12,0v24a14,14,0,0,0,14,14H72a6,6,0,0,0,0-12ZM72,34H48A14,14,0,0,0,34,48V72a6,6,0,0,0,12,0V48a2,2,0,0,1,2-2H72a6,6,0,0,0,0-12Z",
    text: "範囲、表示中、ページ全体をPNGで残します。",
    previewDescription: "Region, viewport, or full",
  },
  {
    name: "Video Speed",
    path: "M115.76,155.76l96-96a6,6,0,0,1,8.48,8.48l-96,96a6,6,0,0,1-8.48-8.48ZM128,86a65.9,65.9,0,0,1,21.08,3.44,6,6,0,0,0,3.83-11.38,78,78,0,0,0-102.43,82.6,6,6,0,0,0,6,5.34,5.12,5.12,0,0,0,.67,0,6,6,0,0,0,5.3-6.62A69,69,0,0,1,62,152,66.08,66.08,0,0,1,128,86Zm98,15.9a6,6,0,1,0-10.68,5.48,98.35,98.35,0,0,1,5.16,77.25,2,2,0,0,1-1.91,1.37H37.46a2.07,2.07,0,0,1-1.91-1.41A98.23,98.23,0,0,1,128,54h.9a97,97,0,0,1,43.71,10.72A6,6,0,1,0,178.1,54,108.92,108.92,0,0,0,129,42h-1A110.06,110.06,0,0,0,24.23,188.58,14.08,14.08,0,0,0,37.46,198H218.53a14.06,14.06,0,0,0,13.22-9.37A110.34,110.34,0,0,0,226,101.9Z",
    text: "再生速度を変え、G・D・Sで操作。動画が切り替わっても、実際の速度をバッジに表示します。",
    previewDescription: "Control page playback",
  },
  {
    name: "Switch Origin",
    path: "M212.24,171.76a6,6,0,0,1,0,8.48l-32,32a6,6,0,0,1-8.48-8.48L193.51,182H48a6,6,0,0,1,0-12H193.51l-21.75-21.76a6,6,0,0,1,8.48-8.48ZM75.76,116.24a6,6,0,0,0,8.48-8.48L62.49,86H208a6,6,0,0,0,0-12H62.49L84.24,52.24a6,6,0,0,0-8.48-8.48l-32,32a6,6,0,0,0,0,8.48Z",
    text: "Local / Staging / Productionへ、今のパスを保ったまま切り替えます。",
    previewDescription: "Local, staging, or production",
  },
  {
    name: "Site Reset",
    path: "M222,128a94,94,0,0,1-92.74,94H128a93.43,93.43,0,0,1-64.5-25.65,6,6,0,1,1,8.24-8.72A82,82,0,1,0,70,70l-.19.19L39.44,98H72a6,6,0,0,1,0,12H24a6,6,0,0,1-6-6V56a6,6,0,0,1,12,0V90.34L61.63,61.4A94,94,0,0,1,222,128Z",
    text: "今のオリジンのキャッシュやCookieを、確認してから消します。",
    previewDescription: "Clear the current site",
  },
  {
    name: "Inspect",
    path: "M208,94a14,14,0,0,0,14-14V48a14,14,0,0,0-14-14H176a14,14,0,0,0-14,14V58H94V48A14,14,0,0,0,80,34H48A14,14,0,0,0,34,48V80A14,14,0,0,0,48,94H58v68H48a14,14,0,0,0-14,14v32a14,14,0,0,0,14,14H80a14,14,0,0,0,14-14V198h68v10a14,14,0,0,0,14,14h32a14,14,0,0,0,14-14V176a14,14,0,0,0-14-14H198V94ZM174,48a2,2,0,0,1,2-2h32a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2ZM46,80V48a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H48A2,2,0,0,1,46,80ZM82,208a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2Zm128-32v32a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2h32A2,2,0,0,1,210,176Zm-24-14H176a14,14,0,0,0-14,14v10H94V176a14,14,0,0,0-14-14H70V94H80A14,14,0,0,0,94,80V70h68V80a14,14,0,0,0,14,14h10Z",
    text: "要素の寸法を測り、CSSセレクタをコピーします。",
    previewDescription: "Measure and copy CSS",
  },
];

function ChromeMark({ className }: { className?: string }) {
  return <span className={className ? `chromeMark ${className}` : "chromeMark"} aria-hidden="true" />;
}

function ProxyMark({ className }: { className?: string }) {
  return <span className={className ? `proxyMark ${className}` : "proxyMark"} aria-hidden="true" />;
}

function ChromeSettingsMark() {
  return (
    <svg className="chromeSettingsIcon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M40,86H74.6a30,30,0,0,0,58.8,0H216a6,6,0,0,0,0-12H133.4a30,30,0,0,0-58.8,0H40a6,6,0,0,0,0,12Zm64-24A18,18,0,1,1,86,80,18,18,0,0,1,104,62ZM216,170H197.4a30,30,0,0,0-58.8,0H40a6,6,0,0,0,0,12h98.6a30,30,0,0,0,58.8,0H216a6,6,0,0,0,0-12Zm-48,24a18,18,0,1,1,18-18A18,18,0,0,1,168,194Z" />
    </svg>
  );
}

function ChromeToolIcon({ path }: { path: string }) {
  return (
    <svg className="chromeToolIcon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function ChromePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`chromeScene${compact ? " isCompact" : ""}`} role="img" aria-label="temoto for Chromeのランチャー画面イメージ">
      <div className="chromePopup">
        <div className="chromePopupHeader">
          <p>temoto <span className="chromeFor">for Chrome</span></p>
          <span className="chromeSettings" aria-hidden="true"><ChromeSettingsMark /></span>
        </div>
        <div className="chromeGrid">
          {chromeTools.map((tool) => (
            <div className="chromeCell" key={tool.name}>
              <div className="chromeCellHead">
                <ChromeToolIcon path={tool.path} />
                {tool.name === "Video Speed" ? <small>1.5x</small> : null}
              </div>
              <span className="chromeCellCopy">
                <strong>{tool.name}</strong>
                <small>{tool.previewDescription}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="chromeFeedback" aria-hidden="true" />
      </div>
    </div>
  );
}

const proxyFeatures = [
  { name: "Named profiles", text: "HTTP、HTTPS、SOCKS4、SOCKS5の接続先を、名前付きプロファイルとして保存します。" },
  { name: "Domain routing", text: "選んだドメインだけをプロキシへ通すか、直接接続へ切り替えます。" },
  { name: "PAC support", text: "固定プロキシ、生成ルール、既存PACスクリプトを用途に合わせて使い分けます。" },
  { name: "Safe switching", text: "適用前に競合を検知し、終了時にはtemotoの設定だけを安全に解除します。" },
  { name: "Session credentials", text: "認証パスワードはブラウザのセッション中だけ保持し、書き出しには含めません。" },
  { name: "Team profiles", text: "認証情報を除いたプロファイルをJSONで読み込み・書き出しできます。" },
] as const;

function ProxyPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`proxyScene${compact ? " isCompact" : ""}`} role="img" aria-label="temoto Proxyのポップアップ画面イメージ">
      <div className="proxyPopup">
        <div className="proxyPopupHeader">
          <p>temoto <span>Proxy</span></p>
          <span className="proxyPopupSettings" aria-hidden="true"><ChromeSettingsMark /></span>
        </div>
        <div className="proxyPopupStatus">
          <div className="proxyStatusLine"><i /><span>Proxy active</span></div>
          <h3>Charles local</h3>
          <p>HTTP · 127.0.0.1:8080</p>
          <div className="proxyPopupActions"><strong>Turn off safely</strong><span>Test</span></div>
        </div>
        <div className="proxyPopupProfiles">
          <div className="proxyPopupSection"><span>Profiles</span><small>3</small></div>
          <div className="proxyPopupProfile isActive">
            <i style={{ "--profile-color": "#9974f8" } as CSSProperties} />
            <span><strong>Charles local</strong><small>HTTP · 127.0.0.1:8080</small></span>
            <em>ACTIVE</em>
          </div>
          <div className="proxyPopupProfile">
            <i style={{ "--profile-color": "#6ebf93" } as CSSProperties} />
            <span><strong>Staging routes</strong><small>HTTP · 127.0.0.1:8080</small></span>
            <em>ROUTED</em>
          </div>
          <div className="proxyPopupProfile">
            <i style={{ "--profile-color": "#d2a154" } as CSSProperties} />
            <span><strong>Company PAC</strong><small>PAC URL</small></span>
            <em>PAC</em>
          </div>
        </div>
        <div className="proxyPopupFooter"><span>Regular windows only unless explicitly enabled</span><strong>Manage</strong></div>
      </div>
    </div>
  );
}

function ProductShowcaseCard({
  href,
  label,
  version,
  title,
  statement,
  detail,
  mark,
  visual,
  product,
}: {
  href: string;
  label: string;
  version: string;
  title: string;
  statement: string;
  detail: string;
  mark: ReactNode;
  visual: ReactNode;
  product: "chrome" | "proxy";
}) {
  return (
    <a className={`productShowcaseCard is${product[0].toUpperCase()}${product.slice(1)}`} href={href}>
      <div className="productShowcaseCopy">
        <div className="productMeta"><span>{label}</span><em>{version}</em></div>
        <div className="productShowcaseMark" aria-hidden="true">{mark}</div>
        <h3>{title}</h3>
        <p><JapaneseText>{statement}</JapaneseText></p>
        <small>{detail}</small>
        <span className="productShowcaseAction"><span>詳しく見る</span><i aria-hidden="true">↓</i></span>
      </div>
      <div className="productShowcaseVisual">{visual}</div>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skipLink" href="#content">本文へ移動</a>
      <main id="content">
      <div id="top" />
      <section className="productOverview" id="products" aria-labelledby="products-title">
        <div className="section shell">
          <div className="sectionHeading">
            <h1 id="products-title"><JapaneseText>Chromeの作業を、手元で整える。</JapaneseText></h1>
            <p><JapaneseText>ページを試す6つの道具と、開発用プロキシ。役割を分けた2つの拡張です。</JapaneseText></p>
          </div>
          <div className="productShowcase">
            <ProductShowcaseCard
              href="#chrome"
              label="FOR CHROME"
              version={chromeVersion}
              title="temoto for Chrome"
              statement="試す道具を、タブのそばに。"
              detail="Color Picker, Screenshot, Video Speed, Switch Origin, Site Reset, Inspect"
              mark={<ChromeMark />}
              visual={<ChromePreview compact />}
              product="chrome"
            />
            <ProductShowcaseCard
              href="#proxy"
              label="PROXY FOR CHROME"
              version={proxyVersion}
              title="temoto Proxy"
              statement="接続先を、見えるプロファイルに。"
              detail="HTTP, HTTPS, SOCKS4, SOCKS5, Domain routing, PAC, Authentication"
              mark={<ProxyMark />}
              visual={<ProxyPreview compact />}
              product="proxy"
            />
          </div>
        </div>
      </section>

      <section className="productBlock isChrome" id="chrome">
        <div className="productHero shell">
          <div className="heroCopy">
            <p className="eyebrow"><span /> TEMOTO FOR CHROME</p>
            <h2><JapaneseText>試す道具を、タブのそばに。</JapaneseText></h2>
            <p className="lead">
              <JapaneseText>色、キャプチャ、再生速度、環境切替、リセット、Inspect。ページを試す6つの道具を、1つのポップアップにまとめています。</JapaneseText>
            </p>
            <p className="requirements">{chromeVersion}　·　Chrome 116+　·　English UI　·　Processed locally</p>
          </div>
          <ChromePreview />
        </div>

        <div className="section shell">
          <div className="sectionHeading">
            <p className="eyebrow"><span /> SIX TOOLS</p>
            <h2><JapaneseText>開いたタブで、すぐ試す。</JapaneseText></h2>
            <p><JapaneseText>画面の表示は英語です。処理はブラウザ内で完結し、ページの内容を外部へ送りません。</JapaneseText></p>
          </div>
          <ol className="chromeToolList">
            {chromeTools.map((tool, index) => (
              <li key={tool.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{tool.name}</h3>
                  <p><JapaneseText>{tool.text}</JapaneseText></p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="section installSection shell">
          <div className="installHeading">
            <p className="eyebrow"><span /> GET CHROME</p>
            <h2><JapaneseText>タブのそばに、6つの道具を。</JapaneseText></h2>
            <p><JapaneseText>Chrome Web Storeで公開中です。ストアからインストールでき、ソースとプライバシー方針もGitHubで確認できます。</JapaneseText></p>
          </div>
          <div className="installOptions">
            <article className="installCard">
              <div className="installMeta"><span>CHROME WEB STORE</span><em>01</em></div>
              <h3><JapaneseText>Chromeに追加</JapaneseText></h3>
              <p><JapaneseText>{`バージョン${chromeVersion}をChrome Web Storeで公開しています。`}</JapaneseText></p>
              <a className="button primary full" href={chromeStoreUrl}>Chrome Web Storeで入手 <span aria-hidden="true">↗</span></a>
            </article>
            <article className="installCard">
              <div className="installMeta"><span>GITHUB</span><em>02</em></div>
              <h3><JapaneseText>ソースを見る</JapaneseText></h3>
              <p><JapaneseText>拡張の実装とプライバシー方針は、リポジトリの browser/temoto-chrome にあります。</JapaneseText></p>
              <a className="button ghost full" href={chromeSourceUrl}>GitHubでソースを見る <span aria-hidden="true">↗</span></a>
            </article>
          </div>
          <div className="permissionNote">
            <span>G</span>
            <div><strong><JapaneseText>Video Speedのショートカットだけが、HTTP(S)ページで常に有効です。</JapaneseText></strong><p><JapaneseText>入力欄と修飾キーの組み合わせは無視します。ほかの道具は、選んだときだけ今のタブに触れます。</JapaneseText></p></div>
          </div>
        </div>
      </section>

      <section className="productBlock isProxy" id="proxy">
        <div className="productHero shell">
          <div className="heroCopy">
            <p className="eyebrow"><span /> TEMOTO PROXY</p>
            <h2><JapaneseText>接続先を、見えるプロファイルに。</JapaneseText></h2>
            <p className="lead">
              <JapaneseText>開発用プロキシの設定、切り替え、解除を名前付きプロファイルにまとめます。いまどの接続が有効かを常に見える状態にします。</JapaneseText>
            </p>
            <p className="requirements">{proxyVersion}　·　Chrome 116+　·　English UI　·　No analytics</p>
          </div>
          <ProxyPreview />
        </div>

        <div className="section shell">
          <div className="sectionHeading">
            <p className="eyebrow"><span /> PROXY WORKSPACES</p>
            <h2><JapaneseText>切り替える。確かめる。安全に戻す。</JapaneseText></h2>
            <p><JapaneseText>プロキシ設定をブラウザの奥に隠さず、接続先、対象ドメイン、認証状態をひとつの画面で管理します。</JapaneseText></p>
          </div>
          <ol className="chromeToolList proxyFeatureList">
            {proxyFeatures.map((feature, index) => (
              <li key={feature.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{feature.name}</h3><p><JapaneseText>{feature.text}</JapaneseText></p></div>
              </li>
            ))}
          </ol>
        </div>

        <div className="section installSection shell">
          <div className="installHeading">
            <p className="eyebrow"><span /> GET PROXY</p>
            <h2><JapaneseText>プロキシ設定を、手元へ。</JapaneseText></h2>
            <p><JapaneseText>Chrome Web Storeで公開中です。ストアからインストールでき、実装とプライバシー方針もGitHubで確認できます。</JapaneseText></p>
          </div>
          <div className="installOptions">
            <article className="installCard">
              <div className="installMeta"><span>CHROME WEB STORE</span><em>01</em></div>
              <h3><JapaneseText>Chromeに追加</JapaneseText></h3>
              <p><JapaneseText>{`バージョン${proxyVersion}をChrome Web Storeで公開しています。`}</JapaneseText></p>
              <a className="button primary full" href={proxyStoreUrl}>Chrome Web Storeで入手 <span aria-hidden="true">↗</span></a>
            </article>
            <article className="installCard">
              <div className="installMeta"><span>GITHUB</span><em>02</em></div>
              <h3><JapaneseText>ソースを見る</JapaneseText></h3>
              <p><JapaneseText>拡張の実装、権限の用途、プライバシー方針は、リポジトリの browser/temoto-proxy にあります。</JapaneseText></p>
              <a className="button ghost full" href={proxySourceUrl}>GitHubでソースを見る <span aria-hidden="true">↗</span></a>
            </article>
          </div>
          <div className="permissionNote">
            <span>P</span>
            <div><strong><JapaneseText>適用中のプロファイルと競合を、切り替える前に表示します。</JapaneseText></strong><p><JapaneseText>temoto for Chromeには有効状態だけを共有し、詳細操作はProxy側で行います。ページ内容は検査・送信しません。</JapaneseText></p></div>
          </div>
        </div>
      </section>

      <section className="finalCta">
        <div className="finalCtaInner shell">
          <p>CHOOSE A TEMOTO</p>
          <h2><JapaneseText>手元の道具を、選ぶ。</JapaneseText></h2>
          <div className="finalActions">
            <a className="button primary" href={chromeStoreUrl}>Chrome版をインストール <span aria-hidden="true">↗</span></a>
            <a className="button ghost" href={proxyStoreUrl}>Proxy版をインストール <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
      </main>
      <footer className="footer shell">
        <a className="brand" href="#top" aria-label="ページ上部へ戻る">temoto</a>
        <p>© 2026 temoto</p>
        <div>
          <a href={repositoryUrl}>GitHub</a>
          <a href={`${repositoryUrl}/issues`}>Issues</a>
          <a href="#chrome">Chrome</a>
          <a href="#proxy">Proxy</a>
        </div>
      </footer>
    </>
  );
}
