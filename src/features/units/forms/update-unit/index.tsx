'use client'
import React from 'react'
import { createUnitTree, UnitTypeEnum, UpdateUnitFormProps } from '@/features/units'
import { Button, Input, Label, MultiSelect, TreeSelect } from '@/shared'
import PhoneInput from 'react-phone-number-input'
import { FieldValues, useForm } from 'react-hook-form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/shared'
import { CreateUnit, StatusType } from '@/features/units/schemas'
import { Textarea } from '@/shared/components/ui/textarea'
import { toast } from 'sonner'
import { updateUnit } from '@/sdk/organization'
import { UserRolesEnum } from '@/features/users'
import { useRouter } from 'next/navigation'
import { unitLevelOptions, industryLevelOptions } from '@/features/units/constants/unitTypeOptions'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

export const UpdateUnitForm = ({ users, organizations, data, user }: UpdateUnitFormProps) => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUnit>({
    values: {
      name: data?.name || '',
      type: data?.type as UnitTypeEnum,
      parent: data?.parentOrg?.id?.toString(),
      admin: data?.admin.id?.toString() || '',
      email: data?.email || '',
      phone: data?.phone || '',
      status: data?.status || 'active',
      description: data?.description || '',
      delegatedPermissions: data?.delegatedPermissions || false,
      backupAdmins: data?.backupAdmins?.map((ba) => ba.id.toString()),
    },
  })
  const tree = createUnitTree(organizations)

  const onSubmit = async (submitData: FieldValues) => {
    try {
      if (data && data.id) {
        await updateUnit({ ...(submitData as CreateUnit), id: data.id })
        router.refresh()
        toast.success('Unit updated successfully')
      }
    } catch {
      toast.error('An error occurred while updating the unit, please try again')
    }
  }

  const childrenDocs = data?.children?.docs ?? []
  const activeChildren = childrenDocs.filter((child) => child.status === 'active')
  const effectiveRole = getEffectiveRoleFromUser(user)
  const disabledField = effectiveRole !== UserRolesEnum.SuperAdmin && activeChildren?.length > 0
  const unitTypeOptions =
    effectiveRole === UserRolesEnum.SuperAdmin ? industryLevelOptions : unitLevelOptions

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter unit name"
            {...register('name', { required: 'Name is required' })}
            disabled={disabledField}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            name="type"
            onValueChange={(value: UnitTypeEnum) => setValue('type', value)}
            value={watch('type')}
            disabled={disabledField}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit type" />
            </SelectTrigger>
            <SelectContent>
              {unitTypeOptions.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>
        {effectiveRole === UserRolesEnum.SuperAdmin && (
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Unit</Label>

            <TreeSelect
              errors={!!errors?.parent}
              disabled={disabledField}
              handleChangeAction={(value) =>
                setValue('parent', typeof value === 'string' ? value : '')
              }
              value={watch('parent')}
              tree={tree}
              options={organizations.map((org) => ({
                value: org.id.toString(),
                label: org.name,
              }))}
            />

            {errors.parent && <p className="text-sm text-red-500">{errors.parent.message}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="admin">Admin</Label>
          <Select onValueChange={(value) => setValue('admin', value)} defaultValue={watch('admin')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select admin" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.admin && <p className="text-sm text-red-500">{errors.admin.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Backup Admins</Label>
          <MultiSelect
            options={users.map((user) => ({ label: user.name, value: user.id.toString() }))}
            onValueChange={(value) => setValue('backupAdmins', value)}
            value={watch('backupAdmins')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter unit email"
            disabled={disabledField}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            id="phone"
            placeholder="Enter unit phone"
            value={watch('phone')}
            onChange={(value) => setValue('phone', value || '')}
            disabled={disabledField}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            international
            defaultCountry="US"
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value: StatusType) => setValue('status', value)}
            defaultValue={watch('status')}
            disabled={disabledField}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Enter unit description"
            {...register('description')}
            disabled={disabledField}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
        {/* Delegate Permissions button hidden - it has no functionality */}
        {/* <div className="flex items-center space-x-2">
          <Input
            id="delegatedPermissions"
            type="checkbox"
            {...register('delegatedPermissions')}
            className="w-4 h-4"
          />
          <Label htmlFor="delegatedPermissions">Delegated Permissions</Label>
        </div> */}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
