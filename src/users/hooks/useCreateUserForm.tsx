import { CreateUser, UserRolesEnum, UserStatusEnum } from '@/users'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Organization } from '@/payload-types'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { isApiError } from '@/shared'
import { createUser } from '@/sdk/users'
import { USER_ALREADY_EXISTS } from '../constants/Errors'

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
  } = useForm<CreateUser>({
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: undefined,
      status: undefined,
      organizations: [],
    },
  })

  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isLoading, setIsLoading] = useState(false)

  const allowedRoles =
    authUserRole === UserRolesEnum.UnitAdmin
      ? [UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager]
      : Object.values(UserRolesEnum)
  const allowedStatuses =
    authUserRole === UserRolesEnum.UnitAdmin ? [] : [UserStatusEnum.Active, UserStatusEnum.Inactive]

  const handleRoleChange = async (role: UserRolesEnum) => {
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

  const handleOrganizationToggle = (orgId: string, checked: boolean) => {
    const currentOrgs = watch('organizations') || []
    const newOrgs = checked
      ? [...currentOrgs, orgId]
      : currentOrgs.filter((id: string) => id !== orgId)
    setValue('organizations', newOrgs)
  }

  const onSubmit = async (data: CreateUser) => {
    try {
      const user = await createUser(data)
      reset()
      toast.success('User created successfully')
      router.push(`/dashboard/users/access/${user.id}`)
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
    handleOrganizationToggle,
    isLoading: isLoading || isSubmitting,
    register,
    errors,
    watch,
    setValue,
  }
}

export default useCreateUserForm
