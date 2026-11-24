
"use client";

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app-shell';
import Modal from '@/components/modal';
import { api, fmtDate } from '@/lib/api';
import { adSpendGstNotice, dailySpend, formatMarketingMetrics, marketingCurrency, marketingImageUrls, marketingReportCsv, type MarketingActivity, type MarketingImage } from '@/lib/marketing-performance';
import { useUserRole } from '@/lib/use-user-role';
import { BarChart3, ChevronLeft, ChevronRight, Download, ImagePlus, Plus, Printer, Trash2, UploadCloud } from 'lucide-react';

const platforms = [
  ['META', 'Meta Ads'],
  ['GOOGLE', 'Google Ads'],
  ['TIKTOK', 'TikTok Ads'],
  ['LINKEDIN', 'LinkedIn Ads'],
  ['OTHER', 'Other'],
] as const;

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
const valueDateKey = (value: string) => dateKey(new Date(value));
const toLocalDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (value: string) => value ? new Date(value).toISOString() : null;
const optionalNumber = (value: string) => value === '' ? null : Number(value);

const blank = (clientId = '') => ({
  clientId,
  creativeName: '',
  platform: 'META',
  uploadedAt: toLocalDateTime(new Date().toISOString()),
  spendRupees: '0',
  location: '',
  showDailySpendToClient: true,
  totalImpressions: '',
  totalReach: '',
  totalResult: '',
  costPerResult: '',
  takenDownAt: '',
  notes: '',
});

const MAX_IMAGES_PER_SAVE = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type PendingImage = { file: File; uploaded?: MarketingImage };

function PendingImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const previewUrl = URL.createObjectURL(file);
    setUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);
  return url ? <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-slate-100"/> : null;
}

export default function MarketingPerformance() {
  const role = useUserRole();
  const canManage = role === 'ADMIN' || role === 'TEAM_MEMBER';
  const [date, setDate] = useState(() => new Date());
  const [items, setItems] = useState<MarketingActivity[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'month' | 'list'>('month');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingActivity | null>(null);
  const [selected, setSelected] = useState<MarketingActivity | null>(null);
  const [form, setForm] = useState(() => blank());
  const [reportBusy, setReportBusy] = useState(false);
  const now = new Date();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const month = date.getFullYear() + '-' + pad(date.getMonth() + 1);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: offset + days > 35 ? 42 : 35 }, (_, index) => index - offset + 1);

  const clientQuery = canManage && filter ? '&clientId=' + encodeURIComponent(filter) : '';
  const activitiesPath = '/marketing-performance?month=' + month + clientQuery;

  async function load() {
    try {
      setError('');
      const results = await Promise.all([
        api<any[]>('/clients'),
        api<MarketingActivity[]>(activitiesPath),
      ]);
      setClients(results[0]);
      setItems(results[1]);
    } catch (cause: any) {
      setError(cause.message || 'Could not load marketing performance.');
    }
  }

  useEffect(() => { load(); }, [month, filter, canManage]);

  const totalSpend = useMemo(
    () => items.reduce((total, item) => total + Number(item.spendRupees || 0), 0),
    [items],
  );

  const activeCount = useMemo(() => {
    const now = Date.now();
    return items.filter(item => new Date(item.uploadedAt).getTime() <= now
      && (!item.takenDownAt || new Date(item.takenDownAt).getTime() > now)).length;
  }, [items]);

  function eventsForDay(day: number) {
    const key = dateKey(new Date(date.getFullYear(), date.getMonth(), day));
    return items.flatMap(item => {
      const events = [];
      if (valueDateKey(item.uploadedAt) === key) events.push({ item, kind: 'uploaded' as const });
      if (item.takenDownAt && valueDateKey(item.takenDownAt) === key) events.push({ item, kind: 'taken-down' as const });
      return events;
    });
  }

  function startCreate() {
    setEditing(null);
    setForm(blank(clients[0]?.id || ''));
    setPendingImages([]);
    setError('');
    setEditorOpen(true);
  }

  function startEdit(item: MarketingActivity) {
    setEditing(item);
    setForm({
      clientId: item.clientId,
      creativeName: item.creativeName,
      platform: item.platform || 'META',
      uploadedAt: toLocalDateTime(item.uploadedAt),
      spendRupees: String(item.spendRupees ?? 0),
      location: item.location ?? '',
      showDailySpendToClient: item.showDailySpendToClient !== false,
      totalImpressions: String(item.totalImpressions ?? ''),
      totalReach: String(item.totalReach ?? ''),
      totalResult: item.totalResult ?? '',
      costPerResult: String(item.costPerResult ?? ''),
      takenDownAt: item.takenDownAt ? toLocalDateTime(item.takenDownAt) : '',
      notes: item.notes || '',
    });
    setPendingImages([]);
    setError('');
    setSelected(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setPendingImages([]);
    setError('');
  }

  function openActivity(item: MarketingActivity) {
    if (canManage) startEdit(item);
    else setSelected(item);
  }

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;
    if (pendingImages.length + files.length > MAX_IMAGES_PER_SAVE) {
      setError('Choose up to 10 new images per save.');
      return;
    }
    if (files.some(file => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES || file.size === 0)) {
      setError('Choose JPEG, PNG, WebP or GIF images up to 4 MB each.');
      return;
    }
    setError('');
    setPendingImages(previous => [...previous, ...files.map(file => ({ file }))]);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const images: MarketingImage[] = [];
      for (const pending of pendingImages) {
        let uploaded = pending.uploaded;
        if (!uploaded) {
          const upload = new FormData();
          upload.append('image', pending.file);
          uploaded = await api<MarketingImage>('/marketing-performance/upload', { method: 'POST', body: upload });
          setPendingImages(previous => previous.map(entry => entry.file === pending.file ? { ...entry, uploaded } : entry));
        }
        images.push(uploaded);
      }

      const payload = {
        clientId: form.clientId,
        creativeName: form.creativeName.trim(),
        platform: form.platform,
        uploadedAt: toIso(form.uploadedAt),
        spendRupees: Number(form.spendRupees),
        location: form.location.trim() || null,
        showDailySpendToClient: form.showDailySpendToClient,
        totalImpressions: optionalNumber(form.totalImpressions),
        totalReach: optionalNumber(form.totalReach),
        totalResult: form.totalResult.trim() || null,
        costPerResult: optionalNumber(form.costPerResult),
        takenDownAt: toIso(form.takenDownAt),
        images,
        notes: form.notes.trim() || null,
      };

      await api(editing ? '/marketing-performance/' + editing.id : '/marketing-performance', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      closeEditor();
      await load();
    } catch (cause: any) {
      setError(cause.message || 'Could not save this creative.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      await api('/marketing-performance/' + editing.id, { method: 'DELETE' });
      closeEditor();
      await load();
    } catch (cause: any) {
      setError(cause.message || 'Could not delete this creative.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadReport() {
    setReportBusy(true);
    setError('');
    try {
      const reportItems = await api<MarketingActivity[]>(activitiesPath);
      const csv = marketingReportCsv(reportItems, new Date(), canManage);
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ad-performance-' + month + '.csv';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not download the report.');
    } finally {
      setReportBusy(false);
    }
  }

  const monthLabel = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const visibleList = items.slice().sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return <AppShell>
    <div className="px-4 md:px-8 py-8 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap justify-between gap-4 items-end mb-6 print-hide">
        <div>
          <div className="text-xs font-bold tracking-widest text-brand">PAID MEDIA</div>
          <h1 className="text-3xl font-extrabold mt-2">Ad performance</h1>
          <p className="text-sm text-slate-500 mt-1">Track creative uploads, spend and takedown dates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-light" disabled={reportBusy} onClick={downloadReport}><Download size={15}/> {reportBusy ? 'Downloading…' : 'Download report (CSV)'}</button>
          <button className="btn btn-light" onClick={() => window.print()}><Printer size={15}/> Download PDF</button>
          {canManage && <button className="btn btn-primary" onClick={startCreate}><Plus size={16}/> Add creative</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="panel p-4"><div className="text-xs font-bold text-slate-500">Visible ad spend</div><div className="text-2xl font-extrabold mt-2">{marketingCurrency.format(totalSpend)}</div></div>
        <div className="panel p-4"><div className="text-xs font-bold text-slate-500">Currently active</div><div className="text-2xl font-extrabold mt-2">{activeCount}</div></div>
        <div className="panel p-4"><div className="text-xs font-bold text-slate-500">Creatives in this period</div><div className="text-2xl font-extrabold mt-2">{items.length}</div></div>
      </div>

      {/* {role === 'CLIENT' && <p className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{adSpendGstNotice}</p>} */}

      {error && !editorOpen && <div role="alert" className="panel p-4 text-sm text-red-600 mb-5">{error}</div>}

      <section className="panel p-4 calendar-export-panel">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4 calendar-toolbar">
          <div className="flex items-center gap-3">
            <button aria-label="Previous month" className="btn btn-light !p-2" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={17}/></button>
            <h2 className="text-xl font-extrabold min-w-40">{monthLabel}</h2>
            <button aria-label="Next month" className="btn btn-light !p-2" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={17}/></button>
            <button className="text-xs font-bold text-brand ml-1" onClick={() => setDate(new Date())}>Today</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && <select aria-label="Filter by client" className="field !w-auto !py-2 text-xs" value={filter} onChange={event => setFilter(event.target.value)}>
              <option value="">All clients</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>}
            <select aria-label="Calendar view" className="field !w-auto !py-2 text-xs" value={view} onChange={event => setView(event.target.value as 'month' | 'list')}>
              <option value="month">Calendar</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>

        {view === 'month' ? <>
          <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="calendar-grid">
            {cells.map((day, index) => <div className="calendar-cell" key={index} style={{ background: day < 1 || day > days ? '#fafbfc' : 'white' }}>
              {day > 0 && day <= days && <>
                <div className={'text-xs font-bold mb-2 ' + (dateKey(new Date()) === dateKey(new Date(date.getFullYear(), date.getMonth(), day)) ? 'text-brand' : '')}>{day}</div>
                <div className="space-y-1">
                  {eventsForDay(day).slice(0, 3).map(event => <button
                    key={event.item.id + event.kind}
                    onClick={() => openActivity(event.item)}
                    className="event-title rounded-md px-1.5 py-1 text-[10px] font-bold truncate w-full text-left"
                    style={{
                      background: event.kind === 'uploaded' ? '#16A34A18' : '#DC262618',
                      color: event.kind === 'uploaded' ? '#16A34A' : '#DC2626',
                    }}
                    title={
                      (event.kind === 'uploaded'
                        ? 'Creative uploaded: '
                        : 'Creative taken down: ') + event.item.creativeName
                    }
                  >
                    <span className="mr-1">
                      {event.kind === 'uploaded' ? 'Active' : 'Completed'}
                    </span>
                    {event.item.creativeName}
                  </button>)}
                  {eventsForDay(day).length > 3 && <div className="text-[9px] text-slate-400">+{eventsForDay(day).length - 3} more</div>}
                </div>
              </>}
            </div>)}
          </div>
        </> : <div>
          {visibleList.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No ad activity for this month.</div>}
          {visibleList.map(item => {
            const [cover] = marketingImageUrls(item);
            return <button key={item.id} onClick={() => openActivity(item)} className="w-full text-left py-4 border-t border-slate-100 flex flex-wrap gap-4 items-center">
            {cover ? <img src={cover} alt="" className="w-16 h-16 object-cover rounded-xl bg-slate-100"/> : <div className="w-16 h-16 rounded-xl bg-slate-100 grid place-items-center text-slate-400"><ImagePlus size={20}/></div>}
            <div className="flex-1 min-w-48">
              <div className="flex flex-wrap items-center gap-2"><b className="text-sm">{item.creativeName}</b><span className="badge bg-slate-100 text-slate-600">{platforms.find(platform => platform[0] === item.platform)?.[1] || item.platform}</span></div>
              <p className="text-xs text-slate-500 mt-1">{item.client?.name || 'Client'} · Uploaded {fmtDate(item.uploadedAt)}{item.takenDownAt ? ' · Taken down ' + fmtDate(item.takenDownAt) : ' · Still active'}</p>
            </div>
            <div className="font-extrabold">{marketingCurrency.format(Number(item.spendRupees || 0))}</div>
            <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
              {formatMarketingMetrics(item, now, canManage).map(([label, value]) => <div key={label} className="min-w-0">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-sm font-semibold whitespace-pre-wrap break-words">{value}</dd>
              </div>)}
            </dl>
          </button>;
          })}
        </div>}
      </section>

      <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-3 print-hide"><span><b className="text-brand">UP</b> Creative uploaded</span><span><b className="text-slate-500">DOWN</b> Creative taken down</span><span className="ml-auto flex items-center gap-1"><BarChart3 size={13}/> Amounts are in INR</span></div>
    </div>

    {editorOpen && <Modal title={editing ? 'Edit ad creative' : 'Add ad creative'} onClose={() => { if (!busy) closeEditor(); }}>
      <form onSubmit={save} className="space-y-4">
        {canManage && <label className="block"><span className="label">Client</span><select className="field" value={form.clientId} onChange={event => setForm({ ...form, clientId: event.target.value })} required>
          <option value="" disabled>Select a client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select></label>}
        <label className="block"><span className="label">Creative name</span><input className="field" value={form.creativeName} onChange={event => setForm({ ...form, creativeName: event.target.value })} maxLength={160} required/></label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="label">Ad platform</span><select className="field" value={form.platform} onChange={event => setForm({ ...form, platform: event.target.value })}>{platforms.map(platform => <option key={platform[0]} value={platform[0]}>{platform[1]}</option>)}</select></label>
          <label className="block"><span className="label">Total spend (₹)</span><input className="field" type="number" min="0" max="9999999999.99" step="0.01" value={form.spendRupees} onChange={event => setForm({ ...form, spendRupees: event.target.value })} required/></label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="label">Creative uploaded at</span><input className="field" type="datetime-local" value={form.uploadedAt} onChange={event => setForm({ ...form, uploadedAt: event.target.value })} required/></label>
          <label className="block"><span className="label">Taken down at (optional)</span><input className="field" type="datetime-local" value={form.takenDownAt} onChange={event => setForm({ ...form, takenDownAt: event.target.value })}/></label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="daily-spend" className="label">Daily spend</label>
              <button type="button" role="switch" aria-checked={form.showDailySpendToClient}
                className={'btn text-xs ' + (form.showDailySpendToClient ? 'btn-primary' : 'btn-light')}
                onClick={() => setForm({ ...form, showDailySpendToClient: !form.showDailySpendToClient })}>
                Show to clients
              </button>
            </div>
            <input id="daily-spend" className="field" value={dailySpend(form.spendRupees, form.uploadedAt, form.takenDownAt, now)} readOnly aria-describedby="daily-spend-description"/><span id="daily-spend-description" className="text-xs text-slate-500">Total spend divided by campaign days, including the start and end dates.</span>
          </div>
          <label className="block"><span className="label">Cost per result (₹)</span><input className="field" type="number" min="0" max="9999999999.99" step="0.01" value={form.costPerResult} onChange={event => setForm({ ...form, costPerResult: event.target.value })}/></label>
          <label className="block"><span className="label">Total impressions</span><input className="field" type="number" min="0" max="2147483647" step="1" value={form.totalImpressions} onChange={event => setForm({ ...form, totalImpressions: event.target.value })}/></label>
          <label className="block"><span className="label">Total reach</span><input className="field" type="number" min="0" max="2147483647" step="1" value={form.totalReach} onChange={event => setForm({ ...form, totalReach: event.target.value })}/></label>
        </div>
        <label className="block"><span className="label">Location (optional)</span><input className="field" maxLength={160} value={form.location} onChange={event => setForm({ ...form, location: event.target.value })}/></label>
        <label className="block"><span className="label">Total result</span><textarea className="field min-h-20" value={form.totalResult} onChange={event => setForm({ ...form, totalResult: event.target.value })} maxLength={2000}/></label>
        <label className="block"><span className="label">Creative images (up to 10 per save, 4 MB each)</span><input className="field" type="file" multiple accept={IMAGE_TYPES.join(',')} onChange={selectImages} disabled={busy}/></label>
        {editing && <div className="flex flex-wrap gap-2">
          {marketingImageUrls(editing).map((url, index) => <img key={url} src={url} alt={'Saved creative image ' + (index + 1)} className="w-20 h-20 object-cover rounded-lg bg-slate-100"/>)}
        </div>}
        {pendingImages.length > 0 && <ul className="space-y-2">
          {pendingImages.map(({ file }, index) => <li key={index} className="flex items-center gap-3">
            <PendingImagePreview file={file}/>
            <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
            <button type="button" className="btn btn-light" disabled={busy} aria-label={'Remove ' + file.name}
              onClick={() => setPendingImages(previous => previous.filter((_, position) => position !== index))}><Trash2 size={15}/></button>
          </li>)}
        </ul>}
        <label className="block"><span className="label">Notes (optional)</span><textarea className="field min-h-20" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} maxLength={2000}/></label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between items-center pt-2">
          {editing ? <button type="button" disabled={busy} onClick={remove} className="btn btn-light text-red-600"><Trash2 size={15}/> Delete</button> : <span/>}
          <button disabled={busy} className="btn btn-primary">{busy ? <><UploadCloud size={15}/> Saving...</> : editing ? 'Save changes' : 'Save creative'}</button>
        </div>
      </form>
    </Modal>}

    {selected && <Modal title="Ad creative details" onClose={() => setSelected(null)}>
      <div className="space-y-3">
        {marketingImageUrls(selected).map((url, index) => <img key={url} src={url} alt={selected.creativeName + ' image ' + (index + 1)} className="w-full max-h-72 object-contain rounded-xl bg-slate-50 mb-4"/>)}
      </div>
      <h2 className="text-lg font-extrabold">{selected.creativeName}</h2>
      <p className="text-sm text-slate-500 mt-1">{selected.client?.name} · {platforms.find(platform => platform[0] === selected.platform)?.[1] || selected.platform}</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="panel p-3"><div className="text-xs text-slate-500">Spend</div><b>{marketingCurrency.format(Number(selected.spendRupees || 0))}</b></div>
        <div className="panel p-3"><div className="text-xs text-slate-500">Uploaded</div><b>{fmtDate(selected.uploadedAt)}</b></div>
        <div className="panel p-3 col-span-2"><div className="text-xs text-slate-500">Taken down</div><b>{selected.takenDownAt ? fmtDate(selected.takenDownAt) : 'Still active'}</b></div>
      </div>
      <dl className="grid grid-cols-2 gap-3 mt-3">
        {formatMarketingMetrics(selected, now).map(([label, value]) => <div key={label} className="panel p-3 min-w-0">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="font-bold whitespace-pre-wrap break-words">{value}</dd>
        </div>)}
      </dl>
      {role === 'CLIENT' && <p className="mt-4 text-[10px] text-slate-600">{adSpendGstNotice}</p>}
      {selected.notes && <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{selected.notes}</p>}
      <p className="text-xs text-slate-400 mt-5">View only</p>
    </Modal>}
  </AppShell>;
}
