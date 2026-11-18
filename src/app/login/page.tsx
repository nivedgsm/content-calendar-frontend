"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem('cf_access', data.accessToken);
      sessionStorage.setItem('cf_refresh', data.refreshToken);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      router.replace('/dashboard');
    } catch (cause: any) {
      setError(cause.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen grid lg:grid-cols-2 bg-white">
    <section className="hidden lg:flex bg-[#171a2b] text-white p-14 flex-col justify-between relative overflow-hidden">
      <div className="absolute w-[550px] h-[550px] rounded-full border border-white/10 -right-40 -bottom-40"/>
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center"><Sparkles/></div><b className="text-xl">contentflow</b></div>
      <div className="max-w-lg relative"><div className="text-brand text-xs font-extrabold tracking-[.25em] mb-5">THE AGENCY OPERATING SYSTEM</div><h1 className="text-5xl font-extrabold leading-[1.1]">Great content starts with a clear plan.</h1><p className="text-slate-400 mt-6 leading-7">Bring every client, campaign, shoot and approval into one calm, focused workspace.</p></div>
      <div className="text-slate-500 text-xs">Copyright 2026 ContentFlow. Built for creative teams.</div>
    </section>
    <div className="flex items-center justify-center p-7">
      <form onSubmit={submit} className="w-full max-w-md">
        <div className="lg:hidden flex items-center gap-2 mb-12"><Sparkles className="text-brand"/><b className="text-xl">contentflow</b></div>
        <div className="text-xs text-brand font-extrabold tracking-[.2em]">WELCOME BACK</div>
        <h2 className="text-3xl font-extrabold mt-3">Sign in to your workspace</h2>
        <p className="text-sm text-slate-500 mt-2 mb-8">Pick up where your team left off.</p>
        <label className="label" htmlFor="email">Email address</label>
        <input id="email" className="field mb-5" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required/>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative mb-4">
          <input id="password" className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required/>
          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full py-3 mt-2">{busy ? 'Signing in...' : 'Sign in'} <ArrowRight size={16}/></button>
        <p className="text-sm text-slate-500 text-center mt-6">New to ContentFlow? <Link className="text-brand font-bold" href="/register">Create an account</Link></p>
      </form>
    </div>
  </div>;
}
