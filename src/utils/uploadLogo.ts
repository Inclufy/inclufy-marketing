/**
 * Logo upload utility for Brand Kit management.
 * Supports picking from photo library OR file managers (Dropbox, iCloud, Google Drive, etc.)
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';

// Lazy import — expo-document-picker requires native module (not available in Expo Go)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DocumentPicker: any = null;
try { DocumentPicker = require('expo-document-picker'); } catch { /* not available */ }

/**
 * Show a choice dialog: pick logo from photo library or from files (Dropbox, etc.)
 * Returns the public URL of the uploaded logo, or null if cancelled.
 */
export function pickAndUploadLogo(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'Logo selecteren',
      'Kies een bron voor je logo',
      [
        {
          text: 'Fotobibliotheek',
          onPress: () => pickFromLibrary().then(resolve).catch(reject),
        },
        {
          text: 'Bestanden (Dropbox, iCloud...)',
          onPress: () => pickFromFiles().then(resolve).catch(reject),
        },
        { text: 'Annuleren', style: 'cancel', onPress: () => resolve(null) },
      ],
    );
  });
}

/**
 * Pick logo from photo library.
 */
async function pickFromLibrary(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Geen toegang tot fotobibliotheek');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return uploadImageToStorage(result.assets[0].uri);
}

/**
 * Pick logo from file managers (Dropbox, iCloud Drive, Google Drive, Files app, etc.)
 */
async function pickFromFiles(): Promise<string | null> {
  if (!DocumentPicker) {
    Alert.alert('Niet beschikbaar', 'Bestanden selecteren is alleen beschikbaar in de volledige app (niet in Expo Go).');
    return null;
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return uploadImageToStorage(result.assets[0].uri);
}

/**
 * Upload a local image URI to Supabase Storage.
 * Returns the signed URL.
 * Uses base64 upload for reliable iOS compatibility.
 */
export async function uploadImageToStorage(uri: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const timestamp = Date.now();
  // Detect format from URI
  const isPng = uri.toLowerCase().includes('.png');
  const ext = isPng ? 'png' : 'jpg';
  const contentType = isPng ? 'image/png' : 'image/jpeg';
  const filePath = `brand-logos/${user.id}/${timestamp}.${ext}`;

  // Read as base64 for reliable iOS upload
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, bytes, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[uploadLogo] Upload failed:', error);
    throw error;
  }

  // Get signed URL (works regardless of bucket public setting)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('media')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  if (signedError || !signedData?.signedUrl) {
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  return signedData.signedUrl;
}
