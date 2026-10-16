import '../../__tests__/dom-polyfills'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog'
import { Avatar, AvatarFallback } from '../avatar'

describe('Card', () => {
  it('should compose header, content and footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Dirección de Comunicaciones</CardTitle>
          <CardDescription>Unidad principal</CardDescription>
          <CardAction>
            <button>Editar</button>
          </CardAction>
        </CardHeader>
        <CardContent>Responsable: Valentina Restrepo</CardContent>
        <CardFooter>Actualizado hoy</CardFooter>
      </Card>,
    )
    expect(screen.getByText('Dirección de Comunicaciones')).toBeInTheDocument()
    expect(screen.getByText('Unidad principal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByText('Responsable: Valentina Restrepo')).toBeInTheDocument()
    expect(screen.getByText('Actualizado hoy')).toBeInTheDocument()
  })
})

describe('Table', () => {
  it('should expose table semantics for headers, rows and footers', () => {
    render(
      <Table aria-label="Unidades">
        <TableCaption>Listado de unidades</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Biblioteca Central</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>1 unidad</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )
    expect(screen.getByRole('table', { name: 'Unidades' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Biblioteca Central' })).toBeInTheDocument()
    expect(screen.getByText('Listado de unidades')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '1 unidad' })).toBeInTheDocument()
  })
})

describe('Avatar', () => {
  it('should show the fallback when there is no image', () => {
    render(
      <Avatar>
        <AvatarFallback>VR</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText('VR')).toBeInTheDocument()
  })
})

function Menu({ onArchive }: { onArchive: () => void }) {
  const [showArchived, setShowArchived] = useState(false)
  const [sort, setSort] = useState('name')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Opciones</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel inset>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onArchive}>
            Archivar
            <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
          Mostrar archivadas
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="name">Por nombre</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Por fecha</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu', () => {
  it('should run the selected item action and close', async () => {
    const user = userEvent.setup()
    const onArchive = vi.fn()
    render(<Menu onArchive={onArchive} />)

    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    expect(await screen.findByText('Acciones')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: /Archivar/ }))

    expect(onArchive).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should reflect checkbox and radio selections', async () => {
    const user = userEvent.setup()
    render(<Menu onArchive={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    expect(screen.getByRole('menuitemradio', { name: 'Por nombre' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Mostrar archivadas' }))

    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Mostrar archivadas' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await user.click(screen.getByRole('menuitemradio', { name: 'Por fecha' }))

    await user.click(screen.getByRole('button', { name: 'Opciones' }))
    expect(screen.getByRole('menuitemradio', { name: 'Por fecha' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})

describe('Dialog', () => {
  it('should open from the trigger and close with the footer close button', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Deshabilitar unidad</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar</DialogTitle>
            <DialogDescription>Esta acción oculta la unidad.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancelar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Deshabilitar unidad' }))
    expect(await screen.findByRole('dialog', { name: 'Confirmar' })).toHaveAccessibleDescription(
      'Esta acción oculta la unidad.',
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
