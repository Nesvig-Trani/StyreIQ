import React from 'react'
import { FormLabel } from '@/shared/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface FieldLabelProps {
  label: React.ReactNode
  description?: string
  required?: boolean
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ label, description, required }) => {
  return (
    <FormLabel className="flex items-center gap-2">
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {description && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="start"
              className="max-w-xs bg-white shadow-lg border p-3"
              sideOffset={8}
              hideArrow={true}
            >
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </FormLabel>
  )
}
