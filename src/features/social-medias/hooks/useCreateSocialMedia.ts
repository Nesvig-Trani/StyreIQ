'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import { UnitWithDepth } from '@/features/units'
import {
  CreateSocialMediaFormProps,
  createSocialMediaFormSchema,
  linkedToolsOptions,
  passwordManagementPracticeOptions,
  thirdPartyManagementOptions,
  verificationStatusOptions,
} from '@/features/social-medias'
import { createSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { createUnitTree } from '@/features/units/utils/createUnitTree'
import { EndpointError } from '@/shared'
import { useRouter } from 'next/navigation'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'
import { UserRolesEnum } from '@/features/users'

export function useCreateSocialMedia({
  users,
  organizations,
  currentUser,
  selectedTenantId,
}: CreateSocialMediaFormProps) {
  const tree = createUnitTree(organizations as UnitWithDepth[])
  const router = useRouter()

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)

  const filterUsersByOrganizationAndRoles = useCallback(
    (organizationId: string | null, roles: string | string[]) => {
      if (!organizationId) return []

      const numericOrgId = parseInt(organizationId, 10)
      const roleArray = Array.isArray(roles) ? roles : [roles]

      return users
        .filter((user) => {
          const userRoles: UserRolesEnum[] = Array.isArray(user.roles)
            ? (user.roles as UserRolesEnum[])
            : user.roles
              ? [user.roles as UserRolesEnum]
              : []

          const hasRequiredRole = roleArray.some((requiredRole) =>
            userRoles.includes(requiredRole as UserRolesEnum),
          )

          if (!hasRequiredRole) return false

          if (!user.organizations || user.organizations.length === 0) return false

          return user.organizations.some((org) => {
            if (typeof org === 'number') {
              return org === numericOrgId
            }
            if (typeof org === 'object' && org !== null) {
              return org.id === numericOrgId
            }
            return false
          })
        })
        .map((user) => ({
          value: user.id.toString(),
          label: user.name,
        }))
    },
    [users],
  )

  const socialMediaManagerOptions = useMemo(
    () => filterUsersByOrganizationAndRoles(selectedOrganizationId, 'social_media_manager'),
    [selectedOrganizationId, filterUsersByOrganizationAndRoles],
  )

  const administratorOptions = useMemo(
    () => filterUsersByOrganizationAndRoles(selectedOrganizationId, 'unit_admin'),
    [selectedOrganizationId, filterUsersByOrganizationAndRoles],
  )

  const backupAdministratorOptions = useMemo(
    () => filterUsersByOrganizationAndRoles(selectedOrganizationId, ['unit_admin']),
    [selectedOrganizationId, filterUsersByOrganizationAndRoles],
  )

  const { formComponent, form } = useFormHelper(
    {
      schema: createSocialMediaFormSchema,
      fields: [
        // Account Details - Row 1
        {
          label: 'Account Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter account name',
          size: 'half',
          required: true,
        },
        {
          label: 'Platform',
          name: 'platform',
          type: 'select',
          options: platformOptions,
          placeholder: 'Select Platform',
          size: 'half',
          required: true,
        },
        // Account Details - Row 2
        {
          label: 'Account Handle',
          name: 'accountHandle',
          type: 'text',
          placeholder: '@username',
          size: 'half',
        },
        {
          label: 'Profile URL',
          name: 'profileUrl',
          type: 'text',
          placeholder: 'https://platform.com/username',
          size: 'half',
          required: true,
        },
        // Account Details - Row 3
        {
          label: 'Creation Date',
          name: 'creationDate',
          type: 'date',
          placeholder: 'dd/mm/yyyy',
          disabled: true,
          size: 'half',
          required: true,
        },
        {
          label: 'Assigned Unit',
          name: 'organization',
          type: 'tree-select',
          options: organizations?.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
          placeholder: 'Select Unit',
          size: 'half',
          required: true,
        },
        // Separator 1
        {
          name: 'notes',
          label: '',
          type: 'separator',
          size: 'full',
        },
        // Ownership & Contact - Row 4
        {
          label: 'Primary Unit Admin',
          name: 'primaryAdmin',
          type: 'select',
          options: administratorOptions,
          placeholder: 'Select Primary Unit Admin',
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
          size: 'half',
          required: true,
        },
        {
          label: 'Backup Unit Admin',
          name: 'backupAdmin',
          type: 'select',
          options: backupAdministratorOptions,
          placeholder: 'Select Backup Unit Admin',
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
          size: 'half',
        },
        // Ownership & Contact - Row 5
        {
          label: 'Social Media Managers',
          name: 'socialMediaManagers',
          type: 'multiselect',
          options: socialMediaManagerOptions,
          placeholder: 'Select options',
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
          size: 'half',
          required: true,
        },
        // Third Party Management - Row 6
        {
          name: 'thirdPartyManagement',
          label: 'External Management',
          type: 'select',
          options: thirdPartyManagementOptions,
          placeholder: 'Select management type',
          size: 'full',
          required: true,
        },
        // Third Party Management - Row 7 (conditional)
        {
          name: 'thirdPartyProvider',
          type: 'text',
          label: 'Agency / Vendor Name',
          placeholder: 'Enter vendor name',
          size: 'half',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes_managed_externally',
          },
          required: true,
        },
        {
          name: 'thirdPartyContact',
          type: 'text',
          label: 'Agency Contact (Name + Email)',
          placeholder: 'Enter contact information',
          size: 'half',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes_managed_externally',
          },
          required: true,
        },
        // Separator 2
        {
          name: 'accountHandle',
          label: '',
          type: 'separator',
          size: 'full',
        },
        // Platform Governance - Row 8
        {
          name: 'passwordManagementPractice',
          type: 'select',
          label: 'Password & Access Model',
          placeholder: 'Select Management Type',
          description:
            'Select how login access is managed for this account. This helps identify security and handoff risk.',
          options: passwordManagementPracticeOptions,
          size: 'half',
          required: true,
        },
        {
          name: 'verificationStatus',
          type: 'select',
          label: 'Verification Status',
          placeholder: 'Select Status',
          options: verificationStatusOptions,
          size: 'half',
        },
        // Platform Governance - Row 9
        {
          label: 'Business Manager ID',
          name: 'businessId',
          type: 'text',
          placeholder: 'Enter Business Manager ID',
          size: 'half',
        },
        {
          label: 'Admin Contact Emails',
          name: 'adminContactEmails',
          type: 'multiselect',
          options: users.map((user) => ({
            value: user.email,
            label: user.email,
          })),
          placeholder: 'Select admin emails',
          size: 'half',
          required: true,
        },
        // Platform Governance - Row 10
        {
          name: 'platformSupportDetails',
          type: 'textarea',
          label: 'Platform Support Info',
          placeholder: 'Enter support information',
          size: 'full',
        },
        // Linked Tools - Row 11
        {
          name: 'linkedTools',
          type: 'multiselect',
          label: 'Linked Tools',
          options: linkedToolsOptions,
          placeholder: 'Select tools',
          size: 'full',
        },
        // Notes - Row 12
        {
          name: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
          placeholder: 'Enter any additional notes or comments',
          size: 'full',
        },
      ],
      onSubmit: async (submitData) => {
        const effectiveRole = getEffectiveRoleFromUser(currentUser)
        try {
          const dataToSubmit = {
            ...submitData,
            ...(effectiveRole === 'unit_admin' && { status: 'pending' }),
            tenant: selectedTenantId,
          }

          await createSocialMedia(dataToSubmit)
          form.reset()
          setSelectedOrganizationId(null)
          if (effectiveRole === 'unit_admin') {
            toast.success('Social media account created successfully and is pending approval')
          } else {
            toast.success('Social media account created successfully')
          }
          router.push('/dashboard/social-media-accounts')
        } catch (catchError) {
          if (catchError instanceof EndpointError) {
            toast.error(catchError.message)
          } else {
            toast.error(
              'An error occurred while creating the social media account, please try again',
            )
          }
        }
      },
      onCancel: () => router.push('/dashboard/social-media-accounts/'),
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        name: '',
        profileUrl: '',
        platform: '',
        accountHandle: '',
        organization: '',
        socialMediaManagers: [],
        primaryAdmin: '',
        backupAdmin: '',
        businessId: '',
        creationDate: new Date().toISOString().split('T')[0],
        adminContactEmails: [],
        thirdPartyManagement: '',
        thirdPartyProvider: '',
        thirdPartyContact: '',
        passwordManagementPractice: '',
        linkedTools: [],
        verificationStatus: 'pending',
        platformSupportDetails: '',
        notes: '',
      },
    },
  )

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'organization') {
        setSelectedOrganizationId(value.organization || null)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  return {
    formComponent,
    form,
  }
}
