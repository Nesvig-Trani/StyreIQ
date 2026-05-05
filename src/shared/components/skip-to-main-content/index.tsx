import { cn } from '@/shared/utils/cn'

/**
 * WCAG 2.4.1 — first keyboard focus hop bypasses repetitive navigation when paired with `#main-content`.
 * Visually hidden off-screen until :focus-visible.
 */
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        'fixed left-4 top-0 z-[100] -translate-y-full',
        'bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md',
        'rounded-md border border-border outline-none',
        'transition-transform',
        'focus-visible:translate-y-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
      )}
    >
      Skip to main content
    </a>
  )
}
