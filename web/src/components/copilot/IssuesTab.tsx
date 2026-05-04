'use client';

// =============================================================================
// IssuesTab — Marketing AMOS AI Copilot "Issues" tab.
//
// Mirrors the Finance + ProjeXtPal Issues tabs:
//   - List recent issues for the user's primary organization
//   - Submit new issue ("Probleem melden")
//   - Auto-detects module_context from current pathname
//   - Paste-from-clipboard screenshots, file upload (≤5MB)
//   - Auto-captures environment (URL, browser, viewport, build SHA, etc.)
// =============================================================================

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
} from 'react';
import {
  AlertTriangle,
  Bug,
  Camera,
  CheckCircle2,
  Clipboard,
  FileImage,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type IssueAttachment,
  type IssueCategory,
  type ProductIssueRecord,
  captureEnvironment,
  createIssue,
  defaultCategoryForModule,
  detectMarketingModuleFromPath,
  fetchPrimaryOrgId,
  fileToAttachment,
  listRecentIssues,
  priorityBadgeClass,
  statusBadgeClass,
} from '@/lib/copilotIssues';

interface IssuesTabProps {
  pathname: string;
  isActive: boolean;
}

const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: 'ui', label: 'UI / Frontend' },
  { value: 'api', label: 'API / Backend' },
  { value: 'mobile', label: 'Mobiele app' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'auth', label: 'Login / Permissies' },
  { value: 'data', label: 'Data / Database' },
  { value: 'integration', label: 'Integratie (LinkedIn / Meta / TikTok)' },
  { value: 'documentation', label: 'Documentatie' },
  { value: 'other', label: 'Anders' },
];

export function IssuesTab({ pathname, isActive }: IssuesTabProps) {
  const detectedModule = detectMarketingModuleFromPath(pathname);
  const defaultCategory = defaultCategoryForModule(detectedModule);

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [issues, setIssues] = useState<ProductIssueRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>(defaultCategory);
  const [reproSteps, setReproSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [errorTrace, setErrorTrace] = useState('');
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the user's primary org id once when the tab is first activated.
  useEffect(() => {
    if (!isActive || organizationId) return;
    fetchPrimaryOrgId()
      .then((id) => setOrganizationId(id))
      .catch(() => setOrganizationId(null));
  }, [isActive, organizationId]);

  // Refresh list when tab becomes active and we have an org.
  useEffect(() => {
    if (isActive && organizationId && mode === 'list') {
      void refreshList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, organizationId, mode]);

  useEffect(() => {
    setCategory(defaultCategoryForModule(detectMarketingModuleFromPath(pathname)));
  }, [pathname]);

  async function refreshList() {
    if (!organizationId) return;
    setLoadingList(true);
    try {
      const list = await listRecentIssues(organizationId, 20);
      setIssues(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Kon issues niet ophalen', { description: msg });
    } finally {
      setLoadingList(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setCategory(defaultCategory);
    setReproSteps('');
    setExpected('');
    setActual('');
    setErrorTrace('');
    setAttachments([]);
  }

  async function handleSubmit() {
    if (!organizationId) {
      toast.error('Geen organisatie gevonden');
      return;
    }
    if (!title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }
    setSubmitting(true);
    try {
      const issue = await createIssue({
        organization_id: organizationId,
        title: title.trim(),
        description: description.trim(),
        category,
        module_context: detectedModule,
        reproduction_steps: reproSteps.trim(),
        expected_behavior: expected.trim(),
        actual_behavior: actual.trim(),
        error_trace: errorTrace.trim(),
        environment: captureEnvironment(pathname, organizationId),
        attachments,
        capture_method: attachments.some((a) => a.data_url)
          ? 'paste_clipboard'
          : 'manual_form',
      });
      toast.success('Probleem gemeld', {
        description: 'Onze AI-agent triageert het binnen enkele minuten.',
      });
      setIssues((prev) => [issue, ...prev]);
      resetForm();
      setMode('list');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Versturen mislukt', { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileChoose(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: IssueAttachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error('Bestand te groot', {
          description: `${f.name} (${Math.round(f.size / 1024)} KB) > 5 MB`,
        });
        continue;
      }
      newAttachments.push(await fileToAttachment(f));
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  }

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const att = await fileToAttachment(file);
          setAttachments((prev) => [...prev, att]);
          toast.success('Screenshot toegevoegd', {
            description: file.name || 'clipboard.png',
          });
        }
      }
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ─── Render: list mode ────────────────────────────────────────────── */

  if (mode === 'list') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-purple-50/40 px-6 py-3">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              Recente issues
              {detectedModule && (
                <span className="ml-2 text-gray-400">· {detectedModule}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={refreshList}
              disabled={loadingList}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              title="Vernieuwen"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setMode('form')}
              className="flex items-center gap-1 rounded bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            >
              <Plus className="h-3 w-3" />
              Probleem melden
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {!organizationId && isActive ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-xs">Organisatie laden...</span>
            </div>
          ) : loadingList && issues.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-xs">Issues laden...</span>
            </div>
          ) : issues.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500/70" />
              <p className="text-xs">
                Geen openstaande problemen. Werkt iets niet zoals verwacht?
              </p>
              <button
                type="button"
                onClick={() => setMode('form')}
                className="mt-3 inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" />
                Meld het nu
              </button>
            </div>
          ) : (
            issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
    );
  }

  /* ─── Render: form mode ────────────────────────────────────────────── */

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-purple-50/40 px-6 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">Probleem melden</span>
          {detectedModule && (
            <span className="rounded bg-purple-100 px-1.5 py-0 text-[10px] text-purple-700">
              {detectedModule}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMode('list');
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div>
          <label htmlFor="issue-title" className="block text-xs font-medium text-gray-700">
            Wat ging er mis? *
          </label>
          <input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. 'Post wordt niet gepubliceerd op LinkedIn'"
            className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500"
            maxLength={255}
          />
        </div>

        <div>
          <label htmlFor="issue-category" className="block text-xs font-medium text-gray-700">
            Categorie
          </label>
          <select
            id="issue-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
            className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="issue-description"
            className="block text-xs font-medium text-gray-700"
          >
            Beschrijving
          </label>
          <textarea
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handlePaste}
            placeholder="Wat probeer je te doen? Wat zie je? Plak hier ook screenshots — die worden automatisch toegevoegd."
            className="mt-1 block w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500"
            rows={4}
          />
          <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
            <Clipboard className="h-2.5 w-2.5" />
            Tip: plak een screenshot direct in dit veld.
          </p>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-800">
            + Meer details (optioneel)
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <label htmlFor="issue-repro" className="block text-xs font-medium text-gray-700">
                Stappen om te reproduceren
              </label>
              <textarea
                id="issue-repro"
                value={reproSteps}
                onChange={(e) => setReproSteps(e.target.value)}
                placeholder={'1. ...\n2. ...\n3. ...'}
                className="mt-1 block w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-xs"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="issue-expected" className="block text-xs font-medium text-gray-700">
                Wat verwachtte je?
              </label>
              <input
                id="issue-expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label htmlFor="issue-actual" className="block text-xs font-medium text-gray-700">
                Wat gebeurde er werkelijk?
              </label>
              <input
                id="issue-actual"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label htmlFor="issue-error" className="block text-xs font-medium text-gray-700">
                Foutmelding / console-output
              </label>
              <textarea
                id="issue-error"
                value={errorTrace}
                onChange={(e) => setErrorTrace(e.target.value)}
                placeholder="Plak hier eventueel een stacktrace..."
                className="mt-1 block w-full resize-none rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
                rows={3}
              />
            </div>
          </div>
        </details>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Bijlagen
            {attachments.length > 0 && (
              <span className="ml-1 text-gray-500">({attachments.length})</span>
            )}
          </label>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
            >
              <Camera className="h-3 w-3" />
              Bestand kiezen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.har,.txt,.log"
              className="hidden"
              onChange={handleFileChoose}
            />
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded bg-gray-100 px-2 py-1 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <FileImage className="h-3 w-3 shrink-0 text-gray-500" />
                    <span className="truncate">{att.name}</span>
                    <span className="shrink-0 text-gray-500">
                      ({Math.round(att.size_bytes / 1024)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-dashed border-purple-200 bg-purple-50/40 p-2">
          <p className="text-[10px] leading-relaxed text-gray-600">
            We voegen automatisch toe: paginalink, browser, schermresolutie,
            app-versie en tijdzone — zo kunnen we het probleem sneller reproduceren.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !organizationId}
          className="flex w-full items-center justify-center gap-2 rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-300"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Versturen...
            </>
          ) : (
            <>
              <Send className="h-3 w-3" />
              Verstuur probleem
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── IssueRow ────────────────────────────────────────────────────────── */

function IssueRow({ issue }: { issue: ProductIssueRecord }) {
  const created = new Date(issue.created_at);
  const ago = relativeTime(created);

  return (
    <div className="rounded-lg border border-gray-100 p-2.5 transition-colors hover:bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {issue.priority && (
              <span
                className={`rounded px-1.5 py-0 text-[10px] font-bold ${priorityBadgeClass(issue.priority)}`}
              >
                {issue.priority}
              </span>
            )}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${statusBadgeClass(issue.status)}`}
            >
              {issue.status}
            </span>
            {issue.module_context && (
              <span className="rounded border border-gray-200 px-1 py-0 text-[10px] text-gray-600">
                {issue.module_context}
              </span>
            )}
          </div>
          <p
            className="mt-1 truncate text-xs font-medium text-gray-900"
            title={issue.title}
          >
            {issue.title}
          </p>
          {issue.classification && (
            <p className="mt-0.5 text-[10px] text-gray-500">
              {issue.classification}
              {issue.triaged_by ? ` · ${issue.triaged_by}` : ''}
            </p>
          )}
        </div>
        <span className="mt-0.5 shrink-0 text-[10px] text-gray-500">{ago}</span>
      </div>
    </div>
  );
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'net';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
