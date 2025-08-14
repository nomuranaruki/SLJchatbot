# Google OAuth セットアップ手順

## 🔧 Google Cloud Console での設定

### 1. プロジェクトの作成・選択
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択

### 2. OAuth同意画面の設定
1. 左メニュー「APIとサービス」→「OAuth同意画面」をクリック
2. 「外部」を選択（個人使用の場合）
3. 必要情報を入力：
   - アプリ名: `SLJ Chatbot`
   - ユーザーサポートメール: あなたのメール
   - 承認済みドメイン: `localhost` （開発用）
   - デベロッパーの連絡先情報: あなたのメール

### 3. OAuth 2.0 クライアントIDの作成
1. 左メニュー「APIとサービス」→「認証情報」をクリック
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類: 「ウェブアプリケーション」
4. 名前: `SLJ Chatbot Local Development`
5. **承認済みのリダイレクトURI**に以下を追加：
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### 4. 認証情報の取得
作成完了後、以下の情報が表示されます：
- **クライアントID**: `xxxxx.apps.googleusercontent.com` 形式
- **クライアントシークレット**: `GOCSPX-xxxxx` 形式

## ⚠️ セキュリティ注意事項
- 認証情報は決してGitリポジトリにコミットしない
- `.env.local` は既に `.gitignore` に含まれています
- 本番環境では必ず異なる認証情報を使用

## 🔄 次のステップ
1. 上記手順で取得した認証情報を `.env.local` に設定
2. 開発サーバーを再起動
3. Google ログインをテスト
