# 🚀 SLJ Chatbot - API設定クイックセットアップガイド

このガイドでは、プロジェクトをクローン後に必要なAPI設定を素早く完了する手順を説明します。

## 📋 必要なAPI

- ✅ **Hugging Face API** (AI チャット機能)
- ✅ **Google OAuth** (認証)
- ✅ **Google Drive API** (文書管理)
- ⚪ **OpenAI API** (オプション)
- ⚪ **Slack API** (オプション)

## 🔧 クイックセットアップ手順

### 1. 環境変数ファイルの準備

```bash
# プロジェクトディレクトリで実行
cp .env.example .env.local
```

### 2. Hugging Face API設定 ⭐ **最重要**

1. **アカウント作成**: https://huggingface.co/join
2. **APIトークン生成**:
   - https://huggingface.co/settings/tokens
   - 「New token」をクリック
   - Name: `SLJ Chatbot`
   - Type: `Read` を選択
   - 「Generate a token」をクリック
3. **設定**:
   ```bash
   # .env.local に追加
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Google OAuth設定

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **新規プロジェクト作成** または既存プロジェクト選択
3. **API有効化**:
   - Google+ API
   - OAuth2 API
4. **認証情報作成**:
   - 「認証情報」→「認証情報を作成」→「OAuth 2.0 クライアント ID」
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みリダイレクト URI: `http://localhost:3000/api/auth/callback/google`
5. **設定**:
   ```bash
   # .env.local に追加
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 4. Google Drive API設定（オプション）

1. **Google Cloud Console**で同じプロジェクト内
2. **サービスアカウント作成**:
   - 「IAM と管理」→「サービスアカウント」
   - 「サービスアカウントを作成」
3. **キーファイル生成**:
   - 作成したサービスアカウントをクリック
   - 「キー」タブ→「キーを追加」→「JSON」
4. **設定**:
   ```bash
   # JSONファイルから client_email と private_key を取得
   GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

## 🏃‍♂️ 起動手順

```bash
# 1. 依存関係インストール
npm install

# 2. 開発サーバー起動
npm run dev

# 3. ブラウザでアクセス
# http://localhost:3000
```

## 🔍 動作確認

### 最小限の動作確認（Hugging Face APIのみ）

1. ブラウザで http://localhost:3000 にアクセス
2. 「開発モードでアクセス」をクリック
3. 「チャット」タブをクリック
4. テストメッセージを送信

### 完全な動作確認（全API設定）

1. Google OAuth でログイン
2. PDF文書をアップロード
3. 文書に関する質問をチャット

## ⚠️ トラブルシューティング

### よくある問題

1. **Hugging Face API エラー**
   ```
   エラー: API key is invalid
   ```
   - APIキーが正しく設定されているか確認
   - APIキーの権限が 'Read' であることを確認

2. **Google OAuth エラー**
   ```
   エラー: redirect_uri_mismatch
   ```
   - リダイレクトURIが正確に設定されているか確認
   - `http://localhost:3000/api/auth/callback/google`

3. **環境変数が反映されない**
   - `.env.local` ファイル名が正確か確認
   - 開発サーバーを再起動: `Ctrl+C` → `npm run dev`

## 📞 サポート

問題が発生した場合：

1. **ログの確認**: ブラウザの開発者ツール（F12）→ Console
2. **サーバーログの確認**: ターミナルの出力
3. **設定ファイルの確認**: `.env.local` の内容

## 🎯 設定完了チェックリスト

- [ ] `.env.local` ファイル作成済み
- [ ] Hugging Face API キー設定済み
- [ ] Google OAuth認証情報設定済み
- [ ] `npm install` 実行済み
- [ ] `npm run dev` でサーバー起動成功
- [ ] ブラウザでアクセス可能
- [ ] チャット機能動作確認済み

---

**所要時間**: 約15-30分（API登録込み）
**必須設定**: Hugging Face API のみ
**推奨設定**: Hugging Face API + Google OAuth
