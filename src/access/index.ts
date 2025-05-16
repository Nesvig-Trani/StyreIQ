import { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => {
  if (user) {
    if (typeof user.role !== 'number' && user.role?.name === 'SuperAdmin') {
      return true
    }
  }
  return false
}
