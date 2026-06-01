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
import { useRouter } from "expo-router";
import { resetToApp } from "@/lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { formatAppleSignInError, performAppleSignIn } from "@/lib/appleSignIn";
import { LuxuryButton } from "@/components/LuxuryButton";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { signUpWithEmail } from "@/services/auth";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    ...Typography.body,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)",
    paddingVertical: 14,
    marginBottom: 20,
  };

  const afterAuth = () => resetToApp();

  const handleAppleSignUp = async () => {
    setLoading(true);
    try {
      await performAppleSignIn();
      afterAuth();
    } catch (e) {
      const message = formatAppleSignInError(e);
      if (message) {
        Alert.alert("Apple Sign In", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, username);
      Alert.alert("Welcome", "Check your email to verify your account.");
      resetToApp();
    } catch (e) {
      Alert.alert("Sign Up", e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          <CrownlyLogo width={100} style={styles.logo} />

          <Text style={styles.title}>Join Crownly</Text>
          <Text style={styles.subtitle}>Create your collector account</Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="rgba(255,255,255,0.65)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={inputStyle}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.65)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.65)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={inputStyle}
          />

          <LuxuryButton
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="large"
            variant="onDark"
          />

          <View style={{ height: 18 }} />

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={2}
              style={{ width: "100%", height: 52, marginBottom: 12 }}
              onPress={handleAppleSignUp}
            />
          )}

          <Pressable
            onPress={() => router.push("/auth/login")}
            style={{ marginTop: 20, alignItems: "center", paddingVertical: 8 }}
            hitSlop={8}
          >
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkAccent}>Sign in</Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={() => resetToApp()}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={styles.linkMuted}>Browse as guest</Text>
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
  logo: {
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    ...Typography.hero,
    color: "#FFFFFF",
    fontSize: 36,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 28,
    textAlign: "center",
  },
  link: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.75)",
  },
  linkAccent: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  linkMuted: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.65)",
  },
});
