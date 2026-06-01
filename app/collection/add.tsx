import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { addToCollection } from "@/services/collection";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

export default function AddCollectionItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [ref, setRef] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !brand.trim() || !model.trim()) {
      Alert.alert("Required", "Brand and model are required.");
      return;
    }
    setLoading(true);
    try {
      const cents = price ? Math.round(parseFloat(price.replace(/[^0-9.]/g, "")) * 100) : undefined;
      await addToCollection(user.id, {
        brand: brand.trim(),
        model: model.trim(),
        reference_number: ref.trim() || undefined,
        purchase_price: cents,
        estimated_value: cents,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureScreenScaffold>
      <ScreenHeader
        title="Add to Collection"
        subtitle="Log a watch you own for portfolio tracking"
      />

      <View style={styles.formCard}>
        <FeatureFormField label="Brand" value={brand} onChangeText={setBrand} placeholder="Rolex" />
        <FeatureFormField label="Model" value={model} onChangeText={setModel} placeholder="Submariner" />
        <FeatureFormField
          label="Reference"
          value={ref}
          onChangeText={setRef}
          placeholder="126610LN"
        />
        <FeatureFormField
          label="Purchase price (USD)"
          value={price}
          onChangeText={setPrice}
          placeholder="12500"
          keyboardType="decimal-pad"
        />
        <LuxuryButton label={loading ? "Saving…" : "Save to collection"} onPress={handleSave} disabled={loading} />
      </View>
    </FeatureScreenScaffold>
  );
}
