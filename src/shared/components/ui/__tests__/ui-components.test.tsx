import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '../password-input'
import { InfoField } from '../info-field'
import { NotAuthorized } from '../not-authorized'
import { Badge } from '../badge'

describe('PasswordInput', () => {
  it('should hide the password by default and reveal it when the toggle is pressed', async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" defaultValue="Andina#2026" />)

    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should not render the toggle when showToggle is false', () => {
    render(<PasswordInput aria-label="Contraseña" showToggle={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('InfoField', () => {
  it('should show the label and value', () => {
    render(<InfoField label="Unit admin" value="Rafael Mejía" />)
    expect(screen.getByText('Unit admin')).toBeInTheDocument()
    expect(screen.getByText('Rafael Mejía')).toBeInTheDocument()
  })

  it('should fall back to "Not specified" when the value is empty', () => {
    render(<InfoField label="Website" value={null} />)
    expect(screen.getByText('Not specified')).toBeInTheDocument()
  })

  it('should render React nodes as given', () => {
    render(<InfoField label="Status" value={<strong>Active</strong>} />)
    expect(screen.getByText('Active').tagName).toBe('STRONG')
  })
})

describe('NotAuthorized', () => {
  it('should explain the denial and link back to the dashboard by default', () => {
    render(<NotAuthorized />)
    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })

  it('should accept a custom message and hide the button', () => {
    render(
      <NotAuthorized
        message="Solo los administradores centrales pueden ver los tenants."
        showHomeButton={false}
      />,
    )
    expect(
      screen.getByText('Solo los administradores centrales pueden ver los tenants.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('should render its text with the requested variant styling', () => {
    render(<Badge variant="destructive">Escalated</Badge>)
    const badge = screen.getByText('Escalated')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge.className).toContain('bg-destructive')
  })
})
