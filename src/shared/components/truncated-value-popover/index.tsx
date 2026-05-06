'use client'

import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'

export type TruncatedValuePopoverProps = {
  /** Full text shown inside the popover. */
  value: string
  /** Accessible name for the disclosure control (e.g. "Show full email"). */
  expandLabel: string
  /** Optional visible label on the control; keep short for dense tables. */
  expandVisibleLabel?: string
  /** Wrapper / preview width constraint. */
  maxWidthClassName?: string
  className?: string
  /** When false, skips the popover if `value` is empty or whitespace only. */
  allowEmpty?: boolean
  /**
   * Minimum character length before showing the disclosure control.
   * Shorter values render as plain truncated text only.
   */
  disclosureMinLength?: number
}

/**
 * Table/dense layout helper: truncated preview with a keyboard-reachable popover
 * for the full value (does not rely on the native `title` tooltip).
 */
export function TruncatedValuePopover({
  value,
  expandLabel,
  expandVisibleLabel = 'View',
  maxWidthClassName = 'max-w-[200px]',
  className,
  allowEmpty = false,
  disclosureMinLength = 36,
}: TruncatedValuePopoverProps) {
  const trimmed = value.trim()
  if (!trimmed && !allowEmpty) {
    return <span className="text-muted-foreground">—</span>
  }

  const showDisclosure = trimmed.length >= disclosureMinLength

  if (!showDisclosure) {
    return <span className={cn('break-all', className)}>{value}</span>
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-1', maxWidthClassName, className)}>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto shrink-0 px-1 py-0 text-xs underline-offset-2"
            aria-label={expandLabel}
          >
            {expandVisibleLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-sm">
          <p className="text-sm whitespace-pre-wrap wrap-break-word">{value}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}
