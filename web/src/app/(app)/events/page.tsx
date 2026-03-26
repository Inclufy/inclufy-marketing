'use client';

import { useState } from 'react';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { formatDate, statusColor, channelIcon } from '@/lib/utils';
import { Calendar, Plus, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const STATUS_FILTERS = ['all', 'upcoming', 'active', 'completed', 'archived'] as const;

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location: '', event_date: '', channels: [] as string[] });
  const { data: events, isLoading } = useEvents(filter);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent.mutateAsync({
        ...form,
        channels: form.channels as any,
        status: 'upcoming',
        hashtags: [],
        default_tags: [],
        goals: [],
      });
      toast.success('Event aangemaakt!');
      setShowCreate(false);
      setForm({ name: '', description: '', location: '', event_date: '', channels: [] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500">{events?.length ?? 0} events totaal</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nieuw Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'Alle' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>
      ) : events?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nog geen events</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Maak je eerste event aan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events?.map(event => (
            <div key={event.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                </div>
                <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" /> {formatDate(event.event_date)}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" /> {event.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm">
                  {event.channels?.map(ch => (
                    <span key={ch} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{channelIcon(ch)} {ch}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                <Link href={`/events/${event.id}`} className="flex-1 rounded-lg bg-brand-50 py-1.5 text-center text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                  Bekijken
                </Link>
                <button
                  onClick={() => { if (confirm('Weet je het zeker?')) deleteEvent.mutate(event.id); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nieuw Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Event naam" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Beschrijving" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Amsterdam" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                  <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kanalen</label>
                <div className="flex flex-wrap gap-2">
                  {['linkedin', 'instagram', 'facebook', 'tiktok', 'x'].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }))}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${form.channels.includes(ch) ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                    >
                      {channelIcon(ch)} {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuleren
                </button>
                <button type="submit" disabled={createEvent.isPending} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                  {createEvent.isPending ? 'Aanmaken...' : 'Event Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
