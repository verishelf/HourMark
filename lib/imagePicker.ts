import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function isPhotoLibraryICloudError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("3164") || message.includes("PHPhotosErrorDomain");
}

export async function ensurePhotoLibraryPermission(message: string): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", message);
    return false;
  }
  return true;
}

function icloudAlert(video: boolean) {
  Alert.alert(
    "Download from iCloud",
    video
      ? "This video is only in iCloud. Open Photos, tap the video to download it to your iPhone, then try again."
      : "This photo is only in iCloud. Open Photos, tap the photo to download it to your iPhone, then try again."
  );
}

type PickOptions = {
  video?: boolean;
  quality?: number;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
};

export async function pickFromPhotoLibrary(
  options: PickOptions
): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await pickManyFromPhotoLibrary(options);
  return result[0] ?? null;
}

export async function pickManyFromPhotoLibrary(
  options: PickOptions
): Promise<ImagePicker.ImagePickerAsset[]> {
  try {
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: options.video ? ["videos"] : ["images"],
      quality: options.quality ?? 0.9,
      allowsMultipleSelection: options.allowsMultipleSelection,
      selectionLimit: options.selectionLimit,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    };

    // Passthrough fails for iCloud-only videos (PHPhotosErrorDomain 3164).
    if (options.video && Platform.OS === "ios") {
      pickerOptions.videoExportPreset = ImagePicker.VideoExportPreset.MediumQuality;
    }

    const picked = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (picked.canceled || !picked.assets?.length) return [];
    return picked.assets.filter((asset) => Boolean(asset.uri));
  } catch (error) {
    if (isPhotoLibraryICloudError(error)) {
      icloudAlert(Boolean(options.video));
    } else {
      Alert.alert(
        "Could not load media",
        error instanceof Error ? error.message : "Please try again."
      );
    }
    return [];
  }
}
