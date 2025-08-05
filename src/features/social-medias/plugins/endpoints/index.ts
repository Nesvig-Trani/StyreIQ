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
          throw new EndpointError('Organization selected is not valid.', 409)
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
      const updatedSocialMedia = await req.payload.update({
        collection: SocialMediasCollectionSlug,
        id: socialMediaId,
        data: {
          ...data,
          primaryAdmin: Number(data.primaryAdmin),
          backupAdmin: Number(data.backupAdmin),
          organization: Number(data.organization),
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
