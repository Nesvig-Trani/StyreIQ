import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared'
import { RequestDemoModal } from './request-demo-modal'

export const FAQSection = ({ id = 'faq' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Is StyreIQ right for our organization?',
      answer:
        'StyreIQ is helpful for many organizations, but it’s purpose-built for large, multi-unit systems — like state and local governments, universities, healthcare networks, and media companies. These institutions are often left out of the social media tool arena when it comes to org-wide governance and compliance. StyreIQ closes that gap by giving leadership the visibility, accountability, and proof points auditors demand, while still letting departments maintain ownership of their own accounts.',
    },
    {
      question: 'Is onboarding going to be a pain?',
      answer:
        'Rolling out StyreIQ is designed to be distributed by default. The system has the ability to mirror how your organizational hierarchy works. Central leadership sets the top-level structure, but each department or unit only manages its own accounts and users. That way, the workload is spread across the organization — no single team is stuck setting everything up. Adding a new user or account happens where it naturally belongs, and the system automatically rolls it into the bigger picture.',
    },
    {
      question: 'What are the benefits of using StyreIQ?',
      answer: (
        <div className="space-y-3">
          <p>
            For a system that covers your entire organization, StyreIQ is remarkably cost-effective.
            Compared to current tools (which weren’t built for compliance), consultant hours, staff
            time, or the cost of recovering a lost account, StyreIQ delivers far more value.
          </p>
          <p className="font-semibold">Think of it as:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>The equivalent of a full-time governance officer</li>
            <li>The benefits of an annual risk mitigation conference</li>
            <li>The protection of an insurance policy for your digital assets</li>
          </ul>
          <p>…all at a fraction of the cost.</p>
        </div>
      ),
    },
    {
      question: 'How often will I need to log in?',
      answer:
        "You won't be babysitting the system. StyreIQ does the work automatically and only alerts you when something needs attention — like an unmonitored account, outdated access, or an unacknowledged policy. It's not another chore on your to-do list; it's the tool that removes the endless back-and-forth emails about avoidable problems.",
    },
    {
      question: 'How does StyreIQ save time & money?',
      answer:
        'Because everything is in one place, central teams spend less time chasing down account ownership, wrangling access lists, or prepping for audits. Distributed onboarding means units handle their own updates, and automated alerts surface problems before they become emergencies. The result: less firefighting, fewer late-night emails, and more time for actual strategy.',
    },
    {
      question: 'How does StyreIQ help with audits?',
      answer:
        'Auditors love visibility, and StyreIQ was built to make it easy. Every account, user, policy acknowledgment, and training completion is logged in one place. Instead of pulling data from spreadsheets and email chains, you can demonstrate governance and compliance in minutes — not weeks.',
    },
    {
      question: 'What risks does StyreIQ actually prevent?',
      answer: (
        <div className="space-y-3">
          <p>
            The biggest threats aren’t usually bad actors — they’re blind spots. StyreIQ reduces
            those risks by:
          </p>
          <br />
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>
              <span className="font-semibold">Preventing risks through training — </span>
              Risk mitigation training is built in to onboarding. Admins learn not just the
              compliance rules and best practices, but the “why” behind them — so risky decisions
              get avoided before they happen.
            </li>
            <li>
              <span className="font-semibold">Ensuring password + security hygiene — </span>
              Queued reminders for admins to update credentials and enable two-factor
              authentication, reducing the chance of hacked accounts or unauthorized access when
              former staff still have lingering connections to accounts.
            </li>
            <li>
              <span className="font-semibold">Catching inactive or abandoned accounts — </span>
              Accounts without recent activity or missing admins are flagged so they don’t become
              liabilities.
            </li>
            <li>
              <span className="font-semibold">Reducing Legal and Financial Exposure — </span>
              lowering the chance of costly failures under HIPAA, FERPA, FOIA, or advertising rules.
            </li>
            <li>
              <span className="font-semibold">Protecting reputation — </span>
              Prevents account misuse and compliance failures that erode public trust.
            </li>
            <li>
              <span className="font-semibold">Streamlining oversight — </span>
              Automates account tracking and reduces wasted staff hours.
            </li>
            <li>
              <span className="font-semibold">Saving central teams from fire drills — </span>
              No more last-minute scrambles to figure out “Who owns this account?” or “Why can’t we
              log in?” Visibility and accountability are built in.
            </li>
          </ul>
          <p>
            Instead of patching holes reactively, StyreIQ{' '}
            <span className="font-semibold">builds prevention into the system</span> — turning
            compliance from an afterthought into everyday practice.
          </p>
        </div>
      ),
    },
    {
      question: 'Why StyreIQ? (pronounced "STEER-IQ")',
      answer: (
        <div className="space-y-3">
          <p>
            “Styre” means “to steer or govern” in Norwegian— a nod to our founder’s heritage and to
            her great-great-grandfather, a Norwegian merchant marine captain who understood the
            value of navigation, accountability, and preparedness.
          </p>
          <p>
            StyreIQ reflects that same principle: <br />
            <span className="font-semibold">
              Smart, steady oversight—for institutions navigating complex digital environments.
            </span>
          </p>
        </div>
      ),
    },
  ]

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id={id} className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about StyreIQ and how it can help your organization.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <Button
                onClick={() => toggleAccordion(index)}
                variant="ghost"
                className="w-full h-auto px-6 py-5 flex justify-between items-center transition-colors duration-200 hover:bg-gray-50 focus:bg-gray-50"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-orange-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </Button>

              {openIndex === index && (
                <div className="px-6 pb-5">
                  <div className="pt-2 text-gray-600 leading-relaxed">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center rounded-lg p-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Reduce Risk?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            StyreIQ is currently onboarding early partners. If your organization needs visibility,
            accountability, and structure across social media accounts, let&apos;s talk.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <RequestDemoModal
              trigger={
                <Button variant="orange" size="lg">
                  Request Demo
                </Button>
              }
            />
          </div>

          <div className="mt-6 text-sm text-gray-500 space-x-4">
            <a 
              href="https://www.iubenda.com/privacy-policy/68492162" 
              class="iubenda-white iubenda-noiframe iubenda-embed iubenda-noiframe " 
              title="Privacy Policy ">Privacy Policy</a><script 
              type="text/javascript">(function (w,d) {var loader = function () {var s = d.createElement("script"), tag = d.getElementsByTagName("script")[0]; s.src="https://cdn.iubenda.com/iubenda.js"; tag.parentNode.insertBefore(s,tag);}; if(w.addEventListener){w.addEventListener("load", loader, false);}else if(w.attachEvent){w.attachEvent("onload", loader);}else{w.onload = loader;}})(window, document);</script>
            <span>•</span>
            <a
              href="https://www.linkedin.com/company/nesvig-trani-llc/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
