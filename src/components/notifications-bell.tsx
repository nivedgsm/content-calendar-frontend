"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/api';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function timeLabel(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await api<{ items: NotificationItem[]; unreadCount: number }>('/notifications');
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Could not load notifications.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [load]);

  async function markAllRead() {
    setError('');
    try {
      await api('/notifications/read-all', { method: 'POST' });
      const readAt = new Date().toISOString();
      setItems(current => current.map(item => ({ ...item, readAt: item.readAt || readAt })));
      setUnreadCount(0);
    } catch (e: any) { setError(e.message || 'Could not mark notifications as read.'); }
  }

  async function openNotification(item: NotificationItem) {
    setBusyId(item.id); setError('');
    try {
      if (!item.readAt) {
        await api(`/notifications/${item.id}/read`, { method: 'POST' });
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
        setUnreadCount(count => Math.max(0, count - 1));
      }
      setOpen(false);
      if (item.link) router.push(item.link);
    } catch (e: any) {
      setError(e.message || 'Could not open this notification.');
    } finally {
      setBusyId('');
    }
  }

  return <div className="relative">
    <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-brand" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen(value => !value); if (!open) load(); }}>
      <Bell size={18}/>
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-extrabold leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-extrabold">Notifications</h2><p className="text-[11px] text-slate-400">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div>{unreadCount > 0 && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] font-bold text-brand"><CheckCheck size={14}/> Mark all read</button>}</div>
      <div className="max-h-[min(65vh,480px)] overflow-y-auto">
        {loading ? <div className="p-8 text-center text-sm text-slate-400"><LoaderCircle size={18} className="mx-auto mb-2 animate-spin"/>Loading notifications</div>
          : error ? <div role="alert" className="p-5 text-sm text-red-600">{error}</div>
          : !items.length ? <div className="p-8 text-center text-sm text-slate-400">Updates about reviews and shoot schedules will show up here.</div>
          : items.map(item => <button type="button" key={item.id} disabled={busyId === item.id} onClick={() => openNotification(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60 ${item.readAt ? '' : 'bg-violet-50/60'}`}><span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-transparent' : 'bg-brand'}`}/><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-slate-800">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.message}</span><span className="mt-1 block text-[10px] text-slate-400">{timeLabel(item.createdAt)}</span></span></span></button>)}
      </div>
    </div>}
  </div>;
}
