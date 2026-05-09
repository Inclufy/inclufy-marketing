'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { Users, Plus, Edit3, Trash2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MarketingStrategy, Persona, PersonaTone, Channel } from '@/types';

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'linkedin',  label: 'LinkedIn'  },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook'  },
  { key: 'x',         label: 'X'         },
  { key: 'tiktok',    label: 'TikTok'    },
];

const TONES: { key: PersonaTone; label: string; desc: string }[] = [
  { key: 'formal',         label: 'Formeel',     desc: 'B2B, professioneel, jargon-vrij maar zakelijk' },
  { key: 'casual',         label: 'Casual',      desc: 'Vriendelijk, conversational, emoji-vriendelijk' },
  { key: 'inspirational',  label: 'Inspirerend', desc: 'Motiverend, visionair, storytelling' },
];

function newPersona(): Persona {
  return {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: '', role: '', pain_points: [], tone: 'formal', channels: [],
  };
}

export default function PersonasPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Persona | null>(null);

  const { data: strategy, isLoading } = useQuery<MarketingStrategy | null>({
    queryKey: ['strategy'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('go_marketing_strategy')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data as MarketingStrategy | null;
    },
  });

  const personas = strategy?.personas ?? [];

  const save = useMutation({
    mutationFn: async (next: Persona[]) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { error } = await supabase
        .from('go_marketing_strategy')
        .upsert({ user_id: user.id, personas: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strategy'] }),
  });

  const handleSave = async (p: Persona) => {
    if (!p.name.trim()) { toast.error('Naam ontbreekt'); return; }
    if (p.channels.length === 0) { toast.error('Kies minstens één kanaal'); return; }
    const exists = personas.some((x) => x.id === p.id);
    const next = exists ? personas.map((x) => (x.id === p.id ? p : x)) : [...personas, p];
    try {
      await save.mutateAsync(next);
      toast.success('Opgeslagen');
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Opslaan mislukt');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deze persona verwijderen?')) return;
    try {
      await save.mutateAsync(personas.filter((p) => p.id !== id));
      toast.info('Verwijderd');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (editing) {
    return <PersonaEditor persona={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={save.isPending} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold">Persona&apos;s</h1>
            <p className="text-sm text-slate-500">Doelgroepen per kanaal — gebruikt door de channel-fit check.</p>
          </div>
        </div>
        <button
          onClick={() => setEditing(newPersona())}
          className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
        >
          <Plus className="h-4 w-4" /> Persona toevoegen
        </button>
      </div>

      {personas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-700">Nog geen persona&apos;s</h3>
          <p className="mt-1 text-sm text-slate-500">
            Beschrijf wie je bereikt per kanaal — gebruikt door de channel-fit beoordeling.
          </p>
          <button
            onClick={() => setEditing(newPersona())}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            <Plus className="h-4 w-4" /> Voeg er één toe
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {personas.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  {p.role && <p className="text-sm text-slate-500">{p.role}</p>}
                </div>
                <button onClick={() => setEditing(p)} className="rounded-full p-2 hover:bg-slate-100">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="rounded-full p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.channels.map((c) => (
                  <span key={c} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                    {CHANNELS.find((x) => x.key === c)?.label ?? c}
                  </span>
                ))}
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                  {TONES.find((x) => x.key === p.tone)?.label}
                </span>
              </div>
              {p.pain_points.length > 0 && (
                <p className="text-sm italic text-slate-500 line-clamp-2">
                  {p.pain_points.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonaEditor({
  persona, onSave, onCancel, saving,
}: { persona: Persona; onSave: (p: Persona) => void; onCancel: () => void; saving: boolean }) {
  const [name, setName] = useState(persona.name);
  const [role, setRole] = useState(persona.role);
  const [tone, setTone] = useState<PersonaTone>(persona.tone);
  const [channels, setChannels] = useState<Channel[]>(persona.channels);
  const [painText, setPainText] = useState(persona.pain_points.join('\n'));

  const toggleChannel = (c: Channel) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSubmit = () => {
    const pain_points = painText.split('\n').map((s) => s.trim()).filter(Boolean);
    onSave({ ...persona, name: name.trim(), role: role.trim(), tone, channels, pain_points });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <X className="h-4 w-4" /> Annuleer
        </button>
        <h1 className="text-xl font-bold">Persona bewerken</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Opslaan
        </button>
      </div>

      <Field label="Naam" hint="Bijv. 'Sarah, MKB-eigenaar'">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Persona naam"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-pink-500 focus:outline-none"
        />
      </Field>

      <Field label="Rol / functie" hint="Bijv. 'Marketing manager bij scale-up (50–200 fte)'">
        <input
          value={role} onChange={(e) => setRole(e.target.value)}
          placeholder="Functietitel + context"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-pink-500 focus:outline-none"
        />
      </Field>

      <Field label="Pijnpunten" hint="Eén per regel — gebruik kernwoorden uit hoe ze zelf praten">
        <textarea
          value={painText} onChange={(e) => setPainText(e.target.value)}
          placeholder={'tijdgebrek\nbudget\nROI bewijzen\nteam te klein'}
          rows={6}
          className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2 text-base focus:border-pink-500 focus:outline-none"
        />
      </Field>

      <Field label="Toon" hint="Welke schrijfstijl past bij deze persona?">
        <div className="space-y-2">
          {TONES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTone(t.key)}
              className={`w-full rounded-lg border p-3 text-left ${
                tone === t.key ? 'border-pink-600 bg-pink-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Kanalen" hint="Op welke kanalen mik je deze persona?">
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const active = channels.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggleChannel(c.key)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  active
                    ? 'border-pink-600 bg-pink-50 text-pink-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}
