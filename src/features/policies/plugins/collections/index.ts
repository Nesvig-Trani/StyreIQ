import { CollectionConfig } from 'payload'
import { AcknowledgmentsCollectionSlug, PoliciesCollectionSlug } from '@/features/policies/schemas'
import { getLastPolicyVersion } from '../queries'
import { injectTenantHook } from '@/features/tenants/hooks/inject-tenant'
import { UserRolesEnum } from '@/features/users'
import { getAccessibleOrgIdsForUserWithPayload } from '@/shared'
import {
  adminOnlyCreateAccess,
  adminOnlyUpdateAccess,
  authenticatedCreateAccess,
  immutableUpdateAccess,
  superAdminOnlyDeleteAccess,
  tenantBasedReadAccess,
  extractTenantId,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const Policies: CollectionConfig = {
  slug: PoliciesCollectionSlug,
  access: {
    read: tenantBasedReadAccess,
    create: adminOnlyCreateAccess,
    update: adminOnlyUpdateAccess,
    delete: superAdminOnlyDeleteAccess,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!req.user) return
        if (operation !== 'create') return
        const tenantId = extractTenantId(req.user)

        if (tenantId) {
          await req.payload.update({
            collection: 'users',
            where: { tenant: { equals: tenantId } },
            data: {
              date_of_last_policy_review: new Date().toISOString(),
              admin_policy_agreement: false,
            },
          })
        }
        const lastPolicy = await getLastPolicyVersion()

        return {
          ...data,
          version:
            lastPolicy && lastPolicy.version
              ? Math.round((lastPolicy?.version + 0.1) * 10) / 10
              : 0.1,
          author: req.user.id,
        }
      },
    ],
  },
  fields: [
    {
      name: 'version',
      type: 'number',
      unique: true,
      defaultValue: 0.1,
    },
    {
      name: 'text',
      type: 'richText',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [injectTenantHook],
      },
    },
  ],
}

export const Acknowledgments: CollectionConfig = {
  slug: AcknowledgmentsCollectionSlug,
  access: {
    read: async ({ req }) => {
      const { user, payload } = req
      if (!user) return false

      const { role, id } = user

      if (role === UserRolesEnum.SuperAdmin) return true
      const tenantId = extractTenantId(user)
      if (!tenantId) return false

      switch (role) {
        case UserRolesEnum.CentralAdmin: {
          const allUsersInTenant = await payload.find({
            collection: 'users',
            where: { tenant: { equals: tenantId } },
            limit: 0,
          })

          const userIds = allUsersInTenant.docs.map((u) => u.id)

          return {
            tenant: { equals: tenantId },
            user: { in: userIds },
          }
        }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)

          const usersInScope = await payload.find({
            collection: 'users',
            where: {
              organizations: { in: accessibleOrgIds },
              tenant: { equals: tenantId },
            },
            limit: 0,
          })

          const userIds = usersInScope.docs.map((u) => u.id)

          return {
            tenant: { equals: tenantId },
            user: { in: userIds },
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return {
            tenant: { equals: tenantId },
            user: { equals: id },
          }

        default:
          return false
      }
    },

    create: authenticatedCreateAccess,
    update: immutableUpdateAccess,
    delete: superAdminOnlyDeleteAccess,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!req.user || operation !== 'create') {
          return data
        }

        await req.payload.update({
          collection: 'users',
          where: { id: { equals: req.user.id } },
          data: {
            date_of_last_policy_review: new Date().toISOString(),
            admin_policy_agreement: true,
          },
        })

        return {
          ...data,
          user: req.user.id,
        }
      },
    ],
  },
  fields: [
    {
      name: 'policy',
      type: 'relationship',
      relationTo: PoliciesCollectionSlug,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [injectTenantHook],
      },
    },
  ],
}
