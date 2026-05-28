import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Href, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { signInWithEmail, signInWithApple } from "@/services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    ...Typography.body,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 20,
  };

  const afterSignIn = () => {
    if (typeof redirect === "string" && redirect.startsWith("/")) {
      router.replace(redirect as Href);
      return;
    }
    router.replace("/(tabs)");
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      afterSignIn();
    } catch (e) {
      Alert.alert(
        "Sign In",
        e instanceof Error ? e.message : "Check your credentials or use demo mode without Supabase."
      );
      afterSignIn();
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential.identityToken) {
        await signInWithApple(credential.identityToken, nonce);
        afterSignIn();
      }
    } catch (e) {
      if ((e as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Sign In", "Unable to sign in with Apple.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          justifyContent: "center",
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: 32 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 24 }}>←</Text>
        </Pressable>

        <Text style={{ ...Typography.hero, color: Colors.textPrimary, fontSize: 36, marginBottom: 8 }}>
          Welcome
        </Text>
        <Text style={{ ...Typography.body, color: Colors.textSecondary, marginBottom: 40 }}>
          Sign in to HourMark
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={inputStyle}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={inputStyle}
        />

        <LuxuryButton label="Sign In" onPress={handleLogin} loading={loading} />

        <View style={{ height: 24 }} />

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={2}
            style={{ width: "100%", height: 52, marginBottom: 16 }}
            onPress={handleAppleSignIn}
          />
        )}

        <LuxuryButton
          label="Continue with Google"
          onPress={() =>
            Alert.alert("Google Sign In", "Configure Google OAuth in Supabase dashboard.")
          }
          variant="outline"
        />

        <Pressable onPress={() => router.push("/auth/signup")} style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
            Don't have an account? Create one
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)")} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
            Browse as guest
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
