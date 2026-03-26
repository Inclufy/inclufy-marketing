'use client';

import { useMemo, useState } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { useEvents } from '@/hooks/useEvents';
import { formatDate, channelIcon, statusColor } from '@/lib/utils';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

const DAYS_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTHS_NL = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

interface CalendarItem {
  id: string;
  title: string;
  type: 'proposal' | 'event';
  date: string;
  channel?: string;
  status: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { data: proposals } = useProposals();
  const { data: events } = useEvents();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar items
  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = [];
    (proposals || []).forEach(p => {
      if (p.scheduled_for) {
        items.push({ id: p.id, title: p.title, type: 'proposal', date: p.scheduled_for, channel: p.channel, status: p.status });
      }
    });
    (events || []).forEach(e => {
      items.push({ id: e.id, title: e.name, type: 'event', date: e.event_date, channel: undefined, status: e.status });
    });
    return items;
  }, [proposals, events]);

  // Get items for a specific date
  const getItemsForDate = (dateStr: string) => calendarItems.filter(i => i.date.startsWith(dateStr));

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedItems = selectedDay ? getItemsForDate(selectedDay) : [];

  // Stats
  const thisMonthItems = calendarItems.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const scheduledCount = thisMonthItems.filter(i => i.type === 'proposal').length;
  const eventsCount = thisMonthItems.filter(i => i.type === 'event').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Kalender</h1>
        <p className="text-gray-500">Overzicht van ingeplande content en events</p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-lg font-bold">{scheduledCount + eventsCount}</p><p className="text-xs text-gray-500">Items deze maand</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Clock className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-lg font-bold">{scheduledCount}</p><p className="text-xs text-gray-500">Ingeplande posts</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><Eye className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-lg font-bold">{eventsCount}</p><p className="text-xs text-gray-500">Events</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">{MONTHS_NL[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_NL.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const items = getItemsForDate(day.date);
              const isToday = day.date === todayStr;
              const isSelected = day.date === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day.date === selectedDay ? null : day.date)}
                  className={`relative min-h-[80px] rounded-lg border p-1.5 text-left transition-all ${
                    !day.isCurrentMonth ? 'bg-gray-50 text-gray-300 border-transparent' :
                    isSelected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' :
                    isToday ? 'border-brand-200 bg-brand-50/50' :
                    'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'rounded-full bg-brand-600 text-white px-1.5 py-0.5' : ''}`}>
                    {day.day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, 2).map(item => (
                      <div key={item.id} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${item.type === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.channel ? channelIcon(item.channel) + ' ' : ''}{item.title}
                      </div>
                    ))}
                    {items.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">+{items.length - 2} meer</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: selected day or upcoming */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDay ? `${new Date(selectedDay + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Binnenkort'}
          </h3>
          {(selectedDay ? selectedItems : calendarItems.filter(i => new Date(i.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10)).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Geen items {selectedDay ? 'op deze dag' : 'gepland'}</p>
          ) : (
            <div className="space-y-3">
              {(selectedDay ? selectedItems : calendarItems.filter(i => new Date(i.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10)).map(item => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.type === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {item.type === 'event' ? 'Event' : 'Post'}
                    </span>
                    {item.channel && <span className="text-xs">{channelIcon(item.channel)}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(item.status)}`}>{item.status}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  {!selectedDay && <p className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
