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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
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
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 20,
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
      router.replace("/(tabs)");
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
          <Text
            style={{
              ...Typography.hero,
              color: Colors.textPrimary,
              fontSize: 36,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Join HourMark
          </Text>
          <Text
            style={{
              ...Typography.body,
              color: Colors.textSecondary,
              marginBottom: 28,
              textAlign: "center",
            }}
          >
            Create your collector account
          </Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={inputStyle}
          />
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

          <LuxuryButton label="Create Account" onPress={handleSignup} loading={loading} size="large" />

          <Pressable
            onPress={() => router.push("/auth/login")}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
              Already have an account? Sign in
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
