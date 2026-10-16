import '../../__tests__/dom-polyfills'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { toast } from 'sonner'
import { useFormHelper } from '../hook'
import type { UseFormHelperProps } from '../hook'
import type { FieldData } from '../types'
import { buildNumberZodSchema } from '../zod-builders'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  budget: buildNumberZodSchema({ min: 0, errorMessages: { isNumber: 'Budget must be a number' } }),
})
type Values = z.input<typeof schema>

function Harness({
  fields,
  onSubmit,
  extra,
  defaults,
  formSchema = schema,
}: {
  fields: FieldData<Values>[]
  onSubmit: UseFormHelperProps<typeof schema>['onSubmit']
  extra?: Partial<UseFormHelperProps<typeof schema>>
  defaults?: Partial<Values>
  formSchema?: z.ZodTypeAny
}) {
  const { formComponent } = useFormHelper(
    { schema: formSchema as typeof schema, fields, onSubmit, ...extra },
    {
      defaultValues: { fullName: '', email: '', budget: '', ...defaults },
    },
  )
  return <>{formComponent}</>
}

const baseFields: FieldData<Values>[] = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'email', label: 'Email', autoComplete: 'email' },
  { name: 'budget', label: 'Budget', type: 'number' },
]

beforeEach(() => vi.clearAllMocks())

describe('useFormHelper / FormHelper', () => {
  it('should submit the typed values when the form is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Harness fields={baseFields} onSubmit={onSubmit} extra={{ submitContent: 'Save contact' }} />,
    )

    await user.type(screen.getByLabelText(/Full name/), 'Valentina Restrepo')
    await user.type(screen.getByLabelText('Email'), 'valentina.restrepo@universidad-andina.edu')
    await user.type(screen.getByLabelText('Budget'), '1500')
    await user.click(screen.getByRole('button', { name: 'Save contact' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      fullName: 'Valentina Restrepo',
      email: 'valentina.restrepo@universidad-andina.edu',
    })
  })

  it('should block submission and show inline validation errors when the form is invalid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness fields={baseFields} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should show a toast when the submit handler throws', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('El tenant está suspendido'))
    render(
      <Harness
        fields={baseFields}
        onSubmit={onSubmit}
        defaults={{
          fullName: 'Rafael Mejía',
          email: 'rafael.mejia@universidad-andina.edu',
          budget: '10',
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
  })

  it('should call onCancel and render custom cancel content', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <Harness
        fields={baseFields}
        onSubmit={vi.fn()}
        extra={{ onCancel, cancelContent: 'Discard changes' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should hide the cancel button when showCancel is false', () => {
    render(
      <Harness
        fields={baseFields}
        onSubmit={vi.fn()}
        extra={{ onCancel: vi.fn(), showCancel: false }}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('should disable the actions while loading', () => {
    render(
      <Harness
        fields={baseFields}
        onSubmit={vi.fn()}
        extra={{ isLoading: true, onCancel: vi.fn() }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('should omit the default actions when customSubmit is set', () => {
    render(<Harness fields={baseFields} onSubmit={vi.fn()} extra={{ customSubmit: true }} />)
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('should render server validation errors with their fields', () => {
    render(
      <Harness
        fields={baseFields}
        onSubmit={vi.fn()}
        extra={{
          error: {
            error: 'Validation failed',
            validationErrors: [{ message: 'Email already registered', fields: ['email'] }],
          },
        }}
      />,
    )
    expect(screen.getByText(/Email already registered/)).toBeInTheDocument()
  })

  it('should only render a dependent field when the controlling value matches', async () => {
    const user = userEvent.setup()
    const fields: FieldData<Values>[] = [
      { name: 'fullName', label: 'Full name' },
      {
        name: 'email',
        label: 'Work email',
        dependsOn: { field: 'fullName', value: 'Rafael Mejía' },
      },
    ]
    render(<Harness fields={fields} onSubmit={vi.fn()} />)

    expect(screen.queryByLabelText('Work email')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Full name'), 'Rafael Mejía')
    expect(await screen.findByLabelText('Work email')).toBeInTheDocument()
  })
})
