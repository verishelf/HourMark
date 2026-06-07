import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS } from "@/constants/layout";
import { submitStory } from "@/services/storySubmissions";

type Props = {
  userId: string;
  onSuccess?: () => void;
};

export function StorySubmissionForm({ userId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [watchRef, setWatchRef] = useState("");
  const [businessLesson, setBusinessLesson] = useState("");
  const [networkingLesson, setNetworkingLesson] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Required", "Please add a title and story content.");
      return;
    }
    setSubmitting(true);
    try {
      await submitStory({
        userId,
        title: title.trim(),
        content: content.trim(),
        watchReference: watchRef.trim() || undefined,
        businessLesson: businessLesson.trim() || undefined,
        networkingLesson: networkingLesson.trim() || undefined,
        photoUris: photos,
      });
      Alert.alert("Submitted", "Your story is pending admin review.");
      onSuccess?.();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit story.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, paddingBottom: 120 }}>
      <Text style={styles.label}>Story Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Your headline" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Story Content</Text>
      <TextInput style={[styles.input, styles.textarea]} value={content} onChangeText={setContent} multiline placeholder="Tell your story..." placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Watch Involved</Text>
      <TextInput style={styles.input} value={watchRef} onChangeText={setWatchRef} placeholder="Brand, model, reference" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Business Lesson</Text>
      <TextInput style={styles.input} value={businessLesson} onChangeText={setBusinessLesson} placeholder="What did you learn?" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Networking Lesson</Text>
      <TextInput style={styles.input} value={networkingLesson} onChangeText={setNetworkingLesson} placeholder="Connection insights" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
        {photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.thumb} contentFit="cover" />
        ))}
        <Pressable onPress={pickPhoto} style={styles.addPhoto}>
          <Text style={{ color: Colors.gold }}>+ Add</Text>
        </Pressable>
      </ScrollView>

      <LuxuryButton label={submitting ? "Submitting..." : "Submit for Review"} onPress={handleSubmit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { ...Typography.label, color: Colors.textMuted, marginBottom: 8, marginTop: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  thumb: { width: 80, height: 80, borderRadius: RADIUS.sm, marginRight: SPACING.sm },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
