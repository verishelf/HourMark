import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { submitReview } from "@/services/reviews";

type Props = {
  orderId: string;
  reviewerId: string;
  sellerId: string;
  onSubmitted?: () => void;
};

function createStyles() {
  return StyleSheet.create({
    wrap: {
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      gap: 8,
    },
    title: { ...Typography.h3, color: Colors.textPrimary, fontSize: 18 },
    subtitle: { ...Typography.caption, color: Colors.textMuted },
    stars: { flexDirection: "row", gap: 8, marginVertical: 8 },
    input: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.sm,
      padding: 12,
      color: Colors.textPrimary,
      backgroundColor: Colors.cardElevated,
      minHeight: 72,
      textAlignVertical: "top",
      ...Typography.body,
      fontSize: 15,
    },
    submitBtn: {
      marginTop: 8,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: RADIUS.sm,
      backgroundColor: Colors.textPrimary,
    },
    submitText: { ...Typography.caption, color: Colors.background, fontWeight: "600" },
  });
}

export function SellerReviewForm({ orderId, reviewerId, sellerId, onSubmitted }: Props) {
  const styles = useThemedStyles(createStyles);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert("Rating required", "Select a star rating.");
      return;
    }
    setLoading(true);
    try {
      await submitReview({
        orderId,
        reviewerId,
        sellerId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert("Thank you", "Your review helps the community.");
      onSubmitted?.();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Rate this seller</Text>
      <Text style={styles.subtitle}>Verified purchase · Escrow completed</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Ionicons
              name={n <= rating ? "star" : "star-outline"}
              size={32}
              color={n <= rating ? Colors.textPrimary : Colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience (optional)"
        placeholderTextColor={Colors.textMuted}
        multiline
      />
      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "Submitting…" : "Submit Review"}</Text>
      </Pressable>
    </View>
  );
}
