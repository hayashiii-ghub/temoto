import { CopyCommandButton } from "./CopyCommandButton";
import { JapaneseText } from "./JapaneseText";

const downloadUrl =
  "https://github.com/hayashiii-ghub/temoto/releases/latest/download/temoto-macos.dmg";
const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const updateCommand =
  "curl -fsSL https://github.com/hayashiii-ghub/temoto/releases/latest/download/install_latest.sh | bash";

const capabilities = [
  {
    number: "01",
    title: "離れた場所へ、まとめて運ぶ。",
    text: "Finderで選んだファイルを棚へ。移動先を開いてから、ひとつでも、まとめてでも取り出せます。",
    className: "capabilityWide",
    visual: <TransferVisual />,
  },
  {
    number: "02",
    title: "ファイル以外も、同じ場所に。",
    text: "フォルダ、画像、URL、テキスト。作業の途中にあるものを、種類を分けずに置いておけます。",
    className: "capabilityTypes",
    visual: <TypeStack />,
  },
  {
    number: "03",
    title: "必要なあいだだけ、手前に。",
    text: "小さく畳んで邪魔をせず、ショートカットですぐ呼び戻せます。",
    className: "capabilityCompact",
    visual: <CollapsedShelf />,
  },
];

function ShelfMark() {
  return (
    <span className="shelfMark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function CloseMark() {
  return <span className="closeMark" aria-hidden="true" />;
}

function ChevronMark({ down = false }: { down?: boolean }) {
  return <span className={`chevronMark${down ? " isDown" : ""}`} aria-hidden="true" />;
}

function FileMark({ kind }: { kind: "file" | "folder" | "link" }) {
  return <span className={`fileMark fileMark-${kind}`} aria-hidden="true"><i /></span>;
}

function ShelfPreview() {
  return (
    <div className="shelfScene" aria-label="3つの項目が入ったtemotoの画面イメージ">
      <div className="sceneLabel sceneLabelTop"><span>ALWAYS ON TOP</span><i /></div>
      <div className="appShelf">
        <div className="appShelfHighlight" />
        <div className="appHeader">
          <span className="appCount">3</span>
          <span className="appDrag" aria-hidden="true" />
          <span className="appControl"><CloseMark /></span>
          <span className="appControl"><ChevronMark /></span>
        </div>
        <div className="appItems">
          <div className="appItem">
            <FileMark kind="file" />
            <span><strong>Final-cut.mov</strong><small>1.82 GB · Movie</small></span>
            <em>•••</em>
          </div>
          <div className="appItem">
            <FileMark kind="folder" />
            <span><strong>Brand assets</strong><small>12 items · Folder</small></span>
            <em>•••</em>
          </div>
          <div className="appItem">
            <FileMark kind="link" />
            <span><strong>Reference board</strong><small>www.figma.com</small></span>
            <em>•••</em>
          </div>
        </div>
        <div className="appActions" aria-hidden="true">
          <span className="actionDrag"><i /><i /><i /></span>
          <span className="actionClipboard" />
          <span className="actionCopies"><i /></span>
          <span className="actionFolder"><i /></span>
          <span className="actionArchive"><i /></span>
          <span className="actionTrash"><i /></span>
        </div>
      </div>
      <div className="sceneLabel sceneLabelBottom"><i /><span>230 × 230 PX</span></div>
      <div className="shortcutTag"><kbd>⌥</kbd><span>+</span><kbd>⇥</kbd><small>ADD FROM FINDER</small></div>
    </div>
  );
}

function TransferVisual() {
  return (
    <div className="transferVisual" aria-hidden="true">
      <div className="transferNode"><FileMark kind="file" /><span>Finder</span></div>
      <div className="transferLine"><i /><i /></div>
      <div className="transferShelf"><ShelfMark /><span>3</span></div>
      <div className="transferLine"><i /><i /></div>
      <div className="transferNode destination"><FileMark kind="folder" /><span>Destination</span></div>
    </div>
  );
}

function TypeStack() {
  return (
    <div className="typeStack" aria-hidden="true">
      <span><FileMark kind="file" /><small>FILE</small></span>
      <span><FileMark kind="folder" /><small>FOLDER</small></span>
      <span><FileMark kind="link" /><small>LINK</small></span>
      <span className="textType">Aa<small>TEXT</small></span>
    </div>
  );
}

function CollapsedShelf() {
  return (
    <div className="collapsedShelf" aria-hidden="true">
      <ShelfMark />
      <i />
      <CloseMark />
      <ChevronMark down />
    </div>
  );
}

export default function Home() {
  return (
    <main id="top">
      <nav className="nav shell" aria-label="メインナビゲーション">
        <a className="brand" href="#top" aria-label="temoto トップへ">temoto</a>
        <div className="navLinks">
          <a href="#features">できること</a>
          <a href="#guide">使い方</a>
          <a href="#install">インストール</a>
        </div>
        <a className="navDownload" href={downloadUrl}><span>Download</span><i aria-hidden="true">↘</i></a>
      </nav>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow"><span /> FLOATING SHELF FOR MACOS</p>
          <h1><JapaneseText>移動する前に、置いておく。</JapaneseText></h1>
          <p className="lead">
            <JapaneseText>temotoは、ファイルやリンクを一時的に置ける小さな棚。ウィンドウを行き来する手間を減らして、作業の流れを止めません。</JapaneseText>
          </p>
          <div className="heroActions">
            <a className="button primary" href={downloadUrl}>無料でダウンロード <span aria-hidden="true">↘</span></a>
            <a className="textLink" href={repositoryUrl}>GitHubでソースを見る <span aria-hidden="true">↗</span></a>
          </div>
          <p className="requirements">v1.0.0　·　macOS 26+　·　Apple Silicon / Intel　·　Open source</p>
        </div>
        <ShelfPreview />
      </section>

      <section className="signalStrip" aria-label="temotoの特徴">
        <div className="shell signalInner">
          <p>Keep it close.<br /><span>Keep moving.</span></p>
          <dl>
            <div><dt>01</dt><dd>ALWAYS ON TOP</dd></div>
            <div><dt>02</dt><dd>ANY FILE TYPE</dd></div>
            <div><dt>03</dt><dd>ZERO ACCOUNT</dd></div>
          </dl>
        </div>
      </section>

      <section className="section shell" id="features">
        <div className="sectionHeading">
          <p className="eyebrow"><span /> WHY TEMOTO</p>
          <h2><JapaneseText>置き場所を決める前の、ちょうどいい置き場所。</JapaneseText></h2>
          <p><JapaneseText>コピー先を探すあいだも、別のアプリを開くあいだも。いま手にしているものを、画面の上に残しておけます。</JapaneseText></p>
        </div>
        <div className="capabilityGrid">
          {capabilities.map((item) => (
            <article className={`capabilityCard ${item.className}`} key={item.number}>
              <div className="capabilityTop"><span>{item.number}</span><i /></div>
              <div className="capabilityVisual">{item.visual}</div>
              <div className="capabilityCopy"><h3><JapaneseText>{item.title}</JapaneseText></h3><p><JapaneseText>{item.text}</JapaneseText></p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow" id="guide">
        <div className="shell workflowGrid">
          <div className="workflowIntro">
            <p className="eyebrow"><span /> HOW IT WORKS</p>
            <h2><JapaneseText>選ぶ。置く。取り出す。</JapaneseText></h2>
            <p><JapaneseText>覚える操作はひとつだけ。Finderで選んだものを、キーボードから直接temotoへ送れます。</JapaneseText></p>
            <div className="bigShortcut"><kbd>option</kbd><span>+</span><kbd>tab</kbd></div>
          </div>
          <ol className="workflowSteps">
            <li><span>01</span><div><h3><JapaneseText>Finderで選ぶ</JapaneseText></h3><p><JapaneseText>ファイル、フォルダ、または複数の項目を選択します。</JapaneseText></p></div></li>
            <li><span>02</span><div><h3><JapaneseText>Option + Tabで置く</JapaneseText></h3><p><JapaneseText>選択した項目が、いちばん手前のtemotoへ追加されます。</JapaneseText></p></div></li>
            <li><span>03</span><div><h3><JapaneseText>好きな場所へ取り出す</JapaneseText></h3><p><JapaneseText>移動先を開き、棚からドラッグ。まとめて移動、コピー、ZIP化もできます。</JapaneseText></p></div></li>
          </ol>
        </div>
      </section>

      <section className="section installSection shell" id="install">
        <div className="installHeading">
          <p className="eyebrow"><span /> GET TEMOTO</p>
          <h2><JapaneseText>Macに、小さな棚を。</JapaneseText></h2>
          <p><JapaneseText>アカウントも設定画面もありません。ダウンロードしてApplicationsへ移すだけで使い始められます。</JapaneseText></p>
        </div>
        <div className="installOptions">
          <article className="installCard installPrimary">
            <div className="installMeta"><span>RECOMMENDED</span><em>01</em></div>
            <h3><JapaneseText>DMGからインストール</JapaneseText></h3>
            <ol>
              <li><span>1</span><p><JapaneseText>最新版をダウンロード</JapaneseText></p></li>
              <li><span>2</span><p><JapaneseText>temotoをApplicationsへ移動</JapaneseText></p></li>
              <li><span>3</span><p><JapaneseText>Applicationsから起動</JapaneseText></p></li>
            </ol>
            <a className="button primary full" href={downloadUrl}>temoto for macOS <span aria-hidden="true">↘</span></a>
            <small><JapaneseText>初回のみ、macOSから起動の確認が表示される場合があります。</JapaneseText></small>
          </article>
          <article className="installCard installTerminal">
            <div className="installMeta"><span>TERMINAL</span><em>02</em></div>
            <h3><JapaneseText>一行で導入・更新</JapaneseText></h3>
            <p><JapaneseText>未導入ならインストール、導入済みなら最新版へ安全に入れ替えます。</JapaneseText></p>
            <div className="terminalWindow">
              <div className="terminalBar"><span /><span /><span /><small>zsh</small></div>
              <div className="commandRow"><code>{updateCommand}</code><CopyCommandButton command={updateCommand} /></div>
            </div>
            <small><JapaneseText>同じコマンドをもう一度実行すれば、いつでも最新版へ更新できます。</JapaneseText></small>
          </article>
        </div>
        <div className="permissionNote">
          <span>⌥</span>
          <div><strong><JapaneseText>最初の一度だけ、Finderの操作を許可してください。</JapaneseText></strong><p><JapaneseText>Option + Tabで選択項目を取得するために使用します。クリップボードを自動で監視することはありません。</JapaneseText></p></div>
        </div>
      </section>

      <section className="finalCta shell">
        <p>Ready when you are.</p>
        <h2><JapaneseText>作業の流れを、そのまま前へ。</JapaneseText></h2>
        <a className="button primary" href={downloadUrl}>無料でダウンロード <span aria-hidden="true">↘</span></a>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top">temoto</a>
        <p>© 2026 temoto</p>
        <div><a href={repositoryUrl}>GitHub</a><a href={`${repositoryUrl}/issues`}>Issues</a><a href={downloadUrl}>Download</a></div>
      </footer>
    </main>
  );
}
