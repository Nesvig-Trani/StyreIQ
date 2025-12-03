import { z } from 'zod'
import { EndpointError } from '@/shared'
import { Endpoint, PayloadRequest } from 'payload'
import {
  createSocialMediaFormSchema,
  LinkedToolsEnum,
  PasswordManagementPracticeEnum,
  PlatformEnum,
  SocialMediaStatusEnum,
  ThirdPartyManagementEnum,
  VerificationStatusEnum,
} from '@/features/social-medias/schemas'
import { SocialMediasCollectionSlug } from '../collections'
import { UserRolesEnum } from '@/features/users/schemas'
import { JSON_HEADERS } from '@/shared/constants'
import { Organization } from '@/types/payload-types'
import { getUserById } from '@/features/users'
import {
  extractTenantId,
  validateRelatedEntityTenant,
  validateTenantAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'

/**
 * Creates a social media record.
 */
export const createSocialMedia: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }

      const user = req.user

      // Validates the role which can create social medias.
      const rolesWithGrant = [UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin]
      if (!user || !user.role || !rolesWithGrant.includes(user.role as UserRolesEnum)) {
        throw new EndpointError("You don't have permission to perform this action.", 401)
      }
      const data = await req.json()
      const dataParsed = createSocialMediaFormSchema.parse(data)
      // Validates if the users are differents.

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: data.tenant,
        entityName: 'social media',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      if (!data.tenant) {
        data.tenant = tenantCheck.userTenant
      }

      const orgCheck = await validateRelatedEntityTenant({
        req,
        collection: 'organization',
        entityId: dataParsed.organization,
        entityName: 'Organization',
      })

      if (!orgCheck.valid) {
        throw new EndpointError(orgCheck.error!.message, orgCheck.error!.status)
      }

      if (Array.isArray(dataParsed.socialMediaManagers)) {
        for (const managerId of dataParsed.socialMediaManagers) {
          const managerCheck = await validateRelatedEntityTenant({
            req,
            collection: 'users',
            entityId: managerId,
            entityName: 'Social Media Manager',
          })

          if (!managerCheck.valid) {
            throw new EndpointError(managerCheck.error!.message, managerCheck.error!.status)
          }
        }
      }

      if (dataParsed.primaryAdmin === dataParsed.backupAdmin) {
        throw new EndpointError(
          "Fields 'Administrator' and 'Backup Administrator' must be differents.",
          409,
        )
      }

      if (UserRolesEnum.UnitAdmin === (user.role as UserRolesEnum)) {
        const organizations = await req.payload.find({
          collection: 'organization',
          depth: 0,
          select: {
            id: true,
            name: true,
            parentOrg: true,
            depth: true,
            path: true,
          },
          limit: 0,
          overrideAccess: false,
          user,
        })

        const orgIds = organizations.docs.map((organization: Organization) => organization.id)
        // Validates if the organizations selected is valid.
        if (!orgIds.includes(Number(dataParsed.organization))) {
          throw new EndpointError('Unit selected is not valid.', 409)
        }
      }

      const selectedPrimaryAdmin = await getUserById({ id: Number(dataParsed.primaryAdmin) })
      if (
        !selectedPrimaryAdmin.role ||
        ![UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager].includes(
          selectedPrimaryAdmin.role as UserRolesEnum,
        )
      ) {
        throw new EndpointError('Administrator user selected is not valid.', 409)
      }

      const selectedBackupAdmin = await getUserById({ id: Number(dataParsed.backupAdmin) })
      if (
        !selectedBackupAdmin.role ||
        ![UserRolesEnum.UnitAdmin, UserRolesEnum.SocialMediaManager].includes(
          selectedBackupAdmin.role as UserRolesEnum,
        )
      ) {
        throw new EndpointError('Backup administrator user selected is not valid.', 409)
      }

      const socialMedia = await req.payload.create({
        collection: SocialMediasCollectionSlug,
        data: {
          ...dataParsed,
          organization: Number(dataParsed.organization),
          primaryAdmin: selectedPrimaryAdmin,
          backupAdmin: selectedBackupAdmin,
          status: SocialMediaStatusEnum.PendingApproval,
          platform: dataParsed.platform as PlatformEnum,
          thirdPartyManagement: dataParsed.thirdPartyManagement as
            | ThirdPartyManagementEnum
            | undefined,
          passwordManagementPractice: dataParsed.passwordManagementPractice as
            | PasswordManagementPracticeEnum
            | undefined,
          verificationStatus: dataParsed.verificationStatus as VerificationStatusEnum | undefined,
          linkedTools: dataParsed.linkedTools as LinkedToolsEnum[] | undefined,
          adminContactEmails: Array.isArray(dataParsed.adminContactEmails)
            ? dataParsed.adminContactEmails.map((email) => ({ email }))
            : [],
          socialMediaManagers: Array.isArray(dataParsed.socialMediaManagers)
            ? dataParsed.socialMediaManagers.map(Number)
            : [],
        },
        req,
      })
      return new Response(JSON.stringify(socialMedia), {
        status: 201,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
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

/**
 * Updates a social media record.
 * Initially created to update the social media status attribute.
 */
export const patchSocialMedia: Endpoint = {
  path: '/:id',
  method: 'patch',
  handler: async (req: PayloadRequest) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }

      if (!req.routeParams?.id) {
        throw new EndpointError('Social media not found.', 404)
      }

      const data = await req.json()

      if (data.status && !Object.values(SocialMediaStatusEnum).includes(data.status)) {
        throw new EndpointError('Status is not valid.', 400)
      }

      const socialMediaId = Number(req.routeParams?.id)
      const targetSocialMedia = await req.payload.findByID({
        collection: 'social-medias',
        id: socialMediaId,
      })

      if (!targetSocialMedia) {
        throw new EndpointError('Social media not found', 404)
      }

      const tenantId = extractTenantId(targetSocialMedia.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'social media',
      })
      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      const updatedSocialMedia = await req.payload.update({
        collection: SocialMediasCollectionSlug,
        id: socialMediaId,
        data: {
          ...data,
          primaryAdmin: Number(data.primaryAdmin),
          backupAdmin: Number(data.backupAdmin),
          organization: Number(data.organization),
          status: SocialMediaStatusEnum.PendingApproval,
          platform: data.platform as PlatformEnum,
          thirdPartyManagement: data.thirdPartyManagement as ThirdPartyManagementEnum | undefined,
          passwordManagementPractice: data.passwordManagementPractice as
            | PasswordManagementPracticeEnum
            | undefined,
          verificationStatus: data.verificationStatus as VerificationStatusEnum | undefined,
          linkedTools: data.linkedTools as LinkedToolsEnum[] | undefined,
          adminContactEmails: Array.isArray(data.adminContactEmails)
            ? data.adminContactEmails.map((email: string) => ({ email }))
            : [],
          socialMediaManagers: Array.isArray(data.socialMediaManagers)
            ? data.socialMediaManagers.map(Number)
            : [],
        },
        req,
      })

      return new Response(JSON.stringify(updatedSocialMedia), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
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

export const updateSocialMediaStatus: Endpoint = {
  path: '/status/:id',
  method: 'patch',
  handler: async (req: PayloadRequest) => {
    try {
      if (!req.json) {
        throw new EndpointError('Missing JSON body', 400)
      }

      if (!req.routeParams?.id) {
        throw new EndpointError('Social media not found.', 404)
      }

      const socialMediaId = Number(req.routeParams?.id)

      const targetSocialMedia = await req.payload.findByID({
        collection: 'social-medias',
        id: socialMediaId,
      })

      if (!targetSocialMedia) {
        throw new EndpointError('Social media not found', 404)
      }

      const tenantId = extractTenantId(targetSocialMedia.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'social media',
      })

      if (!tenantCheck.valid) {
        throw new EndpointError(tenantCheck.error!.message, tenantCheck.error!.status)
      }

      const data = await req.json()

      if (!Object.values(SocialMediaStatusEnum).includes(data.status)) {
        throw new EndpointError('Status is not valid.', 400)
      }
      await req.payload.update({
        collection: SocialMediasCollectionSlug,
        id: socialMediaId,
        data: {
          status: data.status,
          ...(data.deactivationReason && { deactivationReason: data.deactivationReason }),
        },
        req,
      })

      return new Response(JSON.stringify({ message: 'Status updated successfully' }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (catchError) {
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
