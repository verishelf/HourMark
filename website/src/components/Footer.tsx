import Link from "next/link";
import { CrownlyLogo } from "@/components/CrownlyLogo";

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="flex flex-col items-center md:items-start">
          <CrownlyLogo size={40} />
          <p className="mt-3 text-sm text-[#a1a1aa]">
            Luxury watch marketplace · © {new Date().getFullYear()}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:justify-end">
          <Link
            href="/privacy"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Terms &amp; EULA
          </Link>
          <Link
            href="/#platform"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Platform
          </Link>
          <Link
            href="/#trust"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Trust
          </Link>
          <Link
            href="/#how-it-works"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Buyers
          </Link>
          <Link
            href="/#download"
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-white"
          >
            Download
          </Link>
        </div>
      </div>
    </footer>
  );
}
