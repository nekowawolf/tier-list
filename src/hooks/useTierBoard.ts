"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { createBoard } from "@/constants/tiers";
import { loadBoard, saveBoard } from "@/lib/storage";
import type { SaveStatus, TierBoard } from "@/types/tier-list";

type History = { past: TierBoard[]; board: TierBoard; future: TierBoard[] };
type Action = { type: "edit"; update: (board: TierBoard) => TierBoard } | { type: "load"; board: TierBoard } | { type: "undo" | "redo" };

function reducer(state: History, action: Action): History {
  if (action.type === "load") return { past: [], board: action.board, future: [] };
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    return previous ? { past: state.past.slice(0, -1), board: previous, future: [state.board, ...state.future] } : state;
  }
  if (action.type === "redo") {
    const next = state.future[0];
    return next ? { past: [...state.past, state.board], board: next, future: state.future.slice(1) } : state;
  }
  if (action.type === "edit") {
    const board = action.update(state.board);
    return board === state.board ? state : { past: [...state.past.slice(-29), state.board], board, future: [] };
  }
  return state;
}

export function useTierBoard() {
  const [history, dispatch] = useReducer(reducer, undefined, () => ({ past: [], board: createBoard(), future: [] }));
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<TierBoard | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    loadBoard().then((board) => {
      if (!active) return;
      if (board) {
        dispatch({ type: "load", board });
        setSaved(board);
      }
    }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      saveBoard(history.board).then(() => {
        if (active) { setSaved(history.board); setStorageError(false); }
      }).catch(() => { if (active) setStorageError(true); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [history.board, ready]);

  const update = useCallback((updater: (board: TierBoard) => TierBoard) => dispatch({ type: "edit", update: updater }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const saveStatus: SaveStatus = !ready ? "loading" : storageError ? "error" : saved === history.board ? "saved" : "saving";

  useEffect(() => {
    if (saveStatus !== "saving" && saveStatus !== "error") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveStatus]);

  return { board: history.board, ready, saveStatus, update, undo, redo, canUndo: !!history.past.length, canRedo: !!history.future.length };
}