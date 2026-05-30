import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import {
  analyzeListingImages,
  automatedTrustScore,
  buildTrustBadges,
  calculateFraudRisk,
  detectDuplicateSerials,
  hashSerial,
  isSuspiciousPrice,
  isSuspiciousSerial,
  normalizeSerial,
  resolveAuthStatus,
  validateSerialFormat,
  type FraudFlag,
} from "../_shared/trust.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { listingId } = await req.json();
    if (!listingId || typeof listingId !== "string") {
      return jsonResponse({ message: "listingId is required" }, 400);
    }

    const supabase = getServiceClient();

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*, seller:users(is_verified_seller, verified, account_trust_score, fraud_risk_score)")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return jsonResponse({ message: "Listing not found" }, 404);
    }

    if (listing.seller_id !== authResult.user.id) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    await supabase
      .from("listings")
      .update({ authentication_status: "analyzing" })
      .eq("id", listingId);

    const { data: assets } = await supabase
      .from("listing_verification_assets")
      .select("*")
      .eq("listing_id", listingId);

    const assetList = assets ?? [];
    const imageAnalysis = analyzeListingImages(assetList, listing.images ?? []);
    const flags: FraudFlag[] = [...imageAnalysis.flags];

    const serial =
      listing.serial_number
        ? normalizeSerial(listing.serial_number)
        : listing.extracted_serial_number ?? null;

    let serialValid = false;
    let serialHash: string | null = null;

    if (serial) {
      serialValid = validateSerialFormat(listing.brand, serial);
      if (!serialValid) flags.push("suspicious_serial" as FraudFlag);
      if (isSuspiciousSerial(serial)) flags.push("suspicious_serial");
      serialHash = await hashSerial(serial);

      const dup = await detectDuplicateSerials(
        supabase,
        serialHash,
        listingId,
        listing.seller_id
      );
      if (dup.duplicate) flags.push("duplicate_serial");
    }

    if (isSuspiciousPrice(listing.brand, listing.price)) {
      flags.push("suspicious_price");
    }

    const seller = listing.seller as {
      is_verified_seller?: boolean;
      verified?: boolean;
      account_trust_score?: number;
    } | null;

    const accountTrust = seller?.account_trust_score ?? 50;
    const sellerVerified = Boolean(seller?.is_verified_seller ?? seller?.verified);

    const { count: rejectedCount } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", listing.seller_id)
      .eq("authentication_status", "rejected");

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: spamCount } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", listing.seller_id)
      .gte("created_at", since);

    const fraudRisk = calculateFraudRisk({
      flags,
      duplicateSerial: flags.includes("duplicate_serial"),
      rejectedListingCount: rejectedCount ?? 0,
      accountTrustScore: accountTrust,
      listingSpamCount24h: spamCount ?? 0,
    });

    if (fraudRisk >= 70) flags.push("high_fraud_risk");

    const hasAllAssets = !flags.includes("missing_verification_assets");
    const trustScore = automatedTrustScore({
      assetConfidence: imageAnalysis.confidence,
      serialValid: serialValid && Boolean(serial),
      hasAllAssets,
      fraudRisk,
      flagCount: flags.length,
    });

    const authStatus = resolveAuthStatus(trustScore, fraudRisk, flags);
    const hasBoxPapers = assetList.some((a) => a.asset_type === "box_papers");
    const badges = buildTrustBadges({
      sellerVerified,
      authStatus,
      trustScore,
      hasBoxPapers,
      accountTrustScore: accountTrust,
    });

    const listingStatus =
      authStatus === "auto_verified" ? "active" : authStatus === "rejected" ? "archived" : "draft";

    await supabase
      .from("listings")
      .update({
        authentication_status: authStatus,
        ai_trust_score: trustScore,
        fraud_flags: flags,
        extracted_serial_number: serial,
        verification_confidence: imageAnalysis.confidence,
        trust_badges: badges,
        authenticated: authStatus === "auto_verified",
        status: listingStatus,
      })
      .eq("id", listingId);

    if (serial && serialHash && authStatus !== "rejected") {
      await supabase.from("serial_registry").upsert(
        {
          serial_hash: serialHash,
          serial_normalized: serial,
          listing_id: listingId,
          seller_id: listing.seller_id,
          brand: listing.brand,
        },
        { onConflict: "serial_hash" }
      );
    }

    if (fraudRisk >= 50) {
      await supabase.from("fraud_events").insert({
        user_id: listing.seller_id,
        listing_id: listingId,
        event_type: "listing_analysis",
        risk_delta: fraudRisk,
        metadata: { flags, trustScore, authStatus },
      });
    }

    return jsonResponse({
      trustScore,
      fraudRisk,
      authenticationStatus: authStatus,
      flags,
      badges,
      listingStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return jsonResponse({ message }, 500);
  }
});
