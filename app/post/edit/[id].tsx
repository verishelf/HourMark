import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { getPostById, updatePost, uploadPostImage } from "@/services/posts";

const CAPTION_MAX = 500;

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [pickedNewImage, setPickedNewImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const post = await getPostById(id);
        if (cancelled) return;
        if (!post || post.user_id !== user?.id) {
          router.back();
          return;
        }
        setCaption(post.caption ?? "");
        setExistingImageUrl(post.image_url);
        setImageUri(post.image_url);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router, user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to change the photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setPickedNewImage(true);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;

    setSaving(true);
    try {
      let imageUrl = existingImageUrl ?? "";
      if (pickedNewImage && imageUri) {
        imageUrl = await uploadPostImage(user.id, imageUri);
      }

      await updatePost(id, user.id, {
        caption: caption.trim() || null,
        ...(pickedNewImage ? { image_url: imageUrl } : {}),
      });
      notifyContentRefresh();
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.textPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
    >
      <View style={[styles.sheet, { paddingTop: insets.top + 8 }]}>
        <View style={styles.handle} />
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.toolbarSide}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
          <Text style={styles.toolbarTitle}>Edit post</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={12}
            style={styles.toolbarSide}
          >
            <Text style={[styles.saveLabel, saving && styles.saveLabelDisabled]}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        {...HIDE_SCROLL_INDICATORS}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={pickImage} style={styles.photoPicker}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.photo}
                contentFit="contain"
                contentPosition="center"
              />
              <View style={styles.changePhoto}>
                <Ionicons name="images-outline" size={16} color={Colors.textPrimary} />
                <Text style={styles.changePhotoLabel}>Change</Text>
              </View>
            </>
          ) : null}
        </Pressable>

        <View style={styles.captionCard}>
          <View style={styles.captionHeader}>
            <Text style={styles.fieldLabel}>Caption</Text>
            <Text style={styles.charCount}>
              {caption.length}/{CAPTION_MAX}
            </Text>
          </View>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={CAPTION_MAX}
            style={styles.captionInput}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    paddingHorizontal: SPACING.screen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  toolbarSide: {
    minWidth: 72,
  },
  toolbarTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  cancelLabel: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 16,
  },
  saveLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  saveLabelDisabled: {
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screen,
    paddingTop: 20,
    gap: 20,
  },
  photoPicker: {
    width: "100%",
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  changePhoto: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePhotoLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  captionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  captionInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 96,
    textAlignVertical: "top",
    padding: 0,
  },
});
