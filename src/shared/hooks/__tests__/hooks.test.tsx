import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { useIsMobile } from '../use-mobile'
import { useLoading } from '../useLoading'
import { useAccess } from '../use-access'
import { useDocumentEscapeCapture } from '../useDocumentEscapeCapture'
import { buildOrganization, buildUser } from '../../__tests__/fixtures'

describe('useLoading', () => {
  it('should toggle the loading flag with start and stop', () => {
    const { result } = renderHook(() => useLoading())
    expect(result.current.isLoading).toBe(false)

    act(() => result.current.startLoading())
    expect(result.current.isLoading).toBe(true)

    act(() => result.current.stopLoading())
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useIsMobile', () => {
  const originalWidth = window.innerWidth
  let changeListener: (() => void) | undefined

  beforeEach(() => {
    changeListener = undefined
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        changeListener = listener as () => void
      },
      removeEventListener: () => {
        changeListener = undefined
      },
      dispatchEvent: () => false,
    })
  })

  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it('should report mobile for narrow viewports', () => {
    window.innerWidth = 500
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('should report desktop for wide viewports and react to resizes', () => {
    window.innerWidth = 1280
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    window.innerWidth = 600
    act(() => changeListener?.())
    expect(result.current).toBe(true)
  })

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile())
    expect(changeListener).toBeDefined()
    unmount()
    expect(changeListener).toBeUndefined()
  })
})

describe('useAccess', () => {
  it('should let a super admin manage tenants', () => {
    const admin = buildUser({ roles: ['super_admin'] })
    const { result } = renderHook(() => useAccess(admin))
    expect(result.current.can('create', 'TENANTS')).toBe(true)
  })

  it('should deny a social media manager access to user management', () => {
    const manager = buildUser({
      roles: ['social_media_manager'],
      organizations: [buildOrganization()],
    })
    const { result } = renderHook(() => useAccess(manager))
    expect(result.current.can('delete', 'USERS')).toBe(false)
  })
})

describe('useDocumentEscapeCapture', () => {
  function Probe({ active, onEscape }: { active: boolean; onEscape: () => void }) {
    const returnRef = useRef<HTMLButtonElement>(null)
    useDocumentEscapeCapture(active, { onEscape, returnFocusRef: returnRef })
    return <button ref={returnRef}>Volver al listado</button>
  }

  it('should run the callback and restore focus when Escape is pressed while active', async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(<Probe active onEscape={onEscape} />)

    await user.keyboard('{Escape}')

    expect(onEscape).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(screen.getByRole('button')).toHaveFocus())
  })

  it('should ignore other keys', async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(<Probe active onEscape={onEscape} />)
    await user.keyboard('a')
    expect(onEscape).not.toHaveBeenCalled()
  })

  it('should do nothing while inactive', async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(<Probe active={false} onEscape={onEscape} />)
    await user.keyboard('{Escape}')
    expect(onEscape).not.toHaveBeenCalled()
  })
})
