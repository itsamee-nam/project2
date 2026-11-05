import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the product name found for the barcode. */
  onFound: (name: string) => void;
}

/** Optional feature: scan a barcode and look the product name up on Open Food Facts. */
export function BarcodeScanner({ visible, onClose, onFound }: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Point the camera at a barcode');
  const handled = useRef(false);

  const onScan = async ({ data }: { data: string }) => {
    if (handled.current) return;
    handled.current = true;
    setBusy(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(data)}.json?fields=product_name,generic_name`);
      const json = (await res.json()) as { status?: number; product?: { product_name?: string; generic_name?: string } };
      const name = json.product?.product_name || json.product?.generic_name;
      if (json.status === 1 && name) {
        onFound(name);
        handled.current = false;
        setBusy(false);
        onClose();
        return;
      }
      setMessage('Product not found. Try another or type the name.');
    } catch {
      setMessage('Could not look up the product (no internet?).');
    }
    setBusy(false);
    setTimeout(() => { handled.current = false; }, 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        {!perm ? (
          <ActivityIndicator />
        ) : !perm.granted ? (
          <View style={styles.center}>
            <Text style={styles.light}>DormChef needs camera access to scan barcodes.</Text>
            <Button mode="contained" onPress={requestPerm} style={{ marginTop: 12 }}>Allow camera</Button>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={onScan}
          />
        )}
        <View style={styles.footer}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.light}>{message}</Text>}
          <Button mode="contained-tonal" onPress={onClose} style={{ marginTop: 12 }}>Cancel</Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', padding: 16 },
  light: { color: '#fff', textAlign: 'center' },
});
