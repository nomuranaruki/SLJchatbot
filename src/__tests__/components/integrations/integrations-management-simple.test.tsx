import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import IntegrationsManagement from '@/components/integrations/integrations-management'

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('IntegrationsManagement', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ files: [], channels: [], connected: true })
    } as Response)
  })

  it('renders integration management interface', async () => {
    await act(async () => {
      render(<IntegrationsManagement />)
    })

    expect(screen.getByText('外部サービス統合')).toBeInTheDocument()
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
  })

  it('handles connection status refresh', async () => {
    await act(async () => {
      render(<IntegrationsManagement />)
    })

    const refreshButton = screen.getByText('接続状況を更新')
    
    await act(async () => {
      fireEvent.click(refreshButton)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
