import { Button } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { XCircleIcon } from 'lucide-react'

interface DisableOrganizationProps {
  id?: number
  onConfirmDisable: () => Promise<void>
  open: boolean
  handleOpenChange: (open: boolean) => void
}

export function DisableOrganizationButton({
  id,
  onConfirmDisable,
  open,
  handleOpenChange,
}: DisableOrganizationProps) {
  return (
    <>
      {id ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-orange-500" />
                Disable Organization
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <p>Are you sure you want to disable this organization?</p>
              <p className="text-muted-foreground">
                The organization will not be visible from the dashboard and will become inaccessible
                to users.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onConfirmDisable}>Disable Anyway</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
