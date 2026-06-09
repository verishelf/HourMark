import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeQuickActions } from "@/components/HomeQuickActions";
import { MarketTickerMarquee } from "@/components/MarketTickerMarquee";
import { ProfileTabs } from "@/components/ProfileTabs";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { HOME_MARKET_TABS, type HomeMarketTab } from "@/constants/homeMarketTabs";
import { MARQUEE_MIN_HEIGHT, useHomeScroll } from "@/hooks/useCollapsingMarqueeScroll";
import { useTheme } from "@/hooks/useTheme";

const TAB_FADE_WIDTH = 88;
/** Fallback until the icon column is measured */
const TAB_ACTIONS_FALLBACK = 52;

type Props = {
  activeTab: HomeMarketTab;
  onTabChange: (tab: HomeMarketTab) => void;
  unreadNotifs?: number;
  onNotifications: () => void;
  onScanner: () => void;
  onCreatePost: () => void;
};

export function HomeFixedHeader({
  activeTab,
  onTabChange,
  unreadNotifs,
  onNotifications,
  onScanner,
  onCreatePost,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { marqueeVisibility, marqueeHeight, setMarqueeHeight, setTabsHeight, setTotalHeaderHeight } =
    useHomeScroll();
  const marqueeMeasuredRef = useRef(0);
  const tabsMeasuredRef = useRef(0);
  const [marqueeLayoutHeight, setMarqueeLayoutHeight] = useState(0);
  const [shellWidth, setShellWidth] = useState(0);
  const [actionsWidth, setActionsWidth] = useState(TAB_ACTIONS_FALLBACK);

  const tabsViewportWidth = Math.max(0, shellWidth - actionsWidth);

  const tabFadeColors = useMemo(
    () =>
      [
        `${Colors.background}00`,
        `${Colors.background}66`,
        `${Colors.background}CC`,
        Colors.background,
      ] as const,
    [colorScheme]
  );

  const reportHeights = useCallback(() => {
    const marquee = marqueeMeasuredRef.current;
    const tabs = tabsMeasuredRef.current;
    if (marquee > 0) setMarqueeHeight(marquee);
    if (tabs > 0) setTabsHeight(tabs);
  }, [setMarqueeHeight, setTabsHeight]);

  const marqueeClipStyle = useAnimatedStyle(() => {
    const h = marqueeHeight.value;
    if (h <= 0) {
      return { overflow: "hidden" as const };
    }
    return {
      height: h * marqueeVisibility.value,
      overflow: "hidden" as const,
    };
  });

  return (
    <View
      style={{ backgroundColor: Colors.background, paddingTop: insets.top }}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (height > 0) setTotalHeaderHeight(height);
      }}
    >
      <Animated.View style={marqueeClipStyle}>
        <View
          style={marqueeLayoutHeight > 0 ? { height: marqueeLayoutHeight } : undefined}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height >= MARQUEE_MIN_HEIGHT) {
              marqueeMeasuredRef.current = height;
              setMarqueeLayoutHeight((prev) =>
                height >= MARQUEE_MIN_HEIGHT ? Math.max(prev, height) : prev
              );
              setMarqueeHeight(height);
              reportHeights();
            }
          }}
        >
          <MarketTickerMarquee omitSafeArea compact />
        </View>
      </Animated.View>

      <View style={styles.tabsBlock}>
        <View
          style={styles.tabsShell}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width > 0) setShellWidth(width);
          }}
        >
          <View
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              if (height > 0) {
                tabsMeasuredRef.current = height;
                setTabsHeight(height);
                reportHeights();
              }
            }}
          >
            <ProfileTabs
              tabs={[...HOME_MARKET_TABS]}
              active={activeTab}
              onChange={onTabChange}
              trailingInset={actionsWidth + TAB_FADE_WIDTH}
              scrollViewportWidth={tabsViewportWidth}
              leftAnchorTab="marketplace"
              showPreviousTab
              homeHeader
            />
          </View>

          <LinearGradient
            pointerEvents="none"
            colors={tabFadeColors}
            locations={[0, 0.25, 0.65, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.tabFade, { right: actionsWidth, width: TAB_FADE_WIDTH }]}
          />

          <View style={styles.actionsOverlay} pointerEvents="box-none">
            <View
              style={styles.actionsSlot}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                if (width > 0) setActionsWidth(width);
              }}
            >
              <HomeQuickActions
                unreadNotifs={unreadNotifs}
                onNotifications={onNotifications}
                onScanner={onScanner}
                onCreatePost={onCreatePost}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsBlock: {
    marginBottom: 0,
  },
  tabsShell: {
    position: "relative",
  },
  tabFade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  actionsOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: "center",
  },
  actionsSlot: {
    backgroundColor: Colors.background,
    paddingRight: SPACING.screen,
    justifyContent: "center",
    alignItems: "flex-end",
  },
});
