/**
 * Calendar sync hook — syncs Inclufy GO events to the device calendar.
 * Also schedules local push notifications as reminders.
 */

import { useState, useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Event } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarSyncResult {
  syncing: boolean;
  error: string | null;
  addToCalendar: (event: Event) => Promise<string | null>;
  removeFromCalendar: (calendarEventId: string) => Promise<void>;
  scheduleReminder: (event: Event, minutesBefore: number) => Promise<string | null>;
  cancelReminder: (notificationId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a Date object from event_date + optional event_start_time.
 * event_date: "2026-03-15", event_start_time: "14:30" or null
 */
function buildEventDate(eventDate: string, time: string | null): Date {
  const d = new Date(eventDate + 'T' + (time || '09:00') + ':00');
  return isNaN(d.getTime()) ? new Date(eventDate) : d;
}

/**
 * Get or create an "Inclufy GO" calendar on the device.
 */
async function getOrCreateCalendar(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Look for existing Inclufy calendar
  const existing = calendars.find(c => c.title === 'Inclufy GO');
  if (existing) return existing.id;

  // Create new calendar
  const defaultCalendarSource =
    Platform.OS === 'ios'
      ? calendars.find(c => c.source?.name === 'iCloud')?.source ||
        calendars.find(c => c.source?.isLocalAccount)?.source
      : { isLocalAccount: true, name: 'Inclufy GO', type: Calendar.CalendarType.LOCAL as any };

  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'Inclufy GO',
    color: '#A855F7',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: (defaultCalendarSource as any)?.id,
    source: defaultCalendarSource as any,
    name: 'inclufy-go',
    ownerAccount: 'inclufy',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarId;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCalendarSync(): CalendarSyncResult {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Calendar permission
    const { status: calStatus } = await Calendar.requestCalendarPermissionsAsync();
    if (calStatus !== 'granted') {
      setError('Calendar permission denied');
      return false;
    }

    // Notification permission
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== 'granted') {
      setError('Notification permission denied');
      return false;
    }

    return true;
  }, []);

  const addToCalendar = useCallback(async (event: Event): Promise<string | null> => {
    setSyncing(true);
    setError(null);

    try {
      const granted = await requestPermissions();
      if (!granted) return null;

      const calendarId = await getOrCreateCalendar();
      const startDate = buildEventDate(event.event_date, event.event_start_time);
      const endDate = event.event_end_time
        ? buildEventDate(event.event_date, event.event_end_time)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2h duration

      const calEventId = await Calendar.createEventAsync(calendarId, {
        title: event.name,
        notes: event.description,
        location: event.location,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [
          { relativeOffset: -60 },    // 1 hour before
          { relativeOffset: -1440 },   // 1 day before
        ],
      });

      return calEventId;
    } catch (err: any) {
      setError(err.message || 'Calendar sync failed');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [requestPermissions]);

  const removeFromCalendar = useCallback(async (calendarEventId: string) => {
    try {
      await Calendar.deleteEventAsync(calendarEventId);
    } catch (err: any) {
      setError(err.message || 'Could not remove calendar event');
    }
  }, []);

  const scheduleReminder = useCallback(async (
    event: Event,
    minutesBefore: number,
  ): Promise<string | null> => {
    try {
      const granted = await requestPermissions();
      if (!granted) return null;

      const startDate = buildEventDate(event.event_date, event.event_start_time);
      const triggerDate = new Date(startDate.getTime() - minutesBefore * 60 * 1000);

      // Don't schedule if in the past
      if (triggerDate <= new Date()) return null;

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: event.name,
          body: minutesBefore >= 1440
            ? `Morgen: ${event.name}${event.location ? ' — ' + event.location : ''}`
            : `Over ${minutesBefore} min: ${event.name}${event.location ? ' — ' + event.location : ''}`,
          data: { eventId: event.id, type: 'event_reminder' },
          sound: true,
        },
        trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
      });

      return notifId;
    } catch (err: any) {
      setError(err.message || 'Could not schedule reminder');
      return null;
    }
  }, [requestPermissions]);

  const cancelReminder = useCallback(async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore if already cancelled
    }
  }, []);

  return {
    syncing,
    error,
    addToCalendar,
    removeFromCalendar,
    scheduleReminder,
    cancelReminder,
    requestPermissions,
  };
}
