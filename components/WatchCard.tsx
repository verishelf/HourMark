import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Badge } from "@/components/Badge";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { CARD_GAP, LISTING_CARD_RADIUS, RADIUS } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
  variant?: "default" | "editorial" | "compact" | "grid";
  index?: number;
  showBuy?: boolean;
  showFavorite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function WatchCard({
  listing,
  variant = "default",
  index = 0,
  showBuy = true,
  showFavorite,
  onEdit,
  onDelete,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { favorited, toggle } = useFavorite(user?.id, listing.id);

  const imageHeight =
    variant === "editorial"
      ? 420
      : variant === "grid"
        ? 160
        : variant === "compact"
          ? 160
          : 280;
  const isCompact = variant === "compact" || variant === "grid";
  const isGrid = variant === "grid";
  const isOwner = Boolean(user && listing.seller_id === user.id);
  const canBuy = showBuy && !isOwner && variant !== "grid";
  const showHeart = showFavorite ?? isGrid;
  const showOwnerActions = Boolean(onEdit || onDelete);
  const coverImage = getListingCoverImage(listing.images);

  const goToCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/checkout", params: { listingId: listing.id } });
  };

  const handleFavorite = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    toggle();
  };

  const cardRadius = LISTING_CARD_RADIUS;
  const overlayBtn = {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.overlay,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay: index * 80 }}
      style={{
        marginBottom: isGrid || isCompact ? 0 : CARD_GAP,
        flex: isGrid ? 1 : undefined,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: cardRadius,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => router.push(`/listing/${listing.id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={{
                  width: "100%",
                  height: imageHeight,
                  borderTopLeftRadius: cardRadius,
                  borderTopRightRadius: cardRadius,
                }}
                contentFit="cover"
                transition={300}
                recyclingKey={coverImage}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: imageHeight,
                  backgroundColor: Colors.cardElevated,
                  borderTopLeftRadius: cardRadius,
                  borderTopRightRadius: cardRadius,
                }}
              />
            )}
          </Pressable>
          {showOwnerActions && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                flexDirection: "row",
                gap: 6,
              }}
            >
              {onEdit ? (
                <Pressable onPress={onEdit} hitSlop={8} style={overlayBtn}>
                  <Ionicons name="create-outline" size={16} color={Colors.textPrimary} />
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable onPress={onDelete} hitSlop={8} style={overlayBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </Pressable>
              ) : null}
            </View>
          )}
          {showHeart && !showOwnerActions && (
            <Pressable onPress={handleFavorite} hitSlop={8} style={{ ...overlayBtn, position: "absolute", top: 8, right: 8 }}>
              <Ionicons
                name={favorited ? "heart" : "heart-outline"}
                size={18}
                color={favorited ? Colors.textPrimary : Colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => router.push(`/listing/${listing.id}`)}
          style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
          <View style={{ padding: isGrid ? 10 : isCompact ? 12 : 16 }}>
            <Text
              style={{
                ...Typography.label,
                color: Colors.textSecondary,
                marginBottom: isGrid ? 4 : 6,
                fontSize: isGrid ? 9 : 11,
              }}
            >
              {listing.brand}
            </Text>
            <Text
              style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                marginBottom: 4,
                fontSize: isGrid ? 14 : isCompact ? 16 : 18,
              }}
              numberOfLines={isGrid ? 2 : 1}
            >
              {listing.model}
            </Text>
            {listing.reference_number && !isCompact && !isGrid && (
              <Text
                style={{
                  ...Typography.caption,
                  color: Colors.textMuted,
                  marginBottom: 12,
                }}
              >
                Ref. {listing.reference_number}
              </Text>
            )}
            {(isGrid || isCompact) && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                {listing.year && <Badge label={String(listing.year)} variant="muted" />}
                <Badge label={listing.condition} variant="muted" />
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...Typography.price,
                  color: Colors.textPrimary,
                  fontSize: isGrid ? 16 : isCompact ? 20 : 28,
                }}
              >
                {formatPrice(listing.price)}
              </Text>
              {listing.authenticated && !isGrid && (
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
                  Verified
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {canBuy ? (
          <View
            style={{
              paddingHorizontal: isCompact ? 12 : 16,
              paddingBottom: isCompact ? 12 : 16,
            }}
          >
            <Pressable
              onPress={goToCheckout}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: Colors.textPrimary,
                borderRadius: RADIUS.pill,
                paddingVertical: isCompact ? 10 : 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: isCompact ? 14 : 15,
                  fontWeight: "600",
                  textAlign: "center",
                  width: "100%",
                }}
              >
                Buy Now
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </MotiView>
  );
}
