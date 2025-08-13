import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 開発環境でデータベースが利用できない場合の処理
let prismaInstance: PrismaClient | null = null

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient()
  
  // 開発環境でのデータベース接続テスト
  if (process.env.NODE_ENV === 'development') {
    // データベース接続の検証（非同期だが、エラーハンドリングのみ）
    prismaInstance.$connect().catch((error) => {
      console.warn('⚠️ Database connection failed in development mode:', error.message)
      console.warn('💡 The app will continue with limited functionality')
    })
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error)
  
  // 開発環境では警告のみ、本番環境では例外を投げる
  if (process.env.NODE_ENV === 'production') {
    throw error
  } else {
    console.warn('⚠️ Running in development mode without database')
    prismaInstance = null
  }
}

export const prisma = prismaInstance!

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance!
