import { Card, CardContent, CardDescription, CardTitle } from '@/shared'

type FeatureSectionProps = {
  id?: string
  title: string
  subtitle?: string
  features: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
  }[]
  footerText?: string
  columns?: 2 | 3 | 4
  backgroundClassName?: string
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({
  id,
  title,
  subtitle,
  features,
  footerText,
  columns = 3,
  backgroundClassName = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section id={id} className={`py-16 lg:py-24 ${backgroundClassName}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>

        <div className={`grid ${gridCols[columns]} gap-8`}>
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="mb-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {footerText && (
          <div className="text-center mt-12">
            <p className="text-gray-600">{footerText}</p>
          </div>
        )}
      </div>
    </section>
  )
}
