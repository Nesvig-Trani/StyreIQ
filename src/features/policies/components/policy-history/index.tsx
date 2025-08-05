'use client'

import { FileText, Calendar, User, ChevronDown } from 'lucide-react'

import { Separator, Badge, Button } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Policy } from '@/lib/payload/payload-types'
import { LexicalContentModal } from '@/shared/components/rich-text-editor/preview-modal'

export default function PolicyHistory({ policies }: { policies: Policy[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-background">
              <FileText className="mr-2 h-4 w-4" />
              View Policy History
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Policy Version History
              </DialogTitle>
              <DialogDescription>
                Complete history of all policy versions and changes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {policies.map((policy, index) => (
                <div key={policy.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          Version {policy.version}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(policy.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          {policy.author && typeof policy.author === 'object' && (
                            <>
                              <User className="h-3 w-3" />
                              {policy.author.name}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <LexicalContentModal
                        triggerButton
                        triggerText="View"
                        title=""
                        lexicalData={policy.text}
                      />
                    </div>
                  </div>
                  {index < policies.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
