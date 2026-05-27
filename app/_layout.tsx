import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe";
import { Colors } from "@/constants/colors";

export default function RootLayout() {
  useEffect(() => {
    // Reanimated is configured via babel plugin
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"}
        merchantIdentifier="merchant.com.hourmark.app"
        urlScheme="hourmark"
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="listing/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="checkout/index"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen name="auth/login" options={{ animation: "fade" }} />
          <Stack.Screen name="auth/signup" options={{ animation: "fade" }} />
          <Stack.Screen
            name="chat/[id]"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
