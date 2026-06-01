import { useState } from "react";
import { View, type ImageStyle, type StyleProp } from "react-native";
import { Image, type ImageContentFit } from "expo-image";
import { Colors } from "@/constants/colors";

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
};

export function ListingImage({
  uri,
  style,
  contentFit = "cover",
  recyclingKey,
}: Props) {
  const [retry, setRetry] = useState(0);

  const sourceUri = retry > 0 ? `${uri}${uri.includes("?") ? "&" : "?"}r=${retry}` : uri;

  return (
    <View style={[style, { backgroundColor: Colors.cardElevated, overflow: "hidden" }]}>
      <Image
        source={{ uri: sourceUri }}
        style={{ width: "100%", height: "100%" }}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey ?? uri}
        transition={300}
        onError={() => {
          if (retry < 2) setRetry((n) => n + 1);
        }}
      />
    </View>
  );
}
