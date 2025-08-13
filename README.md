# SLJ Chatbot - AI-Powered Document Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg)](README.md)

> 🤖 AI搭載の高機能ドキュメント管理・チャットアシスタント

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

### 🤖 AI チャット機能
- **文書ベースQA** - アップロードした資料に基づく質疑応答 ⚠️ *要OpenAI APIキー*
- **コンテキスト理解** - 複数文書からの情報統合 ⚠️ *要OpenAI APIキー*
- **チャット履歴** - 過去の会話の保存・参照 ✅

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

## Current Implementation Status

### ✅ Phase 1: Authentication & Project Setup (COMPLETED)
- Next.js 14 project setup with TypeScript and Tailwind CSS
- Google OAuth authentication with NextAuth.js
- Comprehensive Prisma database schema
- Responsive login page and dashboard
- Testing environment with Jest

### ✅ Phase 2: File Upload & Chat Functionality (COMPLETED)
- AI chat interface with message history
- File upload with drag & drop functionality
- Document management and search
- Chat API with OpenAI integration (mock)
- File processing for text extraction
- Integrated dashboard with tab navigation

### ✅ Phase 3: External Service Integrations (COMPLETED)
- Google Drive integration for file sync and import
- Slack notifications for document uploads and chat summaries  
- Integration management UI with connection status
- Automated workflow notifications
- Comprehensive API testing and validation

### ✅ Phase 4: Admin Features & System Monitoring (COMPLETED)
- User management with role-based access control
- Comprehensive audit logging system
- System analytics and performance monitoring
- Admin dashboard with real-time statistics
- Security features and data protection
- Advanced charts and visualization with Recharts

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-4 API
- **Testing**: Jest, Testing Library

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd slj-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `NEXTAUTH_SECRET`: Random secret for NextAuth.js
- `OPENAI_API_KEY`: OpenAI API key

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

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
