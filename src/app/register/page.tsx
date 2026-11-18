"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, agencyName, email, password }),
      });
      sessionStorage.setItem('cf_access', data.accessToken);
      sessionStorage.setItem('cf_refresh', data.refreshToken);
      sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      router.replace('/dashboard');
    } catch (cause: any) {
      setError(cause.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen grid place-items-center bg-white p-7">
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex items-center gap-2 mb-8"><Sparkles className="text-brand"/><b className="text-xl">contentflow</b></div>
      <div className="text-xs text-brand font-extrabold tracking-[.2em]">GET STARTED</div>
      <h1 className="text-3xl font-extrabold mt-3">Create your workspace</h1>
      <p className="text-sm text-slate-500 mt-2 mb-7">Start an agency workspace for your team.</p>
      <label className="label" htmlFor="name">Your name</label>
      <input id="name" className="field mb-4" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required maxLength={100}/>
      <label className="label" htmlFor="agency">Agency name</label>
      <input id="agency" className="field mb-4" autoComplete="organization" value={agencyName} onChange={event => setAgencyName(event.target.value)} required maxLength={100}/>
      <label className="label" htmlFor="email">Email address</label>
      <input id="email" className="field mb-4" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required/>
      <label className="label" htmlFor="password">Password</label>
      <input id="password" className="field mb-4" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} maxLength={128}/>
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      <button disabled={busy} className="btn btn-primary w-full py-3 mt-2">{busy ? 'Creating workspace...' : 'Create account'} <ArrowRight size={16}/></button>
      <p className="text-sm text-slate-500 text-center mt-6">Already have an account? <Link className="text-brand font-bold" href="/login">Sign in</Link></p>
    </form>
  </main>;
}
