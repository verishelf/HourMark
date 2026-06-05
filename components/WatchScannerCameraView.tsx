import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
import { OverlayTextColors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  onClose: () => void;
  onCapture: (uri: string) => void;
  loading?: boolean;
};

export function WatchScannerCameraView({ onClose, onCapture, loading }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    void Camera.getCameraPermissionsAsync().then((result) => {
      setGranted(result.granted);
    });
  }, []);

  const requestPermission = async () => {
    const result = await Camera.requestCameraPermissionsAsync();
    setGranted(result.granted);
  };

  const handleIdentify = async () => {
    if (!cameraRef.current || !cameraReady || capturing || loading) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const busy = capturing || loading;
  const showCamera = granted === true;

  return (
    <View style={styles.screen}>
      {!showCamera ? (
        <View style={[styles.permission, { paddingTop: insets.top + 24 }]}>
          <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
            <Ionicons name="close" size={28} color={OverlayTextColors.primary} />
          </Pressable>
          <View style={styles.permissionBody}>
            <Ionicons name="camera-outline" size={48} color={OverlayTextColors.secondary} />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBodyText}>
              Allow camera access to scan and identify watches from your wrist or collection.
            </Text>
            <LuxuryButton
              label="Allow camera"
              onPress={() => void requestPermission()}
              variant="onDark"
              size="large"
            />
          </View>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />

          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
              <Ionicons name="close" size={28} color={OverlayTextColors.primary} />
            </Pressable>
          </View>

          <View style={styles.viewfinder} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>Center the dial or case in the frame</Text>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <LuxuryButton
              label={busy ? "Identifying…" : "Identify watch"}
              onPress={handleIdentify}
              variant="onDark"
              size="large"
              loading={busy}
              disabled={!cameraReady || busy}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: SPACING.screen,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  frame: {
    width: "72%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  hint: {
    ...Typography.caption,
    color: OverlayTextColors.secondary,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingHorizontal: SPACING.screen,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  permission: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: SPACING.screen,
  },
  permissionBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  permissionTitle: {
    ...Typography.h3,
    color: OverlayTextColors.primary,
    textAlign: "center",
    marginTop: 8,
  },
  permissionBodyText: {
    ...Typography.body,
    color: OverlayTextColors.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
});
