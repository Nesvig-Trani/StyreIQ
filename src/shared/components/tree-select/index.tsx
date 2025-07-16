'use client'
import { useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { Tree } from '@/organizations'
import { Command, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { FieldDataOption } from '@/shared/components/form-hook-helper'

interface TreeNodeProps {
  tree: Tree
  selectedValue?: string | string[]
  onSelect?: (value: string) => void
  multiple?: boolean
}

export function TreeNode({ tree, selectedValue, onSelect, multiple = false }: TreeNodeProps) {
  const isSelected = multiple
    ? Array.isArray(selectedValue) && selectedValue.includes(tree.id.toString())
    : selectedValue === tree.id.toString()

  const handleToggle = () => {
    if (onSelect) {
      onSelect(tree.id.toString())
    }
  }

  return (
    <>
      <CommandItem
        value={tree.id.toString()}
        className={cn('flex items-center', isSelected && 'bg-gray-100')}
        onSelect={() => {
          handleToggle()
        }}
      >
        <div className="flex items-center w-full" style={{ marginLeft: `${tree.depth ?? 0}rem` }}>
          {multiple ? (
            <label className="flex items-center w-full cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggle}
                className="mr-2"
                onClick={(e) => e.stopPropagation()} // prevent CommandItem onSelect firing twice
              />
              <span className="flex-1">{tree.name}</span>
            </label>
          ) : (
            <span className="pl-2 flex-1">{tree.name}</span>
          )}
        </div>
      </CommandItem>

      {tree.children?.map((child) => (
        <TreeNode
          key={child.id}
          tree={child}
          selectedValue={selectedValue}
          onSelect={onSelect}
          multiple={multiple}
        />
      ))}
    </>
  )
}

interface TreeSelectProps {
  options: FieldDataOption[]
  tree: Tree[]
  value?: string | string[]
  handleChangeAction: (value: string | string[]) => void
  disabled?: boolean
  errors?: boolean
  multiple?: boolean
}

export function TreeSelect({
  options,
  tree,
  value,
  handleChangeAction,
  disabled,
  errors,
  multiple,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selected: string) => {
    if (disabled) return

    if (multiple) {
      const current = Array.isArray(value) ? value : []
      const exists = current.includes(selected)
      const updated = exists ? current.filter((v) => v !== selected) : [...current, selected]
      handleChangeAction(updated)
    } else {
      handleChangeAction(selected)
      setOpen(false)
    }
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={(val) => !disabled && setOpen(val)}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'w-[300px] flex justify-start p-3 border text-sm rounded-md text-gray-500',
            disabled && 'opacity-50 cursor-not-allowed',
            errors ? 'border-red-500' : 'border-gray-200',
          )}
        >
          {value && multiple
            ? (value as string[])
                .map((val) => options.find((opt) => opt.value.toString() === val)?.label)
                .filter(Boolean)
                .join(', ') || 'Select organizations'
            : value
              ? options.find((opt) => opt.value.toString() === value)?.label
              : 'Select organization'}
        </button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandList>
              {tree.map((tree) => (
                <TreeNode
                  key={tree.id}
                  tree={tree}
                  selectedValue={value}
                  onSelect={handleSelect}
                  multiple={multiple}
                />
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
