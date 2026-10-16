import '@/shared/components/__tests__/dom-polyfills'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PolicyHistory from '../../components/policy-history'
import { emptyLexicalState } from '../../constants/emptyLexicalState'
import { buildUser } from '@/shared/__tests__/fixtures'
import type { Policy } from '@/types/payload-types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard/policies',
  useSearchParams: () => new URLSearchParams(),
}))

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 1 }] }],
  },
})

const policies: Policy[] = [
  {
    id: 2,
    version: 0.2,
    text: paragraph('Las cuentas institucionales deben usar autenticación de dos factores.'),
    author: buildUser({ id: 3, name: 'Rodrigo Salcedo' }),
    createdAt: '2026-09-20T15:00:00.000Z',
    updatedAt: '2026-09-20T15:00:00.000Z',
  },
  {
    id: 1,
    version: 0.1,
    text: paragraph('Política inicial de redes sociales de la Universidad Andina.'),
    author: 3,
    createdAt: '2026-08-01T15:00:00.000Z',
    updatedAt: '2026-08-01T15:00:00.000Z',
  },
]

describe('PolicyHistory', () => {
  it('should keep the history closed until the trigger is pressed', () => {
    render(<PolicyHistory policies={policies} />)
    expect(screen.getByRole('button', { name: /View Policy History/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should list every version with its date and author when populated', async () => {
    const user = userEvent.setup()
    render(<PolicyHistory policies={policies} />)

    await user.click(screen.getByRole('button', { name: /View Policy History/ }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Policy Version History')).toBeInTheDocument()
    expect(within(dialog).getByText('Version 0.2')).toBeInTheDocument()
    expect(within(dialog).getByText('Version 0.1')).toBeInTheDocument()
    expect(within(dialog).getByText(/September 20, 2026/)).toBeInTheDocument()
    expect(within(dialog).getByText('Rodrigo Salcedo')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('button', { name: 'View' })).toHaveLength(2)
  })

  it('should show the content of the selected version', async () => {
    const user = userEvent.setup()
    render(<PolicyHistory policies={policies} />)
    await user.click(screen.getByRole('button', { name: /View Policy History/ }))

    const [newest] = await screen.findAllByRole('button', { name: 'View' })
    await user.click(newest)

    expect(
      await screen.findByText(
        'Las cuentas institucionales deben usar autenticación de dos factores.',
      ),
    ).toBeInTheDocument()
  })
})

describe('emptyLexicalState', () => {
  it('should be a root with a single empty paragraph', () => {
    expect(emptyLexicalState.root.type).toBe('root')
    expect(emptyLexicalState.root.children).toHaveLength(1)
    expect(emptyLexicalState.root.children[0].type).toBe('paragraph')
    expect(emptyLexicalState.root.children[0].children[0].text).toBe('')
  })
})
