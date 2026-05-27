import { TextStyle } from "react-native";

export const Typography = {
  hero: {
    fontSize: 42,
    fontWeight: "300" as const,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  h1: {
    fontSize: 32,
    fontWeight: "300" as const,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: "400" as const,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontWeight: "500" as const,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 1.2,
    lineHeight: 14,
    textTransform: "uppercase" as const,
  },
  price: {
    fontSize: 28,
    fontWeight: "300" as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
} satisfies Record<string, TextStyle>;
