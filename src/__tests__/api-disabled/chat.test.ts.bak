import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock Next Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock the auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('/api/chat', () => {
  beforeEach(() => {
    // Set NODE_ENV to development for testing
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    })
  })

  it('should return a successful response for valid message', async () => {
    const requestBody = {
      message: 'テストメッセージ',
      documentIds: ['1']
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBeDefined()
    expect(data.sources).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })

  it('should return error for empty message', async () => {
    const requestBody = {
      message: '',
      documentIds: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message is required')
  })

  it('should handle document context appropriately', async () => {
    const requestBody = {
      message: '会社の勤務時間について教えてください',
      documentIds: ['1', '2']
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('勤務時間')
    expect(data.sources).toEqual(expect.arrayContaining(['サンプル文書.pdf']))
  })
})
