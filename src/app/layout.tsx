import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SLJ Chatbot - AI-Powered Document Assistant',
  description: 'Intelligent chatbot for document management and Q&A',
}

// サーバーサイドで環境変数を検証
if (typeof window === 'undefined') {
  try {
    const { validateEnvVars } = require('@/lib/env')
    validateEnvVars()
  } catch (error) {
    console.error('Environment validation failed:', error)
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
