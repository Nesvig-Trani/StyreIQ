import { getAuthUser } from '@/features/auth/utils/getAuthUser'
import { AccessControl } from '@/shared/utils/rbac'
import { NotAuthorized } from '@/shared'
import { ResourceAction, Resource } from '@/shared/constants/rbac'

interface AccessGuardOptions {
  action: ResourceAction
  resource: Resource
  title?: string
  message?: string
  buttonText?: string
  buttonIcon?: 'home' | 'arrow-left'
  showHomeButton?: boolean
}

export async function checkAccessGuard({
  action,
  resource,
  title = 'Access Restricted',
  message = 'You do not have permission to access this page.',
  buttonText = 'Back to Dashboard',
  buttonIcon = 'home',
  showHomeButton = true,
}: AccessGuardOptions) {
  const { user } = await getAuthUser()

  if (!user) {
    return {
      user: null,
      accessDenied: true,
      component: (
        <NotAuthorized
          title="Access Denied"
          message="You must be logged in to access this page."
          showHomeButton={false}
        />
      ),
    }
  }

  const access = new AccessControl(user)
  if (!access.can(action, resource)) {
    return {
      user,
      accessDenied: true,
      component: (
        <NotAuthorized
          title={title}
          message={message}
          buttonText={buttonText}
          buttonIcon={buttonIcon}
          showHomeButton={showHomeButton}
        />
      ),
    }
  }

  return {
    user,
    accessDenied: false,
    component: null,
  }
}

// Individual access guard functions for user management
const userAccessMessages = {
  read: "As a Social Media Manager, you don't have access to user management features. You can manage social media accounts and flags from your dashboard.",
  create:
    "As a Social Media Manager, you don't have permission to create new users. Please contact your Unit Admin or Super Admin if you need to add team members.",
  update:
    "As a Social Media Manager, you don't have permission to edit user profiles. Please contact your Unit Admin or Super Admin for user management changes.",
  delete:
    "As a Social Media Manager, you don't have permission to delete users. Please contact your Unit Admin or Super Admin for user management changes.",
} as const

export async function checkUserReadAccess() {
  return checkAccessGuard({
    action: 'read',
    resource: 'USERS',
    message: userAccessMessages.read,
  })
}

export async function checkUserCreateAccess() {
  return checkAccessGuard({
    action: 'create',
    resource: 'USERS',
    message: userAccessMessages.create,
  })
}

export async function checkUserUpdateAccess() {
  return checkAccessGuard({
    action: 'update',
    resource: 'USERS',
    message: userAccessMessages.update,
  })
}

export async function checkUserDeleteAccess() {
  return checkAccessGuard({
    action: 'delete',
    resource: 'USERS',
    message: userAccessMessages.delete,
  })
}
