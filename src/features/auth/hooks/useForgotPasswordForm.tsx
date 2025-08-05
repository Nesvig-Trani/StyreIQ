import { sendForgotPasswordRequest } from '@/sdk/users'
import { useLoading } from '@/shared'
import { forgotPasswordSchema } from '@/features/users'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

export function useForgotPasswordForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    defaultValues: {
      email: '',
    },
  })
  const { isLoading, startLoading, stopLoading } = useLoading()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const email = watch('email')

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    startLoading()
    try {
      await sendForgotPasswordRequest(data)
      setIsSubmitted(true)
    } catch (error) {
      console.error(error)
    } finally {
      stopLoading()
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return {
    register,
    handleSubmit,
    handleBackToLogin,
    onSubmit,
    email,
    isLoading,
    isSubmitted,
    errors,
  }
}
