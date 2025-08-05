'use client'
import React from 'react'

import { UpdateSocialMediaFormProps } from '@/features/social-medias'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TreeSelect,
} from '@/shared'

import { UserRolesEnum } from '@/features/users'
import { useUpdateSocialMedia } from '@/features/social-medias/hooks/useUpdateSocialMedia'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'

export const UpdateSocialMediaForm: React.FC<UpdateSocialMediaFormProps> = ({
  data,
  users,
  organizations,
  user,
}) => {
  const { register, handleSubmit, watch, setValue, errors, isSubmitting, onSubmit, tree } =
    useUpdateSocialMedia({
      data,
      users,
      organizations,
      user,
    })

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update social media</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className={'space-y-4'}>
          <div className={'space-y-2'}>
            <Label htmlFor="name">Account Name</Label>
            <Input
              id={'name'}
              placeholder={'Enter account name'}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
          </div>
          <div className={'space-y-2'}>
            <Label htmlFor="profileUrl">Profile URL</Label>
            <Input
              id={'profileUrl'}
              placeholder={'Enter profile URL'}
              {...register('profileUrl', { required: 'Profile URL is required' })}
            />
            {errors.profileUrl && <p className="text-red-500">{errors.profileUrl.message}</p>}
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor="platform">Platform</Label>
            <Select name="platform" onValueChange={(value: string) => setValue('platform', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform && <p className="text-red-500">{errors.platform.message}</p>}
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id={'contactEmail'}
              placeholder={'Enter contact email'}
              {...register('contactEmail')}
            />
            {errors.contactEmail && <p className="text-red-500">{errors.contactEmail.message}</p>}
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id={'contactPhone'}
              placeholder={'Enter contact phone'}
              {...register('contactPhone')}
            />
            {errors.contactPhone && <p className="text-red-500">{errors.contactPhone.message}</p>}
          </div>
          <div className={'space-y-2'}>
            <Label htmlFor={'organization'}>Organization</Label>
            <TreeSelect
              options={organizations.map((org) => ({
                label: org.name,
                value: org.id.toString(),
              }))}
              tree={tree}
              {...register('organization', { required: 'Organization is required' })}
              handleChangeAction={(organization: string | string[]) =>
                setValue('organization', typeof organization === 'string' ? organization : '')
              }
              value={watch('organization')}
              disabled={user?.role !== UserRolesEnum.SuperAdmin}
              errors={!!errors.organization}
            />

            {errors.organization && <p className="text-red-500">{errors.organization.message}</p>}
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'primaryAdmin'}>Primary Admin</Label>
            <Select
              value={watch('primaryAdmin')}
              onValueChange={(primaryAdmin: string) => setValue('primaryAdmin', primaryAdmin)}
              {...register('primaryAdmin', { required: 'Primary Admin is required' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a primary admin" />
              </SelectTrigger>

              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primaryAdmin && <p className="text-red-500">{errors.primaryAdmin.message}</p>}
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'backupAdmin'}>Backup Admin</Label>
            <Select
              value={watch('backupAdmin')}
              onValueChange={(backupAdmin: string) => setValue('backupAdmin', backupAdmin)}
              {...register('backupAdmin', { required: 'Backup Admin is required' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a backup admin" />
              </SelectTrigger>

              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.backupAdmin && <p className="text-red-500">{errors.backupAdmin.message}</p>}
          </div>
          <Button loading={isSubmitting} type="submit">
            Update
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
