import {
  AffectedEntityTypeEnum,
  createFlagCommentSchema,
  createFlagSchema,
  FlagHistoryActionsEnum,
  FlagSourceEnum,
  FlagStatusEnum,
} from '@/features/flags/schemas'
import { EndpointError } from '@/shared'
import { Endpoint } from 'payload'
import {
  FlagCommentsCollectionSlug,
  FlagHistoryCollectionSlug,
  FlagsCollectionSlug,
} from '../types'
import { JSON_HEADERS } from '@/shared/constants'
import { z } from 'zod'
import { SocialMediasCollectionSlug } from '@/features/social-medias'
import { UserRolesEnum } from '@/features/users'
import {
  extractTenantIdFromProperty,
  validateRelatedEntityTenant,
  validateTenantAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

export const createFlag: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }

      const user = req.user
      if (!user) {
        throw new EndpointError('Missing user', 400)
      }
      const data = await req.json()
      const dataParsed = createFlagSchema.parse(data)
      if (!data.tenant) {
        data.tenant = user.tenant ? extractTenantIdFromProperty(user.tenant) : null
      }

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: data.tenant,
        entityName: 'flag',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      const entityCheck = await validateRelatedEntityTenant({
        req,
        collection: dataParsed.affectedEntityType,
        entityId: Number(dataParsed.affectedEntity),
        entityName: 'Affected entity',
      })

      if (!entityCheck.valid) {
        throw new EndpointError(entityCheck.error!.message, entityCheck.error!.status)
      }

      let organizations

      switch (dataParsed.affectedEntityType) {
        case AffectedEntityTypeEnum.USER:
          const user = await req.payload.findByID({
            collection: 'users',
            id: Number(dataParsed.affectedEntity),
            depth: 0,
          })
          if (user) {
            organizations = user.organizations
          }
          break
        case AffectedEntityTypeEnum.SOCIAL_MEDIA:
          const socialMedia = await req.payload.findByID({
            collection: SocialMediasCollectionSlug,
            id: Number(dataParsed.affectedEntity),
            depth: 0,
          })

          if (socialMedia) {
            organizations = [socialMedia.organization]
          }
          break
        default:
          break
      }

      const flag = await req.payload.create({
        collection: FlagsCollectionSlug,
        data: {
          ...dataParsed,
          status: FlagStatusEnum.PENDING,
          affectedEntity: {
            relationTo: dataParsed.affectedEntityType,
            value: Number(dataParsed.affectedEntity),
          },
          organizations,
          detectionDate: new Date().toISOString(),
          source: FlagSourceEnum.MANUAL_FLAG,
          lastActivity: new Date().toISOString(),
        },
        req,
      })

      await req.payload.create({
        collection: FlagHistoryCollectionSlug,
        data: {
          flag: flag.id,
          user: user.id,
          action: FlagHistoryActionsEnum.CREATED,
        },
      })

      return new Response(JSON.stringify(flag), {
        status: 201,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
      console.log('catch', catchError)
      if (catchError instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }
      if (catchError instanceof EndpointError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: catchError.code,
          headers: JSON_HEADERS,
        })
      }

      return new Response(JSON.stringify({ error: 'Internal Server Error', details: catchError }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const markAsResolved: Endpoint = {
  path: '/resolved/:id',
  method: 'put',
  handler: async (req) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }
      if (!req.routeParams?.id) {
        throw new EndpointError('Social media not found.', 404)
      }

      const user = req.user
      if (user?.role !== UserRolesEnum.SuperAdmin) {
        throw new EndpointError('Unauthorized')
      }

      const flagId = req.routeParams?.id

      const flag = await req.payload.findByID({
        collection: FlagsCollectionSlug,
        id: Number(flagId),
      })

      if (!flag) {
        throw new EndpointError('No flag id', 404)
      }

      const tenantId = extractTenantIdFromProperty(flag.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'flag',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }
      const updatedFlag = await req.payload.update({
        collection: FlagsCollectionSlug,
        where: {
          id: { equals: flag.id },
        },
        data: {
          status: FlagStatusEnum.RESOLVED,
        },
        req,
      })

      await req.payload.create({
        collection: FlagHistoryCollectionSlug,
        data: {
          flag: flag.id,
          user: user.id,
          action: FlagHistoryActionsEnum.STATUS_CHANGED,
          prevStatus: flag.status,
          newStatus: FlagStatusEnum.RESOLVED,
        },
      })

      return new Response(JSON.stringify(updatedFlag), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
      console.log('catch', catchError)
      if (catchError instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }
      if (catchError instanceof EndpointError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: catchError.code,
          headers: JSON_HEADERS,
        })
      }

      return new Response(JSON.stringify({ error: 'Internal Server Error', details: catchError }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const createComment: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }

      const user = req.user

      if (!user) {
        throw new EndpointError('Unauthorized', 403)
      }

      const data = await req.json()
      const dataParsed = createFlagCommentSchema.parse(data)

      const { flagId, comment } = dataParsed

      const flag = await req.payload.findByID({
        collection: FlagsCollectionSlug,
        id: Number(flagId),
      })

      if (!flag) {
        throw new EndpointError('No flag id', 404)
      }

      const tenantId = extractTenantIdFromProperty(flag.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'flag',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      const createComment = await req.payload.create({
        collection: FlagCommentsCollectionSlug,
        data: {
          comment,
          flag: flagId,
          user: user.id,
        },
        req,
      })

      await req.payload.create({
        collection: FlagHistoryCollectionSlug,
        data: {
          flag: flag.id,
          user: user.id,
          action: FlagHistoryActionsEnum.COMMENT,
        },
      })

      return new Response(JSON.stringify(createComment), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
      console.log('catch', catchError)
      if (catchError instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }
      if (catchError instanceof EndpointError) {
        return new Response(JSON.stringify({ error: catchError.message }), {
          status: catchError.code,
          headers: JSON_HEADERS,
        })
      }

      return new Response(JSON.stringify({ error: 'Internal Server Error', details: catchError }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }
  },
}
