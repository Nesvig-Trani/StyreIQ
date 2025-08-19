'use client'
import { useFormHelper } from '@/shared/components/form-hook-helper'
import { UnitWithDepth } from '@/features/units'
import {
  UpdateSocialMediaFormProps,
  createSocialMediaFormSchema,
  linkedToolsOptions,
  passwordManagementPracticeOptions,
  thirdPartyManagementOptions,
  verificationStatusOptions,
} from '@/features/social-medias'
import { updateSocialMedia } from '@/sdk/social-medias'
import { toast } from 'sonner'
import { createUnitTree } from '@/features/units/utils/createUnitTree'
import { EndpointError } from '@/shared'
import { useRouter } from 'next/navigation'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Organization, User } from '@/types/payload-types'

function getEntityId<T extends { id: number }>(entity: number | T | undefined): string | null {
  if (!entity) return null
  if (typeof entity === 'number') return entity.toString()
  if ('id' in entity) return entity.id.toString()
  return null
}

export function useUpdateSocialMedia({ data, users, organizations }: UpdateSocialMediaFormProps) {
  const tree = createUnitTree(organizations as UnitWithDepth[])
  const router = useRouter()

  const getOrganizationId = (organization: number | Organization | undefined) =>
    getEntityId(organization)

  const getUserId = (user: number | User | undefined) => getEntityId(user)

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    getOrganizationId(data?.organization),
  )

  const filterUsersByOrganizationAndRoles = useCallback(
    (organizationId: string | null, roles: string | string[]) => {
      if (!organizationId) return []

      const numericOrgId = parseInt(organizationId, 10)
      const roleArray = Array.isArray(roles) ? roles : [roles]
      const hasRole = (user: User) => !!user.role && roleArray.includes(user.role)

      const belongsToOrg = (user: User, orgId: number) =>
        Array.isArray(user.organizations) &&
        user.organizations.some((org) =>
          typeof org === 'number' ? org === orgId : org?.id === orgId,
        )

      return users
        .filter((user) => hasRole(user) && belongsToOrg(user, numericOrgId))
        .map((user) => ({
          value: user.id.toString(),
          label: user.name,
        }))
    },
    [users],
  )

  const socialMediaManagerOptions = useMemo(() => {
    const options = filterUsersByOrganizationAndRoles(
      selectedOrganizationId,
      'social_media_manager',
    )

    if (data.socialMediaManagers) {
      data.socialMediaManagers.forEach((manager) => {
        const managerId = getUserId(manager)
        if (managerId) {
          const managerExists = options.find((opt) => opt.value === managerId)
          if (!managerExists) {
            const managerName =
              typeof manager === 'object' && 'name' in manager ? manager.name : 'Unknown'
            options.push({
              value: managerId,
              label: managerName,
            })
          }
        }
      })
    }

    return options
  }, [selectedOrganizationId, filterUsersByOrganizationAndRoles, data.socialMediaManagers])

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
          await updateSocialMedia({ ...submitData, id: data.id })
          toast.success('Social media account updated successfully')
          router.push('/dashboard/social-media-accounts')
        } catch (catchError) {
          if (catchError instanceof EndpointError) {
            toast.error(catchError.message)
          } else {
            toast.error(
              'An error occurred while updating the social media account, please try again',
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
        name: data.name || undefined,
        profileUrl: data.profileUrl || undefined,
        platform: data.platform || undefined,
        accountHandle: data.accountHandle || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        organization: getOrganizationId(data.organization) || undefined,
        socialMediaManagers:
          (data.socialMediaManagers
            ?.map((manager) => getUserId(manager))
            .filter(Boolean) as string[]) || [],
        primaryAdmin: getUserId(data.primaryAdmin) || undefined,
        backupAdmin: getUserId(data.backupAdmin) || undefined,
        businessId: data.businessId || undefined,
        creationDate: data.creationDate
          ? new Date(data.creationDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        adminContactEmails:
          data.adminContactEmails
            ?.map((contact) => contact.email)
            .filter((email): email is string => email != null) || [],
        backupContactInfo: data.backupContactInfo || undefined,
        thirdPartyManagement: data.thirdPartyManagement || undefined,
        thirdPartyProvider: data.thirdPartyProvider || undefined,
        thirdPartyContact: data.thirdPartyContact || undefined,
        passwordManagementPractice: data.passwordManagementPractice || undefined,
        linkedTools: data.linkedTools || [],
        verificationStatus: data.verificationStatus || 'pending',
        platformSupportDetails: data.platformSupportDetails || undefined,
        notes: data.notes || undefined,
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
    tree,
  }
}
