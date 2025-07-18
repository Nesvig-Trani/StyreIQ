'use client'
import { affectedEntityOptions } from '@/flags/constants/affectedEntityOptions'
import { flagTypeOptions } from '@/flags/constants/flagTypeOptions'
import { useCreateFlag } from '@/flags/hooks/useCreateFlag'
import { AffectedEntityTypeEnum, FlagTypeEnum } from '@/flags/schemas'
import { SocialMedia, User } from '@/payload-types'
import {
  Label,
  SelectContent,
  SelectValue,
  SelectItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Textarea,
} from '@/shared'
import { Select, SelectTrigger } from '@radix-ui/react-select'

export function CreateFlagForm({
  users,
  socialMedias,
}: {
  users: User[]
  socialMedias: SocialMedia[]
}) {
  const { handleSubmit, onSubmit, setValue, errors, register, renderEntity, watch, isSubmitting } =
    useCreateFlag({ users, socialMedias })

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Risk Flag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Flag Type</Label>
            <Select
              name="flagType"
              onValueChange={(value: FlagTypeEnum) => setValue('flagType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Risk flag type" />
              </SelectTrigger>
              <SelectContent>
                {flagTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.flagType && <p className="text-sm text-red-500">{errors.flagType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Affected Entity Type</Label>
            <Select
              name="affectedEntityType"
              onValueChange={(value: AffectedEntityTypeEnum) =>
                setValue('affectedEntityType', value)
              }
              value={watch('affectedEntityType')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {affectedEntityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.affectedEntityType && (
              <p className="text-sm text-red-500">{errors.affectedEntityType.message}</p>
            )}
          </div>

          {renderEntity()}

          <div className="space-y-2">
            <Label htmlFor="description">Risk Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestedAction">Suggested Action</Label>
            <Textarea
              id="suggestedAction"
              {...register('suggestedAction', { required: 'Suggested action is required' })}
            />
            {errors.suggestedAction && (
              <p className="text-sm text-red-500">{errors.suggestedAction.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting}>
            Create
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
