type ProcessSectionProps = {
  id?: string
  title: string
  subtitle?: string
  steps: {
    number: string
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }[]
  backgroundClassName?: string
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({
  id,
  title,
  subtitle,
  steps,
  backgroundClassName = '',
}) => {
  return (
    <section id={id} className={`py-16 lg:py-24 ${backgroundClassName}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-lg">{step.number}</span>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <step.icon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
