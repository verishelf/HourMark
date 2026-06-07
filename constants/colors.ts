export type ColorPalette = {
  background: string;
  card: string;
  cardElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  overlay: string;
  success: string;
  error: string;
};

export const DarkColors: ColorPalette = {
  background: "#000000",
  card: "#0A0A0A",
  cardElevated: "#111111",
  border: "#1A1A1A",
  borderLight: "#27272A",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  overlay: "rgba(0, 0, 0, 0.7)",
  success: "#22C55E",
  error: "#EF4444",
};

export const LightColors: ColorPalette = {
  background: "#FFFFFF",
  card: "#FAFAFA",
  cardElevated: "#F4F4F5",
  border: "#E4E4E7",
  borderLight: "#D4D4D8",
  textPrimary: "#09090B",
  textSecondary: "#52525B",
  textMuted: "#A1A1AA",
  overlay: "rgba(0, 0, 0, 0.45)",
  success: "#16A34A",
  error: "#DC2626",
};

/** Active palette — updated when the user switches theme. */
export const Colors: ColorPalette = { ...DarkColors };

export function applyColorPalette(palette: ColorPalette) {
  Object.assign(Colors, palette);
}

export const SELLER_FEE_RATE = 0.07;

/** Platform listing fee deducted from seller payout (Stripe application fee). */
export const COMMISSION_RATE = SELLER_FEE_RATE;

export type ColorScheme = "dark" | "light";

/** Text on dark photo overlays — always light regardless of app theme */
export const OverlayTextColors = {
  primary: "#FFFFFF",
  secondary: "rgba(255,255,255,0.75)",
  muted: "rgba(255,255,255,0.65)",
} as const;

/** Circular icon buttons on photos — fixed dark chip + light icons */
export const ImageOverlayButtonColors = {
  background: "rgba(0, 0, 0, 0.55)",
  icon: OverlayTextColors.primary,
  iconMuted: OverlayTextColors.secondary,
} as const;
