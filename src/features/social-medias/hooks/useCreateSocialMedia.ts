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

export function useCreateSocialMedia({ users, organizations }: CreateSocialMediaFormProps) {
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
          if (!user.role || !roleArray.includes(user.role)) return false
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
        {
          label: 'Account Name *',
          name: 'name',
          type: 'text',
        },
        {
          label: 'Profile URL *',
          name: 'profileUrl',
          type: 'text',
        },
        {
          label: 'Platform *',
          name: 'platform',
          type: 'select',
          options: platformOptions,
        },
        {
          label: 'Account Handle',
          name: 'accountHandle',
          type: 'text',
        },
        {
          label: 'Contact Email',
          name: 'contactEmail',
          type: 'text',
        },
        {
          label: 'Contact Phone',
          name: 'contactPhone',
          type: 'phone',
        },
        {
          label: 'Unit *',
          name: 'organization',
          type: 'tree-select',
          options: organizations?.map((org) => ({
            value: org.id.toString(),
            label: org.name,
          })),
          tree: tree,
        },
        {
          label: 'Social Media Managers *',
          name: 'socialMediaManagers',
          type: 'multiselect',
          options: socialMediaManagerOptions,
          size: 'full',
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
        },
        {
          label: 'Administrator *',
          name: 'primaryAdmin',
          type: 'select',
          options: administratorOptions,
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
        },
        {
          label: 'Backup Administrator',
          name: 'backupAdmin',
          type: 'select',
          options: backupAdministratorOptions,
          dependsOn: {
            field: 'organization',
            value: selectedOrganizationId || '',
          },
        },
        {
          label: 'Business Id',
          name: 'businessId',
          type: 'text',
        },
        {
          label: 'Creation Date',
          name: 'creationDate',
          type: 'date',
          disabled: true,
        },
        {
          label: 'Admin Contact Info *',
          name: 'adminContactEmails',
          type: 'multiselect',
          options: users.map((user) => ({
            value: user.email,
            label: user.email,
          })),
        },
        {
          label: 'Backup Contact Info',
          name: 'backupContactInfo',
          type: 'text',
        },
        {
          name: 'thirdPartyManagement',
          label: 'Third Party Management *',
          type: 'select',
          options: thirdPartyManagementOptions,
        },
        {
          name: 'thirdPartyProvider',
          type: 'text',
          label: 'Third Party Provider *',
          size: 'full',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
          },
        },
        {
          name: 'thirdPartyContact',
          type: 'text',
          label: 'Third Party Contact *',
          size: 'full',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
          },
        },
        {
          name: 'passwordManagementPractice',
          type: 'select',
          label: 'Password Management Practice *',
          size: 'full',
          options: passwordManagementPracticeOptions,
        },
        {
          name: 'linkedTools',
          type: 'multiselect',
          label: 'Linked Tools',
          size: 'full',
          options: linkedToolsOptions,
        },
        {
          name: 'verificationStatus',
          type: 'select',
          label: 'Verification Status',
          size: 'full',
          options: verificationStatusOptions,
        },
        {
          name: 'platformSupportDetails',
          type: 'text',
          label: 'Platform Support Details',
          size: 'full',
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
          size: 'full',
        },
      ],
      onSubmit: async (submitData) => {
        try {
          await createSocialMedia(submitData)
          form.reset()
          setSelectedOrganizationId(null)
          toast.success('Social media account created successfully')
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
      cancelContent: 'Cancel',
      showCancel: true,
    },
    {
      defaultValues: {
        name: undefined,
        profileUrl: undefined,
        platform: undefined,
        accountHandle: undefined,
        contactEmail: undefined,
        contactPhone: undefined,
        organization: undefined,
        socialMediaManagers: [],
        primaryAdmin: undefined,
        backupAdmin: undefined,
        businessId: undefined,
        creationDate: new Date().toISOString().split('T')[0],
        adminContactEmails: [],
        backupContactInfo: undefined,
        thirdPartyManagement: undefined,
        thirdPartyProvider: undefined,
        thirdPartyContact: undefined,
        passwordManagementPractice: undefined,
        linkedTools: [],
        verificationStatus: 'pending',
        platformSupportDetails: undefined,
        notes: undefined,
      },
    },
  )

  useEffect(() => {
    const subscription = form.watch(({ organization }, { name }) => {
      if (name !== 'organization') return
      const organizationId = organization ? organization.toString() : null
      setSelectedOrganizationId(organizationId)
      if (organizationId !== selectedOrganizationId) {
        form.setValue('socialMediaManagers', [])
        form.setValue('primaryAdmin', '')
        form.setValue('backupAdmin', undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, selectedOrganizationId])

  return {
    formComponent,
    form,
  }
}
