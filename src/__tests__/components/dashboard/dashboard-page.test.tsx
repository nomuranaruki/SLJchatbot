import { render, screen, act } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import DashboardPage from '@/components/dashboard/dashboard-page'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ documents: [] }),
  })
) as jest.Mock

const mockUseSession = require('next-auth/react').useSession

const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
    role: 'user'
  },
  expires: '2024-12-31T23:59:59.999Z'
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: mockSession
    })
  })

  it('should render dashboard with user information', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <DashboardPage />
        </SessionProvider>
      )
    })

    expect(screen.getByText('SLJ Chatbot')).toBeInTheDocument()
    expect(screen.getAllByText('ダッシュボード')[0]).toBeInTheDocument()
    expect(screen.getByText('ようこそ、Test Userさん')).toBeInTheDocument()
  })

  it('should display navigation items', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <DashboardPage />
        </SessionProvider>
      )
    })

    expect(screen.getAllByText('ダッシュボード')[0]).toBeInTheDocument()
    expect(screen.getByText('資料管理')).toBeInTheDocument()
    expect(screen.getByText('AIチャット')).toBeInTheDocument()
    expect(screen.getByText('設定')).toBeInTheDocument()
  })

  it('should show admin menu for admin users', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          image: 'https://example.com/avatar.jpg',
          role: 'admin'
        },
        expires: '2024-12-31T23:59:59.999Z'
      }
    })

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <DashboardPage />
        </SessionProvider>
      )
    })

    expect(screen.getByText('管理者')).toBeInTheDocument()
  })
})