import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LoginPage from '@/components/auth/login-page'

export default async function Home() {
  // 認証状態をチェック
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.warn('Session check failed, continuing to login page:', error)
  }
  
  if (session) {
    redirect('/dashboard')
  }
  
  return <LoginPage />
}
