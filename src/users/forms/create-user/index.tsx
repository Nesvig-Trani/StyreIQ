'use client'

import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SelectItem,
  Label,
  Input,
  PasswordInput,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Button,
  TreeSelect,
  Checkbox,
} from '@/shared'
import { roleLabelMap, statusLabelMap, UserRolesEnum, UserStatusEnum } from '@/users/schemas'
import useCreateUserForm from '@/users/hooks/useCreateUserForm'
import { Organization } from '@/payload-types'
import { DatePicker } from '@/shared/components/ui/datepicker'

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
    handleRoleChange,
    isLoading,
    register,
    errors,
    watch,
    setValue,
    selectedRole,
    tree,
    passwordUpdatedAt,
  } = useCreateUserForm({ authUserRole, initialOrganizations, topOrgDepth })

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
            <PasswordInput
              id="password"
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
          {selectedRole !== UserRolesEnum.SuperAdmin && (
            <div className="space-y-2">
              <Label>Organizations</Label>
              <div className="border rounded-md p-3">
                {organizations.length > 0 ? (
                  <div className="space-y-2">
                    <TreeSelect
                      options={organizations.map((org) => ({
                        value: org.id.toString(),
                        label: org.name,
                      }))}
                      tree={tree}
                      value={watch('organizations')}
                      handleChangeAction={(val) =>
                        setValue('organizations', typeof val === 'string' ? [val] : val)
                      }
                      errors={!!errors.organizations}
                      multiple
                      disabled={isLoading}
                    />

                    {errors.organizations && (
                      <p className="text-sm text-red-500">{errors.organizations.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center">
                    No organizations available
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={'space-y-2'}>
            <Label htmlFor="passwordUpdatedAt">Password Updated At</Label>
            <DatePicker
              id={'passwordUpdatedAt'}
              {...register('passwordUpdatedAt')}
              onSelect={(date) => {
                setValue('passwordUpdatedAt', date)
              }}
              selected={passwordUpdatedAt}
            />
            {errors.passwordUpdatedAt && (
              <p className="text-red-500">{errors.passwordUpdatedAt.message}</p>
            )}
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'isEnabledTwoFactor'}
              checked={watch('isEnabledTwoFactor')}
              onCheckedChange={(checked) => setValue('isEnabledTwoFactor', !!checked)}
              {...register('isEnabledTwoFactor')}
            />
            {errors.isEnabledTwoFactor && (
              <p className="text-red-500">{errors.isEnabledTwoFactor.message}</p>
            )}
            <Label htmlFor="isEnabledTwoFactor">Is Enabled Two Factor</Label>
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'isInUseSecurePassword'}
              checked={watch('isInUseSecurePassword')}
              onCheckedChange={(checked) => setValue('isInUseSecurePassword', !!checked)}
              {...register('isInUseSecurePassword')}
            />
            {errors.isInUseSecurePassword && (
              <p className="text-red-500">{errors.isInUseSecurePassword.message}</p>
            )}
            <Label htmlFor="isInUseSecurePassword">Is In Use Secure Password</Label>
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'isCompletedTrainingAccessibility'}
              checked={watch('isCompletedTrainingAccessibility')}
              onCheckedChange={(checked) => setValue('isCompletedTrainingAccessibility', !!checked)}
              {...register('isCompletedTrainingAccessibility')}
            />
            {errors.isCompletedTrainingAccessibility && (
              <p className="text-red-500">{errors.isCompletedTrainingAccessibility.message}</p>
            )}
            <Label htmlFor="isCompletedTrainingAccessibility">
              Is Completed Training Accessibility
            </Label>
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'isCompletedTrainingRisk'}
              checked={watch('isCompletedTrainingRisk')}
              onCheckedChange={(checked) => setValue('isCompletedTrainingRisk', !!checked)}
              {...register('isCompletedTrainingRisk')}
            />
            {errors.isCompletedTrainingRisk && (
              <p className="text-red-500">{errors.isCompletedTrainingRisk.message}</p>
            )}
            <Label htmlFor="isCompletedTrainingRisk">Is Completed Training Risk</Label>
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'isCompletedTrainingBrand'}
              checked={watch('isCompletedTrainingBrand')}
              onCheckedChange={(checked) => setValue('isCompletedTrainingBrand', !!checked)}
              {...register('isCompletedTrainingBrand')}
            />
            {errors.isCompletedTrainingBrand && (
              <p className="text-red-500">{errors.isCompletedTrainingBrand.message}</p>
            )}
            <Label htmlFor="isCompletedTrainingBrand">Is Completed Training Brand</Label>
          </div>

          <div className={'flex gap-2'}>
            <Checkbox
              id={'hasKnowledgeStandards'}
              checked={watch('hasKnowledgeStandards')}
              onCheckedChange={(checked) => setValue('hasKnowledgeStandards', !!checked)}
              {...register('hasKnowledgeStandards')}
            />
            {errors.hasKnowledgeStandards && (
              <p className="text-red-500">{errors.hasKnowledgeStandards.message}</p>
            )}
            <Label htmlFor="hasKnowledgeStandards">Has Knowledge Standards</Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating User...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
