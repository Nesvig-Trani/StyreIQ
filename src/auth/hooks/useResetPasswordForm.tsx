import { resetPasswordRequest } from '@/sdk/users'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

const baseSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
})

const resetPasswordSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function useResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      router.push('/login')
    } else if (!token) {
      setToken(tokenParam)
    }
  }, [searchParams, token, router])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true)
    setApiError(null)
    try {
      await resetPasswordRequest({
        token: token || '',
        password: data.password,
      })
      toast.success('Your password has been reset successfully.')
      router.push('/dashboard')
    } catch {
      setApiError('Your reset link is invalid or has expired')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }
  return {
    isLoading,
    register,
    handleSubmit,
    handleBackToLogin,
    onSubmit,
    passwordValue,
    errors,
    apiError,
    token,
  }
}
