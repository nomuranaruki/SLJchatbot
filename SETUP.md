# SLJ Chatbot セットアップガイド

このドキュメントでは、SLJ Chatbotプロジェクトのローカル開発環境をセットアップする手順を説明します。

## 📋 必要な環境

- Node.js 18.0以上
- npm または yarn
- PostgreSQL 12以上
- Git

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/nomuranaruki/SLJchatbot.git
cd SLJchatbot
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成します：

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集して、以下の値を設定してください：

#### 必須設定

1. **NextAuth.js Secret**
   ```bash
   NEXTAUTH_SECRET="your-secret-key-here"
   ```
   ランダムな32文字以上の文字列を設定してください。

2. **PostgreSQL Database**
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/slj_chatbot"
   ```
   お使いのPostgreSQLの接続情報に変更してください。

#### オプション設定（各機能を使用する場合）

3. **Google OAuth認証**
   - [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
   - OAuth 2.0 クライアントIDを作成
   - 認証済みリダイレクトURIに`http://localhost:3000/api/auth/callback/google`を追加
   
   ```bash
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **OpenAI API（AI チャット機能）**
   - [OpenAI API](https://platform.openai.com/api-keys)でAPIキーを取得
   
   ```bash
   OPENAI_API_KEY="your-openai-api-key"
   ```

5. **Google Drive連携**
   - Google Cloud Consoleでサービスアカウントを作成
   - サービスアカウントキーをJSON形式でダウンロード
   
   ```bash
   GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

6. **Slack連携**
   - [Slack API](https://api.slack.com/apps)でアプリを作成
   - Bot Tokenとサイニングシークレットを取得
   
   ```bash
   SLACK_BOT_TOKEN="xoxb-..."
   SLACK_SIGNING_SECRET="..."
   ```

### 4. データベースのセットアップ

```bash
# Prismaのセットアップ
npx prisma generate
npx prisma db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは`http://localhost:3000`でアクセスできます。

## 🧪 テストの実行

```bash
# 全てのテストを実行
npm run test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

## 📁 ディレクトリ構造

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard pages
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── auth/          # Authentication components
│   ├── chat/          # Chat interface
│   ├── documents/     # Document management
│   └── upload/        # File upload
├── lib/               # Utility functions
├── types/             # TypeScript definitions
└── __tests__/         # Test files
```

## 🔧 主な機能

### ✅ 実装済み機能
- Google OAuth認証
- ファイルアップロード・管理
- ドキュメント検索・フィルタリング
- ユーザー管理
- 監査ログ
- システム分析
- 外部連携（Google Drive、Slack）

### ⚠️ API キーが必要な機能
- **AI チャット機能**: OpenAI API キーが必要
- **Google Drive連携**: Google サービスアカウントキーが必要
- **Slack連携**: Slack Bot Token が必要

## 🚀 本番環境へのデプロイ

### Vercel へのデプロイ

1. [Vercel](https://vercel.com/)にログイン
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ

### その他のプラットフォーム

- Docker を使用する場合は`Dockerfile`を参照
- その他のプラットフォーム固有の設定は各プラットフォームのドキュメントを参照

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🆘 サポート

問題が発生した場合は、[Issues](https://github.com/nomuranaruki/SLJchatbot/issues)ページで報告してください。
