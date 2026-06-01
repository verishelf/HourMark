import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { submitKyc } from "@/services/kyc";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

async function uploadKycFile(userId: string, kind: "id" | "selfie", uri: string): Promise<string> {
  if (!isSupabaseConfigured) return `${userId}/${kind}/mock`;

  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  const path = `${userId}/${kind}_${Date.now()}.jpg`;

  const { error } = await supabase.storage.from("kyc-documents").upload(path, buffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [idUri, setIdUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const pick = async (setter: (u: string) => void) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!res.canceled && res.assets[0]?.uri) setter(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!user?.id || !idUri || !selfieUri || !phone.trim()) {
      Alert.alert("Missing info", "Upload ID, selfie, and enter your phone number.");
      return;
    }

    setLoading(true);
    try {
      const idPath = await uploadKycFile(user.id, "id", idUri);
      const selfiePath = await uploadKycFile(user.id, "selfie", selfieUri);
      const result = await submitKyc({
        idDocumentPath: idPath,
        selfiePath,
        phoneNumber: phone.trim(),
      });
      await refreshProfile();
      Alert.alert(
        result.verified ? "Verified Seller" : "Submitted",
        result.verified
          ? "You can now publish authenticated listings."
          : "Identity verification is in progress.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "KYC failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadRow = (
    label: string,
    hint: string,
    uri: string | null,
    onPick: () => void,
    previewSize: { width: number; height: number }
  ) => (
    <Pressable style={styles.listRow} onPress={onPick}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: previewSize.width, height: previewSize.height, borderRadius: RADIUS.sm }}
          contentFit="cover"
        />
      ) : (
        <View style={styles.iconTile}>
          <Ionicons name="cloud-upload-outline" size={22} color={Colors.textPrimary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSub}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FeatureScreenScaffold contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <ScreenHeader
          title="Seller Verification"
          subtitle="Government ID, selfie, and phone for your Verified Seller badge"
        />

        {uploadRow("Government ID", "Front of driver's license or passport", idUri, () => pick(setIdUri), {
          width: 56,
          height: 36,
        })}
        {uploadRow("Selfie", "Face match for identity confirmation", selfieUri, () => pick(setSelfieUri), {
          width: 48,
          height: 48,
        })}

        <View style={[styles.formCard, { marginTop: 8 }]}>
          <FeatureFormField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555 000 0000"
            keyboardType="phone-pad"
          />
        </View>
      </FeatureScreenScaffold>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: SPACING.screen,
          paddingBottom: insets.bottom + 16,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <LuxuryButton
          label={loading ? "Verifying…" : "Submit verification"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </View>
  );
}
