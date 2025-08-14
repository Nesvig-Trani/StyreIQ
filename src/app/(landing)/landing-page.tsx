'use client'
import React from 'react'
import {
  FileCheck,
  Target,
  BarChart3,
  Shield,
  Building2,
  GraduationCap,
  Heart,
  Users,
} from 'lucide-react'
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
        'Flag potential risks like unassigned accounts, inactive admins, and missing policy acknowledgments before they become problems. The dashboard helps teams take proactive steps and assign accountability — even without direct platform integrations.',
    },
  ]

  const processSteps = [
    {
      number: '01',
      title: 'Connect & Register',
      description:
        'Identify all social media accounts across your unit and assign ownership roles — with visibility into who has access and what platform each account is tied to.',
      icon: Target,
    },
    {
      number: '02',
      title: 'Implement Governance',
      description:
        'Upload policies, assign responsibilities, and begin tracking compliance tasks like training completions and policy acknowledgment.',
      icon: Shield,
    },
    {
      number: '03',
      title: 'Monitor & Flag Risks',
      description:
        'See potential issues on your risk dashboard — like unassigned accounts, inactive admins, or incomplete training — and take action before they escalate.',
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
      title: 'Government & Public Sector',
      description:
        'Ensure transparency and compliance across departments. Track policy acknowledgments, user roles, and maintain audit-ready documentation.',
    },
    {
      icon: Heart,
      title: 'Healthcare & Regulated Industries',
      description:
        'Maintain HIPAA compliance while coordinating messaging. Track sensitive content, user access, and ensure policy adherence across facilities.',
    },
    {
      icon: Users,
      title: 'Networked Units & Nonprofits',
      description:
        'Coordinate messaging across distributed teams and chapters. Maintain brand consistency while enabling local autonomy with centralized oversight and compliance tracking.',
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
        footerText="Bring structure to even the most complex social media setups — with visibility, compliance, and shared accountability."
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
        title="Built for Complex Teams and Decentralized Units"
        subtitle="Units that need complete social media governance and compliance oversight."
        features={audiences}
        backgroundClassName="bg-gray-50"
      />

      <Footer showGetStarted={showGetStarted} />
    </div>
  )
}

export default LandingPage
