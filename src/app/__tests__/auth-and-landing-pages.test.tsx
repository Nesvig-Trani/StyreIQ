import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '@/app/page'
import LoginPage from '@/app/(auth)/login/page'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'
import CreateFirstUserPage from '@/app/(auth)/login/create-first-user/page'
import AuthLayout from '@/app/(auth)/layout'
import LandingLayout from '@/app/(landing)/layout'
import TermsAndConditionsPage from '@/app/(landing)/terms-and-conditions/page'
import { buildUser } from '@/shared/__tests__/fixtures'
import { createAuthPayload, pageOf } from '@/features/auth/__tests__/auth-boundaries'
import { redirectError } from './app-fixtures'

const payload = createAuthPayload()

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

const givenSession = (signedIn: boolean, totalUsers = 4) => {
  payload.auth.mockResolvedValue({ user: signedIn ? buildUser() : null })
  payload.find.mockResolvedValue({ ...pageOf([]), totalDocs: totalUsers })
}

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset()
})

describe('home page', () => {
  it('should send a signed-in user to the dashboard', async () => {
    givenSession(true)
    await expect(Page()).rejects.toThrow(redirectError('/dashboard'))
  })

  it('should show the landing page without Get Started once users exist', async () => {
    givenSession(false, 4)
    render(await Page())
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Governance HQ')
    expect(screen.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Get Started' })).not.toBeInTheDocument()
  })

  it('should offer Get Started on a fresh installation', async () => {
    givenSession(false, 0)
    render(await Page())
    expect(screen.getAllByRole('link', { name: 'Get Started' })[0]).toHaveAttribute(
      'href',
      '/login/create-first-user',
    )
  })

  it('should describe every benefit and process step of the product', async () => {
    givenSession(false)
    render(await Page())
    expect(screen.getByText('Be Audit Ready')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Training and Microlearning' })).toBeInTheDocument()
    expect(document.getElementById('main-content')).not.toBeNull()
  })
})

describe('login page', () => {
  it('should send a signed-in user to the dashboard', async () => {
    givenSession(true)
    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      redirectError('/dashboard'),
    )
  })

  it('should show the login form', async () => {
    givenSession(false)
    render(await LoginPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should explain a known logout reason from the query string', async () => {
    givenSession(false)
    render(await LoginPage({ searchParams: Promise.resolve({ reason: 'inactive' }) }))
    expect(screen.getByRole('alert')).toHaveTextContent('Your account is not active.')
  })

  it('should ignore an unknown logout reason', async () => {
    givenSession(false)
    render(await LoginPage({ searchParams: Promise.resolve({ reason: 'hacked' }) }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe.each([
  ['forgot-password', ForgotPasswordPage, 'Reset your password'],
  ['reset-password', ResetPasswordPage, 'Set new password'],
])('%s page', (_name, PageComponent, heading) => {
  it('should send a signed-in user to the dashboard', async () => {
    givenSession(true)
    await expect(PageComponent()).rejects.toThrow(redirectError('/dashboard'))
  })

  it('should show the form to visitors', async () => {
    givenSession(false)
    render(await PageComponent())
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})

describe('create-first-user page', () => {
  it('should send a signed-in user to the dashboard', async () => {
    givenSession(true)
    await expect(CreateFirstUserPage()).rejects.toThrow(redirectError('/dashboard'))
  })

  it('should send visitors to login when the platform already has users', async () => {
    givenSession(false, 3)
    await expect(CreateFirstUserPage()).rejects.toThrow(redirectError('/login'))
  })

  it('should show the setup form on a fresh installation', async () => {
    givenSession(false, 0)
    render(await CreateFirstUserPage())
    expect(screen.getByRole('heading', { name: 'Create First User' })).toBeInTheDocument()
  })
})

describe('route group layouts and static pages', () => {
  it('should wrap authentication pages in the main landmark', () => {
    render(
      <AuthLayout>
        <p>Formulario</p>
      </AuthLayout>,
    )
    expect(screen.getByRole('main')).toHaveTextContent('Formulario')
  })

  it('should pass landing content through unchanged', async () => {
    render(await LandingLayout({ children: <p>Contenido</p> }))
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('should show the terms and conditions', () => {
    render(<TermsAndConditionsPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'GENERAL TERMS AND CONDITIONS OF SALE' }),
    ).toBeInTheDocument()
  })
})
