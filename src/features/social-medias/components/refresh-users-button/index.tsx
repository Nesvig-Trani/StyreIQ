'use client'
import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface RefreshUsersButtonProps {
  onRefresh: () => void
  isRefreshing: boolean
}

export const RefreshUsersButton: React.FC<RefreshUsersButtonProps> = ({
  onRefresh,
  isRefreshing,
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onRefresh}
    disabled={isRefreshing}
    className="h-6 gap-1 px-2 text-xs font-normal text-muted-foreground hover:text-primary"
    aria-label="Refresh users list"
  >
    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
    Refresh users
  </Button>
)
