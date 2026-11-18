"use client";
import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { api, fmtDate } from '@/lib/api';
import { Users, CalendarDays, Video, ArrowUpRight, Plus, Clock3, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [user, setUser] = useState<any>({});
  useEffect(() => {
    try { setUser(JSON.parse(sessionStorage.getItem('cf_user') || '{}')); } catch { setUser({}); }
    api('/dashboard/stats').then(setData).catch(e => setErr(e.message));
  }, []);
  const clientView = user.role === 'CLIENT';
  const stats = clientView
    ? [['Planned content', data?.contents ?? '—', CalendarDays, '#7567F8'], ['Upcoming shoots', data?.shoots ?? '—', Video, '#E59B43'], ['Awaiting your review', data?.pending ?? '—', Clock3, '#E16B8C'], ['Published content', data?.published ?? '—', CheckCircle2, '#19A58A']]
    : [['Active clients', data?.clients ?? '—', Users, '#7567F8'], ['Planned content', data?.contents ?? '—', CalendarDays, '#19A58A'], ['Upcoming shoots', data?.shoots ?? '—', Video, '#E59B43'], ['Awaiting approval', data?.pending ?? '—', Clock3, '#E16B8C']];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return <AppShell><div className="px-5 md:px-9 py-8 max-w-[1500px] mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><div className="text-xs font-bold tracking-widest text-brand">{today.toUpperCase()}</div><h1 className="text-3xl font-extrabold mt-2">{clientView ? `Welcome, ${user.name || 'to your workspace'}` : 'Good to see you, team'} <span>✦</span></h1><p className="text-sm text-slate-500 mt-1">{clientView ? 'See your upcoming content and review work from your agency.' : 'Here is what is happening across your agency.'}</p></div><Link href="/calendar" className="btn btn-primary">{clientView ? <><CalendarDays size={16}/> View content calendar</> : <><Plus size={16}/> Plan content</>}</Link></div>
    {err && <div className="panel p-4 text-sm text-red-600 mb-5">{err}. Check that the API is running.</div>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">{stats.map(([label,value,Icon,color]: any) => <div className="panel stat-card" key={label}><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{label}</span><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18', color }}><Icon size={18}/></span></div><div className="text-3xl font-extrabold mt-5">{value}</div><div className="text-[11px] text-slate-400 mt-1">{clientView ? 'For your brand' : 'Across your workspace'}</div></div>)}</div>
    <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5"><section className="panel"><div className="p-5 flex justify-between items-center"><div><h2 className="font-extrabold text-lg">{clientView ? 'Your upcoming content' : 'Upcoming content'}</h2><p className="text-xs text-slate-500 mt-1">What is next on the publishing calendar</p></div><Link href="/calendar" className="text-xs text-brand font-bold">View calendar <ArrowUpRight className="inline" size={14}/></Link></div>{data?.recent?.length ? data.recent.map((item: any) => <div key={item.id} className="px-5 py-4 border-t border-slate-100 flex items-center gap-3"><div className="w-1 h-10 rounded-full" style={{ background: item.client.color }}/><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{item.title}</div><div className="text-xs text-slate-400 mt-1">{!clientView && `${item.client.name} · `}{item.type}</div></div><div className="text-right"><div className="text-xs font-bold">{fmtDate(item.date)}</div><div className="text-[10px] text-slate-400 mt-1">{item.status.replaceAll('_', ' ')}</div></div></div>) : <div className="p-8 text-center text-sm text-slate-400">No content is scheduled yet.</div>}</section>
    <section className="panel p-5"><h2 className="font-extrabold text-lg">{clientView ? 'Review status' : 'Workspace pulse'}</h2><p className="text-xs text-slate-500 mt-1 mb-6">{clientView ? 'Keep track of work that needs your attention.' : 'A quick snapshot of production.'}</p><div className="space-y-5">{[['Published', data?.published ?? 0, '#19A58A'], ['Awaiting approval', data?.pending ?? 0, '#E59B43'], ['Total planned', data?.contents ?? 0, '#7567F8']].map(([name,val,color]: any) => <div key={name}><div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-600">{name}</span><b>{val}</b></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(val) * 8)}%`, background: color }}/></div></div>)}</div>{!clientView && <div className="mt-8 p-4 rounded-xl bg-[#F5F3FF]"><div className="text-xs font-extrabold text-brand">A BETTER WAY TO PLAN</div><p className="text-sm font-bold mt-2">Keep your whole team aligned.</p><p className="text-xs text-slate-500 mt-1 leading-5">Use client calendars and approval workflows to keep every deliverable moving.</p><Link href="/clients" className="text-xs font-bold text-brand mt-3 inline-block">Manage clients →</Link></div>}</section></div>
  </div></AppShell>;
}
