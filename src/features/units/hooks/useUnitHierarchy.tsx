import { Building2, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button } from '@/shared'
import {
  FlattenedTree,
  UnitHierarchyProps,
  UnitType,
  UnitWithDepth,
  StatusType,
} from '@/features/units'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { statusConfig } from '../constants/statusConfig'
import { typeConfig } from '../constants/typeConfig'
import { disableUnit } from '@/sdk/organization'
import { toast } from 'sonner'

export const useUnitHierarchy = ({ originalData, organizations }: UnitHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [selectedOrg, setSelectedOrg] = useState<UnitWithDepth | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<UnitType | 'all'>('all')
  const [tenantFilter, setTenantFilter] = useState<string>('all')
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
    const map: Record<number, UnitWithDepth> = {}
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

  const handleTypeChange = (value: UnitType | 'all') => {
    setTypeFilter(value)
    updateSearchParams({ type: value === 'all' ? null : value })
  }

  const handleTenantChange = (value: string) => {
    setTenantFilter(value)

    if (value === 'all') {
      updateSearchParams({ tenant: null })
    } else {
      updateSearchParams({ tenant: value })
    }
  }

  const handleConfirmDisable = async () => {
    try {
      if (!selectedOrg?.id) return
      await disableUnit(selectedOrg.id)
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

  const unitRowAccessibleLabel = (org: FlattenedTree) => {
    const originalOrg = originalDataMap[org.id]
    const status = originalOrg?.status
    const type = originalOrg?.type
    const typeLabel = type ? typeConfig[type]?.label : undefined
    const statusLabel = status ? statusConfig[status]?.label : undefined
    const parts = [org.name]
    if (typeLabel) parts.push(typeLabel)
    if (statusLabel) parts.push(statusLabel)
    return parts.join(', ')
  }

  const handleUnitRowKeyDown = (e: KeyboardEvent<HTMLElement>, org: FlattenedTree) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectOrganization(org)
    }
  }

  const renderTreeNode = (org: FlattenedTree, level = 0) => {
    const isExpanded = expandedNodes.has(org.id)
    const hasChildren = org.children && org.children.length > 0
    const originalOrg = originalDataMap[org.id]
    const status = originalOrg?.status
    const type = originalOrg?.type
    const StatusIcon = status ? statusConfig[status]?.icon || CheckCircle : CheckCircle
    const TypeIcon = type ? typeConfig[type]?.icon || Building2 : Building2
    const isSelected = selectedOrg?.id === org.id

    return (
      <div key={org.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded-md ${isSelected ? 'bg-white' : ''}`}
          style={{ paddingLeft: `${org.depth * 20 + 8}px` }}
        >
          {hasChildren ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 shrink-0 p-0"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? `Collapse ${org.name}` : `Expand ${org.name}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(org.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          ) : (
            <div className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}

          <button
            type="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={unitRowAccessibleLabel(org)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => selectOrganization(org)}
            onKeyDown={(e) => handleUnitRowKeyDown(e, org)}
          >
            <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <span className="flex-1 font-medium">{org.name}</span>

            {type && (
              <Badge variant="outline" className="shrink-0 border-border text-xs text-foreground">
                {typeConfig[type]?.label}
              </Badge>
            )}

            {status && (
              <div className="flex shrink-0 items-center gap-1">
                <StatusIcon
                  aria-hidden="true"
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
          </button>
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
    tenantFilter,
    handleTenantChange,
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
