# YouTube Comments Sidebar for Safari

YouTubeの動画ページを次のように並べ替えるSafari Web Extensionです。

- 動画: 左上
- コメント: 動画の右側に固定し、コメント欄だけを独立スクロール
- おすすめ動画: 動画情報の下に複数列グリッドで表示
- 画面幅が1100px以下の場合: 動画 → コメント → おすすめの縦並び

拡張機能のポップアップから、有効/無効とコメント欄の幅（360〜640px）を変更できます。

## 必要なもの

- macOS
- Safari 14以降
- Xcode（App Storeからインストール）

## Safari用プロジェクトを作る

ターミナルで、このREADMEがあるフォルダへ移動してから次を実行します。

```bash
xcrun safari-web-extension-packager . \
  --project-location ../YouTubeCommentsSidebar-SafariProject \
  --app-name "YouTube Comments Sidebar" \
  --bundle-identifier "com.example.YouTubeCommentsSidebar" \
  --macos-only \
  --swift \
  --copy-resources
```

コマンドが成功すると、Xcodeでプロジェクトが開きます。

`com.example.YouTubeCommentsSidebar` は例です。`example` を自分が管理する一意な名前へ変更してください。`--project-location` は必ず元の拡張機能フォルダの外を指定します。元フォルダの内側を指定すると、`--copy-resources` によって生成プロジェクト自身が機能拡張へ再帰的にコピーされます。

機能拡張のBundle Identifierは、親アプリのBundle Identifierに `.Extension` を加えた形にします。大文字小文字を含め、必ず親アプリの識別子から始まる値にしてください。

古いXcodeで `safari-web-extension-packager` が見つからない場合は、コマンド名だけを以前の名称 `safari-web-extension-converter` に置き換えてください。

## XcodeとSafariで有効にする

1. Xcode上部の実行先を `My Mac` にして、Run（▶）を押します。
2. 起動したアプリでSafari機能拡張を開きます。
3. Safariの「設定」→「機能拡張」で `YouTube Comments Sidebar` をオンにします。
4. Webサイトアクセスを尋ねられたら `youtube.com` を許可します。
5. YouTubeの動画ページを再読み込みします。

署名が必要な場合は、親アプリとExtensionの両ターゲットで `Signing & Capabilities` を開き、同じTeamを選択します。

開発中に未署名の機能拡張を使う場合は、Safariの「設定」→「詳細」で開発者向け機能を表示し、「開発」メニューから未署名の機能拡張を許可する必要があります。Safariのバージョンによって表記が少し異なります。

## ファイル構成

```text
manifest.json          Safari Web Extensionの設定
content/content.js     YouTube要素の移動、復元、再描画監視
content/styles.css     2列＋下段レイアウト
popup/                 有効/無効と幅の設定画面
```

## 補足

YouTubeは画面構造を随時変更します。表示されなくなった場合は、`content/content.js` の `getWatchElements()` にある要素セレクターを現在のYouTubeに合わせて調整してください。

## 権限とプライバシー

- Webサイトアクセスは `https://www.youtube.com/*` のみに限定しています。
- `storage` 権限は、有効/無効とコメント欄の幅を端末内へ保存するために使用します。
- 外部サーバーへの通信、閲覧履歴の収集、解析用コードは含みません。
