import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithApple } from "@/services/auth";

function generateRawNonce(): string {
  const bytes = Crypto.getRandomBytes(32);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null
): string | null {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.middleName, fullName.familyName].filter(
    Boolean
  ) as string[];
  return parts.length ? parts.join(" ") : null;
}

export function formatAppleSignInError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: string }).code);
    if (code === "ERR_REQUEST_CANCELED") return "";
    if (code === "ERR_APPLE_AUTHENTICATION_UNAVAILABLE") {
      return "Sign in with Apple is not available on this device. Use a development build on iOS with an Apple ID signed in.";
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Unacceptable audience") || msg.includes("audience")) {
      return (
        "Apple client ID mismatch. In Supabase → Auth → Apple → Client IDs, add:\n" +
        "• com.crownly.app (dev/production builds)\n" +
        "• host.exp.Exponent (Expo Go only)"
      );
    }
    if (msg.includes("nonce")) {
      return "Apple sign-in nonce error. Please try again.";
    }
    if (msg.includes("not configured")) {
      return msg;
    }
    return msg;
  }

  return "Unable to sign in with Apple.";
}

/** Native Sign in with Apple → Supabase session (creates account on first use). */
export async function performAppleSignIn(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iOS.");
  }

  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env."
    );
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error(
      "Sign in with Apple is not available here. Use an iOS development build (npx expo run:ios) or EAS build—not all simulators support it."
    );
  }

  const rawNonce = generateRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token. Try again or check Supabase Apple provider settings.");
  }

  const { data, error } = await signInWithApple(credential.identityToken, rawNonce);
  if (error) throw error;

  const fullName = formatFullName(credential.fullName);
  if (fullName && data.user) {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        given_name: credential.fullName?.givenName ?? undefined,
        family_name: credential.fullName?.familyName ?? undefined,
      },
    });

    await supabase.from("users").update({ full_name: fullName }).eq("id", data.user.id);
  }
}
