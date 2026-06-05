export type MarketTickerItem = {
  id: string;
  name: string;
  reference: string;
  price: number;
  changePercent: number;
};

/** Curated luxury watch market snapshot for the home ticker. */
export const MARKET_TICKER_ITEMS: MarketTickerItem[] = [
  { id: "sub", name: "Rolex Submariner", reference: "126610LN", price: 14_200, changePercent: 1.2 },
  { id: "nautilus", name: "Patek Nautilus", reference: "5711/1A", price: 98_500, changePercent: -0.8 },
  { id: "ro", name: "AP Royal Oak", reference: "15500ST", price: 42_300, changePercent: 2.1 },
  { id: "speedy", name: "Omega Speedmaster", reference: "310.30", price: 6_850, changePercent: 0.4 },
  { id: "daytona", name: "Rolex Daytona", reference: "116500LN", price: 36_900, changePercent: -1.1 },
  { id: "bb58", name: "Tudor Black Bay 58", reference: "M79030N", price: 3_450, changePercent: 0.9 },
  { id: "rm", name: "Richard Mille", reference: "RM 67-02", price: 285_000, changePercent: 0.3 },
  { id: "santos", name: "Cartier Santos", reference: "WSSA0029", price: 7_200, changePercent: -0.2 },
  { id: "gmt", name: "Rolex GMT-Master II", reference: "126710BLNR", price: 18_600, changePercent: 1.5 },
  { id: "aquanaut", name: "Patek Aquanaut", reference: "5167A", price: 52_400, changePercent: -0.6 },
];
