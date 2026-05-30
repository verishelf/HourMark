import { useState } from "react";
import { type ImageStyle, type StyleProp } from "react-native";
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
    <Image
      source={{ uri: sourceUri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey ?? uri}
      transition={300}
      onError={() => {
        if (retry < 2) setRetry((n) => n + 1);
      }}
      placeholder={{ backgroundColor: Colors.cardElevated }}
    />
  );
}
