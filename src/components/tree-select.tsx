'use client'
import { cn } from '@/lib/utils'
import { SelectItem } from '@/components/ui/select'
import { OrganizationWithChildren } from '@/app/(frontend)/dashboard/organizations/create/page'

interface OrganizationTreeNodeProps {
  organization: OrganizationWithChildren
  selectedValue?: string
}

export function OrganizationTreeNode({ organization, selectedValue }: OrganizationTreeNodeProps) {
  return (
    <>
      <SelectItem value={organization.id.toString()} className="flex items-center">
        <div className="flex items-center">
          <span
            className={cn('inline-block, cursor-pointer')}
            style={{
              marginLeft: `${organization.depth ? organization.depth : 0}rem`,
            }}
          >
            {organization.name}
          </span>
        </div>
      </SelectItem>

      {organization.children &&
        organization.children.map((child) => (
          <OrganizationTreeNode key={child.id} organization={child} selectedValue={selectedValue} />
        ))}
    </>
  )
}
