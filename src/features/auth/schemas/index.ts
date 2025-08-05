import { ChangeEvent, FormEvent } from 'react'

export type LoginFormProps = {
  className: string
  loginFields: {
    email: string
    password: string
  }
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
}
