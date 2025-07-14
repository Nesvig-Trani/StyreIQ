'use client'

import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SelectItem,
  Checkbox,
  ScrollArea,
  Label,
  Input,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Button,
} from '@/shared'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/users/schemas'
import useCreateUserForm from '@/users/hooks/useCreateUserForm'
import { Organization } from '@/payload-types'

interface UserFormProps {
  authUserRole?: UserRolesEnum | null
  initialOrganizations: Organization[]
  topOrgDepth?: number
}

export function CreateUserForm({
  authUserRole,
  initialOrganizations = [],
  topOrgDepth,
}: UserFormProps) {
  const {
    handleSubmit,
    allowedStatuses,
    allowedRoles,
    organizations,
    handleOrganizationToggle,
    handleRoleChange,
    isLoading,
    register,
    errors,
    watch,
    setValue,
  } = useCreateUserForm({ authUserRole, initialOrganizations, topOrgDepth })

  const selectedOrganizations = watch('organizations') || []

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password should be at least 8 characters long' },
              })}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter full name"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={watch('role')} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabelMap[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {authUserRole !== UserRolesEnum.UnitAdmin && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: UserStatusEnum) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabelMap[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Organizations</Label>
            <div className="border rounded-md p-3">
              <ScrollArea className="h-32 sm:h-40">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm text-muted-foreground">Loading organizations...</span>
                  </div>
                ) : organizations.length > 0 ? (
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div key={org.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`org-${org.id}`}
                          checked={selectedOrganizations.includes(org.id.toString())}
                          onCheckedChange={(checked) =>
                            handleOrganizationToggle(org.id.toString(), checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`org-${org.id}`}
                          className="text-sm font-normal cursor-pointer leading-relaxed"
                        >
                          {org.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center">
                    No organizations available
                  </div>
                )}
              </ScrollArea>
            </div>
            {selectedOrganizations.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedOrganizations.length} organization(s) selected
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating User...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
