import { Button } from '@/shared'
import { RequestDemoModal } from './request-demo-modal'

export const HeroSection: React.FC = () => {
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
            StyreIQ is a software platform that gives large, multi-unit organizations a central
            system to track social media accounts, see who’s connected to each one, and prevent
            compliance failures that lead to reputational, legal, or operational consequences.
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <RequestDemoModal
              trigger={
                <Button variant="orange" size="lg">
                  Request Demo
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}
