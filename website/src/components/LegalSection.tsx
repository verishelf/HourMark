type LegalSectionProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
};

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-28">
      <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#a1a1aa]">{children}</div>
    </section>
  );
}

export function LegalSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#a1a1aa]">{children}</div>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-[#71717a]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
