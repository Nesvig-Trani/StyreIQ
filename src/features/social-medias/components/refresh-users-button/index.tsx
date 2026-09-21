'use client'
import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

interface RefreshUsersButtonProps {
  onRefresh: () => void
  isRefreshing: boolean
  /** Keeps the button's space in the layout while it is not visible */
  hidden?: boolean
}

export const RefreshUsersButton: React.FC<RefreshUsersButtonProps> = ({
  onRefresh,
  isRefreshing,
  hidden = false,
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onRefresh}
    disabled={isRefreshing}
    className={cn(
      'h-6 gap-1 px-2 text-xs font-normal text-muted-foreground hover:text-primary',
      hidden && 'invisible pointer-events-none',
    )}
    aria-hidden={hidden}
    aria-label="Refresh users list"
  >
    <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} aria-hidden="true" />
    Refresh users
  </Button>
)
