import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Href, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Image
        source={{ uri: LOGGED_OUT_GATE_IMAGES.signup }}
        style={styles.background}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
          justifyContent: "center",
        }}
      >
        <View style={styles.card}>
          <Text
            style={{
              ...Typography.hero,
              color: Colors.textPrimary,
              fontSize: 36,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              ...Typography.body,
              color: Colors.textSecondary,
              marginBottom: 28,
              textAlign: "center",
            }}
          >
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

          <LuxuryButton label="Sign In" onPress={handleLogin} loading={loading} size="large" />

          <View style={{ height: 18 }} />

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={2}
              style={{ width: "100%", height: 52, marginBottom: 12 }}
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

          <Pressable
            onPress={() => router.push("/auth/signup")}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
              Don't have an account? Create one
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
              Browse as guest
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: "rgba(10, 10, 10, 0.78)",
    padding: 20,
  },
});
