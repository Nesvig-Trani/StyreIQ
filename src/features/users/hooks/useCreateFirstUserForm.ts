'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import { createFirstUserFormSchema } from '@/features/users'
import { createFirstUser } from '@/sdk/users'
import { toast } from 'sonner'
import { isApiError } from '@/shared/utils/isApiError'
import { useRouter } from 'next/navigation'

export function useCreateFirstUserForm() {
  const router = useRouter()

  const { formComponent, form } = useFormHelper(
    {
      schema: createFirstUserFormSchema,
      fields: [
        {
          label: 'Name *',
          name: 'name',
          type: 'text',
        },
        {
          label: 'Email *',
          name: 'email',
          type: 'text',
        },
        {
          label: 'Password *',
          name: 'password',
          type: 'password',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createFirstUser(submitData)
          form.reset()
          toast.success('User created successfully')
          router.push(`/login`)
        } catch (error) {
          if (isApiError(error)) {
            toast.error('An error occurred while creating the user, please try again')
          } else {
            toast.error('An unexpected error occurred')
          }
        }
      },
      submitContent: 'Create user',
    },
    {
      defaultValues: {
        name: undefined,
        email: undefined,
        password: undefined,
      },
    },
  )

  return {
    formComponent,
    form,
  }
}

export default useCreateFirstUserForm
