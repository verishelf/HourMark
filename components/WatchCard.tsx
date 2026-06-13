import { Pressable, Text, View } from "react-native";
import { ListingImage } from "@/components/ListingImage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Badge } from "@/components/Badge";
import { ListingSetIcons } from "@/components/ListingSetIcons";
import { TrustBadgeRow } from "@/components/TrustBadgeRow";
import { formatPrice } from "@/lib/stripe";
import { getListingCoverImage } from "@/lib/listingImages";
import { getAuctionDisplayBid, isAuctionListing, isAuctionLive } from "@/lib/auction";
import { AuctionTimer } from "@/components/AuctionTimer";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { CARD_GAP, LISTING_CARD_RADIUS, RADIUS } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { useCardOverlayButtonStyle } from "@/hooks/useCardOverlayButtonStyle";
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
  onCardPress?: () => void;
  statusBadge?: { label: string; variant: "success" | "muted" | "error" | "warning" } | null;
};

export function WatchCard({
  listing,
  variant = "default",
  index = 0,
  showBuy = true,
  showFavorite,
  onEdit,
  onDelete,
  onCardPress,
  statusBadge,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { favorited, toggle } = useFavorite(user?.id, listing.id);
  const overlayButton = useCardOverlayButtonStyle();

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
  const auction = isAuctionListing(listing);
  const auctionLive = auction && isAuctionLive(listing);
  const displayPrice = auction ? getAuctionDisplayBid(listing) : listing.price;

  const openListing = () => {
    if (onCardPress) {
      onCardPress();
      return;
    }
    router.push(`/listing/${listing.id}`);
  };

  const goToCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/checkout", params: { listingId: listing.id } });
  };

  const handleFavorite = () => {
    if (!user) {
      router.push("/auth/welcome");
      return;
    }
    toggle();
  };

  const cardRadius = LISTING_CARD_RADIUS;

  return (
    <View
      style={{
        marginBottom: isGrid || isCompact ? 0 : CARD_GAP,
        width: isGrid || isCompact ? "100%" : undefined,
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
            onPress={openListing}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            {coverImage ? (
              <ListingImage
                uri={coverImage}
                style={{
                  width: "100%",
                  height: imageHeight,
                  borderTopLeftRadius: cardRadius,
                  borderTopRightRadius: cardRadius,
                }}
                contentFit="cover"
                recyclingKey={`${listing.id}-${coverImage}`}
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
          {statusBadge ? (
            <View style={{ position: "absolute", top: 8, left: 8 }}>
              <Badge label={statusBadge.label} variant={statusBadge.variant} />
            </View>
          ) : auction ? (
            <View style={{ position: "absolute", top: 8, left: 8 }}>
              <Badge label="Auction" variant="error" />
            </View>
          ) : null}
          {auction && listing.auction_ends_at ? (
            <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
              <AuctionTimer listing={listing} variant="compact" />
            </View>
          ) : null}
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
                <Pressable onPress={onEdit} hitSlop={8} style={overlayButton.button}>
                  <Ionicons name="create-outline" size={16} color={overlayButton.icon} />
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable onPress={onDelete} hitSlop={8} style={overlayButton.button}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </Pressable>
              ) : null}
            </View>
          )}
          {showHeart && !showOwnerActions && (
            <Pressable
              onPress={handleFavorite}
              hitSlop={8}
              style={{ ...overlayButton.button, position: "absolute", top: 8, right: 8 }}
            >
              <Ionicons
                name={favorited ? "heart" : "heart-outline"}
                size={18}
                color={favorited ? overlayButton.icon : overlayButton.iconMuted}
              />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={openListing}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: isGrid ? 6 : 8,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  ...Typography.h3,
                  color: Colors.textPrimary,
                  flex: 1,
                  fontSize: isGrid ? 14 : isCompact ? 16 : 18,
                }}
                numberOfLines={isGrid ? 2 : 1}
              >
                {listing.model}
              </Text>
              <ListingSetIcons listing={listing} compact inline />
            </View>
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
            {!isGrid && !isCompact && listing.trust_badges?.length ? (
              <View style={{ marginBottom: 10 }}>
                <TrustBadgeRow badges={listing.trust_badges} compact />
              </View>
            ) : null}
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
                {formatPrice(displayPrice)}
              </Text>
              {auction && !isGrid ? (
                <Text style={{ ...Typography.caption, color: Colors.textMuted, fontSize: 11 }}>
                  {listing.auction_current_bid != null ? "Current bid" : "Starting bid"}
                </Text>
              ) : listing.authenticated && !isGrid ? (
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
                  Verified
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>

        {canBuy && !auction ? (
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
        {canBuy && auctionLive ? (
          <View
            style={{
              paddingHorizontal: isCompact ? 12 : 16,
              paddingBottom: isCompact ? 12 : 16,
            }}
          >
            <Pressable
              onPress={openListing}
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
                Place Bid
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
