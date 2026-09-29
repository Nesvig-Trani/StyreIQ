import { useFormHelper } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { requestDemoSchema } from '@/shared/schemas/requestDemoSchema'
import { Check } from 'lucide-react'
import React, { useState } from 'react'

export const RequestDemoModal: React.FC<{ trigger: React.ReactNode }> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { formComponent, form } = useFormHelper(
    {
      schema: requestDemoSchema,
      fields: [
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Your full name',
        },
        {
          label: 'Email',
          name: 'email',
          type: 'text',
          placeholder: 'your@email.com',
        },
        {
          label: 'Company',
          name: 'company',
          type: 'text',
          placeholder: 'Your organization',
        },
        {
          label: 'Role',
          name: 'role',
          type: 'text',
          placeholder: 'Your role (optional)',
        },
      ],
      onSubmit: async (submitData) => {
        const response = await fetch('/api/users/request-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })

        if (!response.ok) {
          throw new Error('Failed to send demo request')
        }

        setIsSubmitted(true)

        setTimeout(() => {
          setIsOpen(false)
          setIsSubmitted(false)
          form.reset()
        }, 2000)
      },
      onCancel: () => {
        setIsOpen(false)
        setIsSubmitted(false)
        form.reset()
      },
      showCancel: true,
      cancelContent: 'Cancel',
    },
    {
      defaultValues: {
        name: '',
        email: '',
        company: '',
        role: '',
      },
    },
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Request a Demo</DialogTitle>
              <DialogDescription className="!mt-0">
                Complete the form and our team will contact you.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">{formComponent}</div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-600">Check your inbox for a link to schedule your demo.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
