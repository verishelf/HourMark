import { StyleSheet } from "react-native";
import { CARD_GAP, SPACING } from "@/constants/layout";
import { Colors } from "@/constants/colors";

export const GRID_GAP = CARD_GAP;

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: SPACING.screen,
  },
  section: {
    marginBottom: SPACING.section,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});

export function tabContentPadding(bottomInset: number) {
  return { paddingBottom: bottomInset + SPACING.tabClearance };
}

export function screenContentPadding(bottomInset: number) {
  return {
    paddingHorizontal: SPACING.screen,
    paddingBottom: bottomInset + SPACING.tabClearance,
  };
}

export function gridColumnStyle(index: number) {
  return {
    paddingLeft: index % 2 === 0 ? 0 : GRID_GAP / 2,
    paddingRight: index % 2 === 0 ? GRID_GAP / 2 : 0,
    marginBottom: GRID_GAP,
  };
}

export function gridItemStyle(index: number) {
  return {
    flex: 1,
    ...gridColumnStyle(index),
  };
}
