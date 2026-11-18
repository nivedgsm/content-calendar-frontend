"use client";

import { useState } from 'react';
import Modal from '@/components/modal';
import { api, fmtDate } from '@/lib/api';
import { CheckCircle2, LoaderCircle, MessageSquareText } from 'lucide-react';

export default function ClientContentReview({ item, onClose, onReviewed }: { item: any; onClose: () => void; onReviewed: () => void }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function review(status: 'APPROVED' | 'CHANGES_REQUESTED') {
    setBusy(true); setError('');
    try {
      await api(`/content/${item.id}/review`, { method: 'POST', body: JSON.stringify({ status, comment }) });
      onReviewed(); onClose();
    } catch (e: any) { setError(e.message || 'Your response could not be saved.'); }
    finally { setBusy(false); }
  }
  return <Modal title="Review content" onClose={onClose}><div className="space-y-4">
    <div><h3 className="text-lg font-extrabold">{item.title}</h3><p className="text-xs text-slate-500 mt-1">{fmtDate(item.date)} · {item.platform} · {item.type}</p></div>
    {item.caption && <p className="text-sm text-slate-600 whitespace-pre-line">{item.caption}</p>}
    {item.referenceUrl && <a className="text-xs text-brand underline" href={item.referenceUrl} target="_blank" rel="noreferrer">Open creative reference</a>}
    {item.status === 'FOR_REVIEW' ? <><div><label className="label" htmlFor="client-review-comment">Feedback <span className="font-normal text-slate-400">(optional)</span></label><textarea id="client-review-comment" rows={3} className="field" placeholder="Add a note for your agency…" value={comment} onChange={e => setComment(e.target.value)}/></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => review('APPROVED')} className="btn btn-primary disabled:opacity-60">{busy ? <LoaderCircle size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>} Approve</button><button disabled={busy} onClick={() => review('CHANGES_REQUESTED')} className="btn btn-light text-red-600 hover:bg-red-50 disabled:opacity-60"><MessageSquareText size={15}/> Reject</button></div></> : <span className="badge bg-slate-100 text-slate-600">{item.status.replaceAll('_', ' ')}</span>}
  </div></Modal>;
}
