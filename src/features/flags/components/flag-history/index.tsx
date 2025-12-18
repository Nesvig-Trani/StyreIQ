'use client'
import { flagStatusLabels } from '../../constants/flagStatusLabels'
import { historyActionLabels } from '../../constants/historyActionLabels'
import { FlagHistoryActionsEnum, FlagStatusEnum } from '../../schemas'
import { getStatusColor } from '../../utils'
import { FlagHistory } from '@/types/payload-types'
import { getFlagHistory } from '@/sdk/flags'
import { Badge, Button, useLoading } from '@/shared'
import { Dialog, DialogContent, DialogTrigger } from '@/shared/components/ui/dialog'
import { CalendarIcon, HistoryIcon, LucideLoader, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function FlagHistoryModal({ flagId }: { flagId: number }) {
  const [flagHistory, setFlagHistory] = useState<FlagHistory[]>()
  const [open, setOpen] = useState<boolean>(false)
  const { isLoading, stopLoading, startLoading } = useLoading()

  const handleGetHistory = async () => {
    try {
      startLoading()
      const response = await getFlagHistory(flagId)
      setFlagHistory(response.docs)
    } catch {
      toast.error('An error occurred loading history, please try again later')
    } finally {
      stopLoading()
    }
  }

  const handleOpenChange = async (value: boolean) => {
    setOpen(value)
    if (value) await handleGetHistory()
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <HistoryIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent title="Risk flag history">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Flag History
          </h4>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-5 w-5">
                <LucideLoader className="animate-spin" />
              </div>
            ) : (
              flagHistory?.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {typeof entry.user === 'object' && entry.user?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    {entry.action === FlagHistoryActionsEnum.STATUS_CHANGED ? (
                      <p className="!ml-2 font-semibold text-xs">
                        Changed status from{' '}
                        {
                          <Badge variant={getStatusColor(entry.prevStatus as FlagStatusEnum)}>
                            {flagStatusLabels[entry.prevStatus as FlagStatusEnum]}
                          </Badge>
                        }{' '}
                        to{' '}
                        {
                          <Badge variant={getStatusColor(entry.newStatus as FlagStatusEnum)}>
                            {flagStatusLabels[entry.newStatus as FlagStatusEnum]}
                          </Badge>
                        }
                      </p>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {historyActionLabels[entry.action as FlagHistoryActionsEnum]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
