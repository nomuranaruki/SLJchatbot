#!/bin/bash
# GitHub リポジトリ作成後に実行するスクリプト

echo "🚀 SLJ Chatbot - GitHub Setup Script"
echo "=================================="

# あなたのGitHubユーザー名を入力してください
read -p "GitHubユーザー名を入力してください: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ ユーザー名が入力されていません。"
    exit 1
fi

echo "📡 リモートリポジトリを追加中..."
git remote add origin https://github.com/$GITHUB_USERNAME/slj-chatbot.git

echo "🔄 メインブランチをプッシュ中..."
git push -u origin main

echo "🌿 開発ブランチをプッシュ中..."
git push -u origin development

echo "⚡ 機能ブランチをプッシュ中..."
git push -u origin feature/ai-chat-improvements

echo ""
echo "✅ 完了! GitHubリポジトリが正常にセットアップされました。"
echo ""
echo "🔗 リポジトリURL: https://github.com/$GITHUB_USERNAME/slj-chatbot"
echo ""
echo "📋 利用可能なブランチ:"
echo "   • main - 本番ブランチ"
echo "   • development - 開発ブランチ"  
echo "   • feature/ai-chat-improvements - AI機能改善ブランチ"
echo ""
echo "💡 次のステップ:"
echo "   1. GitHubでリポジトリを確認"
echo "   2. OpenAI APIキーを設定してAIチャット機能を有効化"
echo "   3. 新機能の開発やバグ修正を開始"
