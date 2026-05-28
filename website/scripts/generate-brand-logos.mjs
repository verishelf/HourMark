import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as simpleIcons from "simple-icons";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "logos");

const brands = [
  { file: "rolex", label: "ROLEX", width: 88 },
  { file: "audemars-piguet", label: "AUDEMARS PIGUET", width: 168 },
  { file: "patek-philippe", label: "PATEK PHILIPPE", width: 156 },
  { file: "richard-mille", label: "RICHARD MILLE", width: 156 },
  { file: "cartier", label: "CARTIER", width: 96 },
  { file: "omega", label: "OMEGA", width: 88 },
  { file: "vacheron-constantin", label: "VACHERON CONSTANTIN", width: 210 },
  { file: "jaeger-lecoultre", label: "JAEGER-LECOULTRE", width: 188 },
  { file: "iwc", label: "IWC", width: 52 },
  { file: "panerai", label: "PANERAI", width: 96 },
  { file: "breitling", label: "BREITLING", width: 108 },
  { file: "tudor", label: "TUDOR", width: 76 },
  { file: "hublot", label: "HUBLOT", width: 88 },
  { file: "a-lange-sohne", label: "A. LANGE & SÖHNE", width: 168 },
];

function brandSvg({ label, width }) {
  const height = 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <title>${label}</title>
  <text x="0" y="22" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" letter-spacing="0.28em">${label}</text>
</svg>`;
}

function iconSvg(icon, width = 96, height = 32, fill = "#71717a") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${width}" height="${height}" role="img" aria-label="${icon.title}">
  <title>${icon.title}</title>
  <path fill="${fill}" d="${icon.path}"/>
</svg>`;
}

mkdirSync(join(root, "brands"), { recursive: true });
mkdirSync(join(root, "partners"), { recursive: true });

for (const brand of brands) {
  writeFileSync(
    join(root, "brands", `${brand.file}.svg`),
    brandSvg(brand),
  );
}

const partnerIcons = [
  { file: "stripe", slug: "stripe", fill: "#a1a1aa" },
  { file: "apple", slug: "apple", fill: "#a1a1aa" },
  { file: "supabase", slug: "supabase", fill: "#71717a" },
  { file: "expo", slug: "expo", fill: "#71717a" },
];

for (const { file, slug, fill } of partnerIcons) {
  const icon = Object.values(simpleIcons).find((entry) => entry.slug === slug);
  if (!icon) {
    console.warn(`Missing icon: ${slug}`);
    continue;
  }
  writeFileSync(join(root, "partners", `${file}.svg`), iconSvg(icon, 80, 28, fill));
}

// Apple Pay wordmark companion
writeFileSync(
  join(root, "partners", "apple-pay.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" role="img" aria-label="Apple Pay">
  <title>Apple Pay</title>
  <path fill="#a1a1aa" d="${Object.values(simpleIcons).find((e) => e.slug === "apple").path}" transform="translate(0,4) scale(0.9)"/>
  <text x="30" y="21" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="13" font-weight="500">Pay</text>
</svg>`,
);

// Stripe Connect label
writeFileSync(
  join(root, "partners", "stripe-connect.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 32" role="img" aria-label="Stripe Connect">
  <title>Stripe Connect</title>
  <path fill="#71717a" d="${Object.values(simpleIcons).find((e) => e.slug === "stripe").path}" transform="translate(0,4) scale(0.85)"/>
  <text x="34" y="21" fill="#71717a" font-family="system-ui, sans-serif" font-size="10" font-weight="500" letter-spacing="0.12em">CONNECT</text>
</svg>`,
);

console.log("Generated brand and partner logos.");
