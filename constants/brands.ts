export const LUXURY_BRANDS = [
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Cartier",
  "Omega",
  "Richard Mille",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "IWC",
  "Panerai",
  "Breitling",
  "Tudor",
  "Hublot",
  "A. Lange & Söhne",
] as const;

export type LuxuryBrand = (typeof LUXURY_BRANDS)[number];

export const CONDITIONS = [
  "Unworn",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type WatchCondition = (typeof CONDITIONS)[number];

export const FILTER_CHIPS = [
  "All",
  "Rolex",
  "AP",
  "Patek Philippe",
  "Cartier",
  "Omega",
  "Richard Mille",
  "Vintage",
  "Limited Edition",
] as const;
