# Cloudflare Workers による Basic 認証の設定手順

GitHub Pages自体にはサーバー側認証をかけられないため、この Worker が
「認証つきの入口」としてGitHub Pagesの前段に立ちます。閲覧者には
GitHub PagesのURLではなく、この Worker のURL（workers.dev、または
独自ドメイン）を共有してください。

## 前提

- Node.js がインストールされていること
- Cloudflareアカウント（無料プランで可）を持っていること

## 手順

1. このフォルダに移動します。
   ```
   cd cloudflare-worker
   ```

2. Wrangler（Cloudflareの公式CLI）をインストールします。
   ```
   npm install -g wrangler
   ```

3. Cloudflareアカウントにログインします（ブラウザが開き、Cloudflareの
   ログイン・認可画面が表示されます）。
   ```
   wrangler login
   ```

4. Basic認証のID・パスワードをSecretとして設定します（値はコード中に
   書かず、この方法で安全に登録します）。
   ```
   wrangler secret put BASIC_AUTH_USER
   # プロンプトが出たらユーザーIDを入力してEnter

   wrangler secret put BASIC_AUTH_PASS
   # プロンプトが出たらパスワードを入力してEnter
   ```

5. デプロイします。
   ```
   wrangler deploy
   ```

   成功すると、以下のようなURLが表示されます。
   ```
   https://nara-business-map-auth.<あなたのサブドメイン>.workers.dev
   ```
   このURLにアクセスすると、ブラウザがID/パスワードの入力を求める
   ダイアログを表示します。正しい認証情報を入力すると、地図サイトが
   表示されます。

6. 以後、このマップを共有する際は **必ずこの workers.dev のURL** を
   使ってください。GitHub PagesのURL
   （`https://morimori1974.github.io/nara-nakamachi-business-map/`）を
   直接共有すると、Basic認証を経由せずに閲覧できてしまいます
   （検索エンジンには載らない設定にしていますが、URLを直接知っていれば
   閲覧できる状態です）。

## 認証情報を変更したいとき

同じコマンドをもう一度実行すると上書きされます。
```
wrangler secret put BASIC_AUTH_USER
wrangler secret put BASIC_AUTH_PASS
```

## 独自ドメインを使いたい場合

お持ちのドメインをCloudflareに追加（ネームサーバー変更）した上で、
`wrangler.toml` の `routes` のコメントを外し、ご自身のドメインに
書き換えてから `wrangler deploy` してください。
