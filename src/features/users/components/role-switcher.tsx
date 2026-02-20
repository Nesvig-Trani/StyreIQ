'use client'

import { UserCircle, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { UserRolesEnum, roleLabelMap } from '@/features/users/schemas'
import { switchRoleRequest } from '@/sdk/users'
import { toast } from 'sonner'

interface RoleSwitcherProps {
  userRoles: UserRolesEnum[]
  activeRole: UserRolesEnum
}

const getRoleDescription = (role: UserRolesEnum): string => {
  const descriptions: Record<UserRolesEnum, string> = {
    [UserRolesEnum.SuperAdmin]: 'Full system access',
    [UserRolesEnum.CentralAdmin]: 'Manage entire organization',
    [UserRolesEnum.UnitAdmin]: 'Manage your unit',
    [UserRolesEnum.SocialMediaManager]: 'Manage social accounts',
  }
  return descriptions[role] || ''
}

export const RoleSwitcher: FC<RoleSwitcherProps> = ({ userRoles, activeRole }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelect = useCallback(
    async (newRole: UserRolesEnum) => {
      if (newRole === activeRole) {
        setOpen(false)
        return
      }

      setIsLoading(true)
      setOpen(false)

      try {
        await switchRoleRequest(newRole)

        localStorage.removeItem('dashboardCache')
        localStorage.removeItem('userPermissions')

        toast.success(`Switched to ${roleLabelMap[newRole]}`)

        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to switch role')
      } finally {
        setIsLoading(false)
      }
    },
    [activeRole, router],
  )

  if (!userRoles || userRoles.length <= 1) {
    return null
  }

  return (
    <div className="w-full space-y-1.5">
      <label className="text-xs font-medium text-gray-500">Acting as</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Switch role"
            disabled={isLoading}
            className={cn(
              'w-full justify-between bg-white hover:bg-gray-50',
              isLoading && 'opacity-70 cursor-wait',
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate">Switching...</span>
                </>
              ) : (
                <>
                  <UserCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm truncate">{roleLabelMap[activeRole]}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search roles..." className="h-9" />
            <CommandList>
              <CommandEmpty>No role found.</CommandEmpty>

              <CommandGroup heading="Your Roles">
                {userRoles.map((role) => {
                  const isSelected = activeRole === role

                  return (
                    <CommandItem
                      key={role}
                      value={roleLabelMap[role]}
                      onSelect={() => handleSelect(role)}
                      className="cursor-pointer"
                    >
                      <UserCircle
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'text-blue-600' : 'text-gray-400',
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn('truncate', isSelected && 'font-medium')}>
                          {roleLabelMap[role]}
                        </span>
                        <span className="text-xs text-gray-600">{getRoleDescription(role)}</span>
                      </div>
                      {isSelected && <Check className="ml-2 h-4 w-4 text-blue-600" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
