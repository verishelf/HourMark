export type MarketTickerItem = {
  id: string;
  name: string;
  reference: string;
  /** USD */
  price: number;
  changePercent: number;
  /** crownly_listings | crownly_sales | watchcharts */
  source?: string;
};

export type MarketTickerBenchmark = {
  id: string;
  name: string;
  reference: string;
  brandMatch: string;
  modelMatch?: string;
  referenceMatch?: string;
  watchChartsBrand?: string;
  watchChartsReference?: string;
};

/** References tracked by the home ticker (server matches Crownly listings + sales). */
export const MARKET_TICKER_BENCHMARKS: MarketTickerBenchmark[] = [
  {
    id: "sub",
    name: "Rolex Submariner",
    reference: "126610LN",
    brandMatch: "Rolex",
    modelMatch: "Submariner",
    referenceMatch: "126610",
    watchChartsBrand: "rolex",
    watchChartsReference: "126610ln",
  },
  {
    id: "nautilus",
    name: "Patek Nautilus",
    reference: "5711/1A",
    brandMatch: "Patek",
    modelMatch: "Nautilus",
    referenceMatch: "5711",
    watchChartsBrand: "patek philippe",
    watchChartsReference: "5711",
  },
  {
    id: "ro",
    name: "AP Royal Oak",
    reference: "15500ST",
    brandMatch: "Audemars",
    modelMatch: "Royal Oak",
    referenceMatch: "15500",
    watchChartsBrand: "audemars piguet",
    watchChartsReference: "15500",
  },
  {
    id: "speedy",
    name: "Omega Speedmaster",
    reference: "310.30",
    brandMatch: "Omega",
    modelMatch: "Speedmaster",
    referenceMatch: "310.30",
    watchChartsBrand: "omega",
    watchChartsReference: "310.30",
  },
  {
    id: "daytona",
    name: "Rolex Daytona",
    reference: "116500LN",
    brandMatch: "Rolex",
    modelMatch: "Daytona",
    referenceMatch: "116500",
    watchChartsBrand: "rolex",
    watchChartsReference: "116500ln",
  },
  {
    id: "bb58",
    name: "Tudor Black Bay 58",
    reference: "M79030N",
    brandMatch: "Tudor",
    modelMatch: "Black Bay",
    referenceMatch: "79030",
    watchChartsBrand: "tudor",
    watchChartsReference: "79030",
  },
  {
    id: "gmt",
    name: "Rolex GMT-Master II",
    reference: "126710BLNR",
    brandMatch: "Rolex",
    modelMatch: "GMT",
    referenceMatch: "126710",
    watchChartsBrand: "rolex",
    watchChartsReference: "126710blnr",
  },
  {
    id: "aquanaut",
    name: "Patek Aquanaut",
    reference: "5167A",
    brandMatch: "Patek",
    modelMatch: "Aquanaut",
    referenceMatch: "5167",
    watchChartsBrand: "patek philippe",
    watchChartsReference: "5167",
  },
];

/** Offline / API failure fallback only — not shown when live data is available. */
export const MARKET_TICKER_FALLBACK: MarketTickerItem[] = [
  { id: "sub", name: "Rolex Submariner", reference: "126610LN", price: 14_200, changePercent: 0 },
  { id: "nautilus", name: "Patek Nautilus", reference: "5711/1A", price: 98_500, changePercent: 0 },
  { id: "ro", name: "AP Royal Oak", reference: "15500ST", price: 42_300, changePercent: 0 },
  { id: "daytona", name: "Rolex Daytona", reference: "116500LN", price: 36_900, changePercent: 0 },
  { id: "gmt", name: "Rolex GMT-Master II", reference: "126710BLNR", price: 18_600, changePercent: 0 },
];
