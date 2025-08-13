/**
 * 環境変数の検証とデフォルト値の設定
 */

// 開発環境かどうかをチェック
export const isDevelopment = process.env.NODE_ENV === 'development'

// 必要な環境変数のチェック
export function validateEnvVars() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY'
  ]

  const missing = required.filter(env => !process.env[env] || process.env[env]?.startsWith('your-'))
  
  if (missing.length > 0 && !isDevelopment) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // 開発環境では警告のみ
  if (missing.length > 0 && isDevelopment) {
    console.warn('⚠️ Development mode: Some environment variables are not set:', missing)
  }
}

// API設定の有効性チェック
export const envConfig = {
  database: {
    url: process.env.DATABASE_URL || '',
    isValid: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password')
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
    isValid: process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your-')
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    isValid: process.env.SLACK_BOT_TOKEN && !process.env.SLACK_BOT_TOKEN.startsWith('xoxb-your-')
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    isValid: process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your-')
  }
}

// 開発環境用のダミーレスポンス生成
export function createMockResponse<T>(data: T, serviceName: string): T {
  if (isDevelopment) {
    console.log(`🔧 Development mode: Using mock data for ${serviceName}`)
  }
  return data
}
