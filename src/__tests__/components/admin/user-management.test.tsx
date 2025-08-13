import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserManagement from '@/components/admin/user-management'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('UserManagement', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should render user management interface', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLoginAt: '2024-01-15T00:00:00.000Z',
            documentsCount: 5,
            chatSessionsCount: 10
          }
        ],
        total: 1,
        stats: {
          totalUsers: 1,
          activeUsers: 1,
          adminUsers: 0,
          inactiveUsers: 0
        }
      })
    } as Response)

    render(<UserManagement />)

    expect(screen.getByText('ユーザー管理')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        total: 0,
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          inactiveUsers: 0
        }
      })
    } as Response)

    render(<UserManagement />)

    const searchInput = screen.getByPlaceholderText('名前またはメールで検索')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/admin/users?page=1&limit=10&search=test')
      )
    })
  })

  it('should display user statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [],
        total: 0,
        stats: {
          totalUsers: 42,
          activeUsers: 35,
          adminUsers: 3,
          inactiveUsers: 7
        }
      })
    } as Response)

    render(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument() // Total users
      expect(screen.getByText('35')).toBeInTheDocument() // Active users
    })
  })
})
