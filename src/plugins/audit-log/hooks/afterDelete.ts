import { AuditLogActionEnum } from '@/plugins/audit-log/types'
import { CollectionAfterDeleteHook } from 'payload'

export const AuditLogAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  setTimeout(async () => {
    try {
      if (!req.user) return doc
      await req.payload.create({
        collection: 'audit_log',
        data: {
          user: req.user?.id,
          action: AuditLogActionEnum.Delete,
          entity: collection.slug,
          prev: doc,
        },
      })
    } catch (err) {
      console.error('Audit log creation failed:', err)
    }
  }, 0)

  return doc
}

export default AuditLogAfterDelete
