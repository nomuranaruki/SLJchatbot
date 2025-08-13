import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

describe('UI Components', () => {
  describe('Button Component', () => {
    it('should render default button correctly', () => {
      render(<Button>Test Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Test Button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary')
    })

    it('should render different button variants', () => {
      const { rerender } = render(<Button variant="outline">Outline Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')
      
      rerender(<Button variant="destructive">Destructive Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')
      
      rerender(<Button variant="ghost">Ghost Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
    })

    it('should handle click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Clickable Button</Button>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })
  })

  describe('Card Component', () => {
    it('should render card with all parts correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should have correct styling classes', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader data-testid="test-header">
            <CardTitle data-testid="test-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )

      expect(screen.getByTestId('test-card')).toHaveClass('rounded-lg', 'border', 'bg-card')
      expect(screen.getByTestId('test-header')).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
      expect(screen.getByTestId('test-title')).toHaveClass('text-2xl', 'font-semibold')
    })
  })
})
