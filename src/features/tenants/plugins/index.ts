import type { Config } from 'payload'
import { Tenants } from './collections'
import { UnitTypeEnum } from '@/features/units'

export type TenantPluginConfig = {
  disabled?: boolean
  autoCreatePrimaryUnits?: boolean
}

export const TenantPlugin =
  (pluginOptions: TenantPluginConfig = {}) =>
  (config: Config): Config => {
    config.collections = [...(config.collections || []), Tenants]

    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) config.endpoints = []
    if (!config.admin) config.admin = {}
    if (!config.admin.components) config.admin.components = {}

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      if (pluginOptions.autoCreatePrimaryUnits) {
        const tenants = await payload.find({
          collection: 'tenants',
          limit: 0,
        })

        const tenantsToFix = tenants.docs.filter((t) => !t.primaryUnit)
        if (tenantsToFix.length === 0) return

        const createOps = tenantsToFix.map((t) =>
          payload.create({
            collection: 'organization',
            data: {
              name: `${t.name} - Primary Unit`,
              tenant: t.id,
              isPrimaryUnit: true,
              parentOrg: null,
              status: 'active',
              type: UnitTypeEnum.DEPARTMENT,
            },
          }),
        )

        const createdUnits = await Promise.all(createOps)

        const updateOps = tenantsToFix.map((tenant, i) =>
          payload.update({
            collection: 'tenants',
            id: tenant.id,
            data: {
              primaryUnit: createdUnits[i].id,
            },
          }),
        )

        await Promise.all(updateOps)
      }
    }

    return config
  }
