import { GET } from '@/app/api/documents/route'
import { NextRequest } from 'next/server'

// Mock Next Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock the auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('/api/documents', () => {
  beforeEach(() => {
    // Set NODE_ENV to development for testing
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    })
  })

  it('should return document list successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents).toBeDefined()
    expect(Array.isArray(data.documents)).toBe(true)
    expect(data.total).toBeDefined()
    expect(data.hasMore).toBeDefined()
  })

  it('should filter documents by search query', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents?q=会社')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents.length).toBeGreaterThan(0)
    // Should contain documents with "会社" in title or content
    expect(data.documents.some((doc: any) => 
      doc.title.includes('会社') || doc.extractedText.includes('会社')
    )).toBe(true)
  })

  it('should filter documents by tags', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents?tags=規定')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents.length).toBeGreaterThan(0)
    // Should contain documents with "規定" tag
    expect(data.documents.some((doc: any) => 
      doc.tags.includes('規定')
    )).toBe(true)
  })

  it('should handle pagination correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents?limit=2&offset=0')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.documents.length).toBeLessThanOrEqual(2)
    expect(data.total).toBeGreaterThanOrEqual(data.documents.length)
  })
})
