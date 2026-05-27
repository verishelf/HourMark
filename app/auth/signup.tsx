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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
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
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
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
          Join HourMark
        </Text>
        <Text style={{ ...Typography.body, color: Colors.textSecondary, marginBottom: 40 }}>
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

        <LuxuryButton label="Create Account" onPress={handleSignup} loading={loading} />

        <Pressable onPress={() => router.push("/auth/login")} style={{ marginTop: 32, alignItems: "center" }}>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
            Already have an account? Sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
