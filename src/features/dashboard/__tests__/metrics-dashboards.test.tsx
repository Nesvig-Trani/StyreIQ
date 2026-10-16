import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AggregateMetricsView } from '@/features/dashboard/components/aggregate-metrics'
import { CentralAdminDashboard } from '@/features/dashboard/components/central-admin-dashboard'

const fetchMock = vi.fn<typeof fetch>()

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('CentralAdminDashboard', () => {
  it('should show the tenant metrics once loaded', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        totalUsers: 42,
        totalUnits: 7,
        totalTasks: 20,
        completedTasks: 15,
        completionRate: 75,
      }),
    )
    render(<CentralAdminDashboard tenantId={10} />)
    expect(await screen.findByLabelText('42, Across all units')).toBeInTheDocument()
    expect(screen.getByLabelText('7, Departments & sub-units')).toBeInTheDocument()
    expect(screen.getByLabelText('75%, 15 of 20 tasks completed')).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/tenants/10/metrics')
  })

  it('should show an error card when the metrics request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Forbidden' }))
    render(<CentralAdminDashboard tenantId={11} />)
    expect(await screen.findByText('Error Loading Dashboard')).toBeVisible()
    expect(screen.getByText('HTTP 403')).toBeVisible()
  })

  it('should show a loading skeleton before the data arrives', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { container } = render(<CentralAdminDashboard tenantId={10} />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Error Loading Dashboard')).not.toBeInTheDocument()
  })
})

describe('AggregateMetricsView', () => {
  it('should show the platform wide metrics', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        totalTenants: 3,
        aggregateMetrics: {
          totalUsers: 120,
          totalTasks: 80,
          totalCompletedTasks: 60,
          averageCompletionRate: 72,
        },
      }),
    )
    render(<AggregateMetricsView />)
    expect(await screen.findByLabelText('3, Organizations using the platform')).toBeInTheDocument()
    expect(screen.getByLabelText('120, Across all tenants')).toBeInTheDocument()
    expect(screen.getByLabelText('80, 60 completed')).toBeInTheDocument()
    expect(screen.getByLabelText('72%, Average across all tenants')).toBeInTheDocument()
  })

  it('should show an error card with the failure reason', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<AggregateMetricsView />)
    expect(await screen.findByText('Error Loading Metrics')).toBeVisible()
    expect(screen.getByText('Failed to fetch')).toBeVisible()
  })

  it('should include the status text when the server answers with an error', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500, statusText: 'Server Error' }))
    render(<AggregateMetricsView />)
    expect(await screen.findByText('HTTP 500: Server Error')).toBeVisible()
  })
})
