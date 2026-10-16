import '../../__tests__/dom-polyfills'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RichTextEditor from '../index'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const initialState = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Uso responsable de las cuentas institucionales',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

beforeEach(() => vi.clearAllMocks())

describe('RichTextEditor', () => {
  it('should show the stored policy text', async () => {
    render(<RichTextEditor initialState={initialState} isSuperAdmin selectedTenantId={10} />)
    expect(
      await screen.findByText('Uso responsable de las cuentas institucionales'),
    ).toBeInTheDocument()
  })

  it('should keep saving disabled for users who are not super admins', () => {
    render(<RichTextEditor initialState={initialState} />)
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    expect(save).toHaveAttribute('title', 'Only the Super Admin can save policies')
  })

  it('should ask a super admin to pick a tenant before saving', () => {
    render(<RichTextEditor initialState={initialState} isSuperAdmin selectedTenantId={null} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText(/Please select a tenant from the selector/)).toBeInTheDocument()
  })
})
