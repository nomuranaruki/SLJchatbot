# 認証情報設定ガイド

SLJ Chatbotの各機能を使用するために必要な認証情報の設定方法を説明します。

## 🔧 環境変数の設定

`.env.local`ファイルを作成し、以下の手順で各サービスのAPIキーを設定してください。

```bash
cp .env.example .env.local
```

## 1. 🔐 NextAuth.js Secret（必須）

セキュアなランダム文字列を生成してください：

```bash
# ランダムなシークレットキーを生成
openssl rand -base64 32
```

生成された文字列を`.env.local`に設定：
```bash
NEXTAUTH_SECRET="生成されたランダム文字列"
```

## 2. 🗄️ PostgreSQL Database（必須）

ローカルのPostgreSQLサーバーを起動し、データベースを作成：

```bash
# PostgreSQLに接続
psql -U postgres

# データベースを作成
CREATE DATABASE slj_chatbot;
```

接続情報を`.env.local`に設定：
```bash
DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/slj_chatbot"
```

## 3. 🔑 Google OAuth（ログイン機能用）

### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類：「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに追加：
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### 環境変数の設定

```bash
GOOGLE_CLIENT_ID="あなたのGoogleクライアントID"
GOOGLE_CLIENT_SECRET="あなたのGoogleクライアントシークレット"
```

## 4. 🤖 OpenAI API（AI チャット機能用）

### OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. アカウントにログインまたは新規作成
3. 「API Keys」セクションに移動
4. 「Create new secret key」をクリック
5. 生成されたAPIキーをコピー

### 環境変数の設定

```bash
OPENAI_API_KEY="sk-proj-あなたのOpenAI APIキー"
```

## 5. 📁 Google Drive API（Drive連携用）

### サービスアカウントの作成

1. Google Cloud Consoleで同じプロジェクトを使用
2. 「APIとサービス」→「認証情報」に移動
3. 「認証情報を作成」→「サービスアカウント」を選択
4. サービスアカウント名を入力
5. 「キーを作成」→「JSON」を選択してダウンロード

### 環境変数の設定

ダウンロードしたJSONファイルから以下の情報を抽出：

```bash
GOOGLE_CLIENT_EMAIL="サービスアカウント@プロジェクトID.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n秘密鍵の内容\n-----END PRIVATE KEY-----"
```

## 6. 💬 Slack API（Slack連携用）

### Slackアプリの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. アプリ名とワークスペースを選択
5. 「OAuth & Permissions」でBot Token Scopesを設定：
   - `chat:write`
   - `files:write`
   - `channels:read`

### 環境変数の設定

```bash
SLACK_BOT_TOKEN="xoxb-あなたのSlack Bot Token"
SLACK_SIGNING_SECRET="あなたのSlack Signing Secret"
```

## 🚀 データベースのセットアップ

環境変数を設定したら、データベースを初期化：

```bash
# Prismaの初期化
npx prisma generate
npx prisma db push
```

## ✅ 設定の確認

全ての設定が完了したら、アプリケーションを起動：

```bash
npm run dev
```

ブラウザで`http://localhost:3000`にアクセスし、以下を確認：

- ✅ Googleログインが動作する
- ✅ ファイルアップロードが動作する
- ✅ AI チャットが動作する（OpenAI APIキー設定時）
- ✅ 外部連携が動作する（各APIキー設定時）

## 🔒 セキュリティ注意事項

- 本番環境では必ず強力なシークレットキーを使用
- APIキーは絶対にGitリポジトリにコミットしない
- `.env.local`ファイルは`.gitignore`に含まれていることを確認
- 定期的にAPIキーをローテーション

## 🆘 トラブルシューティング

### ログインできない場合

1. Google OAuth設定を確認
2. リダイレクトURIが正しいか確認
3. ブラウザのキャッシュをクリア

### AI チャットが動作しない場合

1. OpenAI APIキーが正しいか確認
2. OpenAIアカウントに十分なクレジットがあるか確認
3. APIキーの権限を確認

### データベースエラーの場合

1. PostgreSQLサーバーが起動しているか確認
2. データベースURL接続情報を確認
3. `npx prisma db push`を再実行
