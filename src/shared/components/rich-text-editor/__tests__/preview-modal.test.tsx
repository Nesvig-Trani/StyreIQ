import '../../__tests__/dom-polyfills'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { LexicalContentModal } from '../preview-modal'
import type { LexicalData } from '../preview-modal'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const policy: LexicalData = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: 'Política de uso de redes sociales', format: 0 }],
      },
      {
        type: 'paragraph',
        format: 'center',
        children: [
          { type: 'text', text: 'Texto en negrita', format: 1 },
          { type: 'linebreak' },
          { type: 'text', text: 'cursiva y tachado', format: 6 },
          { type: 'text', text: ' subrayado', format: 8 },
        ],
      },
      { type: 'paragraph', children: [] },
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            url: 'https://universidad-andina.edu/politicas',
            title: 'Políticas',
            children: [{ type: 'text', text: 'Ver políticas completas' }],
          },
          {
            type: 'link',
            url: 'javascript:alert(1)',
            children: [{ type: 'text', text: 'enlace inseguro' }],
          },
        ],
      },
      { type: 'custom-block', children: [{ type: 'text', text: 'Bloque personalizado' }] },
    ],
  },
}

describe('LexicalContentModal', () => {
  const originalLocation = window.location
  const replace = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  })

  it('should disable the preview trigger when there is no content', () => {
    render(<LexicalContentModal lexicalData={null} />)
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled()
  })

  it('should render the stored policy content when opened', async () => {
    const user = userEvent.setup()
    render(<LexicalContentModal lexicalData={policy} triggerText="Ver política" />)

    await user.click(screen.getByRole('button', { name: 'Ver política' }))

    expect(
      await screen.findByRole('heading', { name: 'Política de uso de redes sociales' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Texto en negrita')).toHaveClass('font-bold')
    expect(screen.getByText('cursiva y tachado')).toHaveClass('italic', 'line-through')
    expect(screen.getByText(/subrayado/)).toHaveClass('underline')
    expect(screen.getByText('Bloque personalizado')).toBeInTheDocument()
  })

  it('should render safe links as anchors and unsafe ones as plain text', async () => {
    const user = userEvent.setup()
    render(<LexicalContentModal lexicalData={policy} />)
    await user.click(screen.getByRole('button', { name: 'Preview' }))

    const link = await screen.findByRole('link', { name: 'Ver políticas completas' })
    expect(link).toHaveAttribute('href', 'https://universidad-andina.edu/politicas')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('enlace inseguro').closest('a')).toBeNull()
  })

  it('should accept the policy and refresh the page', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <LexicalContentModal
        lexicalData={policy}
        open
        showActions
        triggerButton={false}
        policy={5}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Accept and Continue' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('You have accepted the new policy'),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({ policy: 5 })
    expect(router.refresh).toHaveBeenCalled()
  })

  it('should report an error when accepting fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    render(
      <LexicalContentModal
        lexicalData={policy}
        open
        showActions
        triggerButton={false}
        policy={5}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Accept and Continue' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'))
  })

  it('should log the user out when the policy is rejected', async () => {
    const user = userEvent.setup()
    render(
      <LexicalContentModal
        lexicalData={policy}
        open
        showActions
        triggerButton={false}
        policy={5}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Cancel and Log Out' }))

    expect(replace).toHaveBeenCalledTimes(1)
    expect(String(replace.mock.calls[0][0])).toContain('/api/logout')
  })
})
