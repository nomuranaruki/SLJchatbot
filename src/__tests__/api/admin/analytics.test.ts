import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/analytics/route'

// Mock the session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const mockGetServerSession = require('next-auth/next').getServerSession

describe('/api/admin/analytics', () => {
  beforeEach(() => {
    mockGetServerSession.mockClear()
  })

  describe('GET', () => {
    it('should return analytics data for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview).toBeDefined()
      expect(data.overview.totalUsers).toBeDefined()
      expect(data.overview.totalDocuments).toBeDefined()
    })

    it('should support type filtering', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics?type=users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.overview).toBeDefined()
    })

    it('should return 403 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })
})
