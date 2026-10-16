import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ComplianceTasksPage from '@/app/(dashboard)/dashboard/compliance/page'
import ResourcesPage from '@/app/(dashboard)/dashboard/resources/page'
import { buildComplianceTask, buildUser } from '@/shared/__tests__/fixtures'
import { createAuthPayload, pageOf } from '@/features/auth/__tests__/auth-boundaries'
import { redirectError } from '../app-fixtures'

const payload = createAuthPayload()

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))
vi.mock('@/shared/utils/getPayloadContext', () => ({
  getPayloadContext: async () => ({ payload: payload.asPayload() }),
}))

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

beforeEach(() => {
  payload.auth.mockReset()
  payload.find.mockReset().mockResolvedValue(pageOf([]))
})

describe('compliance tasks page', () => {
  it('should send an anonymous visitor to login', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(ComplianceTasksPage()).rejects.toThrow(redirectError('/login'))
  })

  it('should explain to a super admin that tasks belong to other roles', async () => {
    payload.auth.mockResolvedValue({ user: buildUser({ roles: ['super_admin'] }) })
    render(await ComplianceTasksPage())
    expect(screen.getByText('Administrative View')).toBeInTheDocument()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should congratulate a user with no open tasks', async () => {
    payload.auth.mockResolvedValue({ user: buildUser() })
    render(await ComplianceTasksPage())
    expect(screen.getByText('Excellent work!')).toBeInTheDocument()
    expect(screen.queryByText(/Overdue$/)).not.toBeInTheDocument()
  })

  it('should list pending and overdue tasks with counts and action links', async () => {
    payload.auth.mockResolvedValue({ user: buildUser({ id: 5 }) })
    payload.find.mockResolvedValue(
      pageOf([
        buildComplianceTask({
          id: 21,
          type: 'POLICY_ACKNOWLEDGMENT',
          status: 'PENDING',
          dueDate: daysFromNow(5),
          description: 'Revise la política de redes sociales',
        }),
        buildComplianceTask({
          id: 22,
          type: 'CONFIRM_2FA',
          status: 'OVERDUE',
          dueDate: daysFromNow(-3),
          remindersSent: [{ sentAt: daysFromNow(-6), daysSinceDue: 3 }],
        }),
      ]),
    )
    render(await ComplianceTasksPage())

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'compliance_tasks',
        where: expect.objectContaining({ assignedUser: { equals: 5 } }),
      }),
    )
    expect(screen.getByText('1 Pending')).toBeInTheDocument()
    expect(screen.getByText('1 Overdue')).toBeInTheDocument()
    expect(screen.getByText('Acknowledge Policy')).toBeInTheDocument()
    expect(screen.getByText('Revise la política de redes sociales')).toBeInTheDocument()
    expect(screen.getByText(/Overdue by 3 days/)).toBeInTheDocument()
    expect(screen.getByText(/Overdue tasks may result in escalations/)).toBeInTheDocument()
    expect(screen.getByText('1 reminder(s) sent')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /Take Action/ })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/compliance/policy/21',
      '/dashboard/compliance/2fa/22',
    ])
  })
})

describe('training resources page', () => {
  it('should send an anonymous visitor to login', async () => {
    payload.auth.mockResolvedValue({ user: null })
    await expect(ResourcesPage()).rejects.toThrow(redirectError('/login'))
  })

  it('should invite the user to finish a training when nothing is completed', async () => {
    payload.auth.mockResolvedValue({ user: buildUser() })
    render(await ResourcesPage())
    expect(screen.getByText('No completed trainings yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to My Compliance Tasks/ })).toHaveAttribute(
      'href',
      '/dashboard/compliance',
    )
  })

  it('should list completed trainings from the profile and from completed tasks', async () => {
    payload.auth.mockResolvedValue({
      user: buildUser({ isCompletedTrainingGovernance: true }),
    })
    payload.find.mockResolvedValue(
      pageOf([
        buildComplianceTask({ type: 'TRAINING_COMPLETION', relatedTraining: 'training-risk' }),
        buildComplianceTask({ id: 2, type: 'TRAINING_COMPLETION', relatedTraining: 'unknown' }),
      ]),
    )
    render(await ResourcesPage())

    expect(
      screen.getByText('Social Media Governance Essentials: Accessibility, Compliance & Risk'),
    ).toBeInTheDocument()
    expect(screen.getByText('Social Media Risk Mitigation')).toBeInTheDocument()
    expect(screen.getAllByText('Completed')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Review Training/ })).toHaveAttribute(
      'href',
      '/trainings/governance-essentials/index.html',
    )
    expect(screen.getByRole('link', { name: /Start Training/ })).toHaveAttribute(
      'href',
      '/trainings/risk-mitigation/index.html',
    )
  })
})
