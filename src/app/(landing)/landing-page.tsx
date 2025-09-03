'use client'
import React from 'react'
import {
  Shield,
  Building2,
  GraduationCap,
  Users,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  FileSignature,
  Eye,
  UserPlus,
  Database,
} from 'lucide-react'
import { Footer } from '@/features/landing/components/footer'
import { FeatureSection } from '@/features/landing/components/feature-section'
import { Navbar } from '@/features/landing/components/navbar'

import { ProcessSection } from '@/features/landing/components/process-section'
import { HeroSection } from '@/features/landing/components/hero-section'
import { FAQSection } from '@/features/landing/components/faq-section'

type LandingPageProps = {
  showGetStarted: boolean
}

const LandingPage: React.FC<LandingPageProps> = ({ showGetStarted }) => {
  const benefits = [
    {
      icon: Shield,
      title: 'Stay Compliant',
      description:
        'Keep account records, user access, and policy acknowledgments in one place — so you can prove compliance when auditors, regulators, or leadership ask.',
    },
    {
      icon: AlertTriangle,
      title: 'Minimize Risk',
      description:
        'Catch problems early — like missing admins, outdated logins, or unmanaged accounts — before they turn into account takeovers, lawsuits, or viral missteps.',
    },
    {
      icon: Users,
      title: 'Strengthen Accountability',
      description:
        'Every account has a clear owner, a backup, and a list of who has access — reducing the chance of errors, misuse, or finger-pointing in a crisis.',
    },
    {
      icon: ClipboardCheck,
      title: 'Be Audit Ready',
      description:
        'Automatic logs show who owns what, when changes happened, and if policies were followed — preventing costly audit failures and last-minute scrambles.',
    },
    {
      icon: Building2,
      title: 'Built for Complex Organizations',
      description:
        'Designed for colleges, agencies, health systems, and others where social media is managed across units—but accountability must scale institution-wide.',
    },
    {
      icon: GraduationCap,
      title: 'Change Habits, Not Just Rules',
      description:
        'Built-in micro-learning, training, and reminders help staff follow policies, lowering the chance of human error and non-compliance fines.',
    },
  ]

  const processSteps = [
    {
      number: '01',
      title: 'Account Registry',
      description: 'One place to see every official account across units.',
      icon: Database,
    },
    {
      number: '02',
      title: 'Admin Assignments',
      description:
        'Require a primary and backup for each account so nothing slips through the cracks.',
      icon: UserPlus,
    },
    {
      number: '03',
      title: 'Access Tracking',
      description:
        'Keep tabs on who has logins, how they re managed, and when they were last updated.',
      icon: Eye,
    },
    {
      number: '04',
      title: 'Policy Acknowledgments',
      description: 'Send policies, track sign-offs, and show proof of compliance instantly.',
      icon: FileSignature,
    },
    {
      number: '05',
      title: 'Risk Dashboard',
      description:
        'Automatic flags for orphaned accounts, outdated credentials, or missing assignments.',
      icon: AlertTriangle,
    },
    {
      number: '06',
      title: 'Audit Logs',
      description: 'Built-in records of ownership, access changes, and compliance actions.',
      icon: FileText,
    },
    {
      number: '07',
      title: 'Training and Microlearning',
      description:
        'Comprehensive risk mitigation training for onboarding new admins. Microlearning is also built in with short, embedded reminders that nudge people toward safer, compliant behavior.',
      icon: GraduationCap,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar showGetStarted={showGetStarted} />

      <HeroSection />

      <FeatureSection
        id="benefits"
        title="Ensure Company-Wide Social Media Safety and Compliance"
        subtitle="Keeps your social media safe by preventing the missteps that lead to reputational damage, legal trouble, or operational headaches."
        features={benefits}
      />

      <ProcessSection
        id="how-it-works"
        title="Features That Keep You in Control"
        subtitle="The essential tools leaders need to govern accounts, enforce compliance, and spot risks — without micromanaging every post."
        steps={processSteps}
        backgroundClassName="bg-gray-50"
      />

      <FAQSection id="faq" />

      <Footer showGetStarted={showGetStarted} />
    </div>
  )
}

export default LandingPage
