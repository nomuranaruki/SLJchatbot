import { render, screen, waitFor } from '@testing-library/react'
import AuditLogs from '@/components/admin/audit-logs'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('AuditLogs', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should render audit logs interface', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        logs: [
          {
            id: '1',
            action: 'LOGIN_ATTEMPT',
            userId: 'user1',
            userName: 'Test User',
            details: 'Login attempt from IP: 127.0.0.1',
            timestamp: '2024-01-15T10:00:00.000Z',
            resource: 'Authentication',
            resourceId: 'auth-1',
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser',
            status: 'SUCCESS'
          }
        ],
        total: 1,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        },
        stats: {
          totalEvents: 1,
          successfulEvents: 1,
          failedEvents: 0,
          uniqueUsers: 1,
          topActions: [{ action: 'user_login', count: 1 }],
          recentActivity: []
        }
      })
    } as Response)

    render(<AuditLogs />)

    expect(screen.getByText('システム監査ログ')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      // フィルター部分ではなくテーブル内のアクションテキストを確認
      const tableRows = screen.getAllByRole('row')
      const actionCell = tableRows.find(row => row.textContent?.includes('Test User'))
      expect(actionCell).toBeTruthy()
      expect(actionCell?.textContent).toContain('ログイン試行')
    })
  })

  it('should display log statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        logs: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        },
        stats: {
          totalEvents: 150,
          successfulEvents: 140,
          failedEvents: 10,
          uniqueUsers: 42,
          topActions: [],
          recentActivity: []
        }
      })
    } as Response)

    render(<AuditLogs />)

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // Total events
      expect(screen.getByText('140')).toBeInTheDocument() // Successful events
      expect(screen.getByText('10')).toBeInTheDocument() // Failed events
    })
  })
})
