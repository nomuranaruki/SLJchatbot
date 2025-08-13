# Google OAuth設定ガイド

## Google Cloud Console での設定

Google OAuth認証を有効にするために、以下の設定が必要です：

### 1. OAuth 2.0 承認済みリダイレクト URI

Google Cloud Console の OAuth 2.0 クライアント設定で、以下のURIを追加してください：

**開発環境:**
```
http://localhost:3000/api/auth/callback/google
```

**本番環境（将来）:**
```
https://yourdomain.com/api/auth/callback/google
```

### 2. OAuth同意画面の設定

以下の情報を設定してください：
- アプリ名: SLJ Chatbot
- ユーザーサポートメール: あなたのメールアドレス
- 開発者連絡先情報: あなたのメールアドレス

### 3. スコープの設定

以下のスコープを追加してください：
- `email` - ユーザーのメールアドレス取得
- `profile` - ユーザーの基本プロフィール情報取得

### 4. テストユーザー（開発段階）

開発段階では、OAuth同意画面が「テスト」モードの場合、テストユーザーとして登録されたGoogleアカウントのみがログインできます。

## 設定確認方法

1. ブラウザで http://localhost:3000 にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Google認証画面にリダイレクトされることを確認
4. 認証後、ダッシュボードにリダイレクトされることを確認

## 🚨 redirect_uri_mismatch エラーの解決方法

現在このエラーが発生している場合、以下の手順で**すぐに**解決してください：

### 緊急対応手順

1. **Google Cloud Console**にアクセス: https://console.cloud.google.com/
2. 左上のプロジェクトセレクターで正しいプロジェクトを選択
3. **APIとサービス** > **認証情報** に移動
4. OAuth 2.0 クライアントID `YOUR_GOOGLE_CLIENT_ID` をクリック
5. **承認済みのリダイレクトURI**セクションを見つける
6. **URIを追加**ボタンをクリック
7. **承認済みのリダイレクトURI**セクションで以下のURIを**正確に**入力：

```
http://localhost:3000/api/auth/callback/google
```

8. **承認済みのJavaScript生成元**セクションで以下のオリジンを追加：

```
http://localhost:3000
```

9. **保存**ボタンをクリック
9. 保存完了後、数分待つ（変更の反映に時間がかかる場合があります）

### ⚠️ よくある間違い

以下の設定は**間違い**です：
- ❌ `https://localhost:3000/api/auth/callback/google` (httpsではない)
- ❌ `http://localhost:3000/api/auth/callback/google/` (末尾にスラッシュ)
- ❌ `http://localhost:3001/api/auth/callback/google` (ポート番号違い)
- ❌ `http://127.0.0.1:3000/api/auth/callback/google` (localhostを使用)

### OAuth同意画面の追加設定

認証エラーを避けるため、以下も設定してください：

1. **APIとサービス** > **OAuth同意画面**
2. **外部**ユーザータイプを選択（推奨）
3. 必須項目を入力：
   - **アプリ名**: SLJ Chatbot
   - **ユーザーサポートメール**: あなたのGoogleアカウント
   - **承認済みドメイン**: `localhost` を追加
   - **開発者の連絡先情報**: あなたのGoogleアカウント

4. **テストユーザー**セクションで**ユーザーを追加**
5. ログインに使用するGoogleアカウントのメールアドレスを追加

## 環境変数

現在の設定:
- `GOOGLE_CLIENT_ID`: YOUR_GOOGLE_CLIENT_ID
- `GOOGLE_CLIENT_SECRET`: YOUR_GOOGLE_CLIENT_SECRET
- `NEXTAUTH_URL`: http://localhost:3000
- `NEXTAUTH_SECRET`: development-secret-key-please-change-in-production

## ✅ 設定チェックリスト

Google Cloud Consoleで以下の**すべて**を確認してください：

### OAuth 2.0 クライアント設定

**承認済みのJavaScript生成元:**
```
http://localhost:3000
```

**承認済みのリダイレクトURI:**
```
http://localhost:3000/api/auth/callback/google
```

### よくある間違いパターン

**❌ 間違った設定例:**
- JavaScript生成元: `https://localhost:3000` (httpsは不要)
- JavaScript生成元: `http://localhost:3000/` (末尾スラッシュは不要)
- リダイレクトURI: `http://localhost:3001/api/auth/callback/google` (ポート違い)
- リダイレクトURI: `http://127.0.0.1:3000/api/auth/callback/google` (localhostを使用)

**✅ 正しい設定:**
- JavaScript生成元: `http://localhost:3000`
- リダイレクトURI: `http://localhost:3000/api/auth/callback/google`

## 設定後のテスト

1. Google Cloud Consoleで設定保存後、**5分程度待つ**
2. ブラウザのキャッシュをクリア（Cmd+Shift+R）
3. http://localhost:3000 でアプリに再アクセス
4. **Googleでログイン**をクリックしてテスト
