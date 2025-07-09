'use client'
import React from 'react'
import { CreateOrganizationsTree, UpdateOrgFormProps } from '@/organizations'
import { Button, Input, Label, MultiSelect, TreeSelect } from '@/shared'
import { FieldValues, useForm } from 'react-hook-form'
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/shared'
import { CreateOrganization, OrganizationType, StatusType } from '@/organizations/schemas'
import { Textarea } from '@/shared/components/ui/textarea'
import { toast } from 'sonner'
import { updateOrganization } from '@/sdk/organization'
import { UserRolesEnum } from '@/users'
import { useRouter } from 'next/navigation'
import { organizationTypeOptions } from '@/organizations/constants/organizationTypeOptions'

export const UpdateOrganizationForm = ({
  users,
  organizations,
  data,
  user,
}: UpdateOrgFormProps) => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateOrganization>({
    values: {
      name: data?.name || '',
      type: data?.type || 'university',
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
  const tree = CreateOrganizationsTree(organizations)

  const onSubmit = async (submitData: FieldValues) => {
    try {
      if (data && data.id) {
        await updateOrganization({ ...(submitData as CreateOrganization), id: data.id })
        router.refresh()
        toast.success('Organization updated successfully')
      }
    } catch {
      toast.error('An error occurred while updating the organization, please try again')
    }
  }

  const childrenDocs = data?.children?.docs ?? []
  const activeChildren = childrenDocs.filter((child) => child.status === 'active')
  const disabledField = user?.role !== UserRolesEnum.SuperAdmin && activeChildren?.length > 0
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter organization name"
            {...register('name', { required: 'Name is required' })}
            disabled={disabledField}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            name="type"
            onValueChange={(value: OrganizationType) => setValue('type', value)}
            value={watch('type')}
            disabled={disabledField}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              {organizationTypeOptions.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {option.label}
                </SelectItem>
              ))}{' '}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>
        {user?.role === UserRolesEnum.SuperAdmin && (
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Organization</Label>

            <TreeSelect
              onChange={(value) => setValue('parent', value)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter organization email"
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
          <Input
            id="phone"
            type="tel"
            placeholder="Enter organization phone"
            {...register('phone')}
            disabled={disabledField}
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
            placeholder="Enter organization description"
            {...register('description')}
            disabled={disabledField}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            id="delegatedPermissions"
            type="checkbox"
            {...register('delegatedPermissions')}
            className="w-4 h-4"
          />
          <Label htmlFor="delegatedPermissions">Delegated Permissions</Label>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
