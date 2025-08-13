import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // For testing purposes, temporarily disable database dependency
  // const session = await getServerSession(authOptions)
  const session = { user: { name: 'Test User', email: 'test@example.com' } } // Mock session
  
  if (!session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
