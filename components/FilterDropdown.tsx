import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { RADIUS } from "@/constants/layout";

type Option = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  compact?: boolean;
};

export function FilterDropdown({ title, value, options, onSelect, compact = false }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? title;

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 4 : 6,
          paddingHorizontal: compact ? 10 : 14,
          paddingVertical: compact ? 6 : 10,
          borderRadius: RADIUS.pill,
          borderWidth: 1,
          borderColor: Colors.textPrimary,
          backgroundColor: "transparent",
        }}
      >
        <Text
          style={{
            ...Typography.caption,
            color: Colors.textPrimary,
            fontWeight: "500",
            fontSize: compact ? 11 : 13,
          }}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 11 : 14} color={Colors.textPrimary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <Pressable
            style={{
              backgroundColor: Colors.cardElevated,
              borderTopLeftRadius: RADIUS.lg,
              borderTopRightRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              paddingTop: 16,
              paddingBottom: insets.bottom + 16,
              maxHeight: "60%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ ...Typography.label, color: Colors.textMuted, paddingHorizontal: 20, marginBottom: 12 }}>{title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <Text style={{ ...Typography.body, color: Colors.textPrimary, fontWeight: active ? "600" : "400" }}>{option.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.textPrimary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
