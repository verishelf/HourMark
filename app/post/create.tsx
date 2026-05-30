import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { createPost, uploadPostImage } from "@/services/posts";

const CAPTION_MAX = 500;

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const captionYRef = useRef(0);

  const canPost = Boolean(imageUri) && !publishing;
  const keyboardOpen = keyboardHeight > 0;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToCaption = () => {
    const scroll = () => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, captionYRef.current - 16),
        animated: true,
      });
    };
    requestAnimationFrame(scroll);
    setTimeout(scroll, Platform.OS === "ios" ? 320 : 120);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to add a post.");
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
    }
  };

  const handlePublish = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!imageUri) {
      Alert.alert("Photo required", "Add a photo for your post.");
      return;
    }

    setPublishing(true);
    try {
      const imageUrl = await uploadPostImage(user.id, imageUri);
      await createPost(user.id, {
        image_url: imageUrl,
        caption: caption.trim() || undefined,
      });
      notifyContentRefresh();
      router.replace("/(tabs)/profile");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to publish post");
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <LoggedOutGate
        title="Share on HourMark"
        subtitle="Sign in to post photos to your profile."
        backgroundImage={LOGGED_OUT_GATE_IMAGES.profile}
        onSignIn={() => router.push("/auth/login")}
        onSignUp={() => router.push("/auth/signup")}
      />
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
          <Text style={styles.toolbarTitle}>New post</Text>
          <Pressable
            onPress={handlePublish}
            disabled={!canPost}
            hitSlop={12}
            style={styles.toolbarSide}
          >
            <Text style={[styles.postLabel, !canPost && styles.postLabelDisabled]}>
              {publishing ? "Posting…" : "Share"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: keyboardOpen
              ? keyboardHeight + 24
              : insets.bottom + 100,
          },
        ]}
        {...HIDE_SCROLL_INDICATORS}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={pickImage}
          style={[styles.photoPicker, imageUri ? styles.photoPickerCompact : null]}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.photo}
                contentFit={imageUri ? "contain" : "cover"}
                contentPosition="center"
              />
              <View style={styles.changePhoto}>
                <Ionicons name="images-outline" size={16} color={Colors.textPrimary} />
                <Text style={styles.changePhotoLabel}>Change</Text>
              </View>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoIconRing}>
                <Ionicons name="add" size={32} color={Colors.textPrimary} />
              </View>
              <Text style={styles.photoPlaceholderTitle}>Add a photo</Text>
              <Text style={styles.photoPlaceholderHint}>Square works best on your profile grid</Text>
            </View>
          )}
        </Pressable>

        <View
          style={styles.captionCard}
          onLayout={(e) => {
            captionYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.captionHeader}>
            <Text style={styles.fieldLabel}>Caption</Text>
            <Text style={styles.charCount}>
              {caption.length}/{CAPTION_MAX}
            </Text>
          </View>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Say something about this photo…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={CAPTION_MAX}
            style={styles.captionInput}
            onFocus={scrollToCaption}
          />
        </View>
      </ScrollView>

      {!keyboardOpen ? (
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handlePublish}
          disabled={!canPost}
          style={({ pressed }) => [
            styles.footerButton,
            !canPost && styles.footerButtonDisabled,
            pressed && canPost && styles.footerButtonPressed,
          ]}
        >
          <Text style={[styles.footerButtonLabel, !canPost && styles.footerButtonLabelDisabled]}>
            {publishing ? "Posting…" : "Post to profile"}
          </Text>
        </Pressable>
      </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheet: {
    paddingHorizontal: SPACING.screen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
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
    textAlign: "center",
    flex: 1,
  },
  cancelLabel: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 16,
  },
  postLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  postLabelDisabled: {
    color: Colors.textMuted,
    opacity: 0.45,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screen,
    paddingTop: 20,
    gap: 20,
  },
  photoPicker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  photoPickerCompact: {
    aspectRatio: undefined,
    height: 220,
    borderStyle: "solid",
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
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  photoIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoPlaceholderTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  photoPlaceholderHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.screen,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.textPrimary,
  },
  footerButtonPressed: {
    opacity: 0.88,
  },
  footerButtonDisabled: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerButtonLabel: {
    ...Typography.body,
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  footerButtonLabelDisabled: {
    color: Colors.textMuted,
  },
});
