import { type RefObject, useEffect, useRef } from 'react'

type EscapeCaptureOptions = {
  onEscape: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}

/**
 * While `active`, intercepts Escape on `document` (capture) before layered UI
 * (e.g. Radix Dialog) handles it — then runs `onEscape` and restores focus.
 */
export function useDocumentEscapeCapture(active: boolean, options: EscapeCaptureOptions) {
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    if (!active) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      optsRef.current.onEscape()
      queueMicrotask(() => optsRef.current.returnFocusRef.current?.focus())
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [active])
}
