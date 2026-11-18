
"use client";

import { useEffect, useState } from 'react';
import AppShell from '@/components/app-shell';
import Modal from '@/components/modal';
import { api } from '@/lib/api';
import { useUserRole } from '@/lib/use-user-role';
import { Plus, Search, Users, Copy, Trash2 } from 'lucide-react';

export default function Clients() {
  const role = useUserRole();

  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<any>({
    name: '',
    brandName: '',
    industry: '',
    email: '',
    color: '#7567F8'
  });
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  async function load() {
    try {
      setItems(await api('/clients'));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api('/clients', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setOpen(false);

      setForm({
        name: '',
        brandName: '',
        industry: '',
        email: '',
        color: '#7567F8'
      });

      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api(`/clients/${invite.id}/invite`, {
        method: 'POST',
        body: JSON.stringify(inviteForm)
      });

      setInvite(null);

      setInviteForm({
        name: '',
        email: '',
        password: ''
      });

      alert('Client login created. Share the sign-in details securely.');
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function share(id: string) {
    try {
      const r = await api(`/clients/${id}/share`, {
        method: 'POST'
      });

      await navigator.clipboard.writeText(
        `${location.origin}/share/${r.shareToken}`
      );

      alert('Client calendar link copied');
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Delete client
  async function deleteClient(client: any) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${client.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError('');

      await api(`/clients/${client.id}`, {
        method: 'DELETE'
      });

      setItems(prev => prev.filter(item => item.id !== client.id));

    } catch (e: any) {
      setError(e.message || 'Could not delete client.');
    }
  }

  return (
    <AppShell>
      <div className="px-5 md:px-9 py-8 max-w-[1400px] mx-auto">

        <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
          <div>
            <div className="text-xs font-bold tracking-widest text-brand">
              YOUR PORTFOLIO
            </div>

            <h1 className="text-3xl font-extrabold mt-2">
              Clients
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage brands and their content operations.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} /> Add client
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 panel px-3 py-2 max-w-sm mb-5">
          <Search size={16} className="text-slate-400" />

          <input
            className="outline-none text-sm flex-1"
            placeholder="Search clients..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {items
            .filter(c =>
              c.name.toLowerCase().includes(query.toLowerCase())
            )
            .map(c => (
              <div className="panel p-5" key={c.id}>

                <div className="flex justify-between">

                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold"
                    style={{ background: c.color }}
                  >
                    {(c.brandName || c.name)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="flex gap-2">

                    {role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setInvite(c);
                          setInviteForm({
                            name: c.name,
                            email: c.email || '',
                            password: ''
                          });
                        }}
                        className="btn btn-light !p-2"
                        title="Create client login"
                      >
                        <Users size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => share(c.id)}
                      className="btn btn-light !p-2"
                      title="Copy share link"
                    >
                      <Copy size={15} />
                    </button>

                    {/* Delete Client Button - ADMIN only */}
                    {role === 'ADMIN' && (
                      <button
                        onClick={() => deleteClient(c)}
                        className="btn btn-light !p-2 text-red-600 hover:bg-red-50"
                        title="Delete client"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                  </div>
                </div>

                <h3 className="font-extrabold text-lg mt-4">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {c.industry || 'Industry not set'} · {c.email || 'No email'}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">

                  <div>
                    <div className="text-xl font-extrabold">
                      {c._count?.contents ?? 0}
                    </div>

                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Content items
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-extrabold">
                      {c._count?.shoots ?? 0}
                    </div>

                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Shoot days
                    </div>
                  </div>

                </div>
              </div>
            ))}

        </div>

        {!items.length && (
          <div className="panel p-12 text-center text-slate-400">
            No clients yet. Add your first client to get started.
          </div>
        )}

      </div>

      {open && (
        <Modal
          title="Add a client"
          onClose={() => setOpen(false)}
        >
          <form onSubmit={save} className="space-y-4">

            {[
              ['name', 'Client / company name'],
              ['brandName', 'Brand name'],
              ['industry', 'Industry'],
              ['email', 'Contact email']
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>

                <input
                  className="field"
                  required={key === 'name'}
                  value={form[key]}
                  onChange={e =>
                    setForm({
                      ...form,
                      [key]: e.target.value
                    })
                  }
                />
              </div>
            ))}

            <div>
              <label className="label">Brand colour</label>

              <input
                type="color"
                className="field h-11"
                value={form.color}
                onChange={e =>
                  setForm({
                    ...form,
                    color: e.target.value
                  })
                }
              />
            </div>

            <button className="btn btn-primary w-full">
              Create client
            </button>

          </form>
        </Modal>
      )}

      {invite && (
        <Modal
          title={`Client access · ${invite.name}`}
          onClose={() => setInvite(null)}
        >
          <form onSubmit={sendInvite} className="space-y-4">

            <p className="text-xs text-slate-500">
              Create a client login so they can review and approve content in their own workspace.
            </p>

            <div>
              <label className="label">Contact name</label>

              <input
                className="field"
                value={inviteForm.name}
                onChange={e =>
                  setInviteForm({
                    ...inviteForm,
                    name: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label className="label">Email</label>

              <input
                type="email"
                required
                className="field"
                value={inviteForm.email}
                onChange={e =>
                  setInviteForm({
                    ...inviteForm,
                    email: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Temporary password (minimum 8 characters)
              </label>

              <input
                type="password"
                minLength={8}
                required
                className="field"
                value={inviteForm.password}
                onChange={e =>
                  setInviteForm({
                    ...inviteForm,
                    password: e.target.value
                  })
                }
              />
            </div>

            <button className="btn btn-primary w-full">
              Create client login
            </button>

          </form>
        </Modal>
      )}

    </AppShell>
  );
}
