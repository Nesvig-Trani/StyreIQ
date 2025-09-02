'use client'

import { useEffect, useState } from 'react'
import { Button, cn } from '@/shared'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { CheckIcon, PlusCircleIcon } from 'lucide-react'

interface FilterPopoverProps {
  label: string
  placeholder: string
  options: { value: string; label: string }[]
  selectedValue?: string
  onChange: (value?: string) => void
}

const FilterPopover = ({
  label,
  placeholder,
  options,
  selectedValue,
  onChange,
}: FilterPopoverProps) => {
  const [localValue, setLocalValue] = useState<string | undefined>(selectedValue)

  useEffect(() => {
    setLocalValue(selectedValue)
  }, [selectedValue])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {label}
          {localValue && (
            <span className="ml-2 rounded bg-primary px-1 text-xs text-primary-foreground">1</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder}...`} />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setLocalValue(undefined)
                  onChange(undefined)
                }}
              >
                <span>All {label}</span>
              </CommandItem>
              {options.map((option) => {
                const isSelected = localValue === option.value
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      setLocalValue(option.value)
                      onChange(option.value)
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <span className="block max-w-[180px] truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default FilterPopover
