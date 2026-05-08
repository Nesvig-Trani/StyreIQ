import React from 'react'
import { FormLabel } from '@/shared/components/ui/form'
import { Button } from '@/shared/components/ui/button'
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
  const labelText = typeof label === 'string' ? label : 'this field'

  return (
    <FormLabel className="flex items-center gap-2">
      <span>
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
      </span>
      {description && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground cursor-help hover:text-primary"
                aria-label={`More information about ${labelText}`}
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </Button>
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
