'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, FileText, Shield, Zap } from 'lucide-react'

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SLJ Chatbot
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-Powered Document Assistant
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">インテリジェントチャット</h3>
                <p className="text-gray-600">ドキュメントに基づいた正確な回答を瞬時に取得</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <FileText className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">文書管理</h3>
                <p className="text-gray-600">PDF、Word、PowerPointファイルの一元管理</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">セキュアアクセス</h3>
                <p className="text-gray-600">Google認証による安全なログイン</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">高速検索</h3>
                <p className="text-gray-600">大量の文書から瞬時に関連情報を検索</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">ログイン</CardTitle>
              <CardDescription>
                Googleアカウントでログインしてください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base"
                variant="outline"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </Button>
              
              <div className="text-xs text-gray-500 text-center space-y-2">
                <p>ログインすることで、利用規約とプライバシーポリシーに同意したものとみなします。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
