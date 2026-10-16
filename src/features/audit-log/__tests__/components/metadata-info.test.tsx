import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MetadataInfo } from '../../components/metadata-info'

describe('MetadataInfo', () => {
  it.each([[null], [undefined], [{}], [[]]])('should say there is no data for %j', (metadata) => {
    render(<MetadataInfo metadata={metadata} auditLogId={1} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('should describe the region for assistive technology', () => {
    render(<MetadataInfo metadata={{ taskId: 4 }} auditLogId={88} />)
    const region = screen.getByRole('region', { name: 'Metadata' })
    expect(region).toHaveAccessibleDescription('Audit log metadata for event 88')
  })

  it('should humanize keys and format scalar values', () => {
    render(
      <MetadataInfo
        metadata={{
          task_type: 'POLICY_ACKNOWLEDGMENT',
          emailType: 'task_created',
          success: true,
          retried: false,
          totalUsers: 12,
          sentAt: '2026-09-15T16:45:00.000Z',
          recipient: 'valentina.restrepo@universidad-andina.edu',
        }}
        auditLogId={1}
      />,
    )
    expect(screen.getByText('Task type')).toBeInTheDocument()
    expect(screen.getByText('Email Type')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(
      screen.getByText(new Date('2026-09-15T16:45:00.000Z').toLocaleString()),
    ).toBeInTheDocument()
    expect(screen.getByText('valentina.restrepo@universidad-andina.edu')).toBeInTheDocument()
  })

  it('should render nested objects and arrays', () => {
    render(
      <MetadataInfo
        metadata={{
          errors: ['Mailbox full', 'Invalid address'],
          unit: { name: 'Dirección de Comunicaciones', tags: [] },
          missing: null,
        }}
        auditLogId={1}
      />,
    )
    const list = screen.getByRole('list')
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Mailbox full', 'Invalid address'])
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('should list array metadata under an Items label', () => {
    render(<MetadataInfo metadata={['Camila Ortega', 'Mateo Giraldo']} auditLogId={1} />)
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('Mateo Giraldo')).toBeInTheDocument()
  })

  it('should show primitive metadata under a Value label', () => {
    render(<MetadataInfo metadata="Reminder sent to the unit admin" auditLogId={1} />)
    expect(screen.getByText('Value')).toBeInTheDocument()
    expect(screen.getByText('Reminder sent to the unit admin')).toBeInTheDocument()
  })

  it('should stop expanding objects nested deeper than the supported depth', () => {
    const deep = {
      l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: { l9: { leaf: 'x' } } } } } } } } },
    }
    render(<MetadataInfo metadata={deep} auditLogId={1} />)
    expect(screen.getByText('{"leaf":"x"}')).toBeInTheDocument()
  })
})
