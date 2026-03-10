import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, spacing, borderRadius } from '../theme';

interface Props {
  onCapture: (uri: string) => void;
  onVideoStart?: () => void;
  onVideoEnd?: (uri: string) => void;
  mode: 'photo' | 'video';
}

export default function CameraCapture({ onCapture, onVideoStart, onVideoEnd, mode }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [recording, setRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera toegang nodig</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Geef toegang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      // Resize to max 1920px on longest side for upload efficiency
      const result = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      onCapture(result.uri);
    } catch (error) {
      Alert.alert('Fout', 'Kon geen foto maken');
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) return;

    if (recording) {
      cameraRef.current.stopRecording();
      setRecording(false);
    } else {
      setRecording(true);
      onVideoStart?.();
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
        if (video) onVideoEnd?.(video.uri);
      } catch {
        Alert.alert('Fout', 'Kon video niet opnemen');
      }
      setRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={mode}
      />

      {/* Controls overlay */}
      <View style={styles.controls}>
        {/* Flip camera */}
        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
        >
          <Text style={styles.flipText}>{'\u{1F504}'}</Text>
        </TouchableOpacity>

        {/* Capture button */}
        <TouchableOpacity
          style={[
            styles.captureBtn,
            mode === 'video' && recording && styles.captureBtnRecording,
          ]}
          onPress={mode === 'photo' ? takePhoto : toggleRecording}
        >
          <View
            style={[
              styles.captureBtnInner,
              mode === 'video' && recording && styles.captureBtnInnerRecording,
            ]}
          />
        </TouchableOpacity>

        {/* Placeholder for symmetry */}
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: spacing.md,
  },
  permissionText: { color: '#fff', fontSize: 16 },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  permissionBtnText: { color: '#fff', fontWeight: '600' as const },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipText: { fontSize: 22 },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnRecording: { borderColor: colors.error },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  captureBtnInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
});
