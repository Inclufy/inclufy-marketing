'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileArchive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

export default function LibraryImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [campaign, setCampaign] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.zip')) {
      toast.error('Selecteer een .zip bestand');
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Upload ZIP to storage
      const ts = Date.now();
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
      const zipPath = `${user.id}/${ts}-${safeName}`;

      const ab = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from('library-imports')
        .upload(zipPath, ab, { contentType: 'application/zip', upsert: false });
      if (upErr) throw upErr;

      // Trigger import edge function
      const { data, error: fnErr } = await supabase.functions.invoke('import-library-zip', {
        body: { zipPath, campaign: campaign || undefined },
      });
      if (fnErr) {
        let detail = fnErr.message;
        const ctx = (fnErr as any).context;
        if (ctx?.text) {
          try {
            const raw = await ctx.text();
            try {
              const parsed = JSON.parse(raw);
              detail = parsed.error || parsed.details || raw;
            } catch { detail = raw; }
          } catch {/* ignore */}
        }
        throw new Error(detail);
      }

      const created = data?.posts_created ?? data?.created ?? '?';
      setResult(`✅ Geïmporteerd: ${created} posts`);
      toast.success(`Geïmporteerd: ${created} posts`);
      setTimeout(() => router.push('/library'), 1500);
    } catch (err: any) {
      setResult(`❌ ${err.message}`);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Library import</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">ZIP structuur</h3>
        <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
{`manifest.json (verplicht)
images/
  <filename>.png|jpg|webp

De manifest beschrijft posts, talen, kanalen, captions en hashtags.`}
        </pre>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Campagne (optioneel)</label>
        <input
          value={campaign} onChange={(e) => setCampaign(e.target.value)}
          placeholder="Bijv. 2026-Q2-launch (manifest wint)"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">ZIP bestand</label>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-pink-400 disabled:opacity-50"
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileArchive className="h-8 w-8 text-pink-600" />
              <div className="text-left">
                <div className="font-semibold text-slate-900">{file.name}</div>
                <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">Klik om ZIP te selecteren</span>
            </div>
          )}
        </button>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        {busy ? 'Importeren…' : 'Upload & importeer'}
      </button>

      {result && (
        <div className={`rounded-lg border p-4 text-sm ${
          result.startsWith('✅')
            ? 'border-green-300 bg-green-50 text-green-900'
            : 'border-red-300 bg-red-50 text-red-900'
        }`}>
          {result.startsWith('✅')
            ? <CheckCircle2 className="inline h-4 w-4 mr-1" />
            : <AlertCircle className="inline h-4 w-4 mr-1" />}
          {result.slice(2)}
        </div>
      )}
    </div>
  );
}
