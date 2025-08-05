'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/shared'
import { ArrowLeftIcon, MailIcon } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm'

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    handleBackToLogin,
    onSubmit,
    email,
    isLoading,
    isSubmitted,
    errors,
  } = useForgotPasswordForm()

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="p-0 h-auto text-muted-foreground hover:text-foreground"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to login
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            {isSubmitted
              ? 'Check your email for a password reset link'
              : "Enter your email address and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative mb-4">
                  <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    disabled={isLoading}
                    className="pl-10"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MailIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                We&#39;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Didn&#39;t receive the email? Check your spam folder or try again.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
