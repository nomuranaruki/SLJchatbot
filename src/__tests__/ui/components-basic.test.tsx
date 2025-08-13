import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Basic UI Components', () => {
  it('should render button correctly', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })
})
