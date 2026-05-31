import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LegalList, LegalSection, LegalSubsection } from "@/components/LegalSection";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${LEGAL.appName}`,
  description: `How ${LEGAL.appName} collects, uses, and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description={`This Privacy Policy explains how ${LEGAL.companyName} ("${LEGAL.appName}," "we," "us," or "our") collects, uses, discloses, and protects information when you use the ${LEGAL.appName} iOS application, website, and related services (collectively, the "Services").`}
    >
      <LegalSection title="1. Who we are">
        <p>
          {LEGAL.companyName} operates {LEGAL.appName}, a marketplace that connects buyers and
          sellers of luxury watches. For privacy-related requests, contact us at{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`} className="text-white underline">
            {LEGAL.privacyEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <LegalSubsection title="Information you provide">
          <LegalList
            items={[
              "Account details such as email address, name, username, and profile photo.",
              "Listing content including photos, descriptions, reference numbers, condition, price, and accessory details.",
              "Posts, comments, messages, and other communications you send through the Services.",
              "Identity verification materials when you complete seller KYC, such as government ID images, selfie photos, and phone number.",
              "Watch verification materials such as serial numbers, movement photos, papers, box images, and listing videos.",
              "Payment and payout information processed by our payment partners (we do not store full card numbers).",
              "Support correspondence and feedback you send to us.",
            ]}
          />
        </LegalSubsection>
        <LegalSubsection title="Information collected automatically">
          <LegalList
            items={[
              "Device information such as device type, operating system, and app version.",
              "Log and usage data such as pages viewed, features used, timestamps, and crash reports.",
              "Identifiers such as IP address, cookies or similar technologies on our website, and mobile advertising identifiers where permitted.",
              "Trust and fraud signals used to protect the marketplace, such as listing patterns and verification outcomes.",
            ]}
          />
        </LegalSubsection>
        <LegalSubsection title="Information from third parties">
          <p>
            We receive information from service providers that help us operate the Services,
            including payment processors (e.g., Stripe), identity verification partners (e.g.,
            Persona or Onfido when enabled), cloud hosting (e.g., Supabase), and authentication
            providers (e.g., Sign in with Apple).
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <p>We use personal information to:</p>
        <LegalList
          items={[
            "Provide, operate, and improve the Services, including listings, search, messaging, and checkout.",
            "Create and manage your account and seller payout profile.",
            "Process transactions, escrow holds, refunds, and seller payouts.",
            "Verify seller identity, analyze listings for authenticity signals, and display trust badges.",
            "Detect, prevent, and respond to fraud, abuse, and security incidents.",
            "Communicate with you about orders, verification, policy updates, and support.",
            "Comply with legal obligations and enforce our Terms of Service.",
            "Analyze aggregated or de-identified usage to improve the product experience.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Automated processing and AI">
        <p>
          {LEGAL.appName} may use automated systems, including machine learning and optical
          character recognition, to review listings, compare serial numbers, score risk, and
          assign trust badges. These systems support our review process but do not replace human
          judgment in all cases. Automated decisions may affect whether a listing is published,
          flagged for review, or whether certain features are available to an account. You may
          contact us to request more information about significant automated decisions affecting
          you, where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>We may share personal information with:</p>
        <LegalList
          items={[
            "Other users, when you publish listings, posts, profile information, or messages visible on the platform.",
            "Service providers that process data on our behalf under contractual obligations, including hosting, payments, identity verification, analytics, and customer support tools.",
            "Counterparties to a transaction, such as buyers and sellers involved in an order.",
            "Law enforcement, regulators, or other parties when required by law, legal process, or to protect rights, safety, and security.",
            "A successor entity in connection with a merger, acquisition, or sale of assets, subject to this Privacy Policy.",
          ]}
        />
        <p className="mt-4">We do not sell your personal information for money.</p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We retain information for as long as needed to provide the Services, comply with legal
          obligations, resolve disputes, and enforce agreements. When you delete your account
          through the app, we delete or anonymize associated profile, listing, post, message, and
          order data as described in the account deletion flow, except where retention is
          required for legal, tax, fraud prevention, or payment record-keeping purposes.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We implement administrative, technical, and organizational measures designed to protect
          personal information, including encryption in transit, access controls, and private
          storage for sensitive verification documents. No method of transmission or storage is
          completely secure; you use the Services at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices and rights">
        <p>Depending on where you live, you may have the right to:</p>
        <LegalList
          items={[
            "Access, correct, or delete certain personal information.",
            "Object to or restrict certain processing.",
            "Withdraw consent where processing is based on consent.",
            "Port data you provided to us in a structured format, where applicable.",
            "Lodge a complaint with a supervisory authority.",
          ]}
        />
        <p className="mt-4">
          You can update profile information in the app and delete your account from Profile
          settings. To exercise other rights, email{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`} className="text-white underline">
            {LEGAL.privacyEmail}
          </a>
          . We may verify your identity before responding.
        </p>
      </LegalSection>

      <LegalSection title="9. California privacy notice">
        <p>
          If you are a California resident, you may have additional rights under the California
          Consumer Privacy Act (CCPA/CPRA), including the right to know, delete, and correct
          personal information, and to opt out of certain sharing that may be considered a “sale”
          or “sharing” for cross-context behavioral advertising (we do not sell personal
          information for money). Contact {LEGAL.privacyEmail} to submit a request. We will not
          discriminate against you for exercising privacy rights.
        </p>
      </LegalSection>

      <LegalSection title="10. International users">
        <p>
          {LEGAL.appName} is operated from the United States. If you access the Services from
          outside the U.S., your information may be transferred to, stored in, and processed in
          the United States or other countries where our providers operate, which may have
          different data protection laws than your country.
        </p>
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          The Services are not directed to individuals under 18 years of age (or the age of
          majority in your jurisdiction). We do not knowingly collect personal information from
          children. If you believe a child has provided us information, contact us and we will
          delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Third-party links">
        <p>
          The Services may link to third-party websites or services (such as Stripe onboarding or
          identity verification flows). Their privacy practices are governed by their own
          policies, not this one.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version
          on {LEGAL.websiteUrl}/privacy and update the effective date. Material changes may be
          communicated through the app or by email where appropriate. Continued use after changes
          become effective constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact us">
        <p>
          {LEGAL.companyName}
          <br />
          Email:{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`} className="text-white underline">
            {LEGAL.privacyEmail}
          </a>
          <br />
          General support:{" "}
          <a href={`mailto:${LEGAL.supportEmail}`} className="text-white underline">
            {LEGAL.supportEmail}
          </a>
        </p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.1em] text-[#71717a]">
          This document is provided for informational purposes and does not constitute legal
          advice. Consult qualified counsel before relying on it for compliance decisions.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
