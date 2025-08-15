'use client'
import { useMemo, useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { Tree } from '@/features/units'
import { Command, CommandEmpty, CommandInput, CommandList } from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { FieldDataOption } from '@/shared/components/form-hook-helper/types'
import { ChevronDown } from 'lucide-react'

interface TreeNodeProps {
  tree: Tree
  selectedValue?: string | string[]
  onSelect?: (value: string) => void
  multiple?: boolean
}

const filterTree = (nodes: Tree[], query: string): Tree[] => {
  if (!query) return nodes
  return nodes
    .map((node) => {
      const children = filterTree(node.children || [], query)
      const matches = node.name.toLowerCase().includes(query.toLowerCase())
      if (matches || children.length > 0) {
        return { ...node, children }
      }
      return null
    })
    .filter(Boolean) as Tree[]
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
      <div
        className={cn('flex items-center cursor-pointer px-2 py-1', isSelected && 'bg-gray-100')}
        style={{ marginLeft: `${(tree.depth ?? 0) * 1}rem` }}
        onClick={handleToggle}
      >
        {multiple ? (
          <label className="flex items-center w-full cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleToggle}
              className="mr-2"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="flex-1">{tree.name}</span>
          </label>
        ) : (
          <span className="pl-2 flex-1">{tree.name}</span>
        )}
      </div>

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
  const [search, setSearch] = useState('')

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

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search])
  return (
    <Popover open={disabled ? false : open} onOpenChange={(val) => !disabled && setOpen(val)}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'w-full flex justify-between items-center h-9 px-3 py-2 border text-sm rounded-md text-gray-500 bg-background',
            disabled && 'opacity-50 cursor-not-allowed',
            errors ? 'border-red-500' : 'border-input',
          )}
        >
          <span className="truncate">
            {value && multiple
              ? (value as string[])
                  .map((val) => options.find((opt) => opt.value.toString() === val)?.label)
                  .filter(Boolean)
                  .join(', ') || 'Select units'
              : value
                ? options.find((opt) => opt.value.toString() === value)?.label
                : 'Select unit'}
          </span>
          <ChevronDown className="h-4 cursor-pointer text-gray-300" />
        </button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
            <CommandList>
              {filteredTree.length > 0 ? (
                filteredTree.map((tree) => (
                  <TreeNode
                    key={tree.id}
                    tree={tree}
                    selectedValue={value}
                    onSelect={handleSelect}
                    multiple={multiple}
                  />
                ))
              ) : (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
