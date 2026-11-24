
"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import { api, fmtDate } from '@/lib/api';
import { adSpendGstNotice, formatMarketingMetrics, marketingImageUrls, type MarketingActivity } from '@/lib/marketing-performance';
import { Users, CalendarDays, Video, ArrowUpRight, Plus, BarChart3, IndianRupee } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [user, setUser] = useState<any>({});
  const [marketing, setMarketing] = useState<MarketingActivity[]>([]);
  const [recentMarketing, setRecentMarketing] = useState<MarketingActivity[]>([]);
  const [marketingError, setMarketingError] = useState('');

  useEffect(() => {
    try {
      setUser(JSON.parse(sessionStorage.getItem('cf_user') || '{}'));
    } catch {
      setUser({});
    }

    api('/dashboard/stats')
      .then(setData)
      .catch(e => setErr(e.message));

    const month = new Date().toISOString().slice(0, 7);

    api<MarketingActivity[]>(`/marketing-performance?month=${month}`)
      .then(setMarketing)
      .catch(() => setMarketing([]));

    api<MarketingActivity[]>('/marketing-performance')
      .then(setRecentMarketing)
      .catch(e => {
        setRecentMarketing([]);
        setMarketingError(e.message || 'Could not load ad performance updates.');
      });
  }, []);

  const clientView = user.role === 'CLIENT';
  const now = new Date();

  const activeCampaigns = marketing.filter(item =>
    new Date(item.uploadedAt).getTime() <= Date.now()
    && (!item.takenDownAt || new Date(item.takenDownAt).getTime() > Date.now())
  ).length;

  const marketingSpend = marketing.reduce(
    (total, item) => total + Number(item.spendRupees || 0),
    0
  );

  const formatRupees = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const stats = clientView
    ? [
        ['Planned content', data?.contents ?? '—', CalendarDays, '#7567F8', 'For your brand'],
        ['Upcoming shoots', data?.shoots ?? '—', Video, '#E59B43', 'For your brand'],
        ['Active campaigns', activeCampaigns, BarChart3, '#bf2026', 'Running right now'],
        ['Marketing spend', formatRupees.format(marketingSpend), IndianRupee, '#504c4d', 'This month']
      ]
    : [
        ['Active clients', data?.clients ?? '—', Users, '#7567F8'],
        ['Planned content', data?.contents ?? '—', CalendarDays, '#19A58A'],
        ['Upcoming shoots', data?.shoots ?? '—', Video, '#E59B43']
      ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <AppShell>
      <div className="px-5 md:px-9 py-8 max-w-[1500px] mx-auto">

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold tracking-widest text-brand">
              {today.toUpperCase()}
            </div>

            <h1 className="text-3xl font-extrabold mt-2">
              {clientView
                ? `Welcome, ${user.name || 'to your workspace'}`
                : 'Good to see you, team'
              } <span></span>
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {clientView
                ? 'See your upcoming content and review work from your agency.'
                : 'Here is what is happening across your agency.'
              }
            </p>
          </div>

          <Link href="/calendar" className="btn btn-primary">
            {clientView ? (
              <>
                <CalendarDays size={16} />
                View content calendar
              </>
            ) : (
              <>
                <Plus size={16} />
                Plan content
              </>
            )}
          </Link>
        </div>

        {err && (
          <div className="panel p-4 text-sm text-red-600 mb-5">
            {err}. Check that the API is running.
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {stats.map(([label, value, Icon, color, detail]: any) => (
            <div className="panel stat-card" key={label}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {label}
                </span>

                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: color + '18',
                    color
                  }}
                >
                  <Icon size={18} />
                </span>
              </div>

              <div className="text-3xl font-extrabold mt-5">
                {value}
              </div>

              <div className="text-[11px] text-slate-400 mt-1">
                {detail || (clientView ? 'For your brand' : 'Across your workspace')}
              </div>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5">

          <section className="panel">
            <div className="p-5 flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-lg">
                  {clientView ? 'Your upcoming content' : 'Upcoming content'}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  What is next on the publishing calendar
                </p>
              </div>

              <Link href="/calendar" className="text-xs text-brand font-bold">
                View calendar <ArrowUpRight className="inline" size={14} />
              </Link>
            </div>

            {data?.recent?.length ? (
              data.recent.map((item: any) => (
                <div
                  key={item.id}
                  className="px-5 py-4 border-t border-slate-100 flex items-center gap-3"
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ background: item.client.color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {item.title}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      {!clientView && `${item.client.name} · `}
                      {item.type}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold">
                      {fmtDate(item.date)}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1">
                      {item.status.replaceAll('_', ' ')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No content is scheduled yet.
              </div>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="font-extrabold text-lg">
              {clientView ? 'Content overview' : 'Workspace pulse'}
            </h2>

            <p className="text-xs text-slate-500 mt-1 mb-6">
              {clientView
                ? 'Keep track of your content progress.'
                : 'A quick snapshot of production.'
              }
            </p>

            <div className="space-y-5">
              {[
                ['Published', data?.published ?? 0, '#19A58A'],
                ['Total planned', data?.contents ?? 0, '#7567F8']
              ].map(([name, val, color]: any) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-600">
                      {name}
                    </span>
                    <b>{val}</b>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Number(val) * 8)}%`,
                        background: color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {!clientView && (
              <div className="mt-8 p-4 rounded-xl bg-[#F5F3FF]">
                <div className="text-xs font-extrabold text-brand">
                  A BETTER WAY TO PLAN
                </div>

                <p className="text-sm font-bold mt-2">
                  Keep your whole team aligned.
                </p>

                <p className="text-xs text-slate-500 mt-1 leading-5">
                  Use client calendars and content workflows to keep every deliverable moving.
                </p>

                <Link
                  href="/clients"
                  className="text-xs font-bold text-brand mt-3 inline-block"
                >
                  Manage clients →
                </Link>
              </div>
            )}
          </section>

        </div>

        {clientView && (
          <section className="panel mt-5">
            <div className="p-5 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-extrabold text-lg">Recent ad performance updates</h2>
                <p className="text-xs text-slate-500 mt-1">Campaign activity shared by your agency</p>
              </div>
              <Link href="/marketing-performance" className="text-xs text-brand font-bold">
                View ad calendar <ArrowUpRight className="inline" size={14} />
              </Link>
            </div>

            <p className="mx-5 mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{adSpendGstNotice}</p>

            {marketingError ? (
              <div role="alert" className="px-5 pb-6 text-sm text-red-600">{marketingError}</div>
            ) : recentMarketing.length ? recentMarketing.slice(0, 5).map(item => (
              <div key={item.id} className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                {marketingImageUrls(item)[0] ? (
                  <img src={marketingImageUrls(item)[0]} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center text-xs text-slate-400">Ad</div>
                )}
                <div className="flex-1 min-w-48">
                  <div className="font-bold text-sm">{item.creativeName}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {item.platform} · Uploaded {fmtDate(item.uploadedAt)}
                    {item.takenDownAt ? ` · Taken down ${fmtDate(item.takenDownAt)}` : ' · Active'}
                  </div>
                </div>
                <div className="font-extrabold text-sm">
                  {formatRupees.format(Number(item.spendRupees || 0))}
                </div>
                <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                  {formatMarketingMetrics(item, now).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="text-sm font-semibold whitespace-pre-wrap break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )) : (
              <div className="px-5 pb-6 text-sm text-slate-400">
                No ad performance updates have been shared yet.
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
