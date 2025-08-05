'use client'
import React from 'react'
import { FileCheck, Target, BarChart3, Shield, Building2, GraduationCap, Heart } from 'lucide-react'
import { Footer } from '@/features/landing/components/footer'
import { FeatureSection } from '@/features/landing/components/feature-section'
import { Navbar } from '@/features/landing/components/navbar'

import { ProcessSection } from '@/features/landing/components/process-section'
import { HeroSection } from '@/features/landing/components/hero-section'

type LandingPageProps = {
  showGetStarted: boolean
}

const LandingPage: React.FC<LandingPageProps> = ({ showGetStarted }) => {
  const benefits = [
    {
      icon: FileCheck,
      title: 'Governance & Ownership',
      description:
        'Track every account and connected user with ownership logs. Enable department-level oversight with central visibility and complete account registry.',
    },
    {
      icon: Target,
      title: 'Compliance & Policy',
      description:
        'Upload or build institution-specific policies with acknowledgment tracking. Keep teams aligned and audit-ready with compliance checklists.',
    },
    {
      icon: BarChart3,
      title: 'Risk & Response',
      description:
        'Route incidents to the right person with escalation engine. Use built-in crisis templates and automatically track every action for compliance.',
    },
  ]

  const processSteps = [
    {
      number: '01',
      title: 'Connect & Register',
      description:
        'Connect all social media accounts and register ownership with complete visibility.',
      icon: Target,
    },
    {
      number: '02',
      title: 'Implement Governance',
      description: 'Upload policies, assign roles, and set up compliance tracking.',
      icon: Shield,
    },
    {
      number: '03',
      title: 'Monitor & Respond',
      description: 'Track risks, receive alerts, and respond with built-in crisis templates.',
      icon: BarChart3,
    },
  ]

  const audiences = [
    {
      icon: GraduationCap,
      title: 'Higher Education',
      description:
        'Manage departmental accounts with complete oversight. Track policy compliance, user access, and maintain brand consistency across all schools.',
    },
    {
      icon: Building2,
      title: 'Government Agencies',
      description:
        'Ensure transparency and compliance across departments. Track policy acknowledgments, user roles, and maintain audit-ready documentation.',
    },
    {
      icon: Heart,
      title: 'Healthcare Systems',
      description:
        'Maintain HIPAA compliance while coordinating messaging. Track sensitive content, user access, and ensure policy adherence across facilities.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar showGetStarted={showGetStarted} />

      <HeroSection showGetStarted={showGetStarted} />

      <FeatureSection
        id="benefits"
        title="Key Benefits"
        subtitle="Structured governance, compliance visibility, and peace of mind."
        features={benefits}
        footerText="StyreIQ replaces chaos and guesswork with structured governance, compliance visibility, and peace of mind."
        backgroundClassName="bg-gray-50"
      />

      <ProcessSection
        id="how-it-works"
        title="How It Works"
        subtitle="Three simple steps to establish complete social media governance."
        steps={processSteps}
      />

      <FeatureSection
        id="who-its-for"
        title="Who It's For"
        subtitle="Organizations that need complete social media governance and compliance oversight."
        features={audiences}
        backgroundClassName="bg-gray-50"
      />

      <Footer showGetStarted={showGetStarted} />
    </div>
  )
}

export default LandingPage
