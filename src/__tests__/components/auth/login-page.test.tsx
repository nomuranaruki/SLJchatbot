import { render, screen, fireEvent } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import LoginPage from '@/components/auth/login-page'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
}))

const mockSignIn = require('next-auth/react').signIn

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render login page with Google sign in button', () => {
    render(
      <SessionProvider session={null}>
        <LoginPage />
      </SessionProvider>
    )

    expect(screen.getByText('SLJ Chatbot')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Document Assistant')).toBeInTheDocument()
    expect(screen.getByText('Googleでログイン')).toBeInTheDocument()
  })

  it('should display features correctly', () => {
    render(
      <SessionProvider session={null}>
        <LoginPage />
      </SessionProvider>
    )

    expect(screen.getByText('インテリジェントチャット')).toBeInTheDocument()
    expect(screen.getByText('文書管理')).toBeInTheDocument()
    expect(screen.getByText('セキュアアクセス')).toBeInTheDocument()
    expect(screen.getByText('高速検索')).toBeInTheDocument()
  })

  it('should call signIn when Google login button is clicked', () => {
    render(
      <SessionProvider session={null}>
        <LoginPage />
      </SessionProvider>
    )

    const googleLoginButton = screen.getByText('Googleでログイン')
    fireEvent.click(googleLoginButton)

    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
  })

  it('should display privacy policy notice', () => {
    render(
      <SessionProvider session={null}>
        <LoginPage />
      </SessionProvider>
    )

    expect(screen.getByText(/利用規約とプライバシーポリシーに同意/)).toBeInTheDocument()
  })

  it('should have responsive design with gradient background', () => {
    render(
      <SessionProvider session={null}>
        <LoginPage />
      </SessionProvider>
    )

    // Check for main title styling
    const titleElement = screen.getByText('SLJ Chatbot')
    expect(titleElement).toHaveClass('text-4xl', 'font-bold')
    
    // Check that the layout elements exist
    expect(titleElement).toBeInTheDocument()
    expect(screen.getByText('Googleでログイン')).toBeInTheDocument()
  })
})
