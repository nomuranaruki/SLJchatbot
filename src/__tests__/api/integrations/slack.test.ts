import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/integrations/slack/route'

// Mock Slack service
jest.mock('@/lib/slack', () => ({
  slackService: {
    getChannels: jest.fn(),
    getUserInfo: jest.fn(),
    sendMessage: jest.fn(),
    sendDocumentNotification: jest.fn(),
    sendChatSummary: jest.fn()
  }
}))

describe('/api/integrations/slack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('gets Slack channels successfully', async () => {
      const { slackService } = require('@/lib/slack')
      const mockChannels = [
        { id: 'C1234567890', name: 'general', is_member: true },
        { id: 'C0987654321', name: 'documents', is_member: true }
      ]

      slackService.getChannels.mockResolvedValue({ channels: mockChannels })

      const request = new NextRequest('http://localhost:3000/api/integrations/slack?action=channels')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.channels).toEqual(mockChannels)
    })

    it('gets user info successfully', async () => {
      const { slackService } = require('@/lib/slack')
      const mockUser = {
        id: 'U1234567890',
        name: 'testuser',
        real_name: 'Test User',
        profile: { email: 'test@example.com' }
      }

      slackService.getUserInfo.mockResolvedValue({ user: mockUser })

      const request = new NextRequest('http://localhost:3000/api/integrations/slack?action=user&userId=U1234567890')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual(mockUser)
    })

    it('handles missing userId for user action', async () => {
      const request = new NextRequest('http://localhost:3000/api/integrations/slack?action=user')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User ID is required')
    })
  })

  describe('POST', () => {
    it('sends message successfully', async () => {
      const { slackService } = require('@/lib/slack')
      const mockResult = {
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890'
      }

      slackService.sendMessage.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/integrations/slack', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send-message',
          channel: 'C1234567890',
          message: 'Test message'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.result).toEqual(mockResult)
    })

    it('sends document notification successfully', async () => {
      const { slackService } = require('@/lib/slack')
      const mockResult = { ok: true, ts: '1234567890.123456' }

      slackService.sendDocumentNotification.mockResolvedValue(mockResult)

      const documentData = {
        title: 'Test Document.pdf',
        size: 1024000,
        uploadedBy: 'Test User',
        mimeType: 'application/pdf',
        tags: ['test', 'document']
      }

      const request = new NextRequest('http://localhost:3000/api/integrations/slack', {
        method: 'POST',
        body: JSON.stringify({
          action: 'document-notification',
          channel: 'C1234567890',
          data: documentData
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Document notification sent to Slack')
    })

    it('sends chat summary successfully', async () => {
      const { slackService } = require('@/lib/slack')
      const mockResult = { ok: true, ts: '1234567890.123456' }

      slackService.sendChatSummary.mockResolvedValue(mockResult)

      const chatData = {
        summary: '5件の質問についてAIチャットを実行しました',
        user: 'Test User',
        questionCount: 5,
        referencedDocuments: 'Document 1, Document 2',
        timestamp: '2024-01-01 12:00:00'
      }

      const request = new NextRequest('http://localhost:3000/api/integrations/slack', {
        method: 'POST',
        body: JSON.stringify({
          action: 'chat-summary',
          channel: 'C1234567890',
          data: chatData
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Chat summary sent to Slack')
    })

    it('tests connection successfully', async () => {
      const { slackService } = require('@/lib/slack')
      slackService.getChannels.mockResolvedValue({ ok: true, channels: [] })

      const request = new NextRequest('http://localhost:3000/api/integrations/slack', {
        method: 'POST',
        body: JSON.stringify({ action: 'test-connection' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.connected).toBe(true)
      expect(data.message).toBe('Slack connection successful')
    })

    it('handles missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/integrations/slack', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send-message',
          channel: 'C1234567890'
          // message is missing
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Channel and message are required')
    })
  })
})
