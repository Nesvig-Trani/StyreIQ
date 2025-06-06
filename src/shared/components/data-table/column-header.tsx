'use client'

import type { Column } from '@tanstack/react-table'
import { cn } from '@/shared/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'
import { ArrowDownIcon, ArrowDownUpIcon, ArrowUpIcon, EyeOffIcon } from 'lucide-react'

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
} & React.HTMLAttributes<HTMLDivElement>

export const DataTableColumnHeader = <TData, TValue>(
  props: DataTableColumnHeaderProps<TData, TValue>,
): React.ReactNode => {
  const { column, title, className } = props

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const isSorted = column.getIsSorted()
  const canHide = column.getCanHide()

  const handleAscClick = (): void => {
    if (isSorted !== 'asc') {
      column.toggleSorting(false)
    } else {
      column.clearSorting()
    }
  }
  const handleDescClick = (): void => {
    if (isSorted !== 'desc') {
      column.toggleSorting(true)
    } else {
      column.clearSorting()
    }
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span>{title}</span>
            {isSorted === 'desc' && <ArrowDownIcon className="ml-2 h-4 w-4" />}
            {isSorted === 'asc' && <ArrowUpIcon className="ml-2 h-4 w-4" />}
            {isSorted === false && <ArrowDownUpIcon className="ml-2 h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={handleAscClick}
            className={cn(isSorted === 'asc' && 'bg-muted/50')}
          >
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDescClick}
            className={cn(isSorted === 'desc' && 'bg-muted/50')}
          >
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>

          {canHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(): void => column.toggleVisibility(false)}>
                <EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
