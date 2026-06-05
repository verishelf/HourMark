import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AuthenticityPassportCard } from "@/components/AuthenticityPassportCard";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getPassportByCode, lookupSerial } from "@/services/passport";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { AuthenticityPassport } from "@/types";

export default function PassportScreen() {
  const { code, serial } = useLocalSearchParams<{ code?: string; serial?: string }>();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [passport, setPassport] = useState<AuthenticityPassport | null>(null);
  const [lookup, setLookup] = useState<Awaited<ReturnType<typeof lookupSerial>> | null>(null);

  useEffect(() => {
    if (code) getPassportByCode(code).then(setPassport);
    if (serial) lookupSerial(serial).then(setLookup);
  }, [code, serial]);

  return (
    <FeatureScreenScaffold
      title="Authenticity Passport"
      subtitle="Crownly verified provenance"
    >
      {passport ? <AuthenticityPassportCard passport={passport} /> : null}

      {lookup ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Serial {lookup.serial_number}</Text>
          {lookup.found ? (
            <>
              <Text style={styles.rowBody}>
                {lookup.listings_count} listing{lookup.listings_count === 1 ? "" : "s"} on record
                {lookup.brand ? ` · ${lookup.brand} ${lookup.model ?? ""}` : ""}
              </Text>
              {lookup.flagged ? (
                <Text style={styles.errorText}>This serial has been flagged in the registry</Text>
              ) : null}
              {lookup.passport_code ? (
                <Text style={styles.rowMeta}>Passport · {lookup.passport_code}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.rowBody}>No Crownly history for this serial.</Text>
          )}
        </View>
      ) : null}

      {!passport && !lookup ? (
        <EmptyState
          icon="shield-outline"
          title="Verify provenance"
          body="Enter a passport code or serial number to look up Crownly verification."
        />
      ) : null}
    </FeatureScreenScaffold>
  );
}
