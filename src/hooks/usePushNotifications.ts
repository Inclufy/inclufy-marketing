// usePushNotifications — register the device's Expo push token with the
// backend (user_devices table) and set up foreground display.
//
// Called once from AppInner when a session is present. Idempotent: if the
// user already has this token registered, the upsert just bumps
// last_seen_at. If a different user previously had this token (account
// switch on shared device), the upsert re-binds it.
//
// Foreground display: by default Expo silently delivers data-only payloads
// when the app is in foreground. We set a notification handler so the
// banner still shows, matching the behavior users expect from native apps.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';

type Session = { user?: { id?: string } } | null;

export function usePushNotifications(session: Session) {
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    // Bail if no session, web (web push needs separate VAPID flow we
    // haven't set up), or already registered for this user.
    if (!userId) return;
    if (Platform.OS === 'web') return;
    if (registeredFor.current === userId) return;

    let cancelled = false;

    (async () => {
      try {
        // Lazy-import so the bundle skips the native module on web.
        const Notifications = await import('expo-notifications');

        // Foreground banner display (data-only payloads stay silent by
        // default on iOS — this surfaces them as banners when relevant).
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // 1. Permission
        const settings = await Notifications.getPermissionsAsync();
        let finalStatus = settings.status;
        if (settings.status !== 'granted') {
          const ask = await Notifications.requestPermissionsAsync();
          finalStatus = ask.status;
        }
        if (finalStatus !== 'granted') {
          return;
        }

        // 2. Token — projectId comes from EAS build config (app.json
        //    extras.eas.projectId). Constants exposes it on Expo SDK 49+.
        const projectId =
          (Constants.expoConfig?.extra as any)?.eas?.projectId ??
          (Constants as any).easConfig?.projectId;
        const tokenResp = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = tokenResp?.data;
        if (!token || cancelled) return;

        // 3. Upsert via edge function (RLS-safe: register-push-token uses
        //    the user JWT to scope the row).
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        const accessToken = freshSession?.access_token;
        if (!accessToken) return;

        const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
          ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
        const url = `${supabaseUrl}/functions/v1/register-push-token`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            expo_push_token: token,
            platform: Platform.OS as 'ios' | 'android',
            device_name: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
            app_version: (Constants.expoConfig?.version as string) ?? null,
          }),
        });

        if (res.ok) {
          registeredFor.current = userId;
        } else {
          const text = await res.text();
          console.warn('[push] register failed', res.status, text);
        }
      } catch (e) {
        // Never throw — push is best-effort, app should keep working
        // if the user denies permission or the device has no Play Services.
        console.warn('[push] setup error', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);
}
