import { type ReactNode } from "react";
import { ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Custom header below the top bar (use embedded ScreenHeader). */
  header?: ReactNode;
  trailing?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function FeatureScreenScaffold({
  children,
  title,
  subtitle,
  header,
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
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarLeft}>
          <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          {title ? (
            <View style={styles.topBarTitles}>
              <Text style={styles.topBarTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.topBarSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {trailing ?? <View style={{ width: 40 }} />}
      </View>
      {header}
      {body}
    </View>
  );
}
