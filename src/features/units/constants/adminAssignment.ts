export const UNASSIGNED_ADMIN_VALUE = 'not_assigned'
export const UNASSIGNED_ADMIN_LABEL = 'Not assigned yet'

export const unassignedAdminOption = {
  value: UNASSIGNED_ADMIN_VALUE,
  label: UNASSIGNED_ADMIN_LABEL,
}

export const toAdminId = (admin?: string | null): number | null =>
  admin && admin !== UNASSIGNED_ADMIN_VALUE ? Number(admin) : null
