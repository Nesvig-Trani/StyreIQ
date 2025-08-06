'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  PasswordInput,
} from '@/shared'
import { ArrowLeftIcon, LockIcon } from 'lucide-react'
import Link from 'next/link'
import { useResetPasswordForm } from '../hooks/useResetPasswordForm'

export function ResetPasswordForm() {
  const {
    isLoading,
    register,
    handleSubmit,
    handleBackToLogin,
    onSubmit,
    passwordValue,
    errors,
    apiError,
    token,
  } = useResetPasswordForm()

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLogin}
              className="p-0 h-auto text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to login
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it&#39;s strong and secure.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <PasswordInput
                  id="password"
                  placeholder="Enter your new password"
                  {...register('password')}
                  className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="!my-2">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
                <li className={passwordValue.length >= 8 ? 'text-green-600' : ''}>
                  At least 8 characters long
                </li>
              </ul>
            </div>
          </CardContent>

          <CardContent className="pt-0">
            {apiError && (
              <div className="text-sm text-red-500 text-center space-y-2">
                <p className="!my-2">{apiError}</p>
                <Link href="/forgot-password">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="py-2 px-4 h-auto text-muted-foreground hover:text-foreground"
                  >
                    Request new token
                  </Button>
                </Link>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
