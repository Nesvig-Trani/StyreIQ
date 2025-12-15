'use client'

import { Building2, Globe, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'

import { cn } from '@/shared/utils/cn'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { useTenant } from '../contexts/tenant-context'
import { useRouter } from 'next/navigation'

export const TenantSelector: FC = () => {
  const {
    selectedTenant,
    availableTenants,
    selectTenant,
    isLoading,
    canSwitchTenants,
    isViewingAllTenants,
  } = useTenant()

  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!canSwitchTenants || availableTenants.length === 0) {
    return null
  }

  const handleSelect = async (tenantId: number | null) => {
    setOpen(false)
    await selectTenant(tenantId)

    router.refresh()
  }

  return (
    <div className="w-full space-y-1.5">
      <label className="text-xs font-medium text-gray-500">Viewing Tenant</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a tenant"
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
              ) : isViewingAllTenants ? (
                <>
                  <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm truncate">All Tenants</span>
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm truncate">{selectedTenant?.name}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tenants..." className="h-9" />
            <CommandList>
              <CommandEmpty>No tenant found.</CommandEmpty>

              <CommandGroup>
                <CommandItem
                  value="all-tenants"
                  onSelect={() => handleSelect(null)}
                  className="cursor-pointer"
                >
                  <Globe className="mr-2 h-4 w-4 text-gray-500" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium">All Tenants</span>
                    <span className="text-xs text-gray-500">
                      View aggregate data from all tenants
                    </span>
                  </div>
                  {isViewingAllTenants && <Check className="ml-2 h-4 w-4 text-blue-600" />}
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Tenants">
                {availableTenants.map((tenant) => {
                  const isSelected = selectedTenant?.id === tenant.id

                  return (
                    <CommandItem
                      key={tenant.id}
                      value={`${tenant.name} ${tenant.domain || ''}`}
                      onSelect={() => handleSelect(tenant.id)}
                      className="cursor-pointer"
                    >
                      <Building2
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'text-blue-600' : 'text-gray-400',
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn('truncate', isSelected && 'font-medium')}>
                          {tenant.name}
                        </span>
                        {tenant.domain && (
                          <span className="text-xs text-gray-500 truncate">{tenant.domain}</span>
                        )}
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
