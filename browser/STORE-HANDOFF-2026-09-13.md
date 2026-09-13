# Chrome Web Store 提出前の引き継ぎ

2026-09-13時点。ローカルの提出素材は準備済み。アップロード、審査提出、push、サイト公開は行っていません。現在のstable Google Chromeでの最終確認と、ストア管理画面の確認が残っています。

## アップロードするファイル

| 商品 | 公開ページで確認した版 | 今回のZIP | 既存のストアID |
| --- | --- | --- | --- |
| temoto for Chrome | 0.2.0 | [1.1.0](temoto-chrome/release/temoto-for-chrome-v1.1.0.zip) | `gcncgknjklghkoeiapcbdghodepnllid` |
| temoto Proxy | 1.1.0 | [1.2.0](temoto-proxy/release/temoto-proxy-v1.2.0.zip) | `hohabmdadcdkifcmbclkgnomhhlllnbb` |

新しい商品は作らず、既存商品の更新として扱います。通常版はユーザー指定により1.1.0へ変更しました。Chromeの旧ローカル1.0.0・1.0.1 ZIPは上書きせず残しています。公開ページと管理画面の下書き・審査中バージョンは別の状態です。後者は未確認のため、アップロード時に番号の衝突がないことも確認してください。

| ZIP | サイズ | SHA-256 |
| --- | ---: | --- |
| Chrome 1.1.0 | 379,998 bytes | `01708d96674c7cbeb921f71c33639224362fe6d858d26d4a4215bffd8cde3086` |
| Proxy 1.2.0 | 89,981 bytes | `a6bbd9e4bd688c3397319961be2e1c7f2a72efe162a462dc92177bc9a582c242` |

両ZIPの整合性、ルートのmanifest、版番号、公開鍵から導出した既存ストアID、`key`の除去、ビルドとの全ファイル照合を確認済み。Chromeは46ファイル、Proxyは23ファイル。開発用studyやソースマップの混入なし。ZIPはローカル成果物のため、再生成するとハッシュが変わる場合があります。

Chrome 1.1.0は再テスト・再ビルド済み。1.0.1 ZIPとの比較で、変更はmanifestの版番号だけであることを確認しました。機能・権限・画像の変更はありません。

## ストアの文章・画像

- [Chrome：日英の掲載文、権限説明、審査担当者向け操作手順](temoto-chrome/store/listing.md)
- [Proxy：日英の掲載文、権限説明、審査担当者向け操作手順](temoto-proxy/store/listing.md)
- Chrome画像：[英語](temoto-chrome/store/assets/screenshot-launcher-1280x800.jpg)、[日本語](temoto-chrome/store/assets/screenshot-launcher-ja-1280x800.jpg)、[小型プロモ](temoto-chrome/store/assets/promo-small-440x280.jpg)
- Proxy画像：[英語ポップアップ](temoto-proxy/store/assets/screenshot-popup-1280x800.jpg)、[日本語ポップアップ](temoto-proxy/store/assets/screenshot-popup-ja-1280x800.jpg)、[英語管理画面](temoto-proxy/store/assets/screenshot-manager-1280x800.png)、[日本語管理画面](temoto-proxy/store/assets/screenshot-manager-ja-1280x800.png)、[小型プロモ](temoto-proxy/store/assets/promo-small-440x280.jpg)
- 128pxアイコン：[Chrome](temoto-chrome/public/icons/icon-128.png)、[Proxy](temoto-proxy/dist/client/icons/icon-128.png)

スクリーンショット6枚は1280 × 800、小型プロモ2枚は440 × 280。各画像の寸法・不透明形式・表示を確認済み。ビルド済みUIをサンプルデータで撮影したもので、Chromeにインストールした拡張の動作証明ではありません。[再撮影手順](shared/STORE-CAPTURE.md)も用意しています。

## 変更内容

Chrome：6ツールのポップアップと設定画面を黒・白・紫の共通テーマへ更新。B/Jointアイコンを採用。拡張の更新・再読み込み後に残った動画ハンドラーが `Extension context invalidated` を起こすケースを修正。

Proxy：同じテーマと中抜きのB/Jointアイコンへ更新。管理画面は接続設定を先頭にまとめ、追加設定を折りたたみ、入力欄のフォーカス線を整理。別拡張としての配布、安全なOff、セッション限定認証は維持。

公開版に対応する手元の旧ZIPと比較すると、両商品の権限配列・ホスト権限は増えていません。ただしChromeには既存の開発変更としてWebMCPのcontent scriptが追加されています。明示的に有効化したページに限り、そのタブの拡張の有無・動画速度を扱う連携です。この差分を掲載文・プライバシーポリシーへ反映しました。「権限が同じ」ことと「実行コードが同じ」ことを混同しないでください。

## 確認結果

- Chrome：`npm test` 44件、`npm run package`（build・パッケージ検証を含む）、`npm run test:sites` 4件が成功。
- Proxy：`npm run check` 41件、`npm run package` が成功。
- サイト：`npm run lint`、`npm test`（buildを含む）8件が成功。ストア画像の正規コピーも既存スクリプトで同期済み。公開はしていません。
- 自動テスト合計97件成功。UI撮影はローカルプレビューで確認済み。撮影中の出所未特定のMutationObserverエラー1件は、拡張の実行環境由来か未確定のため「コンソールエラーなし」とは判定していません。

## 提出前に残っていること

1. **現在のstable Google Chromeで最終確認。** 新ZIPと同一ビルドの各 `dist/client` を読み込み、6ツール、更新後の動画ページ、Proxyの有効化・安全なOff・認証失敗・競合を確認。以前のユーザー実機確認とは分けて記録してください。手順は各listingにあります。
2. **プライバシーポリシーを公開。** ローカルで修正した [Chrome](temoto-chrome/PRIVACY.md) と [Proxy](temoto-proxy/PRIVACY.md) を公開リポジトリへ反映する必要があります。今回pushはしていません。
3. **Chrome側の旧URLを差し替え。** 公開ストアのChromeポリシーリンクは旧 `shelfdrop` リポジトリを指していました。更新後は `https://github.com/hayashiii-ghub/temoto/blob/main/browser/temoto-chrome/PRIVACY.md`。Proxy側は同じ `temoto` リポジトリの `browser/temoto-proxy/PRIVACY.md` を使います。公開後の内容と到達性を確認してください。
4. **管理画面を確認して更新。** 接続先ブラウザーから管理画面へアクセスできず、下書き・審査状態・配布地域・宣誓欄は未確認です。既存商品へZIP、日英の文章・画像を入れ、権限理由とデータ利用の宣誓を実態に合わせて確認。手動公開を希望するなら審査後の自動公開を避ける設定も確認してください。
5. **最後に審査へ提出。** アップロードの成功、審査提出、審査通過、公開はそれぞれ別の完了条件です。

画像寸法の基準は[公式の画像ガイド](https://developer.chrome.com/docs/webstore/images)、更新手順は[公式の更新ガイド](https://developer.chrome.com/docs/webstore/update)を参照しています。
