"use client";

import { useId, useState, type PointerEvent } from "react";
import { hexToHsv, hsvToHex, wheelPositionToColor, type HsvColor } from "@/lib/color";

export default function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const id = useId();
  const [selection, setSelection] = useState(() => ({ hex: value, hsv: hexToHsv(value) }));
  // Keep external preset/HEX changes in sync, but retain hue when choosing gray or black.
  if (value !== selection.hex) setSelection({ hex: value, hsv: hexToHsv(value) });
  const { hsv } = selection;
  const angle = hsv.hue * Math.PI / 180;

  function update(next: HsvColor) {
    const hex = hsvToHex(next);
    setSelection({ hex, hsv: next });
    onChange(hex);
  }

  function selectPosition(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2);
    const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2);
    update({ ...hsv, ...wheelPositionToColor(x, y) });
  }

  return (
    <div className="rounded-xl border border-line bg-background p-4">
      <p className="text-xs font-medium">Custom color</p>
      <p id={`${id}-help`} className="mt-1 text-[11px] leading-5 text-muted">Select a color on the wheel, or adjust the sliders.</p>
      <div className="mx-auto my-5 size-40 sm:size-44">
        <div role="group" aria-label="Color wheel" aria-describedby={`${id}-help`} className="relative size-full touch-none cursor-crosshair rounded-full shadow-sm"
          style={{ background: "radial-gradient(circle closest-side, #fff, transparent), conic-gradient(from 90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
          onPointerDown={(event) => { if (event.button !== 0 || !event.isPrimary) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); selectPosition(event); }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) selectPosition(event); }}
          onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { selectPosition(event); event.currentTarget.releasePointerCapture(event.pointerId); } }}
          onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-black" style={{ opacity: 1 - hsv.value }} />
          <span aria-hidden="true" className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#0008]" style={{ left: `${50 + Math.cos(angle) * hsv.saturation * 50}%`, top: `${50 + Math.sin(angle) * hsv.saturation * 50}%`, backgroundColor: selection.hex }} />
        </div>
      </div>
      <div className="space-y-3">
        {([
          { key: "hue", label: "Hue", max: 360, amount: hsv.hue, suffix: "°" },
          { key: "saturation", label: "Saturation", max: 100, amount: hsv.saturation * 100, suffix: "%" },
          { key: "value", label: "Brightness", max: 100, amount: hsv.value * 100, suffix: "%" },
        ] as const).map(({ key, label, max, amount, suffix }) => (
          <div key={key} className="grid grid-cols-[68px_minmax(0,1fr)_34px] items-center gap-2 text-[11px]">
            <label htmlFor={`${id}-${key}`} className="text-muted">{label}</label>
            <input id={`${id}-${key}`} type="range" min={0} max={max} value={Math.round(amount)} aria-valuetext={`${Math.round(amount)}${suffix}`} onChange={(event) => update({ ...hsv, [key]: Number(event.target.value) / (key === "hue" ? 1 : 100) })} className="h-5 w-full min-w-0 cursor-pointer accent-blue-500" />
            <span aria-hidden="true" className="text-right tabular-nums text-muted">{Math.round(amount)}{suffix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}