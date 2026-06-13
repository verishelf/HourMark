export const HOME_MARKET_TABS = [
  { key: "marketplace", label: "Marketplace" },
  { key: "auctions", label: "Auctions" },
  { key: "best_sellers", label: "Best Sellers" },
  { key: "low_price", label: "Low Price" },
  { key: "new_arrivals", label: "New Arrivals" },
  { key: "rare_finds", label: "Rare Finds" },
] as const;

export type HomeMarketTab = (typeof HOME_MARKET_TABS)[number]["key"];
