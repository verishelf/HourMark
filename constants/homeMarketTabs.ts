export const HOME_MARKET_TABS = [
  { key: "marketplace", label: "Marketplace" },
  { key: "auctions", label: "Auctions" },
  { key: "arbitrage", label: "Arbitrage" },
  { key: "charts", label: "Charts" },
  { key: "grails", label: "Grails" },
] as const;

export type HomeMarketTab = (typeof HOME_MARKET_TABS)[number]["key"];
