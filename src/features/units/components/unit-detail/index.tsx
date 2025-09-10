import { unitTypeLabels } from '@/features/units/constants/unitTypeLabels'
import { UnitWithDepth } from '@/features/units/schemas'
import { Organization, User } from '@/types/payload-types'
import { Badge, Card, CardHeader, CardTitle, CardContent, Separator } from '@/shared'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Building, Mail, Phone } from 'lucide-react'

export function UnitDetail({ organization }: { organization: UnitWithDepth }) {
  const admin = organization.admin as User
  const backupAdmins = organization.backupAdmins as User[]
  const parentOrg = organization.parentOrg as Organization
  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    pending_review: 'bg-yellow-500',
  }

  const getInitials = (name: string | undefined | null): string => {
    if (!name || typeof name !== 'string') return '?'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {unitTypeLabels[organization.type as keyof typeof unitTypeLabels]}
            </Badge>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${statusColors[organization.status as keyof typeof statusColors]}`}
              ></div>
              <span className="text-sm capitalize">{organization.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {organization.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{organization.description}</p>
              </div>
            )}

            <div>
              {organization.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.email}</span>
                </div>
              )}

              {organization.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.phone}</span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Hierarchy</h3>
              {organization.parentOrg && (
                <div className="mb-3">
                  <h4 className="text-xs text-muted-foreground mb-1">Parent Unit</h4>

                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{parentOrg?.name || 'Unknown'}</span>
                  </div>
                </div>
              )}

              {organization.children?.docs && organization.children.docs.length > 0 && (
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">
                    Child Unit ({organization.children.docs.length})
                  </h4>
                  <div className="space-y-2">
                    {organization.children.docs.map((child) => (
                      <div className="flex items-center" key={child.id}>
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div>{child.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {unitTypeLabels[child.type as keyof typeof unitTypeLabels]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {admin && (
            <Card>
              <CardHeader>
                <CardTitle>Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Admin</h3>
                  <div className="flex items-center gap-3 p-2 border rounded-md">
                    <Avatar>
                      <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{admin.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {admin.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </div>

                {organization.backupAdmins && organization.backupAdmins.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Backup Admins
                    </h3>
                    <div className="space-y-2">
                      {backupAdmins?.map((backupAdmin) => (
                        <div
                          key={backupAdmin.id}
                          className="flex items-center gap-3 p-2 border rounded-md"
                        >
                          <Avatar>
                            <AvatarFallback>{getInitials(backupAdmin.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{backupAdmin.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {backupAdmin.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Delegate Permissions button hidden - it has no functionality */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Delegated Permissions</div>
                  <div className="text-sm text-muted-foreground">
                    {organization.delegatedPermissions ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${organization.delegatedPermissions ? 'bg-green-500' : 'bg-gray-300'}`}
                ></div>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(organization.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(organization.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
