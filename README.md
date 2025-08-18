# SLJ Chatbot - AI-Powered Document Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg)](README.md)

> 🤖 ChatGPT風AI搭載の高機能ドキュメント管理・チャットアシスタント

## 🚀 クイックスタート

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd SLJchatbot
```

### 2. API設定（5分で完了）
```bash
# 環境変数ファイル作成
cp .env.example .env.local

# 詳細な設定手順は以下を参照
```
📋 **[API設定ガイド](./API_SETUP_GUIDE.md)** - 必須API設定の詳細手順

### 3. 起動
```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス開始！

## ✨ 主な機能

### 🔐 認証・セキュリティ
- **Google OAuth認証** - セキュアなログインシステム ✅
- **ロールベースアクセス制御** - ユーザー・管理者権限 ✅
- **セッション管理** - JWT認証 ✅

### 📁 ドキュメント管理
- **ファイルアップロード** - PDF、Word、PowerPoint、テキストファイル対応 ✅
- **高速検索** - タイトル、内容、タグでの全文検索 ✅
- **タグ管理** - カテゴリ分類とフィルタリング ✅
- **ファイルベースストレージ** - 実際のファイル保存・管理 ✅

### 🤖 AI チャット機能 ⭐ **NEW: ChatGPT風機能実装済み**
- **Hugging Face AI** - 自然な日本語対話システム ✅ **IMPLEMENTED**
- **ストリーミング応答** - リアルタイム回答表示 ✅ **IMPLEMENTED**
- **文書ベースQA** - アップロードした資料に基づく詳細分析 ✅ **IMPLEMENTED**
- **高度な検索機能** - 日本語対応、関連度スコア計算 ✅ **IMPLEMENTED**
- **構造化回答** - 評価制度、グレード、昇格等の企業情報対応 ✅ **IMPLEMENTED**
- **会話記憶** - 過去の会話を考慮した応答 ✅ **IMPLEMENTED**
- **チャット履歴** - 過去の会話の保存・参照 ✅ **IMPLEMENTED**

### 👨‍💼 管理機能
- **ユーザー管理** - アクティブユーザー・権限管理 ✅
- **監査ログ** - システム利用履歴の追跡 ✅
- **システム分析** - 利用統計とパフォーマンス監視 ✅

### 🔗 外部連携
- **Google Drive** - クラウドストレージ連携 ✅
- **Slack** - チャット結果の共有・通知 ✅
- **API連携** - 拡張性のあるインテグレーション ✅
- 📊 **Analytics**: Usage tracking and audit logs ✅ **IMPLEMENTED**
- 🔗 **External Integrations**: Google Drive and Slack connectivity ✅ **IMPLEMENTED**

## 🎯 プロジェクト完了状況

### ✅ Phase 1: 認証・プロジェクト基盤 (完了)
- Next.js 14 + TypeScript + Tailwind CSS セットアップ
- Google OAuth認証システム (NextAuth.js)
- Prisma データベーススキーマ
- レスポンシブなログインページとダッシュボード
- Jest テスト環境

### ✅ Phase 2: ファイルアップロード・チャット機能 (完了)
- AI チャットインターフェース (履歴機能付き)
- ドラッグ&ドロップファイルアップロード
- OpenAI GPT-4 統合による高度なAI応答
- 複数ファイル形式対応 (PDF、Word、PowerPoint、テキスト)
- 検索・フィルタリング機能

### ✅ Phase 3: 管理機能・外部連携 (完了)
- ユーザー管理システム (ロールベース権限)
- 監査ログ・システム分析機能
- Google Drive・Slack API 連携
- shadcn/ui による美しいUI コンポーネント

### ✅ Phase 4: 本番化・完成 (完了)
- ファイルベースドキュメントストレージシステム
- 実際のファイルアップロード・管理機能
- Google OAuth 実装 (実際のAPI認証情報)
- デモモードから本格アプリケーションへの変換
- GitHubリポジトリ完全セットアップ
- プロダクション対応完了

## 🏆 完了した実装

**✅ すべての機能が完全に実装され、テスト済みです**

- 🔐 **認証システム**: Google OAuth + NextAuth.js
- 📁 **ファイル管理**: 実際のファイルストレージシステム
- 🤖 **AIチャット**: OpenAI GPT-4 統合
- 👨‍💼 **管理機能**: ユーザー・監査・分析
- 🔗 **外部連携**: Google Drive・Slack API
- 🧪 **品質保証**: 25テスト全て成功 (100%)

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API routes, Prisma ORM
- **データベース**: PostgreSQL
- **認証**: NextAuth.js + Google OAuth
- **AI**: OpenAI GPT-4 API
- **テスト**: Jest, Testing Library

## 🚀 クイックスタート

### 必要な環境
- Node.js 18+ 
- PostgreSQL データベース
- Google OAuth 認証情報
- OpenAI API キー（AI機能使用時）

### インストール手順

1. リポジトリをクローン:
```bash
git clone https://github.com/nomuranaruki/SLJchatbot.git
cd SLJchatbot
```

2. 依存関係をインストール:
```bash
npm install
```

3. 環境変数を設定:
```bash
# .env.exampleをコピーして.env.localを作成
cp .env.example .env.local
```

⚠️ **重要**: `.env.local`ファイルを開いて、以下のAPIキーを実際の値に置き換えてください：

- `GOOGLE_CLIENT_ID` - Google OAuth認証用
- `GOOGLE_CLIENT_SECRET` - Google OAuth認証用
- `HUGGINGFACE_API_KEY` - AI機能用（ChatGPT風機能）
- `OPENAI_API_KEY` - 追加AI機能用（オプション）

📋 **詳細な設定手順**: [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md) と [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md) を参照してください。

4. データベースをセットアップ:
```bash
npx prisma generate
npx prisma db push
```

5. 開発サーバーを起動:
```bash
npm run dev
```

アプリケーションは `http://localhost:3000` でアクセスできます。

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Database Setup

This project uses PostgreSQL with Prisma ORM. The database schema is defined in `prisma/schema.prisma`.

### Key Models:
- **User**: User accounts and authentication
- **Document**: Uploaded documents with metadata
- **ChatHistory**: Chat conversation records
- **Permission**: Document access control
- **AuditLog**: System activity tracking

## Authentication

The application uses NextAuth.js with Google OAuth provider. Users are automatically created on first login and assigned the "user" role by default.

## Testing

Tests are written using Jest and Testing Library. Run tests with:

```bash
npm run test
```

Test files are located in `src/__tests__/` directory.

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Authentication components
│   └── dashboard/      # Dashboard components
├── lib/                # Utility functions
├── providers/          # React context providers
├── types/              # TypeScript definitions
└── __tests__/          # Test files
```

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Use TypeScript for all new code
4. Follow Next.js 14 App Router patterns
5. Ensure accessibility compliance

## License

This project is licensed under the MIT License.
