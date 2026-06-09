export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  screen: 20,
  section: 32,
  tabBarHeight: 56,
  tabClearance: 88,
} as const;

/** Horizontal inset for story article text (hero/images can stay edge-to-edge). */
export const STORY_GUTTER = 12;

/** Extra spacing between cards in horizontal scroll rows */
export const HORIZONTAL_CARD_GAP = 20;

/** Gap between listing cards in grids and vertical stacks */
export const CARD_GAP = SPACING.lg;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Shared corner radius for listing cards across the app */
export const LISTING_CARD_RADIUS = RADIUS.lg;

/** Featured home carousel slide height */
export const FEATURED_CAROUSEL_HEIGHT = 520;

/** Horizontal compact listing card row height (image + body) */
export const HORIZONTAL_LISTING_ROW_HEIGHT = 300;

/** Featured story card in horizontal rows (home + related) */
export const STORY_FEATURED_CARD_WIDTH = 300;
export const STORY_FEATURED_CARD_SNAP_INTERVAL = STORY_FEATURED_CARD_WIDTH + SPACING.md;

/** Suggested watch chips on story detail */
export const SUGGESTED_WATCH_CARD_WIDTH = 160;
export const SUGGESTED_WATCH_CARD_SNAP_INTERVAL = SUGGESTED_WATCH_CARD_WIDTH + SPACING.md;

/** Marquee + tab row below safe area — used until HomeFixedHeader onLayout fires */
export const HOME_HEADER_CONTENT_ESTIMATE = 96;
