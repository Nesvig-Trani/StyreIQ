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
import { OrganizationHierarchyProps } from '@/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared'
import { useOrganizationHierarchy } from '@/organizations/hooks/useOrganizationHierarchy'
import { Button } from '@/shared'
import OrganizationDetailPage from '@/organizations/components/organization-detail'
import { UpdateOrganizationForm } from '@/organizations/forms/update-organization'
import { ScrollArea } from '@/shared'
import { organizationTypeOptions } from '@/organizations/constants/organizationTypeOptions'
import { DisableOrganizationButton } from '@/organizations/components/disable-organization'

export default function OrganizationHierarchy({
  organizations,
  originalData,
  pagination,
  users,
  user,
}: OrganizationHierarchyProps) {
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
    <div className="flex">
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admin email..."
                value={searchTerm}
                className="pl-10"
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
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
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {organizationTypeOptions.map((option) => (
                    <SelectItem value={option.value} key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          {renderFilteredResults()}
          <div className="flex justify-end">
            <div className="flex">
              <ChevronLeftIcon
                onClick={() => {
                  if (pagination.pageIndex > 0) {
                    handlePageChange(pagination.pageIndex - 1)
                  }
                }}
              />
              <ChevronRightIcon
                onClick={() => {
                  if (pagination.pageIndex + 1 < pagination.pageCount) {
                    handlePageChange(pagination.pageIndex + 1)
                  }
                }}
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="w-1/2 flex flex-col">
        {selectedOrg ? (
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">{selectedOrg.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <Button onClick={() => setIsEditing(false)}>
                      <X />
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <EditIcon />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="ml-2"
                    onClick={() => setIsDisableModalOpen(true)}
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Disable
                  </Button>
                  <DisableOrganizationButton
                    open={isDisableModalOpen}
                    handleOpenChange={setIsDisableModalOpen}
                    id={selectedOrg.id}
                    onConfirmDisable={handleConfirmDisable}
                  />
                </div>
              </CardHeader>
              {isEditing ? (
                <CardContent className="space-y-6">
                  <UpdateOrganizationForm
                    user={user}
                    users={users}
                    organizations={originalData}
                    data={selectedOrg}
                  />
                </CardContent>
              ) : (
                <CardContent>
                  <OrganizationDetailPage organization={selectedOrg} />
                </CardContent>
              )}
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an organization to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
