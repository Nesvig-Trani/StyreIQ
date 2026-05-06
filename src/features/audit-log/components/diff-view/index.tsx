import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Badge, Button } from '@/shared'
import { EyeIcon } from 'lucide-react'
import { AuditLog } from '@/types/payload-types'
import { actionLabels } from '../../constants/actionLabels'
import { ChangeHighlighter } from '../change-highlighter'
import { MetadataInfo } from '../metadata-info'

const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

export const DiffView = ({
  log,
  detailsTriggerAriaLabel = 'View audit log details',
}: {
  log: AuditLog
  detailsTriggerAriaLabel?: string
}) => {
  const user = typeof log.user === 'object' ? log.user : null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={detailsTriggerAriaLabel}>
          <EyeIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            {actionLabels[log.action]} action on {log.entity} by {user?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">User Information</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Name:</strong> {user?.name}
                </div>
                <div>
                  <strong>Email:</strong> {user?.email}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Action Details</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Action:</strong> {actionLabels[log.action]}
                </div>
                <div>
                  <strong>Entity:</strong> {log.entity}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(log.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Units</h4>
            <div className="flex flex-wrap gap-2">
              {log.organizations?.map((org, index) => (
                <Badge key={index} variant="outline">
                  {typeof org === 'object' && org.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {(log.prev || log.current) && (
              <ChangeHighlighter
                // Payload's JSON fields are typed as wide unions; JSON round-trip narrows to plain objects
                prev={JSON.parse(JSON.stringify(log.prev))}
                current={JSON.parse(JSON.stringify(log.current))}
                title="Changes"
              />
            )}
            {log.metadata && <MetadataInfo metadata={JSON.parse(JSON.stringify(log.metadata))} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
