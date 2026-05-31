import Link from "next/link";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LEGAL } from "@/lib/legal";

type LegalLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, description, children }: LegalLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#71717a] transition-colors hover:text-white"
          >
            ← Back to {LEGAL.appName}
          </Link>

          <header className="mt-10 border-b border-[#1a1a1a] pb-10">
            <CrownlyLogo size={56} className="mb-6" />
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              Legal
            </p>
            <h1 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">{description}</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-[#71717a]">
              Effective {LEGAL.effectiveDate} · {LEGAL.companyName}
            </p>
          </header>

          <article className="legal-prose mt-12">{children}</article>

          <nav
            className="mt-16 flex flex-wrap gap-6 border-t border-[#1a1a1a] pt-10 text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a]"
            aria-label="Related legal documents"
          >
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms &amp; EULA
            </Link>
            <a
              href={`mailto:${LEGAL.privacyEmail}`}
              className="transition-colors hover:text-white"
            >
              Contact
            </a>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
