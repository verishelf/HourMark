import { type ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

type Props = {
  children: ReactNode;
  trailing?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function FeatureScreenScaffold({
  children,
  trailing,
  contentContainerStyle,
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useThemedStyles(createFeatureScreenStyles);

  const body = scroll ? (
    <ScrollView
      {...HIDE_SCROLL_INDICATORS}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, { flex: 1 }, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        {trailing ?? <View style={{ width: 40 }} />}
      </View>
      {body}
    </View>
  );
}
