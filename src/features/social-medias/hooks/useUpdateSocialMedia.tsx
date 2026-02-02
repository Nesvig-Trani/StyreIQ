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
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

function getEntityId<T extends { id: number }>(entity: number | T | undefined): string | null {
  if (!entity) return null
  if (typeof entity === 'number') return entity.toString()
  if ('id' in entity) return entity.id.toString()
  return null
}

export function useUpdateSocialMedia({
  data,
  users,
  organizations,
  currentUser,
}: UpdateSocialMediaFormProps) {
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
      const hasRole = (user: User) => {
        const effectiveRole = getEffectiveRoleFromUser(user)
        return !!effectiveRole && roleArray.includes(effectiveRole)
      }

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
          label: 'Third-Party Management',
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
          label: 'Third Party Provider',
          placeholder: 'Enter vendor name',
          size: 'half',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
          },
          required: true,
        },
        {
          name: 'thirdPartyContact',
          type: 'text',
          label: 'Third Party Contact',
          placeholder: 'Enter contact information',
          size: 'half',
          dependsOn: {
            field: 'thirdPartyManagement',
            value: 'yes',
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
          label: 'Password Management',
          placeholder: 'Select Management Type',
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
        try {
          const effectiveRole = getEffectiveRoleFromUser(currentUser)
          const dataToSubmit = {
            ...submitData,
            ...(effectiveRole === 'unit_admin' && { status: 'pending' }),
          }

          await updateSocialMedia({ ...dataToSubmit, id: data.id })
          if (effectiveRole === 'unit_admin') {
            toast.success('Social media account updated successfully and is pending approval')
          } else {
            toast.success('Social media account updated successfully')
          }

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
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        id: data.id,
        name: data.name || '',
        profileUrl: data.profileUrl || '',
        platform: data.platform || '',
        accountHandle: data.accountHandle || '',
        organization: getOrganizationId(data.organization) || '',
        socialMediaManagers:
          data.socialMediaManagers?.map(getUserId).filter((id): id is string => id !== null) || [],
        primaryAdmin: getUserId(data.primaryAdmin) || '',
        backupAdmin: data.backupAdmin ? (getUserId(data.backupAdmin) ?? '') : '',
        businessId: data.businessId || '',
        creationDate:
          data.creationDate && typeof data.creationDate === 'string'
            ? data.creationDate
            : new Date().toISOString().split('T')[0],
        adminContactEmails:
          data.adminContactEmails
            ?.map((contact) => contact.email)
            .filter((email): email is string => email !== null) || [],
        thirdPartyManagement: data.thirdPartyManagement || '',
        thirdPartyProvider: data.thirdPartyProvider || '',
        thirdPartyContact: data.thirdPartyContact || '',
        passwordManagementPractice: data.passwordManagementPractice || '',
        linkedTools: data.linkedTools || [],
        verificationStatus: data.verificationStatus || 'pending',
        platformSupportDetails: data.platformSupportDetails || '',
        notes: data.notes || '',
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
        form.setValue('backupAdmin', '')
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
