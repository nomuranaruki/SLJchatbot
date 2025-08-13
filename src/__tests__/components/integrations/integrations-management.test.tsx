import { render, screen, act } from '@testing-library/react'
import IntegrationsManagement from '@/components/integrations/integrations-management'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ files: [], channels: [], connected: true }),
  })
) as jest.Mock

describe('IntegrationsManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders integration management interface', async () => {
    await act(async () => {
      render(<IntegrationsManagement />)
    })
    
    expect(screen.getByText('外部サービス統合')).toBeInTheDocument()
    expect(screen.getByText('Google Drive')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
  })
})