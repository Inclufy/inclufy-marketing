'use client';

import { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications';
import { formatDate } from '@/lib/utils';
import {
  Bell, CheckCheck, Check, FileCheck, Zap, Calendar,
  Megaphone, AlertCircle, Info,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  proposal: FileCheck,
  automation: Zap,
  event: Calendar,
  campaign: Megaphone,
  alert: AlertCircle,
  info: Info,
  default: Bell,
};

const COLOR_MAP: Record<string, string> = {
  proposal: 'bg-amber-50 text-amber-600',
  automation: 'bg-purple-50 text-purple-600',
  event: 'bg-blue-50 text-blue-600',
  campaign: 'bg-green-50 text-green-600',
  alert: 'bg-red-50 text-red-600',
  info: 'bg-gray-50 text-gray-600',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const filtered = filter === 'unread'
    ? notifications?.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaties</h1>
          <p className="text-gray-500">{unreadCount > 0 ? `${unreadCount} ongelezen` : 'Alles bijgewerkt'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => { markAllRead.mutate(); }}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" /> Alles gelezen
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Alles
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Ongelezen {unreadCount > 0 && <span className="ml-1 rounded-full bg-red-500 text-white px-1.5 py-0.5 text-[10px]">{unreadCount}</span>}
        </button>
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : filtered?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">{filter === 'unread' ? 'Geen ongelezen notificaties' : 'Geen notificaties'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map(n => {
            const Icon = ICON_MAP[n.type] || ICON_MAP.default;
            const colorClass = COLOR_MAP[n.type] || COLOR_MAP.info;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                  n.is_read ? 'border-gray-100 bg-white' : 'border-brand-200 bg-brand-50/30'
                }`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
