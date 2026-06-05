import { Modal } from "react-native";
import { WatchScannerCameraView } from "@/components/WatchScannerCameraView";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
  loading?: boolean;
};

export function WatchScannerCameraModal({ visible, onClose, onCapture, loading }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <WatchScannerCameraView onClose={onClose} onCapture={onCapture} loading={loading} />
    </Modal>
  );
}
