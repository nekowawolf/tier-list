"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { DropTarget } from "@/types/tier-list";

interface DragSession {
  pointerId: number;
  imageId: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

function findTarget(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y);
  const container = element?.closest<HTMLElement>("[data-drop-container]");
  if (!container?.dataset.dropContainer) return null;
  const tile = element?.closest<HTMLElement>("[data-image-id]");
  let beforeId = tile?.dataset.imageId;
  if (tile) {
    const bounds = tile.getBoundingClientRect();
    if (x > bounds.left + bounds.width / 2) {
      beforeId = (tile.nextElementSibling as HTMLElement | null)?.dataset.imageId;
    }
  }
  return { containerId: container.dataset.dropContainer, beforeId };
}

export function useImageDrag(onMove: (id: string, target: DropTarget) => void) {
  const session = useRef<DragSession | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<{ imageId: string; x: number; y: number } | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const dragging = !!drag;

  const cancel = () => {
    session.current = null;
    setDrag(null);
    setTarget(null);
  };

  useEffect(() => {
    if (!dragging) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    let frame: number;
    const scroll = () => {
      const current = session.current;
      if (current?.active) {
        const edge = 70;
        const amount = current.y < edge ? -12 : current.y > window.innerHeight - edge ? 12 : 0;
        if (amount) {
          window.scrollBy(0, amount);
          const next = findTarget(current.x, current.y);
          setTarget((old) => old?.containerId === next?.containerId && old?.beforeId === next?.beforeId ? old : next);
        }
      }
      frame = requestAnimationFrame(scroll);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    const blur = () => cancel();
    frame = requestAnimationFrame(scroll);
    window.addEventListener("keydown", escape);
    window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.userSelect = previous;
      window.removeEventListener("keydown", escape);
      window.removeEventListener("blur", blur);
    };
  }, [dragging]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, imageId: string) {
    if (event.button !== 0 || !event.isPrimary || session.current) return;
    suppressClick.current = false;
    session.current = { pointerId: event.pointerId, imageId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (!current.active && Math.hypot(current.x - current.startX, current.y - current.startY) < 6) return;
    current.active = true;
    suppressClick.current = true;
    setDrag({ imageId: current.imageId, x: current.x, y: current.y });
    setTarget(findTarget(current.x, current.y));
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current?.active) {
      const drop = findTarget(event.clientX, event.clientY);
      if (drop) onMove(current.imageId, drop);
    }
    cancel();
  }

  return {
    drag,
    target,
    tileEvents: (imageId: string, onSelect: () => void) => ({
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => onPointerDown(event, imageId),
      onPointerMove,
      onPointerUp,
      onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => { if (session.current?.pointerId === event.pointerId) { suppressClick.current = true; cancel(); } },
      onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => { if (session.current?.pointerId === event.pointerId) cancel(); },
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => { if (event.detail === 0 || !suppressClick.current) onSelect(); },
    }),
  };
}