import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#71717a]">
            Crownly
          </p>
          <p className="mt-1 text-sm text-[#a1a1aa]">
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
