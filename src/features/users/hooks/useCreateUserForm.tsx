import { CreateUser, createUserFormSchema, UserRolesEnum, UserStatusEnum } from '@/features/users'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Organization } from '@/types/payload-types'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { isApiError } from '@/shared'
import { createUser } from '@/sdk/users'
import { USER_ALREADY_EXISTS } from '../constants/Errors'
import { CreateOrganizationsTree, OrganizationWithDepth } from '@/features/organizations'

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
      role: undefined,
      status: undefined,
      organizations: [],
      isEnabledTwoFactor: false,
      isInUseSecurePassword: false,
      isCompletedTrainingAccessibility: false,
      isCompletedTrainingRisk: false,
      isCompletedTrainingBrand: false,
      hasKnowledgeStandards: false,
    },
  })

  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isLoading, setIsLoading] = useState(false)

  const selectedRole = watch('role')
  const passwordUpdatedAt = watch('passwordUpdatedAt')
  const tree = CreateOrganizationsTree(organizations as OrganizationWithDepth[])

  const allowedRoles =
    authUserRole === UserRolesEnum.UnitAdmin
      ? [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
      : Object.values(UserRolesEnum)
  const allowedStatuses =
    authUserRole === UserRolesEnum.UnitAdmin ? [] : [UserStatusEnum.Active, UserStatusEnum.Inactive]

  const handleRoleChange = async (role: UserRolesEnum) => {
    setValue('role', role)
    if (authUserRole === UserRolesEnum.UnitAdmin && role === UserRolesEnum.UnitAdmin) {
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
      const user = await createUser(data)
      toast.success('User created successfully')
      reset()
      if (user.role === UserRolesEnum.SuperAdmin) {
        router.push('/dashboard/users')
      } else {
        router.push(`/dashboard/users/access/${user.id}`)
      }
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
    handleRoleChange,
    isLoading: isLoading || isSubmitting,
    register,
    errors,
    watch,
    setValue,
    selectedRole,
    tree,
    passwordUpdatedAt,
  }
}

export default useCreateUserForm
