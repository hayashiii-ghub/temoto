export type UiLocale = "en" | "ja";

type Replacements = Record<string, string | number>;

const ja: Record<string, string> = {
  "temoto Proxy — Profiles": "temoto Proxy — プロファイル",
  "Open profile manager": "プロファイル管理を開く",
  "Reading Chrome settings…": "Chromeの設定を確認中…",
  "Proxy state": "プロキシの状態",
  "Checking the effective browser configuration.": "ブラウザで有効な設定を確認しています。",
  "Loading…": "読み込み中…",
  Test: "テスト",
  Profiles: "プロファイル",
  PROFILES: "プロファイル",
  Proxy: "プロキシ",
  "Regular windows only unless explicitly enabled": "明示的に有効化しない限り通常ウィンドウのみ",
  Manage: "管理",
  "New profile": "新しいプロファイル",
  Import: "読み込む",
  Export: "書き出す",
  "NETWORK WORKSPACES": "ネットワークワークスペース",
  "Make browser routing visible and reversible.": "ブラウザの経路を見える状態に。いつでも戻せるように。",
  "Create a profile for a local debugging proxy, staging gateway, PAC configuration or domain-specific route.": "ローカルのデバッグプロキシ、ステージングゲートウェイ、PAC設定、ドメイン別経路をプロファイルとして作成します。",
  PROFILE: "プロファイル",
  "Proxy profile": "プロキシプロファイル",
  Duplicate: "複製",
  Delete: "削除",
  Identity: "基本情報",
  "Name this network workspace so its impact is obvious.": "影響範囲が分かる名前をネットワークワークスペースにつけます。",
  "Profile name": "プロファイル名",
  Accent: "アクセント",
  "Profile type": "プロファイルの種類",
  "Fixed proxy": "固定プロキシ",
  "One or per protocol": "共通またはプロトコル別",
  "Domain routing": "ドメインルーティング",
  "Generated PAC rules": "生成されたPACルール",
  "Script or URL": "スクリプトまたはURL",
  "Proxy servers": "プロキシサーバー",
  "Route all traffic through one endpoint, or define protocol-specific endpoints.": "すべての通信を1つの接続先へ送るか、プロトコル別に接続先を指定します。",
  "Use protocol-specific proxies": "プロトコル別のプロキシを使用",
  "HTTP, HTTPS and fallback can use different servers.": "HTTP、HTTPS、フォールバックで別々のサーバーを使用できます。",
  "Default proxy": "既定のプロキシ",
  "HTTP proxy": "HTTPプロキシ",
  "HTTPS proxy": "HTTPSプロキシ",
  "FALLBACK proxy": "フォールバックプロキシ",
  "HTTP requests": "HTTPリクエスト",
  "HTTPS requests": "HTTPSリクエスト",
  Fallback: "フォールバック",
  "Routing rules": "ルーティングルール",
  "Rules are evaluated from top to bottom. Generated PAC stays inside this extension.": "ルールは上から順に評価され、生成されたPACは拡張機能内に保存されます。",
  "When no rule matches": "一致するルールがない場合",
  "Use proxy": "プロキシを使用",
  "Connect directly": "直接接続",
  "＋ Add domain rule": "＋ ドメインルールを追加",
  "PAC configuration": "PAC設定",
  "Use an inline FindProxyForURL function or an explicit HTTP(S) PAC URL.": "インラインのFindProxyForURL関数、または明示的なHTTP(S) PAC URLを使用します。",
  Source: "ソース",
  "Inline script": "インラインスクリプト",
  Mandatory: "必須",
  "Block fallback to direct if PAC fails.": "PACが失敗した場合に直接接続へフォールバックしません。",
  "A mandatory or remote PAC can interrupt browsing. temoto validates the format but cannot prove remote PAC behavior.": "必須またはリモートのPACは閲覧を中断する可能性があります。temotoは形式を検証しますが、リモートPACの動作までは保証できません。",
  "Direct connections": "直接接続",
  "One Chrome host pattern per line. These destinations bypass the proxy.": "1行につき1つのChromeホストパターンを入力します。これらの宛先はプロキシを経由しません。",
  "Bypass list": "バイパス一覧",
  Authentication: "認証",
  "Passwords live only in Chrome session storage and disappear when the browser session ends.": "パスワードはChromeのセッションストレージにのみ保持され、ブラウザセッション終了時に消去されます。",
  "Proxy authentication": "プロキシ認証",
  "Credentials are sent only to the explicitly allowed proxy hosts below.": "認証情報は、以下で明示的に許可したプロキシホストにのみ送信されます。",
  Username: "ユーザー名",
  "Session password": "セッションパスワード",
  "Not stored on disk": "ディスクには保存されません",
  "Allowed proxy hosts · one per line": "許可するプロキシホスト · 1行につき1つ",
  "Connection test": "接続テスト",
  "Send a credential-free HEAD request to a public destination without following redirects.": "認証情報を含まないHEADリクエストを、リダイレクトを追跡せず公開宛先へ送信します。",
  "Test URL": "テストURL",
  "Run test": "テストを実行",
  "Incognito scope": "シークレットモードの範囲",
  "Regular windows always use an isolated regular-only setting.": "通常ウィンドウでは常に分離された通常ウィンドウ専用設定を使用します。",
  "Apply the active profile in incognito": "有効なプロファイルをシークレットモードにも適用",
  "Requires explicit access in Chrome's extension settings.": "Chromeの拡張機能設定で明示的な許可が必要です。",
  "Session only": "セッションのみ",
  "Clear the incognito setting when the incognito session ends.": "シークレットセッション終了時に設定を消去します。",
  "Saving an active profile reapplies and verifies it.": "有効なプロファイルを保存すると再適用して検証します。",
  "Save & activate": "保存して有効化",
  "Save profile": "プロファイルを保存",
  Type: "種類",
  Host: "ホスト",
  Port: "ポート",
  "Another extension currently has higher priority. Disable it before activating a temoto profile.": "別の拡張機能が優先されています。temotoのプロファイルを有効にする前に無効化してください。",
  "Chrome or an administrator policy controls this setting. temoto will not overwrite it.": "Chromeまたは管理者ポリシーがこの設定を管理しています。temotoは上書きしません。",
  "Chrome's effective proxy no longer matches this profile. Reapply it or turn temoto off.": "Chromeで有効なプロキシがこのプロファイルと一致しません。再適用するかtemotoをオフにしてください。",
  "The selected profile is saved but is not currently applied.": "選択したプロファイルは保存されていますが、現在は適用されていません。",
  "Chrome reports a temoto-controlled setting that is not linked to a saved profile.": "Chromeが、保存済みプロファイルに紐づかないtemoto管理の設定を報告しています。",
  "Another extension has higher priority. temoto will not overwrite it.": "別の拡張機能が優先されています。temotoは上書きしません。",
  "Chrome or an administrator policy controls proxy settings.": "Chromeまたは管理者ポリシーがプロキシ設定を管理しています。",
  "The effective Chrome setting changed after activation. Reapply the profile or turn temoto off.": "有効化後にChromeの設定が変更されました。プロファイルを再適用するかtemotoをオフにしてください。",
  "A profile is selected but Chrome is not currently using it.": "プロファイルが選択されていますが、Chromeでは現在使用されていません。",
  "Chrome reports a temoto-controlled setting that is not linked to a saved profile. Turn temoto off to clear it.": "Chromeが、保存済みプロファイルに紐づかないtemoto管理の設定を報告しています。temotoをオフにして消去してください。",
  "Chrome's default connection": "Chromeの既定接続",
  "temoto is not overriding your proxy settings.": "temotoはプロキシ設定を上書きしていません。",
  "Turn off safely": "安全にオフ",
  "Select a profile below": "下からプロファイルを選択",
  "Create your first proxy profile": "最初のプロキシプロファイルを作成",
  "Create a profile": "プロファイルを作成",
  "temoto control cleared": "temotoの制御を解除しました",
  "Connection test failed": "接続テストに失敗しました",
  "temoto Proxy could not complete this action": "temoto Proxyで操作を完了できませんでした",
  "Profile not found": "プロファイルが見つかりません",
  ACTIVE: "有効",
  FIXED: "固定",
  ROUTED: "ルーティング",
  "PAC URL": "PAC URL",
  "PAC script": "PACスクリプト",
  "No endpoint": "接続先なし",
  "Proxy active": "プロキシ有効",
  "Proxy off": "プロキシオフ",
  "Controlled by another extension": "別の拡張機能が管理中",
  "Controlled by browser policy": "ブラウザポリシーが管理中",
  "Unrecognized temoto setting": "未認識のtemoto設定",
  "Profile not applied": "プロファイル未適用",
  "Proxy settings changed": "プロキシ設定が変更されました",
  "Unknown state": "状態不明",
  "{name} is active": "{name}を有効にしました",
  "{name} · active": "{name} · 有効",
  Active: "有効",
  ON: "オン",
  "Session password is ready. Leave the password field blank to keep it.": "セッションパスワードは準備済みです。維持する場合はパスワード欄を空のままにしてください。",
  "No session password is loaded. It will be requested again after Chrome restarts.": "セッションパスワードは読み込まれていません。Chrome再起動後にもう一度入力が必要です。",
  "Rule {number} pattern": "ルール{number}のパターン",
  "Rule {number} action": "ルール{number}の操作",
  "Delete rule {number}": "ルール{number}を削除",
  "USE PROXY": "プロキシを使用",
  DIRECT: "直接接続",
  "No domain rules yet. The fallback below handles every destination.": "ドメインルールはまだありません。以下のフォールバックがすべての宛先を処理します。",
  "No profile is selected": "プロファイルが選択されていません",
  "{name} saved and activated": "{name}を保存して有効化しました",
  "{name} saved": "{name}を保存しました",
  "Save & reapply": "保存して再適用",
  "New profile created": "新しいプロファイルを作成しました",
  "Untitled profile": "名称未設定のプロファイル",
  "Activate this profile before running a connection test": "接続テストの前にこのプロファイルを有効化してください",
  "Profile duplicated": "プロファイルを複製しました",
  "Delete “{name}”?": "「{name}」を削除しますか？",
  " temoto will first clear its active proxy setting.": " temotoは最初に有効なプロキシ設定を解除します。",
  "Profile deleted": "プロファイルを削除しました",
  "Profiles exported without secrets": "機密情報を含めずプロファイルを書き出しました",
  "Replace all saved profiles with this file?\n\nChoose Cancel to merge the imported profiles instead.": "保存済みの全プロファイルをこのファイルで置き換えますか？\n\n読み込んだプロファイルを統合する場合はキャンセルを選択してください。",
  "Profiles replaced — enter passwords again": "プロファイルを置き換えました — パスワードを再入力してください",
  "Profiles merged — test URLs reset": "プロファイルを統合しました — テストURLはリセットされました",
  "Incognito proxy enabled explicitly": "シークレットモードのプロキシを明示的に有効化しました",
  "Incognito proxy cleared": "シークレットモードのプロキシを解除しました",
  "Explicitly applies the active profile only to incognito windows.": "有効なプロファイルをシークレットウィンドウにのみ明示的に適用します。",
  "Enable “Allow in Incognito” for temoto Proxy in Chrome extensions first.": "Chromeの拡張機能設定で、temoto Proxyの「シークレットモードでの実行を許可」を有効にしてください。",
  "Proxy settings are controlled by another extension": "プロキシ設定は別の拡張機能によって管理されています",
  "Proxy settings are controlled by Chrome or an administrator policy": "プロキシ設定はChromeまたは管理者ポリシーによって管理されています",
  "Enable temoto Proxy in Chrome's incognito extension settings first": "Chromeの拡張機能設定で、temoto Proxyのシークレットモードでの実行を先に許可してください",
  "Chrome did not apply the incognito proxy setting": "Chromeでシークレットモードのプロキシ設定を適用できませんでした",
  "Chrome did not clear the incognito proxy setting": "Chromeでシークレットモードのプロキシ設定を解除できませんでした",
  "Chrome did not apply the proxy setting": "Chromeでプロキシ設定を適用できませんでした",
  "Chrome did not clear the regular proxy setting": "Chromeで通常ウィンドウのプロキシ設定を解除できませんでした",
  "Authentication is not enabled for this profile": "このプロファイルでは認証が有効になっていません",
  "A session password is required": "セッションパスワードが必要です",
  "Session password is too long": "セッションパスワードが長すぎます",
  "Active profile not found": "有効なプロファイルが見つかりません",
  "Diagnostic URL must use a public network destination": "診断URLには公開ネットワークの宛先を指定してください",
  "Bypass entries must be single-line Chrome host patterns": "バイパス項目は1行のChromeホストパターンで入力してください",
  "PAC source is required": "PACソースは必須です",
  "PAC source is too large": "PACソースが大きすぎます",
  "PAC URL is too long": "PAC URLが長すぎます",
  "PAC URL must begin with http:// or https://": "PAC URLはhttp://またはhttps://で始めてください",
  "PAC URL must not contain embedded credentials": "PAC URLに認証情報を含めることはできません",
  "PAC script must define FindProxyForURL": "PACスクリプトにFindProxyForURLを定義してください",
  "Profile must be an object": "プロファイルの形式が正しくありません",
  "Profile id is required": "プロファイルIDは必須です",
  "At least one protocol proxy is required": "1つ以上のプロトコル別プロキシが必要です",
  "Proxy username is too long": "プロキシのユーザー名が長すぎます",
  "Authentication supports up to 20 proxy hosts": "認証に指定できるプロキシホストは20件までです",
  "Authentication host is too long": "認証ホストが長すぎます",
  "Authentication hosts must be ASCII hostnames or IP addresses": "認証ホストにはASCIIのホスト名またはIPアドレスを指定してください",
  "Diagnostic URL is too long": "診断URLが長すぎます",
  "Diagnostic URL must begin with http:// or https://": "診断URLはhttp://またはhttps://で始めてください",
  "Diagnostic URL must not contain embedded credentials": "診断URLに認証情報を含めることはできません",
  "CIDR rules must use an IPv4 prefix between 0 and 32": "CIDRルールには0から32のIPv4プレフィックスを指定してください",
  "Profiles must be an array": "プロファイル一覧の形式が正しくありません",
  "Profile export is too large": "プロファイルの書き出しデータが大きすぎます",
  "This is not a temoto Proxy export": "temoto Proxyの書き出しデータではありません",
  "This profile export uses an unsupported schema version": "このプロファイル書き出しの形式には対応していません",
  "Export must contain up to 200 profiles": "書き出しデータに含められるプロファイルは200件までです",
  "Invalid URL": "URLの形式が正しくありません",
};

const jaPatterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(.+) scheme is unsupported$/, (match) => `${ja[match[1]] || match[1]}の方式には対応していません`],
  [/^(.+) host is required$/, (match) => `${ja[match[1]] || match[1]}のホストは必須です`],
  [/^(.+) host is too long$/, (match) => `${ja[match[1]] || match[1]}のホストが長すぎます`],
  [/^(.+) host must not include a URL or port$/, (match) => `${ja[match[1]] || match[1]}のホストにURLやポートを含めることはできません`],
  [/^(.+) host must use ASCII hostname or IP characters$/, (match) => `${ja[match[1]] || match[1]}のホストにはASCIIのホスト名またはIPアドレスを指定してください`],
  [/^(.+) port must be between 1 and 65535$/, (match) => `${ja[match[1]] || match[1]}のポートは1から65535で指定してください`],
  [/^Bypass list supports up to (\d+) entries$/, (match) => `バイパス一覧は${match[1]}件までです`],
  [/^Routing rule (\d+) needs a valid pattern$/, (match) => `ルーティングルール${match[1]}に有効なパターンを指定してください`],
  [/^Routing rule (\d+) action must be proxy or direct$/, (match) => `ルーティングルール${match[1]}の操作はプロキシまたは直接接続にしてください`],
  [/^Routing rule (\d+) id is too long$/, (match) => `ルーティングルール${match[1]}のIDが長すぎます`],
  [/^Profile name must be 1-(\d+) characters$/, (match) => `プロファイル名は1から${match[1]}文字で入力してください`],
  [/^Routing profiles support up to (\d+) rules$/, (match) => `ルーティングプロファイルのルールは${match[1]}件までです`],
  [/^Chrome could not clear the incognito proxy setting: (.+)$/, (match) => `Chromeでシークレットモードのプロキシ設定を解除できませんでした: ${match[1]}`],
  [/^(.+) is required$/, (match) => `${ja[match[1]] || match[1]}は必須です`],
];

function translateJapanese(source: string): string {
  if (ja[source]) return ja[source];
  for (const [pattern, translate] of jaPatterns) {
    const match = source.match(pattern);
    if (match) return translate(match);
  }
  return source;
}

function requestedLocale(): string {
  const override = new URLSearchParams(globalThis.location?.search || "").get("lang");
  if (override) return override;
  if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) return chrome.i18n.getUILanguage();
  return globalThis.navigator?.language || "en";
}

export function getUiLocale(): UiLocale {
  return requestedLocale().toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function t(source: string, replacements: Replacements = {}): string {
  const template = getUiLocale() === "ja" ? translateJapanese(source) : source;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(replacements, key) ? String(replacements[key]) : match
  ));
}

export function localizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  return t(message);
}

export function localizeDocument(root: Document = document): void {
  root.documentElement.lang = getUiLocale();
  if (getUiLocale() !== "ja") return;
  root.title = t(root.title);
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const value = node.nodeValue || "";
    const trimmed = value.trim();
    if (trimmed && ja[trimmed]) node.nodeValue = value.replace(trimmed, ja[trimmed]);
    node = walker.nextNode();
  }
  for (const element of root.querySelectorAll<HTMLElement>("[aria-label], [title], [placeholder]")) {
    for (const attribute of ["aria-label", "title", "placeholder"] as const) {
      const value = element.getAttribute(attribute);
      if (value && ja[value]) element.setAttribute(attribute, ja[value]);
    }
  }
}
