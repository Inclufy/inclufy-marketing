/**
 * Logo upload utility for Brand Kit management.
 * Uses expo-image-picker to select an image and uploads to Supabase Storage.
 */

import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

/**
 * Launch image picker and upload selected logo to Supabase Storage.
 * Returns the public URL of the uploaded logo, or null if cancelled.
 */
export async function pickAndUploadLogo(): Promise<string | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Launch picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null; // User cancelled
  }

  const asset = result.assets[0];
  return uploadImageToStorage(asset.uri);
}

/**
 * Upload a local image URI to Supabase Storage.
 * Returns the public URL.
 * Uses fetch→blob pattern consistent with useCaptures.ts.
 */
export async function uploadImageToStorage(uri: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Read file as blob (same pattern as useCaptures.ts)
  const response = await fetch(uri);
  const blob = await response.blob();

  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const filePath = `brand-logos/${user.id}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, blob, {
      contentType: blob.type || (ext === 'png' ? 'image/png' : 'image/jpeg'),
      upsert: false,
    });

  if (error) throw error;

  // Get signed URL (works regardless of bucket public setting)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('media')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  if (signedError || !signedData?.signedUrl) {
    // Fallback to public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  return signedData.signedUrl;
}
