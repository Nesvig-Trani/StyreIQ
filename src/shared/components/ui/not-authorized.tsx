import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ShieldX, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface NotAuthorizedProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  buttonText?: string
  buttonIcon?: 'home' | 'arrow-left'
}

export function NotAuthorized({
  title = 'Access Denied',
  message = 'You do not have permission to access this page.',
  showHomeButton = true,
  buttonText = 'Go to Dashboard',
  buttonIcon = 'home',
}: NotAuthorizedProps) {
  const IconComponent = buttonIcon === 'home' ? Home : ArrowLeft

  return (
    <Card className="max-w-md mx-auto mt-8 border-0 shadow-lg">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{message}</p>
          </div>
          {showHomeButton && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="mt-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Link href="/dashboard">
                <IconComponent className="w-5 h-5 mr-2" />
                {buttonText}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
