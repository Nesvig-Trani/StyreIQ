'use client'
import { OrganizationWithDepth } from '@/features/organizations'
import { UpdateSocialMedia, UpdateSocialMediaFormProps } from '@/features/social-medias'
import { updateSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/features/organizations/utils/createOrgTree'
import { EndpointError } from '@/shared'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'

export function useUpdateSocialMedia({ data, users, organizations }: UpdateSocialMediaFormProps) {
  const router = useRouter()
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/dashboard/social-medias'
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSocialMedia>({
    values: {
      name: data.name,
      profileUrl: data.profileUrl,
      platform: data.platform,
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || undefined,
      organization:
        typeof data.organization === 'object'
          ? data.organization.id.toString()
          : data.organization.toString(),
      primaryAdmin:
        typeof data.primaryAdmin === 'object'
          ? data.primaryAdmin.id.toString()
          : data.primaryAdmin.toString(),
      backupAdmin:
        typeof data.backupAdmin === 'object'
          ? data.backupAdmin.id.toString()
          : data.backupAdmin.toString(),
      adminContactEmails: (data.adminContactEmails ?? [])
        .map((item) => item.email)
        .filter((email): email is string => typeof email === 'string'),
      thirdPartyManagement: data.thirdPartyManagement ?? '',
      creationDate: data.creationDate ?? new Date().toISOString(),
    },
  })

  const onSubmit = async (submitData: UpdateSocialMedia) => {
    try {
      await updateSocialMedia({ ...submitData, id: data.id })
      toast.success('Social media account updated successfully')
      router.push(returnTo)
    } catch (catchError) {
      if (catchError instanceof EndpointError) {
        toast.error(catchError.message)
      } else {
        toast.error('An error occurred while updating the social media account, please try again')
      }
    }
  }
  return {
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    isSubmitting,
    onSubmit,
    tree,
    users,
  }
}
