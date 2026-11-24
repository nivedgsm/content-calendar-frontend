"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import Modal from '@/components/modal';
import { api, fmtDate } from '@/lib/api';
import { useUserRole } from '@/lib/use-user-role';
import { downloadShootCalendarIcs } from '@/lib/calendar-export';
import { Camera, CalendarDays, ChevronLeft, ChevronRight, Clock, Download, MapPin, Plus, Printer } from 'lucide-react';

const blank = () => ({ title: '', date: new Date().toISOString().slice(0, 10), clientId: '', startTime: '10:00', endTime: '14:00', location: '', crew: '', shotList: '', notes: '' });
const dateValue = (value: string) => new Date(value).toISOString().slice(0, 10);

export default function Shoots() {
  const role = useUserRole();
  const isClient = role === 'CLIENT';
  const isAdmin = role === 'ADMIN';
  const canManage = role === 'ADMIN' || role === 'TEAM_MEMBER';
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('month');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(blank());
  const [error, setError] = useState('');
  const month = date.toISOString().slice(0, 7);

  async function load() {
    try {
      const [shoots, clientList] = await Promise.all([api(`/shoots${filter ? `?clientId=${filter}` : ''}`), api('/clients')]);
      setItems(shoots);
      setClients(clientList);
      setError('');
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, [filter]);

  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: offset + days > 35 ? 42 : 35 }, (_, i) => i - offset + 1);
  const dayItems = (n: number) => items.filter(item => {
    const d = new Date(item.date);
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === n;
  });

  function edit(item: any) {
    if (!canManage) return;
    setEditing(item);
    setForm({ ...item, clientId: item.clientId || item.client?.id || '', date: dateValue(item.date) });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(editing ? `/shoots/${editing.id}` : '/shoots', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setOpen(false); setEditing(null); setForm(blank()); await load();
    } catch (e: any) { setError(e.message); }
  }
  async function remove() {
    if (!editing || !confirm('Delete this shoot?')) return;
    try { await api(`/shoots/${editing.id}`, { method: 'DELETE' }); setOpen(false); setEditing(null); await load(); }
    catch (e: any) { setError(e.message); }
  }
  function exportCsv() {
    const rows = [['Date', 'Start time', 'End time', 'Client', 'Shoot', 'Location', 'Crew', 'Shot list'], ...items
      .filter(i => dateValue(i.date).startsWith(month))
      .map(i => [dateValue(i.date), i.startTime || '', i.endTime || '', i.client?.name || '', i.title, i.location || '', i.crew || '', i.shotList || ''])];
    const csv = rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `contentflow-shoots-${month}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  const monthItems = items.filter(item => dateValue(item.date).startsWith(month));

  return <AppShell><div className="px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
    <div className="flex flex-wrap justify-between gap-4 items-end mb-6 print-hide"><div><div className="text-xs font-bold tracking-widest text-brand">{isClient ? 'YOUR PRODUCTION SCHEDULE' : 'PRODUCTION MANAGEMENT'}</div><h1 className="text-3xl font-extrabold mt-2">Shoot calendar</h1><p className="text-sm text-slate-500 mt-1">{isClient ? 'View upcoming shoot days for your brand.' : 'Plan shoot days, crew, locations and shot lists.'}</p></div><div className="flex flex-wrap gap-2"><button className="btn btn-light" onClick={exportCsv}><Download size={15}/> Export CSV</button>{view === 'month' && <button className="btn btn-light" onClick={() => downloadShootCalendarIcs(monthItems, month)}><CalendarDays size={15}/> Calendar file</button>}<button className="btn btn-light" onClick={() => window.print()}><Printer size={15}/> Download PDF</button>{canManage && <button onClick={() => { setEditing(null); setForm({ ...blank(), clientId: clients[0]?.id || '' }); setOpen(true); }} className="btn btn-primary"><Plus size={16}/> Schedule shoot</button>}</div></div>
    {error && <p className="text-sm text-red-600 mb-3 print-hide">{error}</p>}
    <div className="print-only mb-4"><h1 className="text-2xl font-extrabold">Shoot calendar</h1><p className="text-sm text-slate-500">{month} Ã‚Â· {view === "month" ? "Calendar" : "List"} view</p></div>
    <div className="panel p-4 calendar-export-panel"><div className="flex flex-wrap justify-between items-center gap-3 mb-4 calendar-toolbar"><div className="calendar-month-controls flex items-center gap-3"><button className="btn btn-light !p-2" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={17}/></button><h2 className="text-xl font-extrabold min-w-40">{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button className="btn btn-light !p-2" onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={17}/></button><button className="text-xs font-bold text-brand ml-1" onClick={() => setDate(new Date())}>Today</button></div><div className="flex flex-wrap gap-2">{canManage&&<select aria-label="Filter by client" className="field !w-auto !py-2 text-xs" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All clients</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}<select aria-label="Calendar view" className="field !w-auto !py-2 text-xs" value={view} onChange={e => setView(e.target.value)}><option value="month">Month</option><option value="list">List</option></select></div></div>
      {view === 'month' ? <><div className="calendar-scroll" role="region" aria-label="Monthly calendar" tabIndex={0}><div className="calendar-weekdays grid grid-cols-7 text-center text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => <div key={x}>{x}</div>)}</div><div className="calendar-grid">{cells.map((n, i) => <div className="calendar-cell" key={i} style={{ background: n < 1 || n > days ? '#fafbfc' : 'white' }}>{n > 0 && n <= days && <><div className={`text-xs font-bold mb-2 ${new Date().toDateString() === new Date(date.getFullYear(), date.getMonth(), n).toDateString() ? 'text-brand' : ''}`}>{n}</div><div className="space-y-1">{dayItems(n).slice(0, 3).map(item => <button disabled={isClient} key={item.id} onClick={() => edit(item)} className="event-title rounded-md px-1.5 py-1 text-[10px] font-bold truncate w-full text-left" style={{ background: (item.client?.color || '#7567F8') + '18', color: item.client?.color || '#7567F8' }} title={`${item.client?.name}: ${item.title}`}><span className="mr-1">{item.startTime || 'TBD'}</span><span className="print-only">{item.client?.name}: </span>{item.title}</button>)}{dayItems(n).length > 3 && <div className="text-[9px] text-slate-400 print-hide">+{dayItems(n).length - 3} more</div>}{dayItems(n).slice(3).map(item => <div key={item.id} className="print-only text-[9px] font-semibold" style={{ color: item.client?.color }}>{item.startTime} {item.client?.name}: {item.title}</div>)}</div></>}</div>)}</div></div></> : <div>{items.filter(i => dateValue(i.date).startsWith(month)).map(i => <button disabled={isClient} key={i.id} onClick={() => edit(i)} className="w-full text-left py-4 border-t border-slate-100 flex flex-wrap gap-3 items-center sm:flex-nowrap sm:gap-4"><div className="w-10 shrink-0 text-center sm:w-12"><div className="text-xl font-extrabold">{new Date(i.date).getDate()}</div><div className="text-[9px] uppercase text-slate-400">{new Date(i.date).toLocaleDateString('en', { month: 'short' })}</div></div><div className="w-1 h-10 rounded" style={{ background: i.client?.color || '#7567F8' }}/><div className="calendar-list-copy flex-1"><b className="text-sm">{i.title}</b><p className="text-xs text-slate-400 mt-1">{i.client?.name} Ã‚Â· {i.startTime || 'Time TBD'}{i.endTime ? ` Ã¢â‚¬â€œ ${i.endTime}` : ''} Ã‚Â· {i.location || 'Location TBD'}</p><div className="print-only text-xs text-slate-500 mt-1">{i.crew && <>Crew: {i.crew}</>}{i.shotList && <> Ã‚Â· Shot list: {i.shotList}</>}</div></div><Camera size={17} className="text-slate-300"/></button>)}</div>}
    </div>
    {view === 'month' && <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-slate-500">{clients.map(c => <span key={c.id} className="flex min-w-0 max-w-full items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color || '#7567F8' }}/><span className="min-w-0 [overflow-wrap:anywhere]">{c.name}</span></span>)}</div>}
    {!items.length && <div className="panel p-12 mt-4 text-center text-slate-400">No shoots scheduled yet.</div>}
    {open && canManage && <Modal title={editing ? 'Edit shoot day' : 'Schedule a shoot day'} onClose={() => { setOpen(false); setEditing(null); }}><form onSubmit={save} className="grid sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><label className="label">Shoot title</label><input className="field" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></div><div><label className="label">Client</label><select className="field" required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}><option value="">Select client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="label">Date</label><input type="date" className="field" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></div>{[['startTime','Start time'],['endTime','End time'],['location','Location'],['crew','Crew']].map(([k,l]) => <div key={k}><label className="label">{l}</label><input className="field" type={k.includes('Time') ? 'time' : 'text'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}/></div>)}<div className="sm:col-span-2"><label className="label">Shot list</label><textarea rows={3} className="field" value={form.shotList} onChange={e => setForm({ ...form, shotList: e.target.value })}/></div><div className="sm:col-span-2"><label className="label">Production notes</label><textarea rows={2} className="field" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></div><div className="sm:col-span-2 flex gap-2">{editing && isAdmin && <button type="button" className="btn btn-light text-red-600" onClick={remove}>Delete</button>}<button className="btn btn-primary flex-1">{editing ? 'Save changes' : 'Save shoot day'}</button></div></form></Modal>}
  </div></AppShell>;
}
