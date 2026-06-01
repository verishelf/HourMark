import { Platform } from "react-native";
import Constants from "expo-constants";
import { isPlatformPaySupported, PlatformPay } from "@stripe/stripe-react-native";
import { isStripeConfigured } from "@/lib/stripe";

export const APPLE_PAY_MERCHANT_COUNTRY = "US";
export const APPLE_PAY_CURRENCY = "USD";

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export async function getApplePayAvailability(): Promise<{
  canUseNativeButton: boolean;
  reason: string | null;
}> {
  if (Platform.OS !== "ios") {
    return { canUseNativeButton: false, reason: null };
  }

  if (!isStripeConfigured) {
    return {
      canUseNativeButton: false,
      reason: "Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env and restart Expo.",
    };
  }

  if (isExpoGo()) {
    return {
      canUseNativeButton: false,
      reason:
        "Apple Pay is not available in Expo Go. Install a Crownly dev build: npx eas build --platform ios --profile development",
    };
  }

  try {
    const supported = await isPlatformPaySupported();
    if (!supported) {
      return {
        canUseNativeButton: false,
        reason: "Add a card to Apple Wallet (Settings → Wallet) on this iPhone.",
      };
    }
    return { canUseNativeButton: true, reason: null };
  } catch {
    return {
      canUseNativeButton: false,
      reason: "Apple Pay could not be initialized on this device.",
    };
  }
}

export function buildApplePayCartItems(
  label: string,
  amountCents: number
): PlatformPay.CartSummaryItem[] {
  const amount = (amountCents / 100).toFixed(2);
  return [
    {
      label,
      amount,
      paymentType: PlatformPay.PaymentType.Immediate,
    },
  ];
}
