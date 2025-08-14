import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/users/route'

// Mock the session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const mockGetServerSession = require('next-auth/next').getServerSession

describe('/api/admin/users', () => {
  beforeEach(() => {
    mockGetServerSession.mockClear()
  })

  describe('GET', () => {
    it('should return users list for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(data.stats).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
    })

    it('should return 403 for non-admin users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'user' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('PUT', () => {
    it('should update user role for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user1',
          role: 'admin'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User updated successfully')
    })
  })

  describe('DELETE', () => {
    it('should delete user for admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', role: 'admin' }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users?userId=user1')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User deleted successfully')
    })
  })
})
