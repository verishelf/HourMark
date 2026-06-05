import { useState } from "react";
import { useRouter } from "expo-router";
import { WatchScannerCameraView } from "@/components/WatchScannerCameraView";
import { setPendingScanResult } from "@/lib/scannerSession";
import { scanWatchFromImage } from "@/services/scanner";

export default function ScannerCameraScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCapture = async (uri: string) => {
    setLoading(true);
    try {
      setPendingScanResult(await scanWatchFromImage(uri));
    } finally {
      setLoading(false);
      router.replace("/scanner");
    }
  };

  return (
    <WatchScannerCameraView
      onClose={() => router.back()}
      onCapture={handleCapture}
      loading={loading}
    />
  );
}
