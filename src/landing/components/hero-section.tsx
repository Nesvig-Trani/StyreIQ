import Link from 'next/link'
import { Button, Card, CardContent } from '@/shared'
import { Users, BarChart3, Shield } from 'lucide-react'

type HeroSectionProps = {
  showGetStarted: boolean
}

export const HeroSection: React.FC<HeroSectionProps> = ({ showGetStarted }) => {
  const stats = [
    {
      icon: Users,
      description: 'Track every connected account and who owns it',
    },
    {
      icon: BarChart3,
      description: 'Complete quarterly compliance and safeguard tasks',
    },
    {
      icon: Shield,
      description: 'View real-time risk dashboards and automated nudges',
    },
  ]

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Social Media
            <br />
            Governance HQ
          </h1>

          <div className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto">
            Gain full visibility, ownership tracking, and risk oversight for every social media
            account in your organization. Replace chaos and guesswork with structured governance,
            compliance visibility, and peace of mind
          </div>

          {showGetStarted && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild>
                <Link href={'/login/create-first-user'}>Get Started</Link>
              </Button>
            </div>
          )}

          <Card className="mb-16 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-4">WHAT YOU CAN DO</p>
              <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                &quot;See every connected account, track user access, complete compliance tasks,
                acknowledge policies, view risk dashboards, take microtrainings, and receive
                automated nudges&quot;
              </blockquote>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <stat.icon className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-600">{stat.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
