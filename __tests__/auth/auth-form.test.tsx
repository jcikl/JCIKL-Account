import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthProvider } from '@/components/auth/auth-context'

// Mock the auth context
const mockLogin = jest.fn()
const mockSignup = jest.fn()
const mockLoading = false

jest.mock('@/components/auth/auth-context', () => ({
  ...jest.requireActual('@/components/auth/auth-context'),
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    loading: mockLoading,
  }),
}))

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderAuthForm = () => {
    return render(
      <AuthProvider>
        <AuthForm />
      </AuthProvider>
    )
  }

  describe('Login Mode', () => {
    it('should render login form by default', () => {
      renderAuthForm()
      
      expect(screen.getByText('登录 AccounTech')).toBeInTheDocument()
      expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
      expect(screen.getByLabelText('密码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
    })

    it('should handle login form submission', async () => {
      const user = userEvent.setup()
      renderAuthForm()
      
      const emailInput = screen.getByLabelText('邮箱')
      const passwordInput = screen.getByLabelText('密码')
      const submitButton = screen.getByRole('button', { name: '登录' })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should display error message on login failure', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
      renderAuthForm()
      
      const emailInput = screen.getByLabelText('邮箱')
      const passwordInput = screen.getByLabelText('密码')
      const submitButton = screen.getByRole('button', { name: '登录' })
      
      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('Signup Mode', () => {
    it('should switch to signup mode when toggle is clicked', async () => {
      const user = userEvent.setup()
      renderAuthForm()
      
      const toggleButton = screen.getByText('注册')
      await user.click(toggleButton)
      
      expect(screen.getByText('注册新用户')).toBeInTheDocument()
      expect(screen.getByLabelText('显示名称')).toBeInTheDocument()
      expect(screen.getByLabelText('角色')).toBeInTheDocument()
    })

    it('should handle signup form submission', async () => {
      const user = userEvent.setup()
      renderAuthForm()
      
      // Switch to signup mode
      const toggleButton = screen.getByText('注册')
      await user.click(toggleButton)
      
      // Fill form
      const displayNameInput = screen.getByLabelText('显示名称')
      const emailInput = screen.getByLabelText('邮箱')
      const passwordInput = screen.getByLabelText('密码')
      const roleSelect = screen.getByLabelText('角色')
      const submitButton = screen.getByRole('button', { name: '注册' })
      
      await user.type(displayNameInput, 'Test User')
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.selectOptions(roleSelect, 'ASSISTANT_VICE_PRESIDENT')
      await user.click(submitButton)
      
      expect(mockSignup).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpassword123',
        'Test User',
        'ASSISTANT_VICE_PRESIDENT'
      )
    })
  })

  describe('Form Validation', () => {
    it('should require email and password fields', async () => {
      const user = userEvent.setup()
      renderAuthForm()
      
      const submitButton = screen.getByRole('button', { name: '登录' })
      await user.click(submitButton)
      
      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      renderAuthForm()
      
      const emailInput = screen.getByLabelText('邮箱')
      await user.type(emailInput, 'invalid-email')
      
      expect(emailInput).toBeInvalid()
    })
  })
}) 