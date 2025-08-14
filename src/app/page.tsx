import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LoginPage from '@/components/auth/login-page'

export default async function Home() {
  // 開発環境でGoogle OAuth認証情報が未設定の場合のバイパス
  const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here' &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here'
  
  // 認証状態をチェック
  let session = null
  try {
    if (isGoogleOAuthConfigured) {
      session = await getServerSession(authOptions)
    }
  } catch (error) {
    console.warn('Session check failed, continuing to login page:', error)
  }
  
  if (session) {
    redirect('/dashboard')
  }
  
  return <LoginPage />
}
