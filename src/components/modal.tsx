"use client";

import { X } from 'lucide-react';
import { useId } from 'react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-xl font-extrabold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={21}/></button>
      </div>
      {children}
    </div>
  </div>;
}
