"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, Settings, Sparkles, Users, Video } from 'lucide-react';
import NotificationsBell from '@/components/notifications-bell';
import { API_BASE } from '@/lib/api';

const agencyLinks = [['/dashboard', 'Overview', LayoutDashboard], ['/calendar', 'Content calendar', CalendarDays], ['/clients', 'Clients', Users], ['/shoots', 'Shoot calendar', Video], ['/marketing-performance', 'Ad performance', BarChart3]] as const;
const clientLinks = [['/dashboard', 'My workspace', LayoutDashboard], ['/calendar', 'Content calendar', CalendarDays], ['/shoots', 'Shoot calendar', Video], ['/marketing-performance', 'Ad performance', BarChart3]] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('cf_user') || '{}');
      if (!sessionStorage.getItem('cf_access') || !user.role) {
        sessionStorage.removeItem('cf_access');
        sessionStorage.removeItem('cf_refresh');
        sessionStorage.removeItem('cf_user');
        router.replace('/login');
        return;
      }
      setRole(user.role);
    } catch {
      sessionStorage.removeItem('cf_access');
      sessionStorage.removeItem('cf_refresh');
      sessionStorage.removeItem('cf_user');
      router.replace('/login');
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (role === 'CLIENT' && ['/clients', '/settings'].includes(path)) router.replace('/dashboard');
  }, [role, path, router]);

  async function logout() {
    const refreshToken = sessionStorage.getItem('cf_refresh');
    if (refreshToken) {
      await fetch(API_BASE + '/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    sessionStorage.removeItem('cf_access');
    sessionStorage.removeItem('cf_refresh');
    sessionStorage.removeItem('cf_user');
    router.replace('/login');
  }

  const links = role === 'CLIENT' ? clientLinks : agencyLinks;
  if (!authChecked || !role) return <div className="min-h-screen grid place-items-center text-sm text-slate-400">Loading workspace...</div>;
  if (role === 'CLIENT' && ['/clients', '/settings'].includes(path)) return <div className="min-h-screen grid place-items-center text-sm text-slate-400">Opening your client workspace...</div>;

  return <div className="app-shell">
    <aside className="sidebar">
     <div className="flex items-center gap-3 px-3 mb-9">
  {/* GSM Logo */}
  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
    <img
      src="/mascot-logo.png"
      alt="GSM Logo"
      className="w-full h-full object-contain"
    />
  </div>

  {/* Brand Text */}
  <div className="brand-label min-w-0">
    <div className="font-extrabold text-[16px] leading-tight tracking-tight whitespace-nowrap">
      Global studio Media
    </div>

    <div className="text-[10px] mt-1 tracking-[.18em] text-slate-400 font-bold whitespace-nowrap">
      {role === 'CLIENT' ? 'CLIENT PORTAL' : 'AGENCY WORKSPACE'}
    </div>
  </div>
</div>
      <div className="workspace-label text-[10px] uppercase tracking-[.16em] text-slate-500 font-bold px-3 mb-2">{role === 'CLIENT' ? 'My workspace' : 'Workspace'}</div>
      <nav>{links.map(([href, label, Icon]) => <Link key={href} href={href} className={'nav-link ' + (path === href ? 'active' : '')}><Icon size={18}/><span className="nav-label">{label}</span></Link>)}</nav>
      <div className="mt-auto">
        {role !== 'CLIENT' && <Link href="/settings" className="nav-link"><Settings size={18}/><span className="nav-label">Settings</span></Link>}
        <button onClick={logout} className="nav-link w-full"><LogOut size={18}/><span className="nav-label">Sign out</span></button>
        <div className="mt-5 rounded-xl bg-[#24283e] p-3 nav-label"><div className="text-xs font-bold">{role === 'CLIENT' ? 'Client workspace' : 'Studio North'}</div><div className="text-[10px] text-slate-400 mt-1">{role === 'CLIENT' ? 'Limited client access' : 'Agency workspace'}</div></div>
      </div>
    </aside>
    <main className="main-area">
      <div className="flex flex-col px-5 pt-4 md:px-9 max-[620px]:sticky max-[620px]:top-0 max-[620px]:z-40 max-[620px]:border-b max-[620px]:border-slate-100 max-[620px]:bg-white max-[620px]:px-4 max-[620px]:py-3 max-[620px]:shadow-sm print-hide">
        <div className="flex items-center justify-end max-[620px]:justify-between">
          <b className="hidden max-[620px]:block">contentflow</b>
          <div className="flex items-center gap-3"><NotificationsBell/><button onClick={logout} className="hidden text-xs text-slate-500 max-[620px]:block">Sign out</button></div>
        </div>
        <nav className={'mobile-nav ' + (role === 'CLIENT' ? 'grid-cols-4' : 'grid-cols-5') + ' gap-1 w-full mt-3 hidden max-[620px]:grid'}>{links.map(([href, label, Icon]) => <Link key={href} href={href} className={'mobile-nav-link ' + (path === href ? 'active' : '')}><Icon size={17}/><span>{label}</span></Link>)}</nav>
      </div>
      {children}
    </main>
  </div>;
}
