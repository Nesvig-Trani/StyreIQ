import { Endpoint, Where } from 'payload'
import z from 'zod'
import { env } from '@/config/env'
import { parseSearchParamsWithSchema } from '@/shared'
import {
  createUserFormSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  UserRolesEnum,
  UserStatusEnum,
} from '@/features/users/schemas'
import { updateUnitAccessSchema, UserAccessTypeEnum } from '@/features/units/schemas'
import { Organization, User } from '@/types/payload-types'
import { checkAndSendPermissionChangeEmail } from '@/features/users/utils/permissionChangeEmail'
import { JSON_HEADERS } from '@/shared/constants'
import { setUserStatusSchema } from '@/features/review-requests/schemas'
import { USER_ALREADY_EXISTS } from '@/features/users/constants/Errors'
import { forgotPasswordEmailBody } from '@/features/users/constants/forgotPasswordEmailBody'
import { resetPasswordEmailBody } from '@/features/users/constants/resetPasswordEmailBody'
import { welcomeEmailBody } from '@/features/users/constants/welcomeEmailBody'
import { WelcomeEmailCollectionSlug } from '@/features/welcome-emails/plugins/types'
import { AuditLogActionEnum } from '@/features/audit-log/plugins/types'
import { requestDemoEmailBody } from '../../constants/requestDemoEmailBody'
import {
  extractTenantIdFromProperty,
  validateRelatedEntityTenant,
  validateTenantAccess,
} from '@/features/tenants/plugins/collections/helpers/access-control-helpers'
import { getEffectiveRoleFromUser, getHighestRole } from '@/shared/utils/role-hierarchy'

export const createUser: Endpoint = {
  path: '/',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json) {
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }
      const effectiveRole = getEffectiveRoleFromUser(user)
      const data = await req.json()

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: data.tenant,
        entityName: 'user',
      })

      if (!tenantCheck.valid) {
        return new Response(JSON.stringify({ error: tenantCheck.error!.message }), {
          status: tenantCheck.error!.status,
          headers: JSON_HEADERS,
        })
      }

      if (!data.tenant) {
        data.tenant = tenantCheck.userTenant
      }

      if (data.organizations && Array.isArray(data.organizations)) {
        await Promise.all(
          data.organizations.map(async (orgRef: unknown) => {
            const orgId =
              typeof orgRef === 'object' && orgRef !== null && 'id' in orgRef
                ? (orgRef as { id: number }).id
                : orgRef

            const orgCheck = await validateRelatedEntityTenant({
              req,
              collection: 'organization',
              entityId: orgId as number,
              entityName: 'Organization',
            })

            if (!orgCheck.valid) {
              throw new Error(orgCheck.error!.message)
            }
          }),
        )
      }

      if (data.organizations && !Array.isArray(data.organizations)) {
        data.organizations = [String(data.organizations)]
      }
      const dataParsed = createUserFormSchema.parse(data)
      const existingUser = await req.payload.find({
        collection: 'users',
        where: {
          email: {
            equals: data.email,
          },
        },
      })

      if (existingUser.docs.length > 0) {
        return new Response(
          JSON.stringify({
            message: USER_ALREADY_EXISTS,
            details: existingUser.docs[0].id,
          }),
          {
            status: 400,
            headers: JSON_HEADERS,
          },
        )
      }

      const createUser = await req.payload.create({
        collection: 'users',
        data: {
          name: dataParsed.name,
          email: dataParsed.email,
          password: dataParsed.password,
          roles: dataParsed.roles,
          active_role: getHighestRole(dataParsed.roles),
          status:
            effectiveRole === UserRolesEnum.UnitAdmin
              ? UserStatusEnum.PendingActivation
              : (dataParsed.status ?? UserStatusEnum.Active),
          organizations: dataParsed.organizations?.map(Number),
          admin_policy_agreement: false,
          tenant: dataParsed.tenant,
        },
        req,
      })

      await Promise.all(
        dataParsed.organizations?.map((org) =>
          req.payload.create({
            collection: 'organization_access',
            data: {
              organization: Number(org),
              user: createUser.id,
              type: UserAccessTypeEnum.Permanent,
            },
          }),
        ) || [],
      )

      const welcomeEmail = await req.payload.find({
        collection: WelcomeEmailCollectionSlug,
        sort: '-createdAt',
        limit: 1,
      })
      const emailData = welcomeEmail.docs[0]

      let emailSent = false
      try {
        await req.payload.sendEmail({
          to:
            env.NEXT_PUBLIC_NODE_ENV === 'production'
              ? createUser.email
              : env.LOCAL_EMAIL_TO_ADDRESS,
          subject: 'Welcome to StyreIQ',
          html: welcomeEmailBody({
            name: createUser.name,
            instructions: emailData.instructions || '',
            policyLinks: emailData.policyLinks || [],
            responsibilities: emailData.responsibilities || [],
          }),
        })
        emailSent = true
      } catch {
        emailSent = false
      }

      // Log user creation event in audit log
      if (req.user) {
        try {
          await req.payload.create({
            collection: 'audit_log',
            data: {
              user: req.user.id,
              action: AuditLogActionEnum.UserCreation,
              entity: 'users',
              document: {
                relationTo: 'users',
                value: createUser.id,
              },
              current: {
                id: createUser.id,
                email: createUser.email,
                name: createUser.name,
                roles: createUser.roles,
                active_role: createUser.active_role,
                status: createUser.status,
                organizations: createUser.organizations,
              },
              organizations: createUser.organizations,
              metadata: {
                emailSent,
                emailAddress: createUser.email,
                createdBy: req.user.id,
                timestamp: new Date().toISOString(),
                actionType: 'user_creation',
              },
              tenant: createUser.tenant,
            },
          })
        } catch (auditError) {
          console.error('Failed to create audit log for user creation:', auditError)
        }
      }

      return new Response(JSON.stringify(createUser), {
        status: 201,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response(JSON.stringify({ error: 'Error creating user', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const updateUser: Endpoint = {
  path: '/',
  method: 'patch',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }
      const effectiveRole = getEffectiveRoleFromUser(user)

      const data = await req.json()
      const dataParsed = parseSearchParamsWithSchema(data, updateUserSchema)
      const userExists = await req.payload.findByID({ collection: 'users', id: dataParsed.id })
      if (!userExists) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: JSON_HEADERS,
        })
      }

      const tenantId = extractTenantIdFromProperty(userExists.tenant)

      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'user',
      })

      if (!tenantCheck.valid) {
        return new Response(JSON.stringify({ error: tenantCheck.error!.message }), {
          status: tenantCheck.error!.status,
          headers: JSON_HEADERS,
        })
      }

      if (
        data.tenant &&
        data.tenant !== user.tenant &&
        effectiveRole !== UserRolesEnum.SuperAdmin
      ) {
        return new Response(JSON.stringify({ error: 'Cannot change user tenant' }), {
          status: 403,
          headers: JSON_HEADERS,
        })
      }

      if (dataParsed.organizations && Array.isArray(dataParsed.organizations)) {
        await Promise.all(
          dataParsed.organizations.map(async (orgRef) => {
            const orgId =
              typeof orgRef === 'object' && orgRef !== null
                ? (orgRef as { id: number }).id
                : Number(orgRef)

            const orgCheck = await validateRelatedEntityTenant({
              req,
              collection: 'organization',
              entityId: orgId,
              entityName: 'Organization',
            })

            if (!orgCheck.valid) {
              throw new Error(orgCheck.error!.message)
            }
          }),
        )
      }

      if (
        dataParsed.status === UserStatusEnum.Inactive &&
        dataParsed.roles?.includes(UserRolesEnum.UnitAdmin)
      ) {
        const organizations = userExists.organizations as Organization[]

        const orgsWhereUserIsOnlyAdmin: Organization[] = []

        const results = await Promise.all(
          organizations.map(async (org) => {
            const otherAdmins = await req.payload.find({
              collection: 'users',
              where: {
                and: [
                  { 'organizations.id': { equals: org.id } },
                  { roles: { contains: UserRolesEnum.UnitAdmin } },
                  { id: { not_equals: userExists.id } },
                ],
              },
              overrideAccess: false,
              user,
            })

            if (!otherAdmins.docs.length) {
              return org
            }
            return null
          }),
        )

        orgsWhereUserIsOnlyAdmin.push(...results.filter((org): org is Organization => org !== null))

        if (orgsWhereUserIsOnlyAdmin.length > 0) {
          return new Response(
            JSON.stringify({
              error:
                'You cannot disable this user because they are the only Unit Admin in the following organizations.',
              organizations: orgsWhereUserIsOnlyAdmin,
            }),
            {
              status: 409,
              headers: JSON_HEADERS,
            },
          )
        }
      }
      const updatedUser = await req.payload.update({
        collection: 'users',
        id: dataParsed.id,
        data: {
          name: dataParsed.name,
          email: dataParsed.email,
          roles: dataParsed.roles,
          active_role: getHighestRole(dataParsed.roles),
          status: dataParsed.status,
          organizations: dataParsed.organizations?.map((org) => Number(org)),
          admin_policy_agreement: false,
          passwordUpdatedAt: dataParsed.passwordUpdatedAt?.toISOString(),
        },
        req,
      })

      await checkAndSendPermissionChangeEmail({
        payload: req.payload,
        originalUser: userExists,
        updatedData: {
          name: dataParsed.name,
          email: dataParsed.email,
          roles: dataParsed.roles,
          status: dataParsed.status,
          organizations: userExists.organizations as Organization[],
        },
      })

      if (dataParsed.organizations && dataParsed.organizations?.length > 0) {
        await req.payload.delete({
          collection: 'organization_access',
          where: {
            'user.id': {
              equals: dataParsed.id,
            },
          },
        })

        await Promise.all(
          dataParsed.organizations?.map((org) =>
            req.payload.create({
              collection: 'organization_access',
              data: {
                organization: Number(org),
                user: Number(dataParsed.id),
                type: UserAccessTypeEnum.Permanent,
              },
            }),
          ) || [],
        )
      }

      return new Response(JSON.stringify(updatedUser), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      return new Response(JSON.stringify({ error: 'Error updating user', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const updateUserAccess: Endpoint = {
  path: '/access',
  method: 'patch',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }

      const data = await req.json()
      const dataParsed = parseSearchParamsWithSchema(data, updateUnitAccessSchema)
      await Promise.all(
        dataParsed.access.map((access) =>
          req.payload.update({
            collection: 'organization_access',
            id: access.id,
            data: {
              type: access.type,
              start_date: access.start_date,
              end_date: access.end_date,
            },
            req,
          }),
        ) || [],
      )

      return new Response(
        JSON.stringify({ success: true, message: 'Operation completed successfully' }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch (error) {
      console.error('Error updating access:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const setUserApprovalStatus: Endpoint = {
  path: '/status',
  method: 'put',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      const user = req.user

      const effectiveRole = getEffectiveRoleFromUser(user)

      if (!user || effectiveRole !== UserRolesEnum.SuperAdmin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }
      const data = await req.json()
      const parseData = setUserStatusSchema.parse(data)

      const targetUser = await req.payload.findByID({ collection: 'users', id: parseData.id })

      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: JSON_HEADERS,
        })
      }

      const tenantId = extractTenantIdFromProperty(targetUser.tenant)
      const tenantCheck = validateTenantAccess({
        req,
        targetTenantId: tenantId,
        entityName: 'user',
      })

      if (!tenantCheck.valid) {
        return new Response(JSON.stringify({ error: tenantCheck.error!.message }), {
          status: tenantCheck.error!.status,
          headers: JSON_HEADERS,
        })
      }

      const updateData: Partial<User> = {
        status: parseData.approved ? UserStatusEnum.Active : UserStatusEnum.Rejected,
      }
      if (!parseData.approved) {
        updateData.reject_reason = parseData.reason
      }
      const updatedUser = await req.payload.update({
        collection: 'users',
        where: { id: { equals: parseData.id } },
        data: updateData,
      })

      return new Response(JSON.stringify({ updatedUser }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error getting users:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const getOrganizationUsers: Endpoint = {
  path: '/',
  method: 'get',
  handler: async (req) => {
    try {
      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }

      const effectiveRole = getEffectiveRoleFromUser(user)

      const params = req.searchParams
      const limit = params.get('limit') ? Number(params.get('limit')) : 10
      const page = params.get('page') ? Number(params.get('page')) : 0

      const organizations = await req.payload.find({
        collection: 'organization',
        user,
        overrideAccess: false,
      })
      const orgIds = organizations.docs.map((org) => {
        return org.id
      })

      const where: Where =
        orgIds.length === 0 && effectiveRole === UserRolesEnum.SuperAdmin
          ? {}
          : {
              'organizations.id': {
                in: orgIds,
              },
            }

      const users = await req.payload.find({
        collection: 'users',
        where,
        limit,
        page,
      })

      return new Response(JSON.stringify({ ...users }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      console.error('Error getting users:', error)
      return new Response(JSON.stringify({ error: 'Error getting users', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const userForgotPassword: Endpoint = {
  path: '/forgot-password',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const data = await req.json()
      const parseData = forgotPasswordSchema.parse(data)

      const user = await req.payload.find({
        collection: 'users',
        where: { email: { equals: parseData.email } },
      })

      if (user.totalDocs === 0) {
        return new Response(
          JSON.stringify({
            error:
              'If that email address is in our database, we will send you an email to reset your password.',
          }),
          {
            status: 404,
            headers: JSON_HEADERS,
          },
        )
      }

      const token = await req.payload.forgotPassword({
        collection: 'users',
        data: {
          email: parseData.email,
        },
        req: req,
        disableEmail: true,
      })

      let emailSent = false
      try {
        await req.payload.sendEmail({
          to:
            env.NEXT_PUBLIC_NODE_ENV === 'production'
              ? parseData.email
              : env.LOCAL_EMAIL_TO_ADDRESS,
          subject: 'Password recovery instructions',
          html: forgotPasswordEmailBody({
            token,
            name: user.docs[0].name,
          }),
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send password recovery email:', emailError)
        emailSent = false
      }

      // Log password recovery event in audit log
      try {
        await req.payload.create({
          collection: 'audit_log',
          data: {
            user: user.docs[0].id,
            action: AuditLogActionEnum.PasswordRecovery,
            entity: 'password_recovery',
            current: {
              email: parseData.email,
              tokenGenerated: !!token,
              emailSent,
            },
            metadata: {
              emailSent,
              emailAddress: parseData.email,
              tokenGenerated: !!token,
              timestamp: new Date().toISOString(),
              actionType: 'password_recovery',
            },
          },
        })
      } catch (auditError) {
        console.error('Failed to create audit log for password recovery:', auditError)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error sending recovery email', details: error }),
        {
          status: 400,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}

export const userResetPassword: Endpoint = {
  path: '/reset-password',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const data = await req.json()
      const parseData = resetPasswordSchema.parse(data)
      const result = await req.payload.resetPassword({
        collection: 'users',
        data: {
          password: parseData.password,
          token: parseData.token,
        },
        req,
        overrideAccess: true,
      })

      const userSchema = z.object({
        id: z.number(),
        email: z.string(),
        name: z.string(),
      })

      const user = userSchema.parse(result.user)

      await req.payload.update({
        collection: 'users',
        where: { id: { equals: user.id } },
        data: {
          lockUntil: null,
          loginAttempts: 0,
        },
      })

      let emailSent = false
      try {
        await req.payload.sendEmail({
          to: env.NEXT_PUBLIC_NODE_ENV === 'production' ? user.email : env.LOCAL_EMAIL_TO_ADDRESS,
          subject: 'Your account password was changed',
          html: resetPasswordEmailBody({
            name: user.name,
          }),
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send password reset confirmation email:', emailError)
        emailSent = false
      }

      // Log password reset event in audit log
      try {
        await req.payload.create({
          collection: 'audit_log',
          data: {
            user: user.id,
            action: AuditLogActionEnum.PasswordReset,
            entity: 'password_reset',
            current: {
              email: user.email,
              passwordReset: true,
              emailSent,
            },
            metadata: {
              emailSent,
              emailAddress: user.email,
              passwordReset: true,
              timestamp: new Date().toISOString(),
              actionType: 'password_reset',
            },
          },
        })
      } catch (auditError) {
        console.error('Failed to create audit log for password reset:', auditError)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Error getting users', details: error }), {
        status: 400,
        headers: JSON_HEADERS,
      })
    }
  },
}

export const requestDemo: Endpoint = {
  path: '/request-demo',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.json)
        return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })

      const data = await req.json()

      const sendEmailResponse = await req.payload.sendEmail({
        to:
          env.NEXT_PUBLIC_NODE_ENV === 'production'
            ? 'tntrani@nesvigtrani.com'
            : env.LOCAL_EMAIL_TO_ADDRESS,
        subject: 'New Demo Request',
        html: requestDemoEmailBody({
          name: data.name,
          email: data.email,
          company: data.company || '',
        }),
      })

      if (
        !sendEmailResponse ||
        typeof sendEmailResponse !== 'object' ||
        !('id' in sendEmailResponse)
      ) {
        throw new Error('Email service did not return a valid id')
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: JSON_HEADERS,
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unexpected error in requestDemo', details: error }),
        {
          status: 500,
          headers: JSON_HEADERS,
        },
      )
    }
  },
}

export const switchUserRole: Endpoint = {
  path: '/switch-role',
  method: 'post',
  handler: async (req) => {
    if (!req.json)
      return new Response(JSON.stringify({ error: 'Missing JSON body' }), {
        status: 400,
        headers: JSON_HEADERS,
      })

    try {
      const user = req.user
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: JSON_HEADERS,
        })
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }

      const { role } = body as { role?: UserRolesEnum }

      if (!role) {
        return new Response(JSON.stringify({ error: 'Role is required' }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }

      if (!Object.values(UserRolesEnum).includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400,
          headers: JSON_HEADERS,
        })
      }

      const userRoles = (user.roles || []) as UserRolesEnum[]
      if (!userRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'You do not have this role' }), {
          status: 403,
          headers: JSON_HEADERS,
        })
      }

      const updatedUser = await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          active_role: role,
        },
        req,
      })

      return new Response(
        JSON.stringify({
          success: true,
          activeRole: updatedUser.active_role,
        }),
        {
          status: 200,
          headers: JSON_HEADERS,
        },
      )
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to switch role' }), {
        status: 500,
        headers: JSON_HEADERS,
      })
    }
  },
}
