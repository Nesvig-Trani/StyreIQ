'use client'

import { Building2, ChevronLeftIcon, ChevronRightIcon, EditIcon, Search, X } from 'lucide-react'
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { OrganizationHierarchyProps } from '@/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useOrganizationHierarchy } from '@/organizations/hooks/useOrganizationHierarchy'
import { Button } from '../ui/button'
import OrganizationDetailPage from '@/organizations/components/organization-detail'

export default function OrganizationHierarchy({
  organizations,
  originalData,
  pagination,
  users,
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
    formComponent,
    isEditing,
    setIsEditing,
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
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">{renderFilteredResults()}</ScrollArea>
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
                    </Button>           ) : (   <Button onClick={() => setIsEditing(true)}>
                      <EditIcon />
                    </Button>

                  )}
                </div>
              </CardHeader>
              {isEditing ? (
                <CardContent className="space-y-6">{formComponent}</CardContent>
              ) : (
                <CardContent>
                  <OrganizationDetailPage organization={selectedOrg} />{' '}
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
