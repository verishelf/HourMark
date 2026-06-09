import { useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

type Tab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
  /** Extra right padding so horizontal tabs can scroll clear of a trailing overlay */
  trailingInset?: number;
  /** Reserve right edge so tab labels stop before an overlay (home header icons) */
  clipRight?: number;
  /** Home header: no top margin, tighter vertical padding */
  homeHeader?: boolean;
  /** Visible width of the tab scroller — used to scroll pressed tabs into view */
  scrollViewportWidth?: number;
  /** Tab that stays left-aligned at scroll position 0 (others center on press) */
  leftAnchorTab?: T;
  /** Home header: keep the previous tab peeking on the left for quick back navigation */
  showPreviousTab?: boolean;
};

export function useProfileTabStyles(homeHeader = false) {
  const { colorScheme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        tabsRow: {
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          marginTop: homeHeader ? 0 : 8,
          marginBottom: 0,
          marginHorizontal: -SPACING.screen,
        },
        tabButton: {
          alignItems: "center",
          paddingTop: homeHeader ? 14 : 14,
          paddingBottom: homeHeader ? 14 : 16,
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: "transparent",
          marginBottom: -1,
        },
        tabsScrollContent: {
          flexDirection: "row",
          paddingHorizontal: SPACING.screen,
          gap: 4,
        },
        tabButtonActive: {
          borderBottomColor: Colors.textPrimary,
        },
        tabLabel: {
          ...Typography.caption,
          color: Colors.textMuted,
          fontWeight: "400",
          fontSize: 14,
          letterSpacing: 0.3,
          flexShrink: 0,
        },
        tabLabelActive: {
          color: Colors.textPrimary,
          fontWeight: "600",
        },
        tabContent: {
          minHeight: 100,
          marginTop: 0,
          paddingTop: 0,
        },
        tabContentPadded: {
          paddingTop: 16,
        },
        tabContentListings: {
          paddingTop: 24,
          paddingBottom: 24,
        },
      }),
    [colorScheme, homeHeader]
  );
}

export function ProfileTabs<T extends string>({
  tabs,
  active,
  onChange,
  trailingInset = 0,
  clipRight = 0,
  homeHeader = false,
  scrollViewportWidth = 0,
  leftAnchorTab,
  showPreviousTab = false,
}: Props<T>) {
  const profileTabStyles = useProfileTabStyles(homeHeader);
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Partial<Record<T, { x: number; width: number }>>>({});
  const contentWidthRef = useRef(0);
  const lockTabScroll = homeHeader && scrollViewportWidth > 0;

  const scrollToTab = (key: T, animated = true) => {
    if (scrollViewportWidth <= 0) return;

    if (leftAnchorTab !== undefined && key === leftAnchorTab) {
      scrollRef.current?.scrollTo({ x: 0, animated });
      return;
    }

    const layout = tabLayouts.current[key];
    if (!layout) return;

    const maxScrollX = Math.max(0, contentWidthRef.current - scrollViewportWidth);
    let targetX: number;

    if (showPreviousTab) {
      const tabIndex = tabs.findIndex((t) => t.key === key);
      const previousTab = tabIndex > 0 ? tabs[tabIndex - 1] : undefined;
      const previousLayout = previousTab ? tabLayouts.current[previousTab.key] : undefined;

      if (previousLayout) {
        targetX = previousLayout.x;
      } else {
        targetX = layout.x;
      }

      // Keep the active tab fully clear of the trailing icon column
      const activeRight = layout.x + layout.width;
      targetX = Math.max(targetX, activeRight - scrollViewportWidth);
    } else {
      const tabCenter = layout.x + layout.width / 2;
      targetX = tabCenter - scrollViewportWidth / 2;
    }

    targetX = Math.min(Math.max(0, targetX), maxScrollX);
    scrollRef.current?.scrollTo({ x: targetX, animated });
  };

  useEffect(() => {
    if (!lockTabScroll) return;
    scrollToTab(active, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll when active tab or viewport changes
  }, [active, lockTabScroll, scrollViewportWidth, showPreviousTab]);

  const handleTabPress = (key: T) => {
    scrollToTab(key, true);
    onChange(key);
  };

  const saveTabLayout = (key: T, x: number, width: number) => {
    tabLayouts.current[key] = { x, width };
    if (lockTabScroll && key === active) {
      scrollToTab(key, false);
    }
  };

  return (
    <View style={[profileTabStyles.tabsRow, clipRight > 0 ? { marginRight: clipRight } : null]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        scrollEnabled={!lockTabScroll}
        {...HIDE_SCROLL_INDICATORS}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          profileTabStyles.tabsScrollContent,
          lockTabScroll
            ? {
                paddingLeft: SPACING.screen,
                paddingRight: trailingInset > 0 ? trailingInset : scrollViewportWidth / 2,
              }
            : null,
          trailingInset > 0 ? { paddingRight: trailingInset } : null,
        ]}
        onContentSizeChange={(width) => {
          contentWidthRef.current = width;
        }}
      >
        {tabs.map((t) => {
          const selected = active === t.key;
          return (
            <Pressable
              key={t.key}
              onLayout={(event) => {
                saveTabLayout(
                  t.key,
                  event.nativeEvent.layout.x,
                  event.nativeEvent.layout.width
                );
              }}
              onPress={() => handleTabPress(t.key)}
              style={[profileTabStyles.tabButton, selected && profileTabStyles.tabButtonActive]}
            >
              <Text
                numberOfLines={1}
                style={[profileTabStyles.tabLabel, selected && profileTabStyles.tabLabelActive]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
