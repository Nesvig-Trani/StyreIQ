'use client'
import { FlagComment } from '@/types/payload-types'
import { createComment, getComments } from '@/sdk/flags'
import { Button, Textarea, useLoading } from '@/shared'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { CalendarIcon, LucideLoader, MessageSquareIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function FlagCommentsModal({
  flagId,
  triggerAriaLabel = 'View flag comments',
  observationTextareaAriaLabel = 'Add observation',
}: {
  flagId: number
  triggerAriaLabel?: string
  observationTextareaAriaLabel?: string
}) {
  const [flagComments, setFlagComments] = useState<FlagComment[]>([])
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const {
    isLoading: isCommentsLoading,
    startLoading: startCommentsLoading,
    stopLoading: stopCommentsLoading,
  } = useLoading()
  const {
    isLoading: isCreateLoading,
    startLoading: startCreateLoading,
    stopLoading: stopCreateLoading,
  } = useLoading()

  const handleGetComments = async () => {
    try {
      startCommentsLoading()
      const response = await getComments(flagId)
      setFlagComments(response.docs)
    } catch {
      toast.error('An error occurred loading comments, please try again later')
    } finally {
      stopCommentsLoading()
    }
  }

  const handleCreateComment = async () => {
    try {
      startCreateLoading()
      await createComment({ flagId, comment })
      setComment('')
      toast.success('Observation added successfully')
      await handleGetComments()
    } catch {
      toast.error('An error occurred adding observation, please try again later')
    } finally {
      stopCreateLoading()
    }
  }

  const handleOpenChange = async (value: boolean) => {
    setOpen(value)
    if (value) await handleGetComments()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label={triggerAriaLabel}>
          <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          <div className="flex gap-2">
            <MessageSquareIcon className="h-4 w-4" aria-hidden="true" />
            Flag comments
          </div>
        </DialogTitle>

        <div className="space-y-3">
          {isCommentsLoading ? (
            <div className="flex justify-center items-center h-5 w-5">
              <LucideLoader className="animate-spin" aria-hidden="true" />
            </div>
          ) : flagComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            flagComments.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium text-sm">
                      {typeof entry.user === 'object' && entry.user?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" aria-hidden="true" />
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
                <p>{entry.comment}</p>
              </div>
            ))
          )}
        </div>

        <div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a new observation"
            aria-label={observationTextareaAriaLabel}
            className="mb-2"
          />
          <Button loading={isCreateLoading} onClick={handleCreateComment}>
            Add observation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
