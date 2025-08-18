import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardPage from '@/components/dashboard/dashboard-page'

// Force dynamic rendering for this page due to session check
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  // 認証チェック
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.warn('Session check failed:', error)
  }

  if (!session) {
    redirect('/')
  }

  return <DashboardPage />
}
