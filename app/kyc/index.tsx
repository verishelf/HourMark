import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { submitKyc } from "@/services/kyc";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <Text style={{ ...Typography.h2, color: Colors.textPrimary, marginTop: 12 }}>
          Seller Verification
        </Text>
      </View>
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          padding: SPACING.screen,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Text style={{ ...Typography.body, color: Colors.textMuted }}>
          Government ID, selfie, and phone verification power your Verified Seller badge.
        </Text>

        <Pressable
          onPress={() => pick(setIdUri)}
          style={{ marginTop: 24, borderWidth: 1, borderColor: Colors.border, padding: 16 }}
        >
          <Text style={{ color: Colors.textPrimary }}>Government ID</Text>
          {idUri && <Image source={{ uri: idUri }} style={{ width: 80, height: 50, marginTop: 8 }} />}
        </Pressable>

        <Pressable
          onPress={() => pick(setSelfieUri)}
          style={{ marginTop: 12, borderWidth: 1, borderColor: Colors.border, padding: 16 }}
        >
          <Text style={{ color: Colors.textPrimary }}>Selfie (face match)</Text>
          {selfieUri && (
            <Image source={{ uri: selfieUri }} style={{ width: 80, height: 80, marginTop: 8 }} />
          )}
        </Pressable>

        <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 20 }}>
          PHONE
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 555 000 0000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            color: Colors.textPrimary,
            paddingVertical: 10,
            marginTop: 8,
          }}
        />
      </ScrollView>

      <View style={{ padding: SPACING.screen, paddingBottom: insets.bottom + 16 }}>
        <LuxuryButton
          label={loading ? "Verifying…" : "Submit verification"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </View>
  );
}
