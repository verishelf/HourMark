import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCard } from "@/components/WatchCard";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getFavorites } from "@/services/favorites";
import { getUserListings } from "@/services/listings";
import { getOrders } from "@/services/payments";
import { createConnectAccountLink } from "@/services/payments";
import { signOut } from "@/services/auth";
import type { Listing, Order } from "@/types";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, isAuthenticated, loading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"listings" | "favorites" | "orders">("listings");

  useEffect(() => {
    if (!user) return;
    getUserListings(user.id).then(setListings);
    getFavorites(user.id).then(setFavorites);
    getOrders(user.id).then(setOrders);
  }, [user]);

  const handlePayoutSetup = async () => {
    if (!user) return;
    const url = await createConnectAccountLink(
      user.id,
      Linking.createURL("/profile")
    );
    Linking.openURL(url);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  if (!isAuthenticated && !loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ ...Typography.hero, color: Colors.textPrimary, fontSize: 36 }}>
          HourMark
        </Text>
        <Text
          style={{
            ...Typography.body,
            color: Colors.textSecondary,
            marginTop: 16,
            marginBottom: 40,
          }}
        >
          The luxury watch marketplace for discerning collectors.
        </Text>
        <LuxuryButton label="Sign In" onPress={() => router.push("/auth/login")} />
        <View style={{ height: 12 }} />
        <LuxuryButton
          label="Create Account"
          onPress={() => router.push("/auth/signup")}
          variant="outline"
        />
      </View>
    );
  }

  const tabs = [
    { key: "listings" as const, label: "Listings" },
    { key: "favorites" as const, label: "Favorites" },
    { key: "orders" as const, label: "Orders" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <Image
          source={{
            uri:
              profile?.avatar_url ??
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
          }}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }}
        />
        <Text style={{ ...Typography.h2, color: Colors.textPrimary }}>
          @{profile?.username ?? "collector"}
        </Text>
        {profile?.verified && (
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
              Identity Verified
            </Text>
          </View>
        )}
        {profile?.bio && (
          <Text
            style={{
              ...Typography.body,
              color: Colors.textMuted,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {profile.bio}
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          marginBottom: 24,
        }}
      >
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: tab === t.key ? 1 : 0,
              borderBottomColor: Colors.textPrimary,
            }}
          >
            <Text
              style={{
                ...Typography.caption,
                color: tab === t.key ? Colors.textPrimary : Colors.textMuted,
                textAlign: "center",
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "listings" &&
        listings.map((l, i) => <WatchCard key={l.id} listing={l} index={i} />)}
      {tab === "favorites" &&
        favorites.map((l, i) => <WatchCard key={l.id} listing={l} index={i} />)}
      {tab === "orders" &&
        (orders.length ? (
          orders.map((order) => (
            <View
              key={order.id}
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: Colors.border,
                marginBottom: 12,
              }}
            >
              <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
                Order #{order.id.slice(0, 8)}
              </Text>
              <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: 4 }}>
                Status: {order.status}
              </Text>
              {order.tracking_number && (
                <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: 4 }}>
                  Tracking: {order.tracking_number}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ ...Typography.body, color: Colors.textMuted }}>
            No orders yet
          </Text>
        ))}

      <SectionHeader title="Seller Settings" />
      <LuxuryButton
        label="Payout Settings"
        onPress={handlePayoutSetup}
        variant="outline"
      />
      <View style={{ height: 12 }} />
      <LuxuryButton
        label="Verify Identity"
        onPress={() => {}}
        variant="ghost"
      />
      <View style={{ height: 24 }} />
      <LuxuryButton label="Sign Out" onPress={handleSignOut} variant="outline" />
    </ScrollView>
  );
}
