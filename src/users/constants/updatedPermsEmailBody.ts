type updatedPermsProps = {
  name: string
  role?: string | null
  status?: string | null
  organizations?: { name: string }[]
  roleChanged: boolean
  statusChanged: boolean
  orgsChanged: boolean
}
export const updatedPermsEmailBody = ({
  name,
  role,
  status,
  organizations,
  roleChanged,
  statusChanged,
  orgsChanged,
}: updatedPermsProps) => {
  return `
        <h1>Hello ${name || 'User'},</h1>
        ${roleChanged ? `<p><strong>New Role:</strong> ${role}</p>` : ''}
        ${statusChanged ? `<p><strong>Status:</strong> ${status}</p>` : ''}
        ${
          orgsChanged
            ? `<li><strong>Organizations Changed To:</strong><br />
                
                <strong>Updated:</strong> [${organizations
                  ?.map((o: { name: string }) => `${o.name}`)
                  .join(', ')}]</li>`
            : ''
        }        <p>If this change was unexpected, please contact support.</p>
      `
}
