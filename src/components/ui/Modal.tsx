"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { FiX } from "react-icons/fi";

export default function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>{description && <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-muted">{description}</p>}</div>
        <button onClick={onClose} aria-label="Close dialog" className="-mr-1 -mt-1 rounded-lg p-2 text-muted hover:bg-foreground/5 hover:text-foreground"><FiX size={18} /></button>
      </div>
      {children}
    </dialog>
  );
}