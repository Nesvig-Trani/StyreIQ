import { Building2, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button } from '@/shared'
import {
  FlattenedTree,
  OrganizationHierarchyProps,
  OrganizationType,
  OrganizationWithDepth,
  StatusType,
} from '@/organizations'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { statusConfig } from '../constants/statusConfig'
import { typeConfig } from '../constants/typeConfig'
import { disableOrganization } from '@/sdk/organization'
import { toast } from 'sonner'

export const useOrganizationHierarchy = ({
  originalData,
  organizations,
}: OrganizationHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithDepth | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<OrganizationType | 'all'>('all')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateSearchParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams)
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router],
  )

  useEffect(() => {
    const handler = setTimeout(() => {
      updateSearchParams({ search: searchTerm || null })
    }, 500)
    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, updateSearchParams])

  const handlePageChange = (newPageIndex: number) => {
    const updatedPagination = {
      pageIndex: newPageIndex + 1,
    }

    const params = new URLSearchParams()
    params.set('pagination', JSON.stringify(updatedPagination))

    router.push(`${pathname}?${params.toString()}`)
  }

  const originalDataMap = useMemo(() => {
    const map: Record<number, OrganizationWithDepth> = {}
    originalData?.forEach((org) => {
      map[org.id] = org
    })
    return map
  }, [originalData])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusChange = (value: StatusType | 'all') => {
    setStatusFilter(value)
    updateSearchParams({ status: value === 'all' ? null : value })
  }

  const handleTypeChange = (value: OrganizationType | 'all') => {
    setTypeFilter(value)
    updateSearchParams({ type: value === 'all' ? null : value })
  }
  const handleConfirmDisable = async () => {
    try {
      if (!selectedOrg?.id) return
      await disableOrganization(selectedOrg.id)
      toast.success('Organization disabled successfully')
      setIsDisableModalOpen(false)
      setSelectedOrg(null)
      router.refresh()
    } catch {
      toast.error('Failed to disable organization')
    }
  }

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const updated = new Set(prev)
      if (updated.has(nodeId)) {
        updated.delete(nodeId)
      } else {
        updated.add(nodeId)
      }
      return updated
    })
  }

  const selectOrganization = (org: FlattenedTree) => {
    setSelectedOrg(originalDataMap[org.id] || null)
  }
  const renderTreeNode = (org: FlattenedTree, level = 0) => {
    const isExpanded = expandedNodes.has(org.id)
    const hasChildren = org.children && org.children.length > 0
    const originalOrg = originalDataMap[org.id]
    const status = originalOrg?.status
    const type = originalOrg?.type
    const StatusIcon = status ? statusConfig[status]?.icon || CheckCircle : CheckCircle
    const TypeIcon = type ? typeConfig[type]?.icon || Building2 : Building2

    return (
      <div key={org.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 cursor-pointer rounded-md ${
            selectedOrg?.id === org.id ? 'bg-white' : ''
          }`}
          style={{ paddingLeft: `${org.depth * 20 + 8}px` }}
          onClick={() => selectOrganization(org)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(org.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <TypeIcon className="h-4 w-4 text-muted-foreground" />

          <span className="font-medium flex-1">{org.name}</span>

          {type && (
            <Badge variant="secondary" className="text-xs">
              {typeConfig[type]?.label}
            </Badge>
          )}

          {status && (
            <div className="flex items-center gap-1">
              <StatusIcon
                className={`h-3 w-3 ${
                  statusConfig[status]?.color === 'bg-green-500'
                    ? 'text-green-500'
                    : statusConfig[status]?.color === 'bg-red-500'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                }`}
              />
              <span className="text-xs text-muted-foreground">{statusConfig[status]?.label}</span>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{org.children?.map((child) => renderTreeNode({ ...child, level: level + 1 }))}</div>
        )}
      </div>
    )
  }

  const renderFilteredResults = () => {
    return (
      <div className="space-y-1">
        {organizations.map((org) => renderTreeNode({ ...org, level: 0 }))}
      </div>
    )
  }

  return {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusChange,
    typeFilter,
    handleTypeChange,
    renderFilteredResults,
    handlePageChange,
    selectedOrg,
    setIsEditing,
    isEditing,
    handleConfirmDisable,
    isDisableModalOpen,
    setIsDisableModalOpen,
  }
}
