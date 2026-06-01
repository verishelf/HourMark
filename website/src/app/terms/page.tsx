import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LegalList, LegalSection, LegalSubsection } from "@/components/LegalSection";
import { LEGAL } from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: `Terms of Service & EULA — ${LEGAL.appName}`,
  description: `Terms of Service and End User License Agreement for the ${LEGAL.appName} iOS luxury watch marketplace.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service & EULA"
      description={`Please read these Terms of Service ("Terms") and End User License Agreement ("EULA") carefully before using ${LEGAL.appName}. By accessing or using the Services, you agree to be bound by both documents below.`}
    >
      <nav className="mb-12 rounded border border-[#1a1a1a] bg-[#0a0a0a] p-6 text-sm text-[#a1a1aa]">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#71717a]">
          On this page
        </p>
        <ul className="mt-4 space-y-2">
          <li>
            <a href="#terms-of-service" className="text-white underline">
              Part I — Terms of Service
            </a>
          </li>
          <li>
            <a href="#eula" className="text-white underline">
              Part II — End User License Agreement (EULA)
            </a>
          </li>
        </ul>
      </nav>

      <p className="mb-12 text-sm leading-relaxed text-[#a1a1aa]">
        If you do not agree to these Terms and EULA, do not use the Services. For questions,
        contact{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="text-white underline">
          {LEGAL.contactEmail}
        </a>
        .
      </p>

      <div className="mb-16 border-t border-[#1a1a1a] pt-4">
        <p
          id="terms-of-service"
          className="scroll-mt-28 text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]"
        >
          Part I
        </p>
        <h2 className="mt-2 text-2xl font-light tracking-tight text-white">Terms of Service</h2>
      </div>

      <LegalSection title="1. Agreement and eligibility">
        <p>
          These Terms are a binding agreement between you and {LEGAL.companyName} governing your
          use of the {LEGAL.appName} mobile application, website at {LEGAL.websiteUrl}, and
          related services (the "Services"). You must be at least 18 years old and able to form a
          binding contract to use the Services. You may not use the Services if you are barred
          under applicable law or previously suspended from the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Marketplace role">
        <p>
          {LEGAL.appName} provides a platform that facilitates connections between independent
          buyers and sellers of luxury watches. {LEGAL.companyName} is not a traditional retailer,
          auction house, dealer, escrow agent, bank, insurer, or authenticator of watches, except
          as expressly described in product features (such as automated listing review or
          identity verification tools). We do not take title to items sold through the Services
          unless explicitly stated otherwise.
        </p>
        <p className="mt-4">
          Any transaction is directly between buyer and seller. {LEGAL.appName} is a third-party
          platform and is not a party to the sale contract between users, except for platform
          fees and payment processing arrangements described herein.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <LegalList
          items={[
            "You must provide accurate registration information and keep your credentials secure.",
            "You are responsible for all activity under your account.",
            "You may sign in using methods we support, including Sign in with Apple and email.",
            "We may require identity verification before you sell or receive payouts.",
            "You may delete your account in the app; deletion is permanent for profile, listings, posts, messages, and orders as described in-app.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Listings and seller obligations">
        <p>Sellers represent and warrant that:</p>
        <LegalList
          items={[
            "They own the item listed or have authority to sell it.",
            "Listings are accurate regarding brand, model, reference, condition, papers, accessories, and price.",
            "Items are genuine, not counterfeit, not stolen, and not subject to liens or third-party claims.",
            "They will ship items promptly and as described after a valid sale.",
            "They comply with all applicable laws, including import/export and tax obligations.",
          ]}
        />
        <p className="mt-4">
          We may remove listings, require additional verification, or suspend accounts that
          violate these Terms or pose risk to the community.
        </p>
      </LegalSection>

      <LegalSection title="5. Prohibited conduct">
        <p>You may not:</p>
        <LegalList
          items={[
            "List counterfeit, replica, or misrepresented watches or accessories.",
            "Circumvent fees, escrow, or checkout by directing users off-platform for payment.",
            "Harass, threaten, defraud, or impersonate others.",
            "Scrape, reverse engineer, or interfere with the Services except as permitted by law.",
            "Upload malware or attempt unauthorized access to systems or accounts.",
            "Use the Services for money laundering or other illegal financial activity.",
            "Reuse serial numbers across accounts or submit false verification materials.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Buyer terms, escrow, and inspection">
        <p>
          When you purchase through supported checkout, payment may be processed by Stripe and
          held pursuant to our escrow flow until delivery and a {LEGAL.inspectionDays}-day
          inspection window (or as otherwise shown at checkout). Buyers should inspect items
          promptly and report issues through the order flow. Failure to act within stated
          deadlines may result in release of funds to the seller.
        </p>
        <p className="mt-4">
          Wire transfer or other payment methods, if offered, are subject to separate instructions
          displayed at checkout. {LEGAL.appName} is not responsible for bank delays or errors
          caused by incorrect references supplied by the buyer.
        </p>
      </LegalSection>

      <LegalSection title="7. Fees and payments">
        <p>
          {LEGAL.appName} charges a platform fee of {LEGAL.platformFeePercent}% on applicable
          transactions, plus payment processing costs charged by Stripe or other providers.
          Sellers must complete Stripe Connect onboarding to receive payouts. Payout timing
          depends on verification status, delivery confirmation, inspection periods, disputes,
          and Stripe policies.
        </p>
        <p className="mt-4">
          All prices are listed by sellers. Taxes, duties, and shipping may be additional unless
          stated otherwise in the listing or checkout summary.
        </p>
      </LegalSection>

      <LegalSection title="8. Trust, verification, and disclaimers">
        <p>
          Badges, trust scores, AI authentication results, and seller verification status are
          provided for informational purposes only. They do not guarantee authenticity,
          condition, legality, or future performance of any user or item. You are responsible for
          your own due diligence before buying or selling high-value goods.
        </p>
      </LegalSection>

      <LegalSection title="9. User content and license">
        <p>
          You retain ownership of content you submit. You grant {LEGAL.companyName} a worldwide,
          non-exclusive, royalty-free license to host, display, reproduce, adapt, and distribute
          your content solely to operate, promote, and improve the Services. You represent that
          you have all rights necessary to grant this license.
        </p>
      </LegalSection>

      <LegalSection title="10. Messaging, posts, and community">
        <p>
          You are solely responsible for messages, posts, and comments you send. We may monitor
          or remove content that violates these Terms or applicable law. Do not share sensitive
          personal data in public posts or messages.
        </p>
      </LegalSection>

      <LegalSection title="11. Intellectual property">
        <p>
          The Services, including software, design, trademarks, and logos, are owned by{" "}
          {LEGAL.companyName} or its licensors and are protected by intellectual property laws.
          Except for the limited license in the EULA below, no rights are granted to you.
        </p>
      </LegalSection>

      <LegalSection title="12. Copyright complaints">
        <p>
          If you believe content on the Services infringes your copyright, send a notice to{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-white underline">
            {LEGAL.contactEmail}
          </a>{" "}
          with the information required under the U.S. Digital Millennium Copyright Act (DMCA).
          We may remove content and terminate repeat infringers.
        </p>
      </LegalSection>

      <LegalSection title="13. Disputes between users">
        <p>
          Buyers and sellers should attempt to resolve transaction disputes through the in-app
          order tools and messaging. {LEGAL.companyName} may, but is not obligated to, assist with
          disputes. Our decisions regarding holds, refunds, or releases are made in our reasonable
          discretion consistent with these Terms and payment partner rules.
        </p>
      </LegalSection>

      <LegalSection title="14. Suspension and termination">
        <p>
          We may suspend or terminate your access at any time for violation of these Terms, risk
          concerns, or legal requirements. You may stop using the Services at any time. Sections
          that by their nature should survive termination will survive.
        </p>
      </LegalSection>

      <LegalSection title="15. Disclaimers">
        <p className="uppercase tracking-wide text-[#71717a]">
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO
          NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>
      </LegalSection>

      <LegalSection title="16. Limitation of liability">
        <p className="uppercase tracking-wide text-[#71717a]">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL.companyName} AND ITS AFFILIATES,
          OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
          GOODWILL, OR WATCH VALUE, ARISING FROM YOUR USE OF THE SERVICES OR ANY TRANSACTION
          BETWEEN USERS. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE
          SERVICES WILL NOT EXCEED THE GREATER OF (A) AMOUNTS YOU PAID TO US IN PLATFORM FEES IN
          THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100). SOME
          JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS, SO SOME OF THE ABOVE MAY NOT APPLY TO
          YOU.
        </p>
      </LegalSection>

      <LegalSection title="17. Indemnification">
        <p>
          You agree to indemnify and hold harmless {LEGAL.companyName} from claims, damages,
          losses, and expenses (including reasonable attorneys&apos; fees) arising from your use
          of the Services, your content, your listings, your transactions, or your violation of
          these Terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="18. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of Delaware, United States, without
          regard to conflict-of-law principles, except where mandatory consumer protection laws in
          your country of residence apply. You agree that exclusive jurisdiction for disputes
          relating to these Terms shall be in the state or federal courts located in Delaware,
          unless applicable law requires otherwise. You may also have the right to bring claims in
          your country of residence under mandatory law.
        </p>
      </LegalSection>

      <LegalSection title="19. Changes">
        <p>
          We may modify these Terms by posting an updated version at {LEGAL.websiteUrl}/terms. Material
          changes will be indicated by updating the effective date. Continued use after changes
          become effective constitutes acceptance.
        </p>
      </LegalSection>

      <div className="my-16 border-t border-[#1a1a1a]" />

      <div className="mb-16">
        <p id="eula" className="scroll-mt-28 text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
          Part II
        </p>
        <h2 className="mt-2 text-2xl font-light tracking-tight text-white">
          End User License Agreement (EULA)
        </h2>
        <p className="mt-4 text-sm text-[#a1a1aa]">
          This EULA governs your use of the {LEGAL.appName} mobile application licensed by{" "}
          {LEGAL.companyName}, not the purchase of physical watches between users.
        </p>
      </div>

      <LegalSection title="20. License grant">
        <p>
          Subject to your compliance with these Terms and this EULA, {LEGAL.companyName} grants you
          a limited, non-exclusive, non-transferable, revocable license to install and use one
          copy of the {LEGAL.appName} application on Apple-branded devices that you own or control,
          solely for personal, non-commercial use of the marketplace features, as permitted by the
          App Store Terms of Service and Usage Rules.
        </p>
      </LegalSection>

      <LegalSection title="21. License restrictions">
        <p>You may not:</p>
        <LegalList
          items={[
            "Copy, modify, or create derivative works of the application except as permitted by law.",
            "Reverse engineer, decompile, or disassemble the application except as permitted by applicable law.",
            "Rent, lease, lend, sell, sublicense, or redistribute the application.",
            "Remove proprietary notices or circumvent technical protections.",
            "Use the application for any unlawful purpose or in violation of these Terms.",
          ]}
        />
      </LegalSection>

      <LegalSection title="22. Apple App Store terms">
        <p>
          If you downloaded the application from the Apple App Store, the following also apply:
        </p>
        <LegalList
          items={[
            `This EULA is between you and ${LEGAL.companyName}, not Apple. Apple is not responsible for the application or its content.`,
            "Apple has no obligation to furnish maintenance or support services for the application.",
            `In the event of failure of the application to conform to any applicable warranty, you may notify Apple for a refund of the purchase price (if any); to the maximum extent permitted by law, Apple has no other warranty obligation.`,
            `${LEGAL.companyName}, not Apple, is responsible for addressing claims relating to the application, including product liability, legal compliance, and intellectual property infringement claims.`,
            "Apple and its subsidiaries are third-party beneficiaries of this EULA and may enforce it against you.",
            "You represent that you are not located in a country subject to U.S. government embargo and are not listed on any U.S. government prohibited party list.",
          ]}
        />
      </LegalSection>

      <LegalSection title="23. Maintenance and support">
        <p>
          {LEGAL.companyName} may provide updates, bug fixes, and support at its discretion. You
          agree to install updates when required for security or continued use. We may modify or
          discontinue features with reasonable notice where practicable.
        </p>
      </LegalSection>

      <LegalSection title="24. Export and government use">
        <p>
          You may not use or export the application except as authorized by U.S. law and the laws
          of the jurisdiction in which the application was obtained. The application and related
          documentation are "Commercial Items" as defined at 48 C.F.R. §2.101, licensed to U.S.
          government end users with only those rights set forth herein.
        </p>
      </LegalSection>

      <LegalSection title="25. EULA termination">
        <p>
          This EULA is effective until terminated. Your rights under this EULA terminate
          automatically if you fail to comply with its terms. Upon termination, you must cease
          use and delete all copies of the application from your devices.
        </p>
      </LegalSection>

      <LegalSection title="26. Contact">
        <p>
          {LEGAL.companyName}
          <br />
          Legal:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-white underline">
            {LEGAL.contactEmail}
          </a>
          <br />
          Support:{" "}
          <a href={`mailto:${LEGAL.supportEmail}`} className="text-white underline">
            {LEGAL.supportEmail}
          </a>
        </p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.1em] text-[#71717a]">
          This document is provided for informational purposes and does not constitute legal
          advice. Have qualified counsel review before App Store submission or production launch.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
