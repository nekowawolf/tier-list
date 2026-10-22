"use client";

import { useId, useState } from "react";
import { FiEdit2 } from "react-icons/fi";

const MAX_TITLE_LENGTH = 40;

export default function BoardTitle({ title, onSave }: { title: string; onSave: (title: string) => void }) {
  const [value, setValue] = useState(title);
  const hintId = useId();

  return (
    <div className="w-48 max-w-full sm:w-64">
      <label className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-line focus-within:border-blue-400/50 focus-within:bg-surface-soft focus-within:ring-1 focus-within:ring-blue-400/50">
        <FiEdit2 aria-hidden="true" size={13} className="shrink-0 text-muted" />
        <input aria-label="Tier list title" aria-describedby={hintId} value={value} maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => { const next = value.trim().slice(0, MAX_TITLE_LENGTH) || "My tier list"; setValue(next); onSave(next); }}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
          className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none focus-visible:outline-none" />
      </label>
      <p id={hintId} className="mt-1 px-3 text-[10px] tabular-nums text-muted">{value.length} / {MAX_TITLE_LENGTH} characters</p>
    </div>
  );
}