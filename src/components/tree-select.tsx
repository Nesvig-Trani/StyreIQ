import { cn } from '@/lib/utils'
import { SelectItem } from '@/components/ui/select'
import { Tree } from '@/types/organizations'

interface OrganizationTreeNodeProps {
  tree: Tree
  selectedValue?: string
}

export function TreeNode({ tree, selectedValue }: OrganizationTreeNodeProps) {
  return (
    <>
      <SelectItem value={tree.id.toString()} className="flex items-center">
        <div className="flex items-center">
          <span
            className={cn('inline-block, cursor-pointer')}
            style={{
              marginLeft: `${tree.depth ? tree.depth : 0}rem`,
            }}
          >
            {tree.name}
          </span>
        </div>
      </SelectItem>

      {tree.children &&
        tree.children.map((child) => (
          <TreeNode key={child.id} tree={child} selectedValue={selectedValue} />
        ))}
    </>
  )
}
