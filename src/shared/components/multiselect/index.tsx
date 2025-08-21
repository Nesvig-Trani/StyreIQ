import { Check, ChevronDown, XCircle } from 'lucide-react'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command'
import { Separator } from '@/shared/components/ui/separator'
import { Button } from '@/shared/components/ui/button'

const defaultButtonClassname =
  'm-1 h-auto w-auto cursor-pointer border-0 px-2.5 py-0.5 text-xs transition delay-150 duration-300 ease-in-out'

export type MultiSelectOption = {
  /** The text to display for the option. */
  label: string
  /** The unique value associated with the option. */
  value: string
  /** Optional icon component to display alongside the option. */
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Props for MultiSelect component
 */
type MultiSelectProps = {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: MultiSelectOption[]

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void

  /** The default selected values when the component mounts. */
  defaultValue?: string[]

  /** Selected options as a controlled prop */
  value?: string[]

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      defaultValue = [],
      value: valueFromProps,
      placeholder = 'Select options',
      modalPopover = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const [searchInput, setSearchInput] = React.useState('')
    const previousOptions = React.useRef<MultiSelectOption[]>(options)

    const [filteredValues, setFilteredValues] = React.useState<MultiSelectOption[]>(options)

    // sync controlled props
    if (valueFromProps !== undefined && valueFromProps !== selectedValues) {
      setSelectedValues(valueFromProps)
    }

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        setIsPopoverOpen(true)
      }
    }

    const filterOptions = React.useCallback(
      (search: string) => {
        const filtered = options.filter((option) =>
          option.label.toLowerCase().trim().includes(search),
        )
        setFilteredValues(filtered)
      },
      [options],
    )

    const handleInput = (inputValue: string): void => {
      setSearchInput(inputValue)
      filterOptions(inputValue)
    }

    React.useEffect(() => {
      if (previousOptions.current !== options) {
        previousOptions.current = options
        filterOptions(searchInput)
      }
    }, [filterOptions, options, searchInput])

    const toggleOption = (option: string): void => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option]
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    }

    const handleClear = (): void => {
      setSelectedValues([])
      onValueChange([])
    }

    const handleTogglePopover = (): void => {
      setIsPopoverOpen((prev) => !prev)
    }

    const toggleAll = (): void => {
      if (selectedValues.length === options.length) {
        handleClear()
      } else {
        const allValues = options.map((option) => option.value)
        setSelectedValues(allValues)
        onValueChange(allValues)
      }
    }

    return (
      <div className="space-y-2">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              {...props}
              onClick={handleTogglePopover}
              className={cn(
                'flex w-full p-1 font-normal text-muted-foreground rounded-md border h-10 items-center justify-between bg-inherit hover:bg-inherit',
                className,
              )}
            >
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="mx-3 text-sm">{placeholder}</span>
                <ChevronDown className="mx-2 h-4 cursor-pointer font-normal text-gray-300" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[700px] p-0"
            align="start"
            onEscapeKeyDown={(): void => setIsPopoverOpen(false)}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={`${'Search'}...`}
                onKeyDown={handleInputKeyDown}
                value={searchInput}
                onValueChange={handleInput}
              />
              <CommandList>
                {options.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No options available
                  </div>
                ) : filteredValues.length === 0 ? (
                  <CommandEmpty>
                    <p>No results found.</p>
                  </CommandEmpty>
                ) : (
                  <CommandGroup key="items-list">
                    <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer h-[35px]">
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          selectedValues.length === options.length
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className="size-4" />
                      </div>
                      <span>
                        <p>Select All</p>
                      </span>
                    </CommandItem>
                    {filteredValues.map((option) => {
                      const isSelected = selectedValues.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={(): void => toggleOption(option.value)}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className="size-4" />
                          </div>
                          {option.icon && (
                            <option.icon className="mr-2 size-4 text-muted-foreground" />
                          )}
                          <span>{option.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
              {!!selectedValues.length && (
                <>
                  <CommandSeparator />
                  <CommandGroup key="items-actions">
                    <div className="flex items-center justify-between">
                      <CommandItem
                        onSelect={handleClear}
                        className="flex-1 cursor-pointer justify-center h-[35px]"
                      >
                        <p>Clear</p>
                      </CommandItem>
                      <Separator orientation="vertical" className="flex h-full min-h-6" />
                    </div>
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>
        {selectedValues.length > 0 && (
          <>
            <div
              role="group"
              aria-label="Selected values"
              className="flex w-full flex-wrap items-start rounded-md border p-1"
            >
              {selectedValues.map((value) => {
                const option = options.find((o) => o.value === value)
                const IconComponent = option?.icon
                return (
                  <Button
                    key={value}
                    type="button"
                    className={defaultButtonClassname}
                    onClick={(): void => toggleOption(value)}
                  >
                    {IconComponent && <IconComponent className="mr-2 size-4" />}
                    {option?.label}
                    <XCircle className="ml-2 size-4" />
                  </Button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  },
)

MultiSelect.displayName = 'MultiSelect'

export { MultiSelect, type MultiSelectProps }
