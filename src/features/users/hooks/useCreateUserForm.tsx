import { CreateUser, createUserFormSchema, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Organization } from '@/types/payload-types'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { isApiError } from '@/shared'
import { createUser } from '@/sdk/users'
import { USER_ALREADY_EXISTS } from '../constants/Errors'
import { createUnitTree, UnitWithDepth } from '@/features/units'

interface UserFormProps {
  authUserRole?: UserRolesEnum | null
  initialOrganizations: Organization[]
  topOrgDepth?: number
  onRefetchOrganizations?: () => Promise<Organization[]>
}

function useCreateUserForm({ initialOrganizations, authUserRole, topOrgDepth }: UserFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CreateUser>({
    defaultValues: {
      email: '',
      password: '',
      name: '',
      roles: [UserRolesEnum.SocialMediaManager],
      status: undefined,
      organizations: [],
    },
  })

  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isLoading, setIsLoading] = useState(false)

  const selectedRoles = watch('roles')
  const passwordUpdatedAt = watch('passwordUpdatedAt')
  const tree = createUnitTree(organizations as UnitWithDepth[])

  const allowedRoles =
    authUserRole === UserRolesEnum.UnitAdmin
      ? [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
      : Object.values(UserRolesEnum)
  const allowedStatuses =
    authUserRole === UserRolesEnum.UnitAdmin ? [] : [UserStatusEnum.Active, UserStatusEnum.Inactive]

  const handleRolesChange = async (roles: UserRolesEnum[]) => {
    setValue('roles', roles)
    if (authUserRole === UserRolesEnum.UnitAdmin && roles.includes(UserRolesEnum.UnitAdmin)) {
      try {
        setIsLoading(true)
        const newOrgs = initialOrganizations.filter((org) => org.depth === topOrgDepth)
        setOrganizations(newOrgs)
      } catch (error) {
        console.error('Failed to refetch organizations:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      setOrganizations(initialOrganizations)
    }
  }

  const onSubmit = async (data: CreateUser) => {
    const result = createUserFormSchema.safeParse(data)
    if (!result.success) {
      const zodErrors = result.error.flatten()

      Object.entries(zodErrors.fieldErrors).forEach(([field, messages]) => {
        if (!messages) return
        setError(field as keyof CreateUser, {
          type: 'manual',
          message: messages[0],
        })
      })
      return
    }
    try {
      await createUser(data)
      toast.success('User created successfully')
      reset()

      router.push('/dashboard/users')
    } catch (error) {
      if (isApiError(error)) {
        if (error.data?.message === USER_ALREADY_EXISTS) {
          toast('User already exists, update the user instead')
          router.push(`/dashboard/users/update/${error.data.details}`)
        } else {
          toast.error('An error occurred while creating the user, please try again')
        }
      } else {
        toast.error('An unexpected error occurred')
        console.error('error', error)
      }
    }
  }

  return {
    handleSubmit: handleSubmit(onSubmit),
    organizations,
    allowedRoles,
    allowedStatuses,
    handleRolesChange,
    isLoading: isLoading || isSubmitting,
    register,
    errors,
    watch,
    setValue,
    selectedRoles,
    tree,
    passwordUpdatedAt,
  }
}

export default useCreateUserForm
