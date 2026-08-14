import { CopyCommandButton } from "./CopyCommandButton";
import { JapaneseText } from "./JapaneseText";

const downloadUrl =
  "https://github.com/hayashiii-ghub/temoto/releases/latest/download/temoto-macos.dmg";
const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeSourceUrl = `${repositoryUrl}/tree/main/browser/temoto-chrome`;
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
    title: "画面の上か、メニューバーか。",
    text: "ピン留めすれば、閉じるまでほかのウィンドウより手前に残ります。メニューバーならアイコンの下に開き、外側をクリックすると閉じます。",
    className: "capabilityCompact",
    visual: <LocationModes />,
  },
];

const chromeTools = [
  {
    name: "Color Picker",
    path: "M222,67.34a33.81,33.81,0,0,0-10.64-24.25C198.12,30.56,176.68,31,163.54,44.18L142.82,65l-.63-.63a22,22,0,0,0-31.11,0l-9,9a14,14,0,0,0,0,19.81l3.47,3.47L53.14,149.1a37.81,37.81,0,0,0-9.84,36.73l-8.31,19a11.68,11.68,0,0,0,2.46,13A13.91,13.91,0,0,0,47.32,222,14.15,14.15,0,0,0,53,220.82L71,212.92a37.92,37.92,0,0,0,35.84-10.07l52.44-52.46,3.47,3.48a14,14,0,0,0,19.8,0l9-9a22.06,22.06,0,0,0,0-31.13l-.66-.65L212,91.85A33.76,33.76,0,0,0,222,67.34Zm-123.61,127a26,26,0,0,1-26,6.47,6,6,0,0,0-4.17.24l-20,8.75a2,2,0,0,1-2.09-.31l9.12-20.9a5.94,5.94,0,0,0,.19-4.31A25.91,25.91,0,0,1,56,166h70.78ZM138.78,154H65.24l48.83-48.84,36.76,36.78Zm64.77-70.59L178.17,108.9a6,6,0,0,0,0,8.47l4.88,4.89a10,10,0,0,1,0,14.15l-9,9a2,2,0,0,1-2.82,0l-60.69-60.7a2,2,0,0,1,0-2.83l9-9a10,10,0,0,1,14.14,0l4.89,4.89a6,6,0,0,0,4.24,1.75h0a6,6,0,0,0,4.25-1.77L172,52.66c8.57-8.58,22.51-9,31.07-.85a22,22,0,0,1,.44,31.57Z",
    text: "画面の色を選んで、hexをコピーします。",
  },
  {
    name: "Screenshot",
    path: "M150,40a6,6,0,0,1-6,6H112a6,6,0,0,1,0-12h32A6,6,0,0,1,150,40Zm-6,170H112a6,6,0,0,0,0,12h32a6,6,0,0,0,0-12ZM208,34H184a6,6,0,0,0,0,12h24a2,2,0,0,1,2,2V72a6,6,0,0,0,12,0V48A14,14,0,0,0,208,34Zm8,72a6,6,0,0,0-6,6v32a6,6,0,0,0,12,0V112A6,6,0,0,0,216,106Zm0,72a6,6,0,0,0-6,6v24a2,2,0,0,1-2,2H184a6,6,0,0,0,0,12h24a14,14,0,0,0,14-14V184A6,6,0,0,0,216,178ZM40,150a6,6,0,0,0,6-6V112a6,6,0,0,0-12,0v32A6,6,0,0,0,40,150Zm32,60H48a2,2,0,0,1-2-2V184a6,6,0,0,0-12,0v24a14,14,0,0,0,14,14H72a6,6,0,0,0,0-12ZM72,34H48A14,14,0,0,0,34,48V72a6,6,0,0,0,12,0V48a2,2,0,0,1,2-2H72a6,6,0,0,0,0-12Z",
    text: "範囲、表示中、ページ全体をPNGで残します。",
  },
  {
    name: "Video Speed",
    path: "M115.76,155.76l96-96a6,6,0,0,1,8.48,8.48l-96,96a6,6,0,0,1-8.48-8.48ZM128,86a65.9,65.9,0,0,1,21.08,3.44,6,6,0,0,0,3.83-11.38,78,78,0,0,0-102.43,82.6,6,6,0,0,0,6,5.34,5.12,5.12,0,0,0,.67,0,6,6,0,0,0,5.3-6.62A69,69,0,0,1,62,152,66.08,66.08,0,0,1,128,86Zm98,15.9a6,6,0,1,0-10.68,5.48,98.35,98.35,0,0,1,5.16,77.25,2,2,0,0,1-1.91,1.37H37.46a2.07,2.07,0,0,1-1.91-1.41A98.23,98.23,0,0,1,128,54h.9a97,97,0,0,1,43.71,10.72A6,6,0,1,0,178.1,54,108.92,108.92,0,0,0,129,42h-1A110.06,110.06,0,0,0,24.23,188.58,14.08,14.08,0,0,0,37.46,198H218.53a14.06,14.06,0,0,0,13.22-9.37A110.34,110.34,0,0,0,226,101.9Z",
    text: "再生速度を変え、G・D・Sでも操作できます。",
  },
  {
    name: "Environments",
    path: "M212.24,171.76a6,6,0,0,1,0,8.48l-32,32a6,6,0,0,1-8.48-8.48L193.51,182H48a6,6,0,0,1,0-12H193.51l-21.75-21.76a6,6,0,0,1,8.48-8.48ZM75.76,116.24a6,6,0,0,0,8.48-8.48L62.49,86H208a6,6,0,0,0,0-12H62.49L84.24,52.24a6,6,0,0,0-8.48-8.48l-32,32a6,6,0,0,0,0,8.48Z",
    text: "Local / Staging / Productionへ、今のパスを保ったまま切り替えます。",
  },
  {
    name: "Site Reset",
    path: "M222,128a94,94,0,0,1-92.74,94H128a93.43,93.43,0,0,1-64.5-25.65,6,6,0,1,1,8.24-8.72A82,82,0,1,0,70,70l-.19.19L39.44,98H72a6,6,0,0,1,0,12H24a6,6,0,0,1-6-6V56a6,6,0,0,1,12,0V90.34L61.63,61.4A94,94,0,0,1,222,128Z",
    text: "今のオリジンのキャッシュやCookieを、確認してから消します。",
  },
  {
    name: "Inspect",
    path: "M208,94a14,14,0,0,0,14-14V48a14,14,0,0,0-14-14H176a14,14,0,0,0-14,14V58H94V48A14,14,0,0,0,80,34H48A14,14,0,0,0,34,48V80A14,14,0,0,0,48,94H58v68H48a14,14,0,0,0-14,14v32a14,14,0,0,0,14,14H80a14,14,0,0,0,14-14V198h68v10a14,14,0,0,0,14,14h32a14,14,0,0,0,14-14V176a14,14,0,0,0-14-14H198V94ZM174,48a2,2,0,0,1,2-2h32a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2ZM46,80V48a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H48A2,2,0,0,1,46,80ZM82,208a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2Zm128-32v32a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2h32A2,2,0,0,1,210,176Zm-24-14H176a14,14,0,0,0-14,14v10H94V176a14,14,0,0,0-14-14H70V94H80A14,14,0,0,0,94,80V70h68V80a14,14,0,0,0,14,14h10Z",
    text: "要素の寸法を測り、CSSセレクタをコピーします。",
  },
];

function TemotoMark({ className }: { className?: string }) {
  return (
    <svg className={className ? `temotoMark ${className}` : "temotoMark"} viewBox="0 0 1024 1024" aria-hidden="true">
      <g transform="translate(512 512) scale(1.49) translate(-512 -512)" fill="currentColor">
        <rect x="302" y="335" width="420" height="130" rx="65" transform="rotate(30 512 400)" />
        <rect x="302" y="535" width="420" height="130" rx="65" transform="rotate(30 512 600)" />
      </g>
    </svg>
  );
}

function ChromeMark({ className }: { className?: string }) {
  return (
    <svg className={className ? `chromeMark ${className}` : "chromeMark"} viewBox="0 0 1024 1024" aria-hidden="true">
      <g transform="translate(512 512) scale(1.49) translate(-512 -512)" fill="#9974f8">
        <rect x="302" y="335" width="420" height="130" transform="rotate(30 512 400)" />
        <rect x="302" y="535" width="420" height="130" transform="rotate(30 512 600)" />
      </g>
    </svg>
  );
}

const shelfIcons = {
  pinSlash: "M52.44,36A6,6,0,0,0,43.56,44L71.27,74.51C61.78,76,50.6,80,39.22,89.18A14,14,0,0,0,38.1,110l49.71,49.71-44.05,44a6,6,0,1,0,8.48,8.48l44.05-44.05L146,217.89a14,14,0,0,0,9.9,4.11q.49,0,1,0a14,14,0,0,0,10.19-5.54,85.51,85.51,0,0,0,12.44-22.84l24,26.45a6,6,0,1,0,8.87-8.08ZM157.49,209.21a2,2,0,0,1-3,.2L46.58,101.51a2,2,0,0,1,.18-3c13.18-10.64,25.84-12.9,34.79-12.7L170,183.11C167.83,193.74,162.11,203.07,157.49,209.21Zm76.42-106.62-44.65,44.78a6,6,0,1,1-8.5-8.47l44.65-44.79a2,2,0,0,0,0-2.84L164.73,30.59a2,2,0,0,0-2.83,0L120.68,71.94a6,6,0,0,1-8.5-8.47l41.23-41.36a14,14,0,0,1,19.81,0l60.69,60.69A14,14,0,0,1,233.91,102.59Z",
  close: "M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z",
  chevronUp: "M212.24,164.24a6,6,0,0,1-8.48,0L128,88.49,52.24,164.24a6,6,0,0,1-8.48-8.48l80-80a6,6,0,0,1,8.48,0l80,80A6,6,0,0,1,212.24,164.24Z",
  ellipsis: "M138,128a10,10,0,1,1-10-10A10,10,0,0,1,138,128ZM60,118a10,10,0,1,0,10,10A10,10,0,0,0,60,118Zm136,0a10,10,0,1,0,10,10A10,10,0,0,0,196,118Z",
  file: "M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Z",
  folder: "M216,74H130.49l-27.9-27.9a13.94,13.94,0,0,0-9.9-4.1H40A14,14,0,0,0,26,56V200.62A13.39,13.39,0,0,0,39.38,214H216.89A13.12,13.12,0,0,0,230,200.89V88A14,14,0,0,0,216,74ZM40,54H92.69a2,2,0,0,1,1.41.59L113.51,74H38V56A2,2,0,0,1,40,54ZM218,200.89a1.11,1.11,0,0,1-1.11,1.11H39.38A1.4,1.4,0,0,1,38,200.62V86H216a2,2,0,0,1,2,2Z",
  link: "M238,88.18a52.42,52.42,0,0,1-15.4,35.66l-34.75,34.75A52.28,52.28,0,0,1,150.62,174h-.05A52.63,52.63,0,0,1,98,119.9a6,6,0,0,1,6-5.84h.17a6,6,0,0,1,5.83,6.16A40.62,40.62,0,0,0,150.58,162h0a40.4,40.4,0,0,0,28.73-11.9l34.75-34.74A40.63,40.63,0,0,0,156.63,57.9l-11,11a6,6,0,0,1-8.49-8.49l11-11a52.62,52.62,0,0,1,74.43,0A52.83,52.83,0,0,1,238,88.18Zm-127.62,98.9-11,11A40.36,40.36,0,0,1,70.6,210h0a40.63,40.63,0,0,1-28.7-69.36L76.62,105.9A40.63,40.63,0,0,1,146,135.77a6,6,0,0,0,5.83,6.16H152a6,6,0,0,0,6-5.84A52.63,52.63,0,0,0,68.14,97.42L33.38,132.16A52.63,52.63,0,0,0,70.56,222h0a52.26,52.26,0,0,0,37.22-15.42l11-11a6,6,0,1,0-8.49-8.48Z",
  drag: "M188,82a25.85,25.85,0,0,0-14.59,4.49A26,26,0,0,0,128,75.41,26,26,0,0,0,82,92v22H68a26,26,0,0,0-26,26v12a86,86,0,0,0,172,0V108A26,26,0,0,0,188,82Zm14,70a74,74,0,0,1-148,0V140a14,14,0,0,1,14-14H82v26a6,6,0,0,0,12,0V92a14,14,0,0,1,28,0v28a6,6,0,0,0,12,0V92a14,14,0,0,1,28,0v28a6,6,0,0,0,12,0V108a14,14,0,0,1,28,0Z",
  clipboard: "M200,34H162.83a45.91,45.91,0,0,0-69.66,0H56A14,14,0,0,0,42,48V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V48A14,14,0,0,0,200,34Zm-72-4a34,34,0,0,1,34,34v2H94V64A34,34,0,0,1,128,30Zm74,186a2,2,0,0,1-2,2H56a2,2,0,0,1-2-2V48a2,2,0,0,1,2-2H85.67A45.77,45.77,0,0,0,82,64v8a6,6,0,0,0,6,6h80a6,6,0,0,0,6-6V64a45.77,45.77,0,0,0-3.67-18H200a2,2,0,0,1,2,2Z",
  copy: "M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z",
  folderPlus: "M216,74H130.49l-27.9-27.9a13.94,13.94,0,0,0-9.9-4.1H40A14,14,0,0,0,26,56V200.62A13.39,13.39,0,0,0,39.38,214H216.89A13.12,13.12,0,0,0,230,200.89V88A14,14,0,0,0,216,74ZM40,54H92.69a2,2,0,0,1,1.41.59L113.51,74H38V56A2,2,0,0,1,40,54ZM218,200.89a1.11,1.11,0,0,1-1.11,1.11H39.38A1.4,1.4,0,0,1,38,200.62V86H216a2,2,0,0,1,2,2ZM158,144a6,6,0,0,1-6,6H134v18a6,6,0,0,1-12,0V150H104a6,6,0,0,1,0-12h18V120a6,6,0,0,1,12,0v18h18A6,6,0,0,1,158,144Z",
  archive: "M224,50H32A14,14,0,0,0,18,64V88a14,14,0,0,0,14,14h2v90a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V102h2a14,14,0,0,0,14-14V64A14,14,0,0,0,224,50ZM210,192a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V102H210ZM226,88a2,2,0,0,1-2,2H32a2,2,0,0,1-2-2V64a2,2,0,0,1,2-2H224a2,2,0,0,1,2,2ZM98,136a6,6,0,0,1,6-6h48a6,6,0,0,1,0,12H104A6,6,0,0,1,98,136Z",
  trash: "M216,50H174V40a22,22,0,0,0-22-22H104A22,22,0,0,0,82,40V50H40a6,6,0,0,0,0,12H50V208a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V62h10a6,6,0,0,0,0-12ZM94,40a10,10,0,0,1,10-10h48a10,10,0,0,1,10,10V50H94ZM194,208a2,2,0,0,1-2,2H64a2,2,0,0,1-2-2V62H194ZM110,104v64a6,6,0,0,1-12,0V104a6,6,0,0,1,12,0Zm48,0v64a6,6,0,0,1-12,0V104a6,6,0,0,1,12,0Z",
} as const;

function ShelfIcon({ name, className }: { name: keyof typeof shelfIcons; className?: string }) {
  return (
    <svg className={className ? `shelfIcon ${className}` : "shelfIcon"} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d={shelfIcons[name]} />
    </svg>
  );
}

function CloseMark() {
  return <ShelfIcon name="close" />;
}

function ChevronMark() {
  return <ShelfIcon name="chevronUp" />;
}

function PinMark() {
  return <ShelfIcon name="pinSlash" />;
}

function EllipsisMark() {
  return <ShelfIcon name="ellipsis" />;
}

function FileMark({ kind }: { kind: "file" | "folder" | "link" }) {
  switch (kind) {
    case "file":
      return <ShelfIcon name="file" className="fileMark" />;
    case "folder":
      return <ShelfIcon name="folder" className="fileMark" />;
    case "link":
      return <ShelfIcon name="link" className="fileMark" />;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function ShelfPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`shelfScene${compact ? " isCompact" : ""}`} aria-label="3つの項目が入ったtemoto for macOSの画面イメージ">
      <div className="sceneLabel sceneLabelTop"><span>ON SCREEN</span><i /></div>
      <div className="appShelf">
        <div className="appShelfHighlight" />
        <div className="appHeader">
          <span className="appCount">3</span>
          <span className="appDrag" aria-hidden="true" />
          <span className="appControl"><PinMark /></span>
          <span className="appControl"><CloseMark /></span>
          <span className="appControl"><ChevronMark /></span>
          <span className="appControl"><EllipsisMark /></span>
        </div>
        <div className="appItems">
          <div className="appItem">
            <FileMark kind="file" />
            <span><strong>Final-cut.mov</strong><small>1.82 GB · Movie</small></span>
            <span className="appItemMore"><EllipsisMark /></span>
          </div>
          <div className="appItem">
            <FileMark kind="folder" />
            <span><strong>Brand assets</strong><small>12 items · Folder</small></span>
            <span className="appItemMore"><EllipsisMark /></span>
          </div>
          <div className="appItem">
            <FileMark kind="link" />
            <span><strong>Reference board</strong><small>www.figma.com</small></span>
            <span className="appItemMore"><EllipsisMark /></span>
          </div>
        </div>
        <div className="appActions" aria-hidden="true">
          <span><ShelfIcon name="drag" /></span>
          <span><ShelfIcon name="clipboard" /></span>
          <span><ShelfIcon name="copy" /></span>
          <span><ShelfIcon name="folderPlus" /></span>
          <span><ShelfIcon name="archive" /></span>
          <span><ShelfIcon name="trash" /></span>
        </div>
      </div>
      <div className="sceneLabel sceneLabelBottom"><i /><span>230 × 230 PX</span></div>
      <div className="shortcutTag"><kbd>⌥</kbd><span>+</span><kbd>⇥</kbd><small>ADD FROM FINDER</small></div>
    </div>
  );
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
    <div className={`chromeScene${compact ? " isCompact" : ""}`} aria-label="temoto for Chromeのランチャー画面イメージ">
      <div className="chromePopup">
        <div className="chromePopupHeader">
          <p>temoto <span className="chromeFor">for Chrome</span></p>
          <span className="chromeSettings" aria-hidden="true"><ChromeSettingsMark /></span>
        </div>
        <div className="chromeGrid">
          {chromeTools.map((tool) => (
            <div className="chromeCell" key={tool.name}>
              {tool.name === "Video Speed" ? <small>1.5x</small> : null}
              <ChromeToolIcon path={tool.path} />
              <span>{tool.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HubScene() {
  return (
    <div className="hubScene" aria-hidden="true">
      <div className="hubPane">
        <span>MACOS</span>
        <ShelfPreview compact />
      </div>
      <div className="hubPane">
        <span>CHROME</span>
        <ChromePreview compact />
      </div>
    </div>
  );
}

function TransferVisual() {
  return (
    <div className="transferVisual" aria-hidden="true">
      <div className="transferNode"><FileMark kind="file" /><span>Finder</span></div>
      <div className="transferLine"><i /><i /></div>
      <div className="transferShelf"><TemotoMark /><span>3</span></div>
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

function LocationModes() {
  return (
    <div className="locationModes" aria-hidden="true">
      <figure>
        <div className="locationCard">
          <PinMark />
          <b />
          <CloseMark />
        </div>
        <figcaption>ON SCREEN</figcaption>
      </figure>
      <figure>
        <div className="locationCard isMenuBar">
          <span className="menuBarChip"><TemotoMark /></span>
        </div>
        <figcaption>MENU BAR</figcaption>
      </figure>
    </div>
  );
}

export default function Home() {
  return (
    <main id="top">
      <nav className="nav shell" aria-label="メインナビゲーション">
        <a className="brand" href="#top" aria-label="temoto トップへ"><TemotoMark />temoto</a>
        <div className="navLinks">
          <a href="#macos">macOS</a>
          <a href="#chrome">Chrome</a>
        </div>
        <a className="navGitHub" href={repositoryUrl} aria-label="GitHub"><span>GitHub</span><i aria-hidden="true">↗</i></a>
      </nav>

      <section className="hero shell">
        <div className="heroCopy">
          <p className="eyebrow"><span /> KEEP IT CLOSE</p>
          <h1><JapaneseText>手元に、置いておく。</JapaneseText></h1>
          <p className="lead">
            <JapaneseText>temotoは、作業の途中にあるものを近くに残すための小さな道具。Macではファイルとリンクの棚。Chromeでは、ページを試す6つの道具。</JapaneseText>
          </p>
          <div className="heroActions">
            <a className="button primary" href="#macos">macOS を見る <span aria-hidden="true">↓</span></a>
            <a className="button ghost" href="#chrome">Chrome を見る <span aria-hidden="true">↓</span></a>
          </div>
          <p className="requirements">Open source　·　No account　·　macOS / Chrome</p>
        </div>
        <HubScene />
      </section>

      <section className="signalStrip" aria-label="temotoの製品">
        <div className="shell signalInner">
          <p>Keep it close.<br /><span>Keep moving.</span></p>
          <dl>
            <div><dt>01</dt><dd>MACOS SHELF</dd></div>
            <div><dt>02</dt><dd>CHROME TOOLS</dd></div>
            <div><dt>03</dt><dd>ZERO ACCOUNT</dd></div>
          </dl>
        </div>
      </section>

      <section className="section shell" id="products">
        <div className="sectionHeading">
          <p className="eyebrow"><span /> CHOOSE A TOOL</p>
          <h2><JapaneseText>使う場所に合わせた、2つのtemoto。</JapaneseText></h2>
          <p><JapaneseText>データも設定も共有しません。手元に残したいものが違うだけです。</JapaneseText></p>
        </div>
        <div className="productPick">
          <a className="productCard" href="#macos">
            <div className="productMeta"><span>FOR MACOS</span><em>v1.1.3</em></div>
            <div className="productVisual"><TemotoMark /></div>
            <h3>temoto for macOS</h3>
            <p><JapaneseText>移動する前に、置いておく。</JapaneseText></p>
            <small><JapaneseText>ファイル、フォルダ、URL、テキストを、画面の上かメニューバーへ。</JapaneseText></small>
          </a>
          <a className="productCard" href="#chrome">
            <div className="productMeta"><span>FOR CHROME</span><em>0.1.7</em></div>
            <div className="productVisual isChrome"><ChromeMark /></div>
            <h3>temoto for Chrome</h3>
            <p><JapaneseText>試す道具を、タブのそばに。</JapaneseText></p>
            <small>Color Picker, Screenshot, Video Speed, Environments, Site Reset, Inspect</small>
          </a>
        </div>
      </section>

      <section className="productBlock" id="macos">
        <div className="productHero shell">
          <div className="heroCopy">
            <p className="eyebrow"><span /> TEMOTO FOR MACOS</p>
            <h2><JapaneseText>移動する前に、置いておく。</JapaneseText></h2>
            <p className="lead">
              <JapaneseText>ファイルやリンクを一時的に置ける小さな棚。ウィンドウを行き来する手間を減らして、作業の流れを止めません。</JapaneseText>
            </p>
            <p className="requirements">v1.1.3　·　macOS 26+　·　Apple Silicon / Intel　·　Open source</p>
          </div>
          <ShelfPreview />
        </div>

        <div className="section shell">
          <div className="sectionHeading">
            <p className="eyebrow"><span /> WHY MACOS</p>
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
        </div>

        <div className="workflow">
          <div className="shell workflowGrid">
            <div className="workflowIntro">
              <p className="eyebrow"><span /> HOW IT WORKS</p>
              <h2><JapaneseText>選ぶ。置く。取り出す。</JapaneseText></h2>
              <p><JapaneseText>Finderで選んだものを Option + Tab で棚へ。表示の切り替えは Option + Shift + Tab です。</JapaneseText></p>
              <div className="shortcutStack">
                <div className="bigShortcut"><kbd>option</kbd><span>+</span><kbd>tab</kbd></div>
                <div className="bigShortcut"><kbd>option</kbd><span>+</span><kbd>shift</kbd><span>+</span><kbd>tab</kbd></div>
              </div>
            </div>
            <ol className="workflowSteps">
              <li><span>01</span><div><h3><JapaneseText>Finderで選ぶ</JapaneseText></h3><p><JapaneseText>ファイル、フォルダ、または複数の項目を選択します。</JapaneseText></p></div></li>
              <li><span>02</span><div><h3><JapaneseText>Option + Tabで置く</JapaneseText></h3><p><JapaneseText>選択した項目が、いちばん手前のtemotoへ追加されます。</JapaneseText></p></div></li>
              <li><span>03</span><div><h3><JapaneseText>好きな場所へ取り出す</JapaneseText></h3><p><JapaneseText>移動先を開き、棚からドラッグ。まとめて移動、コピー、ZIP化もできます。</JapaneseText></p></div></li>
            </ol>
          </div>
        </div>

        <div className="section installSection shell">
          <div className="installHeading">
            <p className="eyebrow"><span /> GET MACOS</p>
            <h2><JapaneseText>Macに、小さな棚を。</JapaneseText></h2>
            <p><JapaneseText>macOS版にアカウントも設定画面もありません。ダウンロードしてApplicationsへ移すだけで使い始められます。</JapaneseText></p>
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
            <p className="requirements">0.1.7　·　Chrome 116+　·　English UI　·　Processed locally</p>
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
            <p><JapaneseText>Chrome Web Storeへの公開は準備中です。いまはソースから中身を確認できます。</JapaneseText></p>
          </div>
          <div className="installOptions">
            <article className="installCard">
              <div className="installMeta"><span>CHROME WEB STORE</span><em>01</em></div>
              <h3><JapaneseText>公開の準備中</JapaneseText></h3>
              <p><JapaneseText>ストアへの提出はまだ完了していません。公開までのあいだ、インストール用のストアリンクは置きません。</JapaneseText></p>
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

      <section className="finalCta shell">
        <p>Keep it close.</p>
        <h2><JapaneseText>手元の道具を、選ぶ。</JapaneseText></h2>
        <div className="finalActions">
          <a className="button primary" href={downloadUrl}>temoto for macOS <span aria-hidden="true">↘</span></a>
          <a className="button ghost" href={chromeSourceUrl}>temoto for Chrome <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><TemotoMark />temoto</a>
        <p>© 2026 temoto</p>
        <div>
          <a href={repositoryUrl}>GitHub</a>
          <a href={`${repositoryUrl}/issues`}>Issues</a>
          <a href="#macos">macOS</a>
          <a href="#chrome">Chrome</a>
        </div>
      </footer>
    </main>
  );
}
