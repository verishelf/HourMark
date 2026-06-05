import type { WatchScanResult } from "@/types";

let pendingScanResult: WatchScanResult | null = null;

export function setPendingScanResult(result: WatchScanResult) {
  pendingScanResult = result;
}

export function consumePendingScanResult(): WatchScanResult | null {
  const result = pendingScanResult;
  pendingScanResult = null;
  return result;
}
