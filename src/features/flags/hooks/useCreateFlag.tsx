import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared'
import { AffectedEntityTypeEnum, CreateFlagFormSchema, createFlagSchema } from '../schemas'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createFlag } from '@/sdk/flags'
import { toast } from 'sonner'
import { SocialMedia, User } from '@/lib/payload/payload-types'

export const useCreateFlag = ({
  users,
  socialMedias,
}: {
  users: User[]
  socialMedias: SocialMedia[]
}) => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFlagFormSchema>({
    resolver: zodResolver(createFlagSchema),
    defaultValues: {},
  })
  const onSubmit = async (submitData: CreateFlagFormSchema) => {
    try {
      await createFlag(submitData)
      toast.success('Risk flag created successfully')
      router.push('/dashboard/flags')
    } catch {
      toast.error('something went wrong')
    }
  }

  const affectedEntityType = watch('affectedEntityType')

  const renderEntity = () => {
    switch (affectedEntityType) {
      case AffectedEntityTypeEnum.USER:
        return (
          <div className="space-y-2">
            <Label htmlFor="name">Users</Label>
            <Select
              name="affectedEntity"
              onValueChange={(value: string) => setValue('affectedEntity', value)}
              value={watch('affectedEntity')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select affected user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.affectedEntity && (
              <p className="text-sm text-red-500">{errors.affectedEntity.message}</p>
            )}
          </div>
        )
      case AffectedEntityTypeEnum.SOCIAL_MEDIA:
        return (
          <div className="space-y-2">
            <Label htmlFor="name">Social Medias</Label>
            <Select
              name="affectedEntitySocial"
              onValueChange={(value: string) => setValue('affectedEntity', value)}
              value={watch('affectedEntity')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select affected social media account" />
              </SelectTrigger>
              <SelectContent>
                {socialMedias.map((socialMedia) => (
                  <SelectItem key={socialMedia.id} value={socialMedia.id.toString()}>
                    {socialMedia.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.affectedEntity && (
              <p className="text-sm text-red-500">{errors.affectedEntity.message}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    isSubmitting,
    renderEntity,
    watch,
    setValue,
    errors,
  }
}
