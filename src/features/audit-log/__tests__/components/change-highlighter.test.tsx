import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangeHighlighter } from '../../components/change-highlighter'

describe('ChangeHighlighter', () => {
  it('should show every labelled field as created when there is no previous state', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{}}
        current={{
          name: 'Camila Ortega',
          email: 'camila.ortega@universidad-andina.edu',
          secret: 'x',
        }}
      />,
    )
    expect(screen.getByText('Changes (Created)')).toBeInTheDocument()
    expect(screen.getByText('Name:')).toBeInTheDocument()
    expect(screen.getByText('Camila Ortega')).toBeInTheDocument()
    expect(screen.getByText('camila.ortega@universidad-andina.edu')).toBeInTheDocument()
  })

  it('should leave out fields that have no human label', () => {
    render(<ChangeHighlighter title="Changes" prev={{}} current={{ passwordHash: 'abc123' }} />)
    expect(screen.queryByText('abc123')).not.toBeInTheDocument()
  })

  it('should show removed and added values for a changed field', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ status: 'pending', name: 'Camila Ortega' }}
        current={{ status: 'active', name: 'Camila Ortega' }}
      />,
    )
    expect(screen.getByText('Changes (Updated)')).toBeInTheDocument()
    expect(screen.getByText('pending')).toHaveClass('line-through')
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('Camila Ortega')).not.toHaveClass('line-through')
  })

  it('should only show the new value when the field did not exist before', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ name: 'Camila Ortega' }}
        current={{ name: 'Camila Ortega', phone: '+57 300 555 0142' }}
      />,
    )
    expect(screen.getByText('+57 300 555 0142')).toBeInTheDocument()
    expect(screen.getByText('+57 300 555 0142')).not.toHaveClass('line-through')
  })

  it('should only show the old value when the field was removed', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ name: 'Camila Ortega', phone: '+57 300 555 0142' }}
        current={{ name: 'Camila Ortega' }}
      />,
    )
    expect(screen.getByText('+57 300 555 0142')).toHaveClass('line-through')
  })

  it('should render related records by name and lists as comma separated values', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ unit: { id: 1, name: 'Facultad de Ingeniería' }, role: ['unit_admin'] }}
        current={{
          unit: { id: 2, name: 'Dirección de Comunicaciones' },
          role: ['unit_admin', { id: 3, name: 'Social Media Manager' }],
        }}
      />,
    )
    expect(screen.getByText('Facultad de Ingeniería')).toBeInTheDocument()
    expect(screen.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    expect(screen.getByText('"unit_admin"')).toBeInTheDocument()
    expect(screen.getByText('"unit_admin", Social Media Manager')).toBeInTheDocument()
  })

  it('should stringify objects that have no name', () => {
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ source: { channel: 'email' } }}
        current={{ source: { channel: 'web' } }}
      />,
    )
    expect(screen.getByText('{"channel":"email"}')).toBeInTheDocument()
    expect(screen.getByText('{"channel":"web"}')).toBeInTheDocument()
  })

  it('should format ISO timestamps as locale dates', () => {
    const iso = '2026-09-15T16:45:00.000Z'
    render(
      <ChangeHighlighter
        title="Changes"
        prev={{ end_date: '2026-08-01T10:00:00.000Z' }}
        current={{ end_date: iso }}
      />,
    )
    expect(screen.getByText(new Date(iso).toLocaleString())).toBeInTheDocument()
  })
})
