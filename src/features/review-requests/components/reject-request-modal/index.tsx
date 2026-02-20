'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogDescription,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { RejectApplicationButtonProps } from '@/features/review-requests/schemas'
import { setUserApprovalStatus } from '@/sdk/users'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function RejectApplicationButton({ id }: RejectApplicationButtonProps) {
  const [open, setOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()
  const handleReject = async () => {
    try {
      await setUserApprovalStatus({ data: { id, approved: false, reason: rejectionReason } })
      toast.success('User rejected successfully')
      setRejectionReason('')
      setOpen(false)
      router.refresh()
    } catch (_error) {
      toast.error('An error occurred please try again later')
    }
  }

  const handleCancel = () => {
    setRejectionReason('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" aria-label="Reject user request">
          <X className="w-4 h-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject User</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this user request. This will help the Unit Admin
            understand the decision.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please specify the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
