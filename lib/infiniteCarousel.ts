import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlatList } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export function buildLoopedData<T>(items: readonly T[]): {
  loopData: T[];
  startIndex: number;
  realCount: number;
} {
  const realCount = items.length;
  if (realCount <= 1) {
    return { loopData: [...items], startIndex: 0, realCount };
  }
  return {
    loopData: [items[realCount - 1], ...items, items[0]],
    startIndex: 1,
    realCount,
  };
}

export function loopIndexToReal(loopIndex: number, realCount: number): number {
  if (realCount <= 1) return 0;
  if (loopIndex === 0) return realCount - 1;
  if (loopIndex === realCount + 1) return 0;
  return loopIndex - 1;
}

type InfiniteCarouselOptions = {
  initialScroll?: boolean;
};

export function useInfiniteCarousel<T>(
  items: readonly T[],
  pageWidth: number,
  options?: InfiniteCarouselOptions
) {
  const { loopData, startIndex, realCount } = useMemo(
    () => buildLoopedData(items),
    [items]
  );
  const listRef = useRef<FlatList<T>>(null);
  const loopIndexRef = useRef(startIndex);
  const [realIndex, setRealIndex] = useState(0);

  useEffect(() => {
    if (!options?.initialScroll || realCount <= 1) return;
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: startIndex, animated: false });
      loopIndexRef.current = startIndex;
      setRealIndex(0);
    }, 0);
    return () => clearTimeout(id);
  }, [options?.initialScroll, realCount, startIndex]);

  const syncFromLoopIndex = useCallback(
    (loopIndex: number, jumpIfNeeded: boolean) => {
      loopIndexRef.current = loopIndex;

      if (realCount <= 1) {
        setRealIndex(0);
        return;
      }

      if (jumpIfNeeded && loopIndex === 0) {
        listRef.current?.scrollToIndex({ index: realCount, animated: false });
        loopIndexRef.current = realCount;
        setRealIndex(realCount - 1);
        return;
      }

      if (jumpIfNeeded && loopIndex === realCount + 1) {
        listRef.current?.scrollToIndex({ index: 1, animated: false });
        loopIndexRef.current = 1;
        setRealIndex(0);
        return;
      }

      setRealIndex(loopIndexToReal(loopIndex, realCount));
    },
    [realCount]
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const loopIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      syncFromLoopIndex(loopIndex, true);
    },
    [pageWidth, syncFromLoopIndex]
  );

  const onViewableLoopIndexChanged = useCallback(
    (loopIndex: number) => {
      syncFromLoopIndex(loopIndex, false);
    },
    [syncFromLoopIndex]
  );

  const advance = useCallback(() => {
    if (realCount <= 1) return;
    const lastLoopIndex = realCount + 1;
    let current = loopIndexRef.current;

    // Past the trailing clone (or ref drifted ahead of scroll) — snap to first real slide.
    if (current >= lastLoopIndex) {
      listRef.current?.scrollToIndex({ index: 1, animated: false });
      current = 1;
      loopIndexRef.current = 1;
      setRealIndex(0);
    }

    const next = current + 1;
    if (next > lastLoopIndex) return;

    loopIndexRef.current = next;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setRealIndex(loopIndexToReal(next, realCount));
  }, [realCount]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  return {
    listRef,
    loopData,
    realCount,
    realIndex,
    loopIndexRef,
    startIndex,
    onMomentumScrollEnd,
    onViewableLoopIndexChanged,
    advance,
    getItemLayout,
  };
}
