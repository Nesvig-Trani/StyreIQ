import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Building2, Shield } from 'lucide-react'
import { HeaderMetricCard } from '@/features/dashboard/components/header-metric-card'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import { StatusCard } from '@/features/dashboard/components/status-card'
import { RiskCategoryCard } from '@/features/dashboard/components/risk-category-card'
import { RiskDetailsModal } from '@/features/dashboard/components/risk-details-modal'

describe('HeaderMetricCard', () => {
  it('should announce the value together with its subtitle', () => {
    render(
      <HeaderMetricCard
        title="Total Units"
        value={24}
        icon={Building2}
        subtitle="Departments & sub-units"
      />,
    )
    expect(screen.getByText('Total Units')).toBeVisible()
    expect(screen.getByLabelText('24, Departments & sub-units')).toBeInTheDocument()
  })
})

describe('StatusCard', () => {
  it('should expose value and subtitle as a single accessible label', () => {
    render(
      <StatusCard
        title="Completed"
        value={18}
        subtitle="of 20 tasks"
        icon={Shield}
        color="green"
      />,
    )
    expect(screen.getByLabelText('18, of 20 tasks')).toBeInTheDocument()
  })

  it('should fall back to the default palette for unknown colors', () => {
    const { container } = render(
      <StatusCard title="Pending" value={2} subtitle="tasks" icon={Shield} color="blue" />,
    )
    expect(container.querySelector('.bg-blue-50')).not.toBeNull()
  })
})

describe('MetricCard', () => {
  it('should render a plain value without an aria override', () => {
    render(<MetricCard title="Accounts" value={12} icon={Shield} />)
    expect(screen.getByText('Accounts')).toBeVisible()
    expect(screen.getByText('12')).not.toHaveAttribute('aria-hidden')
  })

  it('should combine value, subtitle and risk badge into the accessible name', () => {
    render(
      <MetricCard
        title="Unprotected Accounts"
        value={5}
        icon={Shield}
        riskLevel="high"
        subtitle="Without 2FA"
      />,
    )
    expect(screen.getByLabelText('5, Without 2FA, High Risk')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
  })

  it('should label medium risk and omit the badge for low risk', () => {
    const { rerender } = render(
      <MetricCard title="Passwords" value="3" icon={Shield} riskLevel="medium" />,
    )
    expect(screen.getByLabelText('3, Medium Risk')).toBeInTheDocument()
    rerender(<MetricCard title="Passwords" value="3" icon={Shield} riskLevel="low" />)
    expect(screen.queryByText(/Risk/)).not.toBeInTheDocument()
  })
})

describe('RiskCategoryCard', () => {
  it('should render as an interactive button when a click handler is provided', async () => {
    const onClick = vi.fn()
    render(
      <RiskCategoryCard
        title="Access Management"
        subtitle="Review and confirm access"
        issues={3}
        color="red"
        icon={Shield}
        onClick={onClick}
      />,
    )
    const card = screen.getByRole('button', { name: 'Open category — Access Management' })
    expect(screen.getByLabelText('Review and confirm access, 3 issues')).toBeInTheDocument()
    await userEvent.click(card)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should use the singular form for a single issue and render items when static', () => {
    render(
      <RiskCategoryCard
        title="Policies & Training"
        subtitle="Acknowledge policies"
        issues={1}
        color="yellow"
        icon={Shield}
        items={[
          { label: 'Política de redes sociales', severity: 'high' },
          { label: 'Curso de gobernanza', severity: 'medium' },
          { label: 'Revisión anual', severity: 'low' },
        ]}
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Acknowledge policies, 1 issue')).toBeInTheDocument()
    expect(screen.getByText('Política de redes sociales')).toBeVisible()
    expect(screen.getByText('Revisión anual')).toBeVisible()
  })
})

describe('RiskDetailsModal', () => {
  const issue = {
    id: '1',
    title: 'Missing 2FA',
    description: 'La cuenta de Instagram no tiene verificación en dos pasos',
    severity: 'high' as const,
    dueDate: '2026-10-30T12:00:00.000Z',
    user: { id: 9, name: 'Jimena Salazar', email: 'jimena.salazar@universidad-andina.edu' },
  }

  it('should show an empty state when there are no issues', () => {
    render(
      <RiskDetailsModal
        isOpen
        onClose={vi.fn()}
        title="Flagged Issues"
        subtitle="Resolve manually flagged issues"
        issues={[]}
        icon={Shield}
        color="gray"
      />,
    )
    expect(screen.getByText('No issues found')).toBeVisible()
    expect(
      screen.getByText('There are currently no flagged issues requiring attention.'),
    ).toBeVisible()
  })

  it('should list the issues with their assigned user and due date', () => {
    render(
      <RiskDetailsModal
        isOpen
        onClose={vi.fn()}
        title="Access Management"
        subtitle="Review and confirm access"
        issues={[
          issue,
          { ...issue, id: '2', title: 'Outdated Password', severity: 'medium', user: undefined },
        ]}
        icon={Shield}
        color="orange"
      />,
    )
    expect(screen.getByText('Missing 2FA')).toBeVisible()
    expect(screen.getByText('Jimena Salazar')).toBeVisible()
    expect(screen.getByText('jimena.salazar@universidad-andina.edu')).toBeVisible()
    expect(screen.getByText('Outdated Password')).toBeVisible()
    expect(screen.getAllByText(/10\/30\/2026/)).toHaveLength(2)
  })

  it('should call onClose when the dialog is dismissed', async () => {
    const onClose = vi.fn()
    render(
      <RiskDetailsModal
        isOpen
        onClose={onClose}
        title="Access Management"
        subtitle="Review and confirm access"
        issues={[issue]}
        icon={Shield}
        color="red"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('should render nothing while closed', () => {
    render(
      <RiskDetailsModal
        isOpen={false}
        onClose={vi.fn()}
        title="Access Management"
        subtitle="Review"
        issues={[]}
        icon={Shield}
        color="red"
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
