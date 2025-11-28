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
        const lastPolicy = await getLastPolicyVersion()
        await req.payload.update({
          collection: 'users',
          where: { tenant: { equals: req.user.tenant } },
          data: {
            date_of_last_policy_review: new Date().toISOString(),
            admin_policy_agreement: false,
          },
        })
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

      const { role, tenant, id } = user

      if (role === UserRolesEnum.SuperAdmin) return true
      if (!tenant) return false

      switch (role) {
        case UserRolesEnum.CentralAdmin: {
          const allUsersInTenant = await payload.find({
            collection: 'users',
            where: { tenant: { equals: tenant } },
            limit: 0,
          })

          const userIds = allUsersInTenant.docs.map((u) => u.id)

          return {
            tenant: { equals: tenant },
            user: { in: userIds },
          }
        }

        case UserRolesEnum.UnitAdmin: {
          const accessibleOrgIds = await getAccessibleOrgIdsForUserWithPayload(user, payload)

          const usersInScope = await payload.find({
            collection: 'users',
            where: {
              organizations: { in: accessibleOrgIds },
              tenant: { equals: tenant },
            },
            limit: 0,
          })

          const userIds = usersInScope.docs.map((u) => u.id)

          return {
            tenant: { equals: tenant },
            user: { in: userIds },
          }
        }

        case UserRolesEnum.SocialMediaManager:
          return {
            tenant: { equals: tenant },
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
        if (!req.user) return
        if (operation !== 'create') return
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
