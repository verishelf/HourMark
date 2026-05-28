import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as simpleIcons from "simple-icons";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "logos");
const brandsDir = join(root, "brands");
const partnersDir = join(root, "partners");

/** @type {{ file: string; name: string; wiki: string; width: number; height: number; monochrome?: boolean; slotClassName?: string }[]} */
const BRANDS = [
  { file: "rolex", name: "Rolex", wiki: "Rolex_wordmark_logo.svg", width: 120, height: 32 },
  { file: "audemars-piguet", name: "Audemars Piguet", wiki: "Audemars Piguet logo.png", width: 140, height: 32, monochrome: true },
  { file: "patek-philippe", name: "Patek Philippe", wiki: "Patek Philippe Logo.png", width: 130, height: 32, monochrome: true },
  {
    file: "richard-mille",
    name: "Richard Mille",
    wiki: "Richard Mille Logo.svg",
    width: 360,
    height: 28,
    slotClassName: "h-6 w-36 sm:h-7 sm:w-40 md:h-8 md:w-44",
  },
  { file: "cartier", name: "Cartier", wiki: "Cartier_logo.svg", width: 110, height: 32 },
  { file: "omega", name: "Omega", wiki: "Omega_Logo.svg", width: 110, height: 32 },
  {
    file: "vacheron-constantin",
    name: "Vacheron Constantin",
    wiki: "Vacheron logo.svg",
    width: 150,
    height: 32,
  },
  {
    file: "jaeger-lecoultre",
    name: "Jaeger-LeCoultre",
    wiki: "Jaeger-LeCoultre Logo.png",
    width: 150,
    height: 32,
    monochrome: true,
  },
  { file: "iwc", name: "IWC", wiki: "IWC logo.svg", width: 72, height: 32 },
  { file: "panerai", name: "Panerai", wiki: "Panerai_logo.svg", width: 120, height: 32 },
  {
    file: "breitling",
    name: "Breitling",
    wiki: "Logo Breitling 2018 1884 P.png",
    width: 130,
    height: 32,
    monochrome: true,
  },
  { file: "tudor", name: "Tudor", wiki: "Tudor (Uhrenmarke) logo.svg", width: 100, height: 32 },
  { file: "hublot", name: "Hublot", wiki: "Hublot_logo.svg", width: 110, height: 32 },
  {
    file: "a-lange-sohne",
    name: "A. Lange & Söhne",
    wiki: "Alange_soehne_logo.svg",
    width: 140,
    height: 32,
  },
];

function wikiUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function normalizeSvg(svg, label) {
  let out = svg
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/<!DOCTYPE[^>]*>\s*/i, "");

  const viewBoxMatch = out.match(/viewBox="([^"]+)"/i);
  const widthMatch = out.match(/<svg[^>]*\swidth="([0-9.]+)/i);
  const heightMatch = out.match(/<svg[^>]*\sheight="([0-9.]+)/i);
  let viewBox = viewBoxMatch?.[1];

  if (!viewBox && widthMatch && heightMatch) {
    viewBox = `0 0 ${widthMatch[1]} ${heightMatch[1]}`;
  }

  if (!out.includes("<title>")) {
    out = out.replace(/<svg/i, `<svg role="img" aria-label="${label}"`);
    out = out.replace(/<svg([^>]*)>/i, `<svg$1><title>${label}</title>`);
  }

  out = out
    .replace(/\sfill="(?!none)[^"]*"/gi, ' fill="#a1a1aa"')
    .replace(/\sstroke="(?!none)[^"]*"/gi, ' stroke="#a1a1aa"')
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\sclass="[^"]*"/gi, "");

  if (!/fill="#a1a1aa"/i.test(out) && !/fill="currentColor"/i.test(out)) {
    out = out.replace(/<svg/i, '<svg fill="#a1a1aa"');
  }

  out = out.replace(/<svg([^>]*)\swidth="[^"]*"/i, "<svg$1");
  out = out.replace(/<svg([^>]*)\sheight="[^"]*"/i, "<svg$1");

  if (viewBox && !/viewBox="/i.test(out)) {
    out = out.replace(/<svg/i, `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet"`);
  }

  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBrand(brand, attempt = 1) {
  const response = await fetch(wikiUrl(brand.wiki), {
    headers: { "User-Agent": "HourMark-Website/1.0 (logo build script)" },
  });

  if (response.status === 429 && attempt < 5) {
    await sleep(2000 * attempt);
    return downloadBrand(brand, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`${brand.name}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("svg") || brand.wiki.endsWith(".svg")) {
    const normalized = normalizeSvg(buffer.toString("utf8"), brand.name);
    writeFileSync(join(brandsDir, `${brand.file}.svg`), normalized);
    return `${brand.file}.svg`;
  }

  const ext = brand.wiki.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const filename = `${brand.file}.${ext}`;
  writeFileSync(join(brandsDir, filename), buffer);
  return filename;
}

function iconSvg(icon, fill = "#71717a") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="28" role="img" aria-label="${icon.title}">
  <title>${icon.title}</title>
  <path fill="${fill}" d="${icon.path}"/>
</svg>`;
}

async function main() {
  mkdirSync(brandsDir, { recursive: true });
  mkdirSync(partnersDir, { recursive: true });
  mkdirSync(join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data"), {
    recursive: true,
  });

  const manifest = [];

  for (const brand of BRANDS) {
    await sleep(800);
    const filename = await downloadBrand(brand);
    manifest.push({
      file: brand.file,
      name: brand.name,
      src: `/logos/brands/${filename}`,
      width: brand.width,
      height: brand.height,
      ...(brand.monochrome ? { monochrome: true } : {}),
      ...(brand.slotClassName ? { slotClassName: brand.slotClassName } : {}),
    });
    console.log(`✓ ${brand.name} → ${filename}`);
  }

  writeFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "brandLogos.json"),
    JSON.stringify(manifest, null, 2),
  );

  const partnerIcons = [
    { file: "stripe", slug: "stripe", fill: "#a1a1aa" },
    { file: "apple", slug: "apple", fill: "#a1a1aa" },
    { file: "supabase", slug: "supabase", fill: "#71717a" },
    { file: "expo", slug: "expo", fill: "#71717a" },
  ];

  for (const { file, slug, fill } of partnerIcons) {
    const icon = Object.values(simpleIcons).find((entry) => entry.slug === slug);
    if (!icon) continue;
    writeFileSync(join(partnersDir, `${file}.svg`), iconSvg(icon, fill));
  }

  const apple = Object.values(simpleIcons).find((e) => e.slug === "apple");
  const stripe = Object.values(simpleIcons).find((e) => e.slug === "stripe");

  writeFileSync(
    join(partnersDir, "apple-pay.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" role="img" aria-label="Apple Pay">
  <title>Apple Pay</title>
  <path fill="#a1a1aa" d="${apple.path}" transform="translate(0,4) scale(0.9)"/>
  <text x="30" y="21" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="13" font-weight="500">Pay</text>
</svg>`,
  );

  writeFileSync(
    join(partnersDir, "stripe-connect.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 32" role="img" aria-label="Stripe Connect">
  <title>Stripe Connect</title>
  <path fill="#71717a" d="${stripe.path}" transform="translate(0,4) scale(0.85)"/>
  <text x="34" y="21" fill="#71717a" font-family="system-ui, sans-serif" font-size="10" font-weight="500" letter-spacing="0.12em">CONNECT</text>
</svg>`,
  );

  console.log(`\nWrote manifest with ${manifest.length} brand logos.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
