'use client'
import { OrganizationWithDepth } from '@/organizations'
import { UpdateSocialMedia, UpdateSocialMediaFormProps } from '@/social-medias'
import { updateSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { CreateOrganizationsTree } from '@/organizations/utils/createOrgTree'
import { EndpointError } from '@/shared'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

export function useUpdateSocialMedia({ data, users, organizations }: UpdateSocialMediaFormProps) {
  const router = useRouter()
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])

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
      passwordUpdatedAt: data.passwordUpdatedAt ? new Date(data.passwordUpdatedAt) : undefined,
      isEnabledTwoFactor: data.isEnabledTwoFactor || false,
      isInUseSecurePassword: data.isInUseSecurePassword || false,
      isAcceptedPolicies: data.isAcceptedPolicies || false,
      isCompletedTrainingAccessibility: data.isCompletedTrainingAccessibility || false,
      isCompletedTrainingRisk: data.isCompletedTrainingRisk || false,
      isCompletedTrainingBrand: data.isCompletedTrainingBrand || false,
      hasKnowledgeStandards: data.hasKnowledgeStandards || false,
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
    },
  })

  const onSubmit = async (submitData: UpdateSocialMedia) => {
    try {
      await updateSocialMedia({ ...submitData, id: data.id })
      toast.success('Social media account updated successfully')
      router.push('/dashboard/social-medias')
    } catch (catchError) {
      if (catchError instanceof EndpointError) {
        toast.error(catchError.message)
      } else {
        toast.error('An error occurred while updating the social media account, please try again')
      }
    }
  }
  const passwordUpdatedAt = watch('passwordUpdatedAt')
  return {
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    isSubmitting,
    onSubmit,
    passwordUpdatedAt,
    tree,
    users,
  }
}
