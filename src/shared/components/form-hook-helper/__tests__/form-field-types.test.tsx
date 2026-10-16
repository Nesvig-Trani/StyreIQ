import '../../__tests__/dom-polyfills'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { useFormHelper } from '../hook'
import type { FieldData } from '../types'
import type { Tree } from '@/features/units'

const schema = z.object({
  campaign: z.string(),
  notes: z.string(),
  secret: z.string(),
  seats: z.string(),
  channel: z.string(),
  channels: z.array(z.string()),
  topics: z.array(z.string()),
  acceptsTerms: z.boolean(),
  launch: z.date().nullable(),
  phone: z.string(),
  unit: z.string(),
  units: z.array(z.string()),
  contacts: z.array(z.object({ contactName: z.string() })),
})
type Values = z.input<typeof schema>

const defaultValues: Values = {
  campaign: '',
  notes: '',
  secret: '',
  seats: '',
  channel: '',
  channels: [],
  topics: [],
  acceptsTerms: false,
  launch: null,
  phone: '',
  unit: '',
  units: [],
  contacts: [],
}

const tree: Tree[] = [
  {
    id: 1,
    parent: 0,
    name: 'Universidad Andina',
    depth: 0,
    status: 'active',
    type: 'university',
    children: [
      {
        id: 2,
        parent: 1,
        name: 'Dirección de Comunicaciones',
        depth: 1,
        status: 'active',
        type: 'office',
        children: [],
      },
    ],
  },
]

function Harness({
  fields,
  onSubmit = vi.fn(),
  values = {},
}: {
  fields: FieldData<Values>[]
  onSubmit?: (values: Values) => unknown
  values?: Partial<Values>
}) {
  const { formComponent } = useFormHelper(
    { schema, fields, onSubmit },
    { defaultValues: { ...defaultValues, ...values } },
  )
  return <>{formComponent}</>
}

describe('form field types', () => {
  it('should render separator and custom content next to inputs', () => {
    render(
      <Harness
        fields={[
          { name: 'campaign', label: 'Campaign' },
          { name: 'notes', label: '', type: 'separator' },
          { name: 'notes', label: '', type: 'custom', content: <p>Información de contacto</p> },
        ]}
      />,
    )
    expect(screen.getByText('Información de contacto')).toBeInTheDocument()
  })

  it('should show a required marker and a help tooltip trigger for described fields', () => {
    render(
      <Harness
        fields={[
          {
            name: 'campaign',
            label: 'Campaign',
            required: true,
            description: 'Nombre público de la campaña',
          },
        ]}
      />,
    )
    expect(screen.getByText('required')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'More information about Campaign' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Campaign/ })).toBeInTheDocument()
  })

  it('should update textarea and password fields as the user types', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Escribe una nota' },
          { name: 'secret', label: 'Secret', type: 'password' },
        ]}
      />,
    )
    await user.type(screen.getByPlaceholderText('Escribe una nota'), 'Revisar con rectoría')
    expect(screen.getByPlaceholderText('Escribe una nota')).toHaveValue('Revisar con rectoría')

    const secret = screen.getByLabelText('Secret')
    await user.type(secret, 'Andina#2026')
    expect(secret).toHaveValue('Andina#2026')
  })

  it('should accept digits and reject letters or repeated symbols in number fields', async () => {
    const user = userEvent.setup()
    render(<Harness fields={[{ name: 'seats', label: 'Seats', type: 'number' }]} />)
    const input = screen.getByLabelText('Seats')

    await user.type(input, '125')
    expect(input).toHaveValue('125')
    expect(input).toHaveAttribute('inputmode', 'numeric')

    const typeChar = (char: string): boolean =>
      fireEvent.keyPress(input, {
        key: char,
        charCode: char.charCodeAt(0),
        which: char.charCodeAt(0),
      })
    expect(typeChar('a')).toBe(false)
    expect(typeChar('-')).toBe(false)
    expect(typeChar('.')).toBe(true)
  })

  it('should choose a value in a select field and allow clearing it when optional', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'channel',
            label: 'Channel',
            type: 'select',
            options: [
              { value: 'instagram', label: 'Instagram' },
              { value: 'linkedin', label: 'LinkedIn' },
            ],
          },
        ]}
      />,
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'LinkedIn' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('LinkedIn')
  })

  it('should offer to clear an optional select that already has a value', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        values={{ channel: 'instagram' }}
        fields={[
          {
            name: 'channel',
            label: 'Channel',
            type: 'select',
            options: [{ value: 'instagram', label: 'Instagram' }],
          },
        ]}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Instagram')
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('Select an option')
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument()
  })

  it('should show an empty message when a select has no options', async () => {
    const user = userEvent.setup()
    render(
      <Harness fields={[{ name: 'channel', label: 'Channel', type: 'select', options: [] }]} />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByText('No options available')).toBeInTheDocument()
  })

  it('should show a custom message when a select has no options', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'channel',
            label: 'Channel',
            type: 'select',
            options: [],
            emptyOptionsMessage: 'No units available for your account.',
          },
        ]}
      />,
    )
    await user.click(screen.getByRole('combobox', { name: /Channel/ }))

    expect(await screen.findByText('No units available for your account.')).toBeInTheDocument()
    expect(screen.queryByText('No options available')).not.toBeInTheDocument()
  })

  it('should render nothing for a hidden select', () => {
    render(
      <Harness fields={[{ name: 'channel', label: 'Channel', type: 'select', hidden: true }]} />,
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('should toggle a single boolean checkbox', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'acceptsTerms',
            label: 'Accept terms',
            type: 'checkbox',
            checkboxMode: 'boolean',
          },
        ]}
      />,
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('should select and clear values in a multiselect', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'topics',
            label: 'Topics',
            type: 'multiselect',
            options: [
              { value: 'admissions', label: 'Admisiones' },
              { value: 'events', label: 'Eventos' },
            ],
          },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Topics/ }))
    await user.click(await screen.findByText('Admisiones'))
    const selected = await screen.findByRole('group', { name: 'Selected values' })
    expect(within(selected).getByRole('button', { name: /Admisiones/ })).toBeInTheDocument()

    await user.click(screen.getByText('Clear'))
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Selected values' })).not.toBeInTheDocument(),
    )
  })

  it('should pick a day in a date field', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[{ name: 'launch', label: 'Launch date', type: 'date' }]}
        values={{ launch: new Date(2026, 8, 10) }}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Launch date/ }))
    await user.click(await screen.findByRole('gridcell', { name: '15' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Launch date/ })).toHaveTextContent(
        'September 15th, 2026',
      ),
    )
  })

  it('should render a disabled date field without a calendar', async () => {
    const user = userEvent.setup()
    render(
      <Harness fields={[{ name: 'launch', label: 'Launch date', type: 'date', disabled: true }]} />,
    )
    const trigger = screen.getByRole('button', { name: /Launch date/ })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it('should format a phone number as the user types', async () => {
    const user = userEvent.setup()
    render(<Harness fields={[{ name: 'phone', label: 'Phone', type: 'phone' }]} />)
    const input = screen.getByPlaceholderText('Enter phone number')
    await user.type(input, '2015550123')
    expect(input).toHaveValue('+1 201 555 0123')
  })

  it('should select a unit in a single tree-select', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'unit',
            label: 'Unit',
            type: 'tree-select',
            tree,
            options: [
              { value: '1', label: 'Universidad Andina' },
              { value: '2', label: 'Dirección de Comunicaciones' },
            ],
          },
        ]}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByText('Dirección de Comunicaciones'))
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveTextContent('Dirección de Comunicaciones'),
    )
  })

  it('should summarise several selections in a multiple tree-select', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'units',
            label: 'Units',
            type: 'tree-select',
            multiple: true,
            tree,
            options: [
              { value: '1', label: 'Universidad Andina' },
              { value: '2', label: 'Dirección de Comunicaciones' },
            ],
          },
        ]}
      />,
    )
    await user.click(screen.getByRole('combobox', { name: /Units/ }))
    await user.click(await screen.findByRole('checkbox', { name: 'Universidad Andina' }))
    await user.click(screen.getByRole('checkbox', { name: 'Dirección de Comunicaciones' }))
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Units/ })).toHaveTextContent(
        'Universidad Andina, Dirección de Comunicaciones',
      ),
    )
  })

  it('should add and remove items in an array field', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        fields={[
          {
            name: 'contacts',
            label: 'Contacts',
            type: 'array',
            arrayItemLabel: 'contact',
            children: [{ name: 'contactName', label: 'Contact name', type: 'text' }],
          },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add Contacts' }))
    await user.click(screen.getByRole('button', { name: 'Add Contacts' }))
    expect(screen.getAllByTestId('fields-group-item')).toHaveLength(2)

    await user.type(screen.getAllByLabelText(/Contact name/)[0], 'Rafael Mejía')
    expect(screen.getAllByLabelText(/Contact name/)[0]).toHaveValue('Rafael Mejía')

    await user.click(screen.getByRole('button', { name: 'Remove contact item 1' }))
    expect(screen.getAllByTestId('fields-group-item')).toHaveLength(1)
  })

  it('should throw for unsupported field types', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<Harness fields={[{ name: 'campaign', label: 'Upload', type: 'file' }]} />),
    ).toThrow('Unsupported field type: file')
    spy.mockRestore()
  })
})
