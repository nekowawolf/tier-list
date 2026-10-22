"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

interface DropdownProps {
  id?: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  placement?: "auto" | "bottom";
}

export default function Dropdown({ id, label, value, options, onChange, icon, fullWidth = false, disabled = false, placement = "auto" }: DropdownProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const bounds = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(fullWidth ? bounds.width : Math.max(bounds.width, 224), viewportWidth - 24);
    const below = Math.max(0, viewportHeight - bounds.bottom - 20);
    const above = Math.max(0, bounds.top - 20);
    const desiredHeight = Math.min(360, 56 + options.length * 40);
    const openAbove = placement === "auto" && below < desiredHeight && above > below;
    panel.style.width = `${width}px`;
    panel.style.maxHeight = `${Math.min(360, openAbove ? above : below)}px`;
    panel.style.left = `${Math.max(12, Math.min(fullWidth ? bounds.left : bounds.right - width, viewportWidth - width - 12))}px`;
    panel.style.top = openAbove ? "auto" : `${bounds.bottom + 8}px`;
    panel.style.bottom = openAbove ? `${viewportHeight - bounds.top + 8}px` : "auto";
  }, [fullWidth, options.length, placement]);

  useEffect(() => {
    if (!isOpen) return;
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
      positionPanel();
    };
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, positionPanel]);

  useEffect(() => {
    if (disabled) panelRef.current?.hidePopover();
  }, [disabled]);

  function close(restoreFocus = true) {
    panelRef.current?.hidePopover();
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function focusOption(index: number) {
    const items = panelRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']");
    if (!items?.length) return;
    const option = items[(index + items.length) % items.length];
    option.focus({ preventScroll: true });
    option.scrollIntoView({ block: "nearest" });
  }

  function open(index = Math.max(0, options.findIndex((option) => option.value === value))) {
    if (disabled || !options.length) return;
    search.current = { text: "", time: 0 };
    positionPanel();
    panelRef.current?.showPopover();
    focusOption(index);
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") { close(); return; }
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const destinations: Record<string, number> = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: options.length - 1 };
    if (event.key in destinations) {
      event.preventDefault();
      event.stopPropagation();
      focusOption(destinations[event.key]);
    } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLowerCase();
      search.current = { text, time: now };
      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(text));
      if (match !== -1) focusOption(match);
    }
  }

  return (
    <div className={fullWidth ? "w-full" : "inline-block shrink-0"} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && panelRef.current?.matches(":popover-open")) close(false);
    }}>
      <button ref={triggerRef} id={id} type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={panelId}
        onClick={() => panelRef.current?.matches(":popover-open") ? close() : open()}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            open(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : undefined);
          }
        }}
        className={`flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-35 ${fullWidth ? "w-full justify-between text-sm" : "justify-center"} ${isOpen ? "border-blue-500/50 bg-blue-500/20 text-foreground" : "border-line bg-surface text-muted hover:border-blue-600 hover:text-foreground"}`}>
        {icon && <span aria-hidden="true" className={`shrink-0 ${isOpen ? "text-blue-400 light:text-blue-600" : ""}`}>{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? label}</span>
        <FiChevronDown aria-hidden="true" size={14} className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div ref={panelRef} id={panelId} popover="auto" role="listbox" aria-label={label} tabIndex={-1}
        onToggle={(event) => setIsOpen(event.currentTarget.matches(":popover-open"))}
        onKeyDown={handleKeys}
        className="fixed inset-auto m-0 overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface px-3 pb-3 pt-4 text-foreground shadow-xl outline-none">
        <div aria-hidden="true" className="mb-2 flex items-center gap-1.5 px-2 text-muted">
          {icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div role="presentation" className="space-y-1">
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} tabIndex={-1}
              onClick={() => { onChange(option.value); close(); }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-offset-[-2px] ${value === option.value ? "bg-blue-500/20 font-medium text-blue-400 light:text-blue-600" : "text-muted hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10"}`}>
              <span className="min-w-0 wrap-anywhere">{option.label}</span>
              {value === option.value && <FiCheck aria-hidden="true" size={16} className="shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}