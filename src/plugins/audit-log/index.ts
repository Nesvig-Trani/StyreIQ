import type { CollectionSlug, Config } from 'payload'

import AuditLogAfterChange from '@/plugins/audit-log/hooks/afterChange'
import AuditLogAfterDelete from '@/plugins/audit-log/hooks/afterDelete'
import { AuditLogs } from '@/plugins/audit-log/collections/audit-log'

export type AuditLogConfig = {
  collections?: Partial<Record<CollectionSlug, true>>
  disabled?: boolean
}

const attachDocRelationshipToAuditLog = ({
  config,
  pluginCollectionSlugs,
}: {
  config: Config
  pluginCollectionSlugs: CollectionSlug[]
}) => {
  const auditLogCollection = config.collections?.find(
    (collection) => collection.slug === 'audit_log',
  )
  if (auditLogCollection) {
    auditLogCollection.fields = [
      ...auditLogCollection.fields,
      {
        name: 'document',
        label: 'Document',
        type: 'relationship',
        relationTo: pluginCollectionSlugs,
      },
    ]
  }
}

const attachHooksToCollections = ({
  config,
  pluginCollectionSlugs,
}: {
  config: Config
  pluginCollectionSlugs: CollectionSlug[]
}) => {
  for (const collectionSlug of pluginCollectionSlugs) {
    const collection = config.collections?.find((collection) => collection.slug === collectionSlug)
    if (collection) {
      collection.hooks = {
        ...collection.hooks,
        afterChange: [...(collection.hooks?.afterChange || []), AuditLogAfterChange],
        afterDelete: [...(collection.hooks?.afterDelete || []), AuditLogAfterDelete],
      }
    }
  }
}

export const AuditLogPlugin =
  (pluginOptions: AuditLogConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }
    config.collections.push(AuditLogs)

    if (pluginOptions.collections) {
      const pluginCollectionSlugs = Object.keys(pluginOptions.collections).map(
        (key) => key,
      ) as CollectionSlug[]

      attachDocRelationshipToAuditLog({
        config,
        pluginCollectionSlugs,
      })

      attachHooksToCollections({
        config,
        pluginCollectionSlugs,
      })
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
