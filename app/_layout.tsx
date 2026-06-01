import "react-native-reanimated";
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AuthNavigationGuard } from "@/components/AuthNavigationGuard";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe";
import { Colors } from "@/constants/colors";

function RootNavigation() {
  const { colorScheme } = useTheme();
  const { user } = useAuth();
  usePushNotifications(user?.id);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.crownly.app"
        urlScheme="crownly"
      >
        <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
        <AuthNavigationGuard />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="listing/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="seller/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="checkout/index"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="verify/index"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="profile/settings"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="profile/connections"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="profile/posts"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="post/create"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="post/edit/[id]"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="post/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="checkout/success"
            options={{ animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen name="auth/welcome" options={{ animation: "fade", gestureEnabled: false }} />
          <Stack.Screen
            name="auth/login"
            options={{ animation: "slide_from_right", gestureEnabled: false }}
          />
          <Stack.Screen
            name="auth/signup"
            options={{ animation: "slide_from_right", gestureEnabled: false }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen name="notifications/index" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="scanner/index" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
          <Stack.Screen name="collection/index" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="collection/add" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
          <Stack.Screen name="alerts/index" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="grails/index" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="ref/[ref]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="passport/[code]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="passport/lookup" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
        </Stack>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigation />
    </ThemeProvider>
  );
}
