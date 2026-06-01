import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useStripe,
  PlatformPay,
  PlatformPayButton,
  confirmPlatformPayPayment,
} from "@stripe/stripe-react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsRow } from "@/components/SettingsRow";
import { Colors } from "@/constants/colors";
import { COMMISSION_RATE } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { CARD_GAP, LISTING_CARD_RADIUS, RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import {
  formatPrice,
  calculateCommission,
  isStripeConfigured,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_RETURN_URL,
  formatStripePaymentError,
} from "@/lib/stripe";
import {
  APPLE_PAY_CURRENCY,
  APPLE_PAY_MERCHANT_COUNTRY,
  buildApplePayCartItems,
  getApplePayAvailability,
} from "@/lib/applePay";
import { checkoutPrefillEmail } from "@/lib/email";
import { safeGoBack } from "@/lib/navigation";
import { getListingCoverImage } from "@/lib/listingImages";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getListingById } from "@/services/listings";
import {
  createPaymentIntent,
  createWireTransferOrder,
  completeOrder,
} from "@/services/payments";
import type { Listing, ShippingDetails } from "@/types";

type PayMethod = "apple_pay" | "card" | "wire";

/** Maps iOS/Android contact & home-address autofill to the correct shipping fields. */
function shippingAutofill(
  autoComplete: NonNullable<TextInputProps["autoComplete"]>,
  textContentType: NonNullable<TextInputProps["textContentType"]>
): Pick<TextInputProps, "autoComplete" | "textContentType" | "importantForAutofill"> {
  return {
    autoComplete,
    textContentType,
    ...(Platform.OS === "android" ? { importantForAutofill: "yes" as const } : {}),
  };
}

function validateShippingForm(form: ShippingDetails): string | null {
  const required: Array<[string, string]> = [
    ["Full name", form.buyerName],
    ["Email", form.buyerEmail],
    ["Phone", form.buyerPhone],
    ["Street address", form.addressLine1],
    ["City", form.city],
    ["State", form.state],
    ["ZIP code", form.postalCode],
  ];

  for (const [label, value] of required) {
    if (!value.trim()) return `${label} is required`;
  }

  return null;
}

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createCheckoutStyles);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeMethod, setActiveMethod] = useState<PayMethod | null>(null);
  const [applePayNativeAvailable, setApplePayNativeAvailable] = useState(false);
  const [applePayUnavailableReason, setApplePayUnavailableReason] = useState<string | null>(
    null
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    if (!listingId) return;
    getListingById(listingId).then(setListing);
  }, [listingId]);

  useFocusEffect(
    useCallback(() => {
      getApplePayAvailability().then(({ canUseNativeButton, reason }) => {
        setApplePayNativeAvailable(canUseNativeButton);
        setApplePayUnavailableReason(reason);
      });
    }, [])
  );

  useEffect(() => {
    if (!buyerEmail && user?.email) {
      const prefill = checkoutPrefillEmail(user.email);
      if (prefill) setBuyerEmail(prefill);
    }
  }, [user?.email, buyerEmail]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated && listingId) {
      router.replace({
        pathname: "/auth/welcome",
        params: { redirect: `/checkout?listingId=${listingId}` },
      });
    }
  }, [isAuthenticated, authLoading, listingId, router]);

  const shippingDetails = useMemo<ShippingDetails>(
    () => ({
      buyerName,
      buyerEmail,
      buyerPhone,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      state,
      postalCode,
      country,
    }),
    [
      buyerName,
      buyerEmail,
      buyerPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    ]
  );

  const ensureShippingValid = (): boolean => {
    const error = validateShippingForm(shippingDetails);
    if (error) {
      Alert.alert("Shipping required", error);
      return false;
    }
    return true;
  };

  const showWireInstructions = (details: {
    wireReference: string;
    bankName: string;
    accountName: string;
    routingNumber: string;
    accountNumber: string;
    swiftCode: string;
    bankAddress: string;
    amountLabel: string;
  }) => {
    Alert.alert(
      "Wire Transfer Instructions",
      [
        `Amount: ${details.amountLabel}`,
        `Reference (required): ${details.wireReference}`,
        "",
        `Bank: ${details.bankName}`,
        `Account name: ${details.accountName}`,
        `Routing: ${details.routingNumber}`,
        `Account: ${details.accountNumber}`,
        `SWIFT: ${details.swiftCode}`,
        `Address: ${details.bankAddress}`,
        "",
        "Include the reference in your wire memo. Your order is reserved and will be confirmed once funds arrive (1–3 business days).",
      ].join("\n"),
      [{ text: "View Orders", onPress: () => router.replace("/(tabs)/profile") }]
    );
  };

  const handleCardPayment = async () => {
    if (!listing || !user || !ensureShippingValid()) return;

    if (!STRIPE_PUBLISHABLE_KEY) {
      Alert.alert(
        "Stripe not configured",
        "Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env, then restart Expo: npx expo start -c"
      );
      return;
    }

    setActiveMethod("card");
    try {
      const { clientSecret, orderId } = await createPaymentIntent({
        listingId: listing.id,
        buyerId: user.id,
        amountCents: listing.price,
        paymentMethod: "card",
        shipping: shippingDetails,
      });

      if (clientSecret === "mock_client_secret") {
        Alert.alert(
          "Demo Mode",
          "Stripe is not configured. In production, card payment would process here.",
          [
            {
              text: "OK",
              onPress: () =>
                safeGoBack(
                  listingId ? (`/listing/${listingId}` as const) : "/(tabs)"
                ),
            },
          ]
        );
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Crownly",
        returnURL: STRIPE_RETURN_URL,
        allowsDelayedPaymentMethods: false,
        applePay: {
          merchantCountryCode: APPLE_PAY_MERCHANT_COUNTRY,
        },
        defaultBillingDetails: {
          email: shippingDetails.buyerEmail,
          name: shippingDetails.buyerName,
          phone: shippingDetails.buyerPhone,
          address: {
            line1: shippingDetails.addressLine1,
            line2: shippingDetails.addressLine2,
            city: shippingDetails.city,
            state: shippingDetails.state,
            postalCode: shippingDetails.postalCode,
            country: shippingDetails.country ?? "US",
          },
        },
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          throw new Error(presentError.message);
        }
        return;
      }

      await completeOrder(orderId);
      router.replace(`/checkout/success?orderId=${orderId}` as const);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Try again";
      if (__DEV__) console.warn("[checkout] card payment failed:", raw);
      Alert.alert("Payment Failed", formatStripePaymentError(raw));
    } finally {
      setActiveMethod(null);
    }
  };

  const tryApplePay = () => {
    if (applePayUnavailableReason) {
      Alert.alert("Apple Pay", applePayUnavailableReason);
      return;
    }
    void handleApplePay();
  };

  const handleApplePay = async () => {
    if (!listing || !user || !ensureShippingValid()) return;

    if (!STRIPE_PUBLISHABLE_KEY) {
      Alert.alert(
        "Stripe not configured",
        "Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env, then restart Expo: npx expo start -c"
      );
      return;
    }

    setActiveMethod("apple_pay");
    try {
      const { clientSecret, orderId } = await createPaymentIntent({
        listingId: listing.id,
        buyerId: user.id,
        amountCents: listing.price,
        paymentMethod: "apple_pay",
        shipping: shippingDetails,
      });

      if (clientSecret === "mock_client_secret") {
        Alert.alert("Demo Mode", "Apple Pay requires Stripe configuration.");
        return;
      }

      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: buildApplePayCartItems(
            `${listing.brand} ${listing.model}`,
            listing.price
          ),
          merchantCountryCode: APPLE_PAY_MERCHANT_COUNTRY,
          currencyCode: APPLE_PAY_CURRENCY,
        },
      });

      if (error) {
        if (error.code !== "Canceled") {
          throw new Error(error.message);
        }
        return;
      }

      await completeOrder(orderId);
      router.replace(`/checkout/success?orderId=${orderId}` as const);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Try again";
      if (__DEV__) console.warn("[checkout] Apple Pay failed:", raw);
      Alert.alert("Apple Pay Failed", formatStripePaymentError(raw));
    } finally {
      setActiveMethod(null);
    }
  };

  const handleWireTransfer = async () => {
    if (!listing || !user || !ensureShippingValid()) return;

    setActiveMethod("wire");
    try {
      const result = await createWireTransferOrder({
        listingId: listing.id,
        amountCents: listing.price,
        shipping: shippingDetails,
      });

      showWireInstructions({
        ...result,
        amountLabel: formatPrice(listing.price),
      });
    } catch (e) {
      Alert.alert("Wire Transfer Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setActiveMethod(null);
    }
  };

  if (!listing || authLoading || !isAuthenticated) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const commission = calculateCommission(listing.price);
  const coverImage = getListingCoverImage(listing.images);
  const isLoading = activeMethod !== null;
  const showApplePayOnIos = Platform.OS === "ios" && isStripeConfigured;
  const applePayAppearance =
    colorScheme === "light" ? PlatformPay.ButtonStyle.Black : PlatformPay.ButtonStyle.White;

  const paymentRows: {
    key: PayMethod;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle: string;
    onPress: () => void;
  }[] = [
    ...(showApplePayOnIos && !applePayNativeAvailable
      ? [
          {
            key: "apple_pay" as const,
            icon: "logo-apple" as const,
            label: "Apple Pay",
            subtitle: applePayUnavailableReason ?? "Pay with Apple Wallet",
            onPress: tryApplePay,
          },
        ]
      : []),
    {
      key: "card",
      icon: "card-outline",
      label: "Credit or Debit Card",
      subtitle: showApplePayOnIos
        ? "Card or Apple Pay in checkout sheet"
        : "Visa, Mastercard, Amex, and more",
      onPress: handleCardPayment,
    },
    {
      key: "wire",
      icon: "business-outline",
      label: "Wire Transfer",
      subtitle: "Bank wire for high-value purchases",
      onPress: handleWireTransfer,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        {...HIDE_SCROLL_INDICATORS}
      >
        <ScreenHeader
          title="Checkout"
          subtitle="Shipping details and payment"
          rightAction={
            <Pressable
              onPress={() =>
                safeGoBack(
                  listingId ? (`/listing/${listingId}` as const) : "/(tabs)"
                )
              }
              hitSlop={12}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          }
        />

        <View style={styles.content}>
          <View style={styles.listCard}>
            <View style={styles.listRow}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.listThumb} contentFit="cover" />
              ) : (
                <View style={styles.listThumb} />
              )}
              <View style={styles.listContent}>
                <Text style={styles.brand}>{listing.brand}</Text>
                <Text style={styles.model} numberOfLines={1}>
                  {listing.model}
                </Text>
                <Text style={styles.price}>{formatPrice(listing.price)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Shipping Information</Text>
            <TextInput
              placeholder="Full name"
              placeholderTextColor={Colors.textMuted}
              value={buyerName}
              onChangeText={setBuyerName}
              {...shippingAutofill("name", "name")}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={buyerEmail}
              onChangeText={setBuyerEmail}
              {...shippingAutofill("email", "emailAddress")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone"
              placeholderTextColor={Colors.textMuted}
              value={buyerPhone}
              onChangeText={setBuyerPhone}
              {...shippingAutofill("tel", "telephoneNumber")}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              placeholder="Street address"
              placeholderTextColor={Colors.textMuted}
              value={addressLine1}
              onChangeText={setAddressLine1}
              {...shippingAutofill("street-address", "streetAddressLine1")}
              style={styles.input}
            />
            <TextInput
              placeholder="Apt, suite, unit (optional)"
              placeholderTextColor={Colors.textMuted}
              value={addressLine2}
              onChangeText={setAddressLine2}
              {...shippingAutofill("address-line2", "streetAddressLine2")}
              style={styles.input}
            />
            <View style={styles.inputRow}>
              <TextInput
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
                value={city}
                onChangeText={setCity}
                {...shippingAutofill("postal-address-locality", "addressCity")}
                style={[styles.input, styles.inputHalf, styles.inputRowLeft]}
              />
              <TextInput
                placeholder="State"
                placeholderTextColor={Colors.textMuted}
                value={state}
                onChangeText={setState}
                {...shippingAutofill("postal-address-region", "addressState")}
                autoCapitalize="characters"
                style={[styles.input, styles.inputHalf]}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="ZIP code"
                placeholderTextColor={Colors.textMuted}
                value={postalCode}
                onChangeText={setPostalCode}
                {...shippingAutofill("postal-code", "postalCode")}
                keyboardType="number-pad"
                style={[styles.input, styles.inputHalf, styles.inputRowLeft]}
              />
              <TextInput
                placeholder="Country"
                placeholderTextColor={Colors.textMuted}
                value={country}
                onChangeText={setCountry}
                {...shippingAutofill("country", "countryName")}
                autoCapitalize="characters"
                style={[styles.input, styles.inputHalf]}
              />
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(listing.price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMuted}>
                Platform fee ({(COMMISSION_RATE * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.summaryMuted}>{formatPrice(commission)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(listing.price)}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Payment Method</Text>

          {showApplePayOnIos ? (
            <View style={styles.applePaySection}>
              {applePayNativeAvailable ? (
                <PlatformPayButton
                  onPress={tryApplePay}
                  type={PlatformPay.ButtonType.Buy}
                  appearance={applePayAppearance}
                  borderRadius={RADIUS.sm}
                  disabled={isLoading}
                  style={styles.applePayButton}
                />
              ) : null}
              {activeMethod === "apple_pay" ? (
                <Text style={styles.applePayStatus}>Opening Apple Pay…</Text>
              ) : applePayUnavailableReason ? (
                <Text style={styles.applePayHint}>{applePayUnavailableReason}</Text>
              ) : null}
            </View>
          ) : null}

          {showApplePayOnIos && applePayNativeAvailable ? (
            <Text style={styles.paymentDivider}>or pay with</Text>
          ) : null}

          <View style={styles.settingsSection}>
            {paymentRows.map((row, index) => (
              <SettingsRow
                key={row.key}
                icon={row.icon}
                label={row.label}
                subtitle={row.subtitle}
                onPress={row.onPress}
                loading={activeMethod === row.key}
                disabled={isLoading && activeMethod !== row.key}
                isLast={index === paymentRows.length - 1}
              />
            ))}
          </View>

          <Text style={styles.footerNote}>
            Payments are processed securely via Stripe. Wire transfers reserve the watch until funds
            arrive.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createCheckoutStyles() {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textMuted,
  },
  content: {
    paddingHorizontal: SPACING.screen,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  listCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: LISTING_CARD_RADIUS,
    backgroundColor: Colors.card,
    marginBottom: SPACING.section,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  listThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: Colors.cardElevated,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
    gap: 2,
  },
  brand: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  model: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  price: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  formSection: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: SPACING.section,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  sectionHeading: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  applePaySection: {
    marginBottom: CARD_GAP,
  },
  applePayButton: {
    width: "100%",
    height: 50,
  },
  applePayStatus: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  applePayHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: CARD_GAP,
  },
  paymentDivider: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
    marginBottom: 0,
  },
  inputRowLeft: {
    marginRight: 10,
  },
  summarySection: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: SPACING.section,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  summaryMuted: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  totalLabel: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  totalValue: {
    ...Typography.price,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  settingsSection: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    overflow: "hidden",
    marginBottom: CARD_GAP,
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  });
}
