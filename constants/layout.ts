export const SPACING = {
  screen: 20,
  section: 32,
  tabBarHeight: 56,
  tabClearance: 88,
} as const;

/** Gap between listing cards in grids and horizontal rows */
export const CARD_GAP = 16;

/** Extra spacing between cards in horizontal scroll rows */
export const HORIZONTAL_CARD_GAP = 20;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Shared corner radius for listing cards across the app */
export const LISTING_CARD_RADIUS = RADIUS.lg;
