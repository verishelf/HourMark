import { createContext, useCallback, useContext, type ReactNode } from "react";
import { HOME_HEADER_CONTENT_ESTIMATE } from "@/constants/layout";
import {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SCROLL_THRESHOLD = 6;
const TOP_LOCK_THRESHOLD = 16;
const ANIMATION_MS = 220;
/** Full marquee row height; ignore collapsed onLayout remeasures below this. */
export const MARQUEE_MIN_HEIGHT = 20;

type HomeScrollState = {
  marqueeVisibility: ReturnType<typeof useSharedValue<number>>;
  marqueeHeight: ReturnType<typeof useSharedValue<number>>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  setMarqueeHeight: (height: number) => void;
  setTabsHeight: (height: number) => void;
  setTotalHeaderHeight: (height: number) => void;
  resetMarquee: () => void;
  headerInsetStyle: ReturnType<typeof useAnimatedStyle>;
};

const HomeScrollContext = createContext<HomeScrollState | null>(null);

export function useHomeScroll() {
  const ctx = useContext(HomeScrollContext);
  if (!ctx) {
    throw new Error("useHomeScroll must be used within HomeScrollProvider");
  }
  return ctx;
}

export function HomeScrollProvider({
  topInset,
  children,
}: {
  topInset: number;
  children: ReactNode;
}) {
  const value = useCollapsingMarqueeScroll(topInset);
  return <HomeScrollContext.Provider value={value}>{children}</HomeScrollContext.Provider>;
}

function useCollapsingMarqueeScroll(topInset: number): HomeScrollState {
  const marqueeVisibility = useSharedValue(1);
  const marqueeHeight = useSharedValue(0);
  const tabsHeight = useSharedValue(0);
  const totalHeaderHeight = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const setMarqueeHeight = useCallback(
    (height: number) => {
      if (height < MARQUEE_MIN_HEIGHT) return;
      if (marqueeHeight.value >= MARQUEE_MIN_HEIGHT && height < marqueeHeight.value) return;
      marqueeHeight.value = height;
    },
    [marqueeHeight]
  );

  const setTabsHeight = useCallback(
    (height: number) => {
      tabsHeight.value = height;
    },
    [tabsHeight]
  );

  const setTotalHeaderHeight = useCallback(
    (height: number) => {
      if (height > 0) totalHeaderHeight.value = height;
    },
    [totalHeaderHeight]
  );

  const resetMarquee = useCallback(() => {
    marqueeVisibility.value = 1;
    lastScrollY.value = 0;
  }, [marqueeVisibility, lastScrollY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const diff = y - lastScrollY.value;

      if (y <= TOP_LOCK_THRESHOLD) {
        if (marqueeVisibility.value < 1) {
          marqueeVisibility.value = withTiming(1, { duration: ANIMATION_MS });
        }
      } else if (diff > SCROLL_THRESHOLD) {
        if (marqueeVisibility.value > 0) {
          marqueeVisibility.value = withTiming(0, { duration: ANIMATION_MS });
        }
      } else if (diff < -SCROLL_THRESHOLD) {
        if (marqueeVisibility.value < 1) {
          marqueeVisibility.value = withTiming(1, { duration: ANIMATION_MS });
        }
      }

      lastScrollY.value = y;
    },
  });

  const headerInsetStyle = useAnimatedStyle(() => {
    const v = marqueeVisibility.value;
    const measured = totalHeaderHeight.value;
    const computed = topInset + tabsHeight.value + marqueeHeight.value * v;
    const fallback = topInset + HOME_HEADER_CONTENT_ESTIMATE;
    return {
      paddingTop: measured > 0 ? measured : Math.max(computed, fallback),
    };
  });

  return {
    marqueeVisibility,
    marqueeHeight,
    scrollHandler,
    setMarqueeHeight,
    setTabsHeight,
    setTotalHeaderHeight,
    resetMarquee,
    headerInsetStyle,
  };
}
