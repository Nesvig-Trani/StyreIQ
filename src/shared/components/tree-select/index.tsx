'use client'
import { useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { Tree } from '@/organizations'
import { Command, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { FieldDataOption } from '@/shared/components/form-hook-helper'

interface TreeNodeProps {
  tree: Tree
  selectedValue?: string
  onSelect?: (value: string) => void
}

export function TreeNode({ tree, selectedValue, onSelect }: TreeNodeProps) {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(tree.id.toString())
    }
  }

  return (
    <>
      <CommandItem value={tree.id.toString()} className="flex items-center" onSelect={handleSelect}>
        <div className="flex items-center">
          <span
            className={cn('inline-block cursor-pointer')}
            style={{
              marginLeft: `${tree.depth ? tree.depth : 0}rem`,
            }}
          >
            {tree.name}
          </span>
        </div>
      </CommandItem>

      {tree.children &&
        tree.children.map((child) => (
          <TreeNode key={child.id} tree={child} selectedValue={selectedValue} onSelect={onSelect} />
        ))}
    </>
  )
}

interface TreeSelectProps {
  options: FieldDataOption[]
  tree: Tree[]
  value?: string
  onChange: (value: string) => void
}

export function TreeSelect({ options, tree, value, onChange }: TreeSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    onChange(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-[300px] flex justify-start p-3 border-solid border-gray-600 text-sm">
          {value
            ? options.find((opt) => opt.value.toString() === value)?.label
            : 'Select organization'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandList>
            {tree.map((tree) => (
              <TreeNode key={tree.id} tree={tree} selectedValue={value} onSelect={handleSelect} />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
