import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { InterestPicker } from "@/components/stories/InterestPicker";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SPACING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { getUserInterests, setUserInterests } from "@/services/userInterests";
import type { UserInterest } from "@/types";

export default function InterestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<UserInterest[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) getUserInterests(user.id).then(setSelected).catch(() => {});
  }, [user]);

  const toggle = (interest: UserInterest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setUserInterests(user.id, selected);
      router.replace("/stories");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save interests.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureScreenScaffold title="Crownly Connect">
      <ScreenHeader
        label="Personalize"
        title="Your Interests"
        subtitle="We'll recommend stories that match your world"
        style={{ paddingHorizontal: SPACING.screen }}
      />
      <InterestPicker selected={selected} onToggle={toggle} />
      <LuxuryButton
        label={saving ? "Saving..." : "Continue"}
        onPress={save}
        disabled={saving || selected.length === 0}
        style={{ marginHorizontal: SPACING.screen, marginTop: SPACING.lg }}
      />
    </FeatureScreenScaffold>
  );
}
