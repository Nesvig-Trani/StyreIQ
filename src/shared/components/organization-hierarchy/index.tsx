'use client'

import { useId, useLayoutEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { focusableHeadingClassName } from '@/shared/utils/a11y-styles'
import {
  Building2,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  Search,
  X,
  XCircleIcon,
} from 'lucide-react'
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/shared'
import { Input } from '@/shared'
import { UnitHierarchyProps } from '@/features/units'
import { Card, CardContent, CardHeader } from '@/shared'
import { useUnitHierarchy } from '@/features/units/hooks/useUnitHierarchy'
import { Button } from '@/shared'
import { UnitDetail } from '@/features/units/components/unit-detail'
import { UpdateUnitForm } from '@/features/units/forms/update-unit'
import { ScrollArea } from '@/shared'
import { unitTypeOptions } from '@/features/units/constants/unitTypeOptions'
import { DisableUnitButton } from '@/features/units/components/disable-unit'
import { UserRolesEnum } from '@/features/users'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { Tenant } from '@/types/payload-types'

export default function UnitHierarchy({
  organizations,
  originalData,
  pagination,
  users,
  user,
  tenants = [],
  isViewingAllTenants = false,
}: UnitHierarchyProps & {
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
}) {
  const detailPanelTitleId = useId()
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)

  const {
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
    isEditing,
    setIsEditing,
    handleConfirmDisable,
    isDisableModalOpen,
    setIsDisableModalOpen,
    lastSelectedRowTriggerRef,
  } = useUnitHierarchy({ organizations, originalData, pagination, users, detailHeadingRef })

  const unitStatusAnnouncement =
    selectedOrg && !isEditing ? `Selected unit: ${selectedOrg.name}` : ''

  const selectedOrgId = selectedOrg?.id
  useLayoutEffect(() => {
    if (selectedOrgId == null || isEditing) return
    detailHeadingRef.current?.focus()
  }, [selectedOrgId, isEditing])

  const handleDetailPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !selectedOrg || isEditing) return
    e.preventDefault()
    lastSelectedRowTriggerRef.current?.focus()
  }

  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSocialMediaManager = effectiveRole === UserRolesEnum.SocialMediaManager
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col border rounded-lg">
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search units by name"
                placeholder="Search by name..."
                value={searchTerm}
                className="pl-10"
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full" aria-label="Filter by status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full" aria-label="Filter by type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {unitTypeOptions.map((option) => (
                    <SelectItem value={option.value} key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isViewingAllTenants && tenants.length > 0 && (
                <Select value={tenantFilter} onValueChange={handleTenantChange}>
                  <SelectTrigger className="w-full" aria-label="Filter by tenant">
                    <SelectValue placeholder="All Tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem value={tenant.id.toString()} key={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <section aria-label="Organization units tree">{renderFilteredResults()}</section>
        </ScrollArea>

        <div className="flex justify-center p-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Go to previous page"
              aria-disabled={pagination.pageIndex === 0}
              onClick={() => {
                if (pagination.pageIndex > 0) {
                  handlePageChange(pagination.pageIndex - 1)
                }
              }}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </span>

            <Button
              variant="outline"
              size="sm"
              aria-label="Go to next page"
              aria-disabled={pagination.pageIndex + 1 >= pagination.pageCount}
              onClick={() => {
                if (pagination.pageIndex + 1 < pagination.pageCount) {
                  handlePageChange(pagination.pageIndex + 1)
                }
              }}
              disabled={pagination.pageIndex + 1 >= pagination.pageCount}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {selectedOrg ? (
          <div className="flex-1">
            <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {unitStatusAnnouncement}
            </span>
            <Card
              role="region"
              aria-labelledby={detailPanelTitleId}
              onKeyDown={handleDetailPanelKeyDown}
            >
              <ScrollArea className={'h-[650px]'}>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2
                      id={detailPanelTitleId}
                      ref={detailHeadingRef}
                      tabIndex={-1}
                      className={`flex items-center gap-2 truncate text-lg font-semibold leading-none ${focusableHeadingClassName}`}
                    >
                      {selectedOrg.name}
                    </h2>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!isSocialMediaManager && (
                      <>
                        {isEditing ? (
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" aria-hidden="true" />
                            <span className="ml-1 hidden sm:inline">Cancel</span>
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setIsEditing(true)}>
                            <EditIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="ml-1 hidden sm:inline">Edit</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => setIsDisableModalOpen(true)}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Disable
                        </Button>
                        <DisableUnitButton
                          open={isDisableModalOpen}
                          handleOpenChange={setIsDisableModalOpen}
                          id={selectedOrg.id}
                          onConfirmDisable={handleConfirmDisable}
                        />
                      </>
                    )}
                  </div>
                </CardHeader>
                {isEditing ? (
                  <CardContent className="space-y-6">
                    <UpdateUnitForm
                      user={user}
                      users={users}
                      organizations={originalData}
                      data={selectedOrg}
                    />
                  </CardContent>
                ) : (
                  <CardContent>
                    <UnitDetail organization={selectedOrg} />
                  </CardContent>
                )}
              </ScrollArea>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg">
            <div className="text-center p-8">
              <Building2 className="mx-auto mb-4 h-12 w-12 opacity-50" aria-hidden="true" />
              <p className="text-sm">Select a unit to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
