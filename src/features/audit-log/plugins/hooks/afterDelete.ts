import { AuditLogActionEnum } from '../types'
import { CollectionAfterDeleteHook } from 'payload'
import { AuditLog } from '@/lib/payload/payload-types'

export const AuditLogAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  setTimeout(async () => {
    try {
      if (!req.user) return doc
      const { slug } = collection
      const data: Omit<AuditLog, 'createdAt' | 'updatedAt' | 'id'> = {
        user: req.user?.id,
        action: AuditLogActionEnum.Delete,
        entity: collection.slug,
        prev: doc,
      }

      switch (slug) {
        case 'organization':
          data.organizations = [doc.id]
          break
        case 'users':
          data.organizations = doc.organizations
          break
        default:
          break
      }

      await req.payload.create({
        collection: 'audit_log',
        data,
      })
    } catch (err) {
      console.error('Audit log creation failed:', err)
    }
  }, 0)

  return doc
}

export default AuditLogAfterDelete
