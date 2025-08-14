import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/audit-logs/route'

// Mock the session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const mockGetServerSession = require('next-auth/next').getServerSession

describe('/api/admin/audit-logs', () => {
  beforeEach(() => {
    mockGetServerSession.mockClear()
  })

  describe('GET', () => {
    it('should return audit logs for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toBeDefined()
      expect(data.stats).toBeDefined()
      expect(Array.isArray(data.logs)).toBe(true)
    })

    it('should support filtering by action', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?action=user_login')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toBeDefined()
    })

    it('should return 403 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })
})
