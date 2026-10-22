"use client";

import { useState } from "react";
import { FiCheck, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { TIER_COLORS } from "@/constants/tiers";
import { labelTextColor } from "@/lib/board";
import type { Tier } from "@/types/tier-list";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ColorPicker from "@/components/ui/ColorPicker";

interface Props {
  tier: Pick<Tier, "label" | "color">;
  isNew: boolean;
  canDelete: boolean;
  hasImages: boolean;
  onSave: (label: string, color: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TierSettings({ tier, isNew, canDelete, hasImages, onSave, onClear, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(tier.label);
  const [color, setColor] = useState(tier.color);
  const validColor = /^#[a-f\d]{6}$/i.test(color);
  const preview = validColor ? color : tier.color;

  return (
    <Modal title={isNew ? "Add a tier" : "Edit tier"} description="Set a tier name and label color for your ranking." onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); if (label.trim() && validColor) onSave(label.trim(), color); }}>
        <div className="mb-6 flex min-h-20 items-center justify-center rounded-lg px-6 py-4 text-center text-xl font-semibold wrap-anywhere" style={{ backgroundColor: preview, color: labelTextColor(preview) }}>{label || "Tier preview"}</div>
        <label className="block text-xs font-medium" htmlFor="tier-label">Tier name <span className="float-right font-normal text-muted">{label.length}/60</span></label>
        <input id="tier-label" autoFocus value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} required placeholder="e.g. S, High priority, Recommended" className="mt-2 w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
        <p className="mb-5 mt-1.5 text-[11px] text-muted">Use a letter, number, or descriptive label.</p>
        <fieldset>
          <legend className="text-xs font-medium">Label color</legend>
          <div className="mb-3 mt-2.5 grid grid-cols-6 gap-2">
            {TIER_COLORS.map((swatch) => <button key={swatch} type="button" aria-label={`Use color ${swatch}`} aria-pressed={color.toLowerCase() === swatch} onClick={() => setColor(swatch)} className="flex h-9 items-center justify-center rounded-md ring-offset-2 ring-offset-surface aria-pressed:ring-2 aria-pressed:ring-blue-400" style={{ backgroundColor: swatch, color: labelTextColor(swatch) }}>{color.toLowerCase() === swatch && <FiCheck size={18} />}</button>)}
          </div>
          <ColorPicker value={preview} onChange={setColor} />
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-background p-2.5">
            <span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-line" style={{ backgroundColor: preview }} />
            <label htmlFor="tier-hex" className="text-[11px] text-muted">HEX</label>
            <input id="tier-hex" value={color} onChange={(event) => setColor(event.target.value)} aria-label="Hex color" aria-invalid={!validColor} aria-describedby={!validColor ? "tier-color-error" : undefined} pattern="#[a-fA-F0-9]{6}" required maxLength={7} spellCheck={false} className="min-w-0 flex-1 rounded-sm bg-transparent text-xs uppercase outline-none focus-visible:ring-1 focus-visible:ring-blue-400" />
          </div>
          {!validColor && <p id="tier-color-error" role="alert" className="mt-2 text-[11px] text-red-400 light:text-red-600">Enter a six-digit HEX color, such as #2563EB.</p>}
        </fieldset>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={!label.trim() || !validColor}>{isNew ? "Add tier" : "Save changes"}</Button></div>
      </form>
      {!isNew && <div className="mt-6 space-y-2 border-t border-line pt-4">
        <Button variant="ghost" className="w-full justify-start" onClick={onClear} disabled={!hasImages}><FiRotateCcw /> Return images to unranked</Button>
        <Button variant="danger" className="w-full justify-start" onClick={onDelete} disabled={!canDelete}><FiTrash2 /> Delete tier</Button>
        <p className="px-1 text-[11px] leading-5 text-muted">{canDelete ? "Deleting a tier moves its images back to the tray." : "Keep at least one tier on your board."}</p>
      </div>}
    </Modal>
  );
}