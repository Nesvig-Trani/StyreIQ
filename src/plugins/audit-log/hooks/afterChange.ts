import { AuditLog } from '@/payload-types'
import { CollectionAfterChangeHook } from 'payload'
import { AuditLogCollectionKey } from '@payload-config'

const AuditLogAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  operation,
  req,
  context,
}) => {
  setTimeout(async () => {
    try {
      if (!req.user) return doc

      const { slug } = collection

      const data: Omit<AuditLog, 'createdAt' | 'updatedAt' | 'id'> = {
        user: req.user?.id,
        action: operation,
        entity: collection.slug,
        document: {
          relationTo: collection.slug as AuditLogCollectionKey,
          value: doc.id,
        },
      }

      switch (slug) {
        case 'organization':
          data.organizations = [doc.id]
          break
        case 'users':
          data.organizations = doc.organizations
          break
        case 'social-medias':
          data.organizations = [doc.organization.id]
          break
        case 'flags':
          data.organizations = [doc.organization.id]
          break
        case 'flagComments':
          data.organizations = [doc.flag.organization.id]
          break
        case 'organization_access':
          data.organizations = [doc.organization.id]
          break
        default:
          break
      }
      if (operation === 'update' && context.prev) {
        const parsePrevCtx = JSON.stringify(context.prev)
        data.prev = JSON.parse(parsePrevCtx)
      } else {
        data.prev = previousDoc
      }

      data.current = doc
      await req.payload.create({
        collection: 'audit_log',
        data: {
          ...data,
        },
      })
    } catch (err) {
      console.error('Audit log creation failed:', err)
    }
  }, 0)

  return doc
}

export default AuditLogAfterChange
