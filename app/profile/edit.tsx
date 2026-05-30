import { useEffect, useState } from "react";
import {
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { saveProfile } from "@/services/profile";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pickedAvatar, setPickedAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setAvatarUri(profile.avatar_url);
  }, [profile]);

  const displayAvatar = pickedAvatar ? avatarUri : avatarUri ?? profile?.avatar_url ?? DEFAULT_AVATAR;

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setPickedAvatar(true);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await saveProfile(user.id, {
        fullName,
        username,
        bio,
        avatarUri: pickedAvatar ? avatarUri : null,
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  };

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
          title="Edit Profile"
          subtitle="Update your photo and public details"
          rightAction={
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </Pressable>
          }
        />

        <View style={styles.content}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: displayAvatar ?? DEFAULT_AVATAR }} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={18} color={Colors.textPrimary} />
              </View>
            </View>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </Pressable>

          <View style={styles.formSection}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              style={inputStyle}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell collectors about yourself…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              style={[inputStyle, styles.textArea]}
            />
          </View>

          <LuxuryButton
            label="Save Profile"
            onPress={handleSave}
            loading={saving}
            variant="primary"
            size="large"
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
  content: {
    paddingHorizontal: SPACING.screen,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: SPACING.section,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 12,
  },
  formSection: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    padding: 16,
    marginBottom: SPACING.section,
  },
  label: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    marginBottom: 0,
    textAlignVertical: "top",
  },
});
