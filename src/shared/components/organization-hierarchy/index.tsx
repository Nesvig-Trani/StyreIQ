'use client'

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
import { UnitHierarchyProps } from '@/features/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { useOrganizationHierarchy } from '@/features/organizations/hooks/useOrganizationHierarchy'
import { Button } from '@/shared'
import { UnitDetail } from '@/features/organizations/components/unit-detail'
import { UpdateUnitForm } from '@/features/organizations/forms/update-unit'
import { ScrollArea } from '@/shared'
import { unitTypeOptions } from '@/features/organizations/constants/unitTypeOptions'
import { DisableUnitButton } from '@/features/organizations/components/disable-unit'
import { UserRolesEnum } from '@/features/users'

export default function UnitHierarchy({
  organizations,
  originalData,
  pagination,
  users,
  user,
}: UnitHierarchyProps) {
  const {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusChange,
    typeFilter,
    handleTypeChange,
    renderFilteredResults,
    handlePageChange,
    selectedOrg,
    isEditing,
    setIsEditing,
    handleConfirmDisable,
    isDisableModalOpen,
    setIsDisableModalOpen,
  } = useOrganizationHierarchy({ organizations, originalData, pagination, users })
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[700px]">
      <div className="flex flex-col border rounded-lg">
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                className="pl-10"
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">{renderFilteredResults()}</ScrollArea>

        <div className="flex justify-center p-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (pagination.pageIndex > 0) {
                  handlePageChange(pagination.pageIndex - 1)
                }
              }}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (pagination.pageIndex + 1 < pagination.pageCount) {
                  handlePageChange(pagination.pageIndex + 1)
                }
              }}
              disabled={pagination.pageIndex + 1 >= pagination.pageCount}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {selectedOrg ? (
          <div className="flex-1">
            <Card>
              <ScrollArea className={'h-[650px]'}>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 truncate">
                      {selectedOrg.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {user?.role !== UserRolesEnum.SocialMediaManager && (
                      <>
                        {isEditing ? (
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Cancel</span>
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setIsEditing(true)}>
                            <EditIcon className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Edit</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => setIsDisableModalOpen(true)}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
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
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select an organization to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
