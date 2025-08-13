import { render, screen, waitFor, act } from '@testing-library/react'
import SystemAnalytics from '@/components/admin/system-analytics'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('SystemAnalytics', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should render system analytics interface', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          overview: {
            totalUsers: 42,
            activeUsers: 35,
            totalDocuments: 156,
            totalChatSessions: 289,
            storageUsed: 2.4,
            totalAPIRequests: 1245,
            averageResponseTime: 450,
            systemUptime: 99.9
          },
          userActivity: [],
          apiUsage: [],
          documentTypes: [],
          chatMetrics: {
            averageSessionLength: 25,
            averageMessagesPerSession: 8,
            mostAskedTopics: [],
            userSatisfaction: 4.2
          },
          performanceMetrics: []
        }
      })
    } as Response)

    await act(async () => {
      render(<SystemAnalytics />)
    })

    await waitFor(() => {
      expect(screen.getByText('システム分析')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument() // Total users
      expect(screen.getByText('156')).toBeInTheDocument() // Total documents
      expect(screen.getByText('289')).toBeInTheDocument() // Total chat sessions
    })
  })

  it('should display performance metrics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          overview: {
            totalUsers: 0,
            activeUsers: 0,
            totalDocuments: 0,
            totalChatSessions: 0,
            storageUsed: 0,
            totalAPIRequests: 0,
            averageResponseTime: 500,
            systemUptime: 99.5
          },
          userActivity: [],
          apiUsage: [],
          documentTypes: [],
          chatMetrics: {
            averageSessionLength: 20,
            averageMessagesPerSession: 5,
            mostAskedTopics: [],
            userSatisfaction: 4.0
          },
          performanceMetrics: []
        }
      })
    } as Response)

    await act(async () => {
      render(<SystemAnalytics />)
    })

    await waitFor(() => {
      expect(screen.getByText('システム分析')).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.getByText('平均応答時間: 500ms')).toBeInTheDocument()
    })
  })
})
