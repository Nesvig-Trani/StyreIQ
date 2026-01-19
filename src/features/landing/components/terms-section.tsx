/* eslint-disable react/no-unescaped-entities */
'use client'

import { Card, CardContent } from '@/shared'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const TermsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card>
          <CardContent className="p-8 sm:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              GENERAL TERMS AND CONDITIONS OF SALE
            </h1>

            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Applicability</h2>
                <p>
                  These terms and conditions of sale (these "Terms") are the only terms that govern
                  the provision of services by StyreIQ Inc. ("Service Provider") to the individual
                  or entity identified on a purchase order, invoice, or order confirmation that
                  references these Terms ("Customer").
                </p>
                <p>
                  The accompanying order confirmation (the "Order Confirmation") and these Terms
                  (collectively, this "Agreement") comprise the entire agreement between the
                  parties, and supersede all prior or contemporaneous understandings, agreements,
                  negotiations, representations and warranties, and communications, both written and
                  oral. In the event of any conflict between these Terms and the Order Confirmation,
                  the Order Confirmation shall govern.
                </p>
                <p>
                  These Terms prevail over any of Customer's general terms and conditions regardless
                  whether or when Customer has submitted its request for proposal, order, or such
                  terms. Provision of services to Customer does not constitute acceptance of any of
                  Customer's terms and conditions and does not serve to modify or amend these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Services</h2>
                <p>
                  Service Provider shall provide the services to Customer as described in the Order
                  Confirmation (the "Services") in accordance with these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Performance Dates</h2>
                <p>
                  Service Provider shall use reasonable efforts to meet any performance dates
                  specified in the Order Confirmation, and any such dates shall be estimates only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Customer's Obligations
                </h2>
                <p>Customer shall:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>
                    cooperate with Service Provider in all matters relating to the Services and
                    provide such access to Customer's premises, and such office accommodation and
                    other facilities as may reasonably be requested by Service Provider, for the
                    purposes of performing the Services;
                  </li>
                  <li>
                    respond promptly to any Service Provider request to provide direction,
                    information, approvals, authorizations, or decisions that are reasonably
                    necessary for Service Provider to perform Services in accordance with the
                    requirements of this Agreement;
                  </li>
                  <li>
                    provide such Customer materials or information as Service Provider may request
                    to carry out the Services in a timely manner and ensure that such Customer
                    materials or information are complete and accurate in all material respects; and
                  </li>
                  <li>
                    obtain and maintain all necessary licenses and consents and comply with all
                    applicable laws in relation to the Services before the date on which the
                    Services are to start.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Customer's Acts or Omissions
                </h2>
                <p>
                  If Service Provider's performance of its obligations under this Agreement is
                  prevented or delayed by any act or omission of Customer or its agents,
                  subcontractors, consultants, or employees, Service Provider shall not be deemed in
                  breach of its obligations under this Agreement or otherwise liable for any costs,
                  charges, or losses sustained or incurred by Customer, in each case, to the extent
                  arising directly or indirectly from such prevention or delay.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Change Orders</h2>
                <div className="space-y-4">
                  <p>
                    If either party wishes to change the scope or performance of the Services, it
                    shall submit details of the requested change to the other party in writing.
                    Service Provider shall, within a reasonable time after such request, provide a
                    written estimate to Customer of:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>the likely time required to implement the change;</li>
                    <li>
                      any necessary variations to the fees and other charges for the Services
                      arising from the change;
                    </li>
                    <li>the likely effect of the change on the Services; and</li>
                    <li>
                      any other impact the change might have on the performance of this Agreement.
                    </li>
                  </ul>
                  <p>
                    Promptly after receipt of the written estimate, the parties shall negotiate and
                    agree in writing on the terms of such change (a "Change Order"). Neither party
                    shall be bound by any Change Order unless mutually agreed upon in writing in
                    accordance with Section 26.
                  </p>
                  <p>
                    Notwithstanding Section 6(a) and Section 6(b), Service Provider may, from time
                    to time change the Services without the consent of Customer provided that such
                    changes do not materially affect the nature or scope of the Services, or the
                    fees or any performance dates set forth in the Order Confirmation.
                  </p>
                  <p>
                    Service Provider may charge for the time it spends assessing and documenting a
                    change request from Customer on a time and materials basis in accordance with
                    the Order Confirmation.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Fees and Expenses; Payment Terms; Interest on Late Payments
                </h2>
                <div className="space-y-4">
                  <p>
                    In consideration of the provision of the Services by Service Provider and the
                    rights granted to Customer under this Agreement, Customer shall pay the fees set
                    forth in the Order Confirmation.
                  </p>
                  <p>
                    Customer agrees to reimburse Service Provider for all reasonable travel and
                    out-of-pocket expenses incurred by Service Provider in connection with the
                    performance of the Services.
                  </p>
                  <p>
                    Customer shall pay all invoiced amounts due to Service Provider within 30 days
                    from the date of Service Provider's invoice. Customer shall make all payments
                    hereunder in US dollars by wire transfer.
                  </p>
                  <p>
                    In the event payments are not received by Service Provider after becoming due,
                    Service Provider may:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      charge interest on any such unpaid amounts at a rate of 1% per month or, if
                      lower, the maximum amount permitted under applicable law, from the date such
                      payment was due until the date paid; and
                    </li>
                    <li>
                      suspend performance for all Services until payment has been made in full.
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Taxes</h2>
                <p>
                  Customer shall be responsible for all sales, use and excise taxes, and any other
                  similar taxes, duties and charges of any kind imposed by any federal, state, or
                  local governmental entity on any amounts payable by Customer hereunder.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
                <p>
                  All intellectual property rights, including copyrights, patents, patent
                  disclosures and inventions (whether patentable or not), trademarks, service marks,
                  trade secrets, know-how, and other confidential information, trade dress, trade
                  names, logos, corporate names and domain names, together with all of the goodwill
                  associated therewith, derivative works and all other rights (collectively,
                  "Intellectual Property Rights") in and to all documents, work product and other
                  materials that are delivered to Customer under this Agreement or prepared by or on
                  behalf of Service Provider in the course of performing the Services, including any
                  items identified as such in the Order Confirmation (collectively, the
                  "Deliverables") except for any Confidential Information of Customer or Customer
                  materials shall be owned exclusively by Service Provider. Service Provider hereby
                  grants Customer a license to use all Intellectual Property Rights in the
                  Deliverables free of additional charge and on a non-exclusive, worldwide,
                  non-transferable, non-sublicensable, fully paid-up, royalty-free and perpetual
                  basis, solely to the extent necessary to enable Customer to make reasonable use of
                  the Deliverables and the Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Confidential Information
                </h2>
                <div className="space-y-4">
                  <p>
                    All non-public, confidential or proprietary information of Service Provider,
                    including, but not limited to, trade secrets, technology, information pertaining
                    to business operations and strategies, and information pertaining to customers,
                    pricing, and marketing (collectively, "Confidential Information"), disclosed by
                    Service Provider to Customer, whether disclosed orally or disclosed or accessed
                    in written, electronic or other form or media, and whether or not marked,
                    designated or otherwise identified as "confidential," in connection with the
                    provision of the Services and this Agreement is confidential, and shall not be
                    disclosed or copied by Customer without the prior written consent of Service
                    Provider. Confidential Information does not include information that is:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>in the public domain;</li>
                    <li>known to Customer at the time of disclosure; or</li>
                    <li>
                      rightfully obtained by Customer on a non-confidential basis from a third
                      party.
                    </li>
                  </ul>
                  <p>
                    Customer agrees to use the Confidential Information only to make use of the
                    Services and Deliverables.
                  </p>
                  <p>
                    Service Provider shall be entitled to injunctive relief for any violation of
                    this Section.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Representation and Warranty
                </h2>
                <div className="space-y-4">
                  <p>
                    Service Provider represents and warrants to Customer that it shall perform the
                    Services using personnel of required skill, experience, and qualifications and
                    in a professional and workmanlike manner in accordance with generally recognized
                    industry standards for similar services and shall devote adequate resources to
                    meet its obligations under this Agreement.
                  </p>
                  <p>
                    The Service Provider shall not be liable for a breach of the warranty set forth
                    in Section 11(a) unless Customer gives written notice of the defective Services,
                    reasonably described, to Service Provider within 15 days of the time when
                    Customer discovers or ought to have discovered that the Services were defective.
                  </p>
                  <p>
                    Subject to Section 11(b), Service Provider shall, in its sole discretion,
                    either:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>repair or re-perform such Services (or the defective part); or</li>
                    <li>
                      credit or refund the price of such Services at the pro rata contract rate.
                    </li>
                  </ul>
                  <p className="font-semibold uppercase">
                    THE REMEDIES SET FORTH IN SECTION 11(c) SHALL BE THE CUSTOMER'S SOLE AND
                    EXCLUSIVE REMEDY AND SERVICE PROVIDER'S ENTIRE LIABILITY FOR ANY BREACH OF THE
                    LIMITED WARRANTY SET FORTH IN SECTION 11(a).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Disclaimer of Warranties
                </h2>
                <p className="font-semibold uppercase">
                  EXCEPT FOR THE WARRANTY SET FORTH IN SECTION 11(a) ABOVE, SERVICE PROVIDER MAKES
                  NO WARRANTY WHATSOEVER WITH RESPECT TO THE SERVICES, INCLUDING ANY (A) WARRANTY OF
                  MERCHANTABILITY; OR (B) WARRANTY OF FITNESS FOR A PARTICULAR PURPOSE; OR (C)
                  WARRANTY OF TITLE; OR (D) WARRANTY AGAINST INFRINGEMENT OF INTELLECTUAL PROPERTY
                  RIGHTS OF A THIRD PARTY; WHETHER EXPRESS OR IMPLIED BY LAW, COURSE OF DEALING,
                  COURSE OF PERFORMANCE, USAGE OF TRADE, OR OTHERWISE.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Limitation of Liability
                </h2>
                <div className="space-y-4">
                  <p className="font-semibold uppercase">
                    IN NO EVENT SHALL SERVICE PROVIDER BE LIABLE TO CUSTOMER OR TO ANY THIRD PARTY
                    FOR ANY LOSS OF USE, REVENUE OR PROFIT OR LOSS OF DATA OR DIMINUTION IN VALUE,
                    OR FOR ANY CONSEQUENTIAL, INCIDENTAL, INDIRECT, EXEMPLARY, SPECIAL, OR PUNITIVE
                    DAMAGES WHETHER ARISING OUT OF BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE),
                    OR OTHERWISE, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE AND WHETHER OR
                    NOT SERVICE PROVIDER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND
                    NOTWITHSTANDING THE FAILURE OF ANY AGREED OR OTHER REMEDY OF ITS ESSENTIAL
                    PURPOSE.
                  </p>
                  <p className="font-semibold uppercase">
                    IN NO EVENT SHALL SERVICE PROVIDER'S AGGREGATE LIABILITY ARISING OUT OF OR
                    RELATED TO THIS AGREEMENT, WHETHER ARISING OUT OF OR RELATED TO BREACH OF
                    CONTRACT, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, EXCEED THE AGGREGATE AMOUNTS
                    PAID OR PAYABLE TO SERVICE PROVIDER PURSUANT TO THIS AGREEMENT.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Termination</h2>
                <p>
                  In addition to any remedies that may be provided under this Agreement, Service
                  Provider may terminate this Agreement with immediate effect upon written notice to
                  Customer, if Customer:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>fails to pay any amount when due under this Agreement;</li>
                  <li>
                    has not otherwise performed or complied with any of the terms of this Agreement,
                    in whole or in part; or
                  </li>
                  <li>
                    becomes insolvent, files a petition for bankruptcy or commences or has commenced
                    against it proceedings relating to bankruptcy, receivership, reorganization, or
                    assignment for the benefit of creditors.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Insurance</h2>
                <p>
                  During the term of this Agreement, Customer shall, at its own expense, maintain
                  and carry insurance in full force and effect which includes, but is not limited
                  to, commercial general liability (including product liability) in a sum no less
                  than $1,000,000 with financially sound and reputable insurers. Upon Service
                  Provider's request, Customer shall provide Service Provider with a certificate of
                  insurance from Customer's insurer evidencing the insurance coverage specified in
                  these Terms. Customer shall provide Service Provider with 10 days' advance written
                  notice in the event of a cancellation or material change in Customer's insurance
                  policy. Except where prohibited by law, Customer shall require its insurer to
                  waive all rights of subrogation against Service Provider's insurers and Service
                  Provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Waiver</h2>
                <p>
                  No waiver by Service Provider of any of the provisions of this Agreement is
                  effective unless explicitly set forth in writing and signed by Service Provider.
                  No failure to exercise, or delay in exercising, any rights, remedy, power, or
                  privilege arising from this Agreement operates or may be construed as a waiver
                  thereof. No single or partial exercise of any right, remedy, power, or privilege
                  hereunder precludes any other or further exercise thereof or the exercise of any
                  other right, remedy, power, or privilege.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Force Majeure</h2>
                <p>
                  No party shall be liable or responsible to the other party, or be deemed to have
                  defaulted under or breached this Agreement, for any failure or delay in fulfilling
                  or performing any term of this Agreement (except for any obligations of Buyer to
                  make payments to Seller hereunder), when and to the extent such failure or delay
                  is caused by or results from acts beyond the impacted party's ("Impacted Party")
                  reasonable control, including, without limitation, the following force majeure
                  events ("Force Majeure Event(s)"): (a) acts of God; (b) flood, fire, earthquake,
                  or explosion; (c) war, invasion, hostilities (whether war is declared or not),
                  terrorist threats or acts, riot or other civil unrest; (d) government order, law,
                  or action; (e) embargoes or blockades in effect on or after the date of this
                  Agreement; (f) national or regional emergency; (g) strikes, labor stoppages or
                  slowdowns or other industrial disturbances; (h) telecommunication breakdowns,
                  power outages or shortages, lack of warehouse or storage space, inadequate
                  transportation services, or inability or delay in obtaining supplies of adequate
                  or suitable materials; and (i) other similar events beyond the reasonable control
                  of the Impacted Party.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Assignment</h2>
                <p>
                  Customer shall not assign any of its rights or delegate any of its obligations
                  under this Agreement without the prior written consent of Service Provider. Any
                  purported assignment or delegation in violation of this Section is null and void.
                  No assignment or delegation relieves Customer of any of its obligations under this
                  Agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Relationship of the Parties
                </h2>
                <p>
                  The relationship between the parties is that of independent contractors. Nothing
                  contained in this Agreement shall be construed as creating any agency,
                  partnership, joint venture or other form of joint enterprise, employment, or
                  fiduciary relationship between the parties, and neither party shall have authority
                  to contract for or bind the other party in any manner whatsoever.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  No Third-Party Beneficiaries
                </h2>
                <p>
                  This Agreement is for the sole benefit of the parties hereto and their respective
                  successors and permitted assigns and nothing herein, express or implied, is
                  intended to or shall confer upon any other person or entity any legal or equitable
                  right, benefit or remedy of any nature whatsoever under or by reason of these
                  Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Governing Law</h2>
                <p>
                  All matters arising out of or relating to this Agreement are governed by and
                  construed in accordance with the internal laws of the State of Delaware without
                  giving effect to any choice or conflict of law provision or rule (whether of the
                  State of Delaware or any other jurisdiction) that would cause the application of
                  the laws of any jurisdiction other than those of the State of Delaware.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Submission to Jurisdiction
                </h2>
                <p>
                  Any legal suit, action, or proceeding arising out of or relating to this Agreement
                  shall be instituted in the federal courts of the United States of America or the
                  courts of the Commonwealth of Virginia in each case located in the City of
                  Richmond and County of Henrico, and each party irrevocably submits to the
                  exclusive jurisdiction of such courts in any such suit, action, or proceeding.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Notices</h2>
                <p>
                  All notices, requests, consents, claims, demands, waivers, and other
                  communications hereunder (each, a "Notice") shall be in writing and addressed to
                  the parties at the addresses set forth in the Order Confirmation or to such other
                  address that may be designated by the receiving party in writing. All Notices
                  shall be delivered by personal delivery, nationally recognized overnight courier
                  (with all fees pre-paid), facsimile (with confirmation of transmission) or email
                  or certified or registered mail (in each case, return receipt requested, postage
                  prepaid). Except as otherwise provided in this Agreement, a Notice is effective
                  only (a) upon receipt of the receiving party, and (b) if the party giving the
                  Notice has complied with the requirements of this Section.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Severability</h2>
                <p>
                  If any term or provision of this Agreement is invalid, illegal, or unenforceable
                  in any jurisdiction, such invalidity, illegality, or unenforceability shall not
                  affect any other term or provision of this Agreement or invalidate or render
                  unenforceable such term or provision in any other jurisdiction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Survival</h2>
                <p>
                  Provisions of these Terms, which by their nature should apply beyond their terms,
                  will remain in force after any termination or expiration of this Agreement
                  including, but not limited to, the following provisions: Confidentiality,
                  Governing Law, Insurance, Submission to Jurisdiction, and Survival.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Amendment and Modification
                </h2>
                <p>
                  This Agreement may only be amended or modified in a writing which specifically
                  states that it amends this Agreement and is signed by an authorized representative
                  of each party.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
