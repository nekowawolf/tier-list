"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { FiArrowDown, FiArrowUp, FiCheck, FiCheckCircle, FiChevronDown, FiChevronUp, FiDownload, FiGrid, FiHelpCircle, FiImage, FiInfo, FiLink, FiLoader, FiPlus, FiRotateCcw, FiRotateCw, FiSettings, FiShield, FiSliders, FiUpload, FiX } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import Modal from "@/components/ui/Modal";
import ImageSettings from "@/components/tier-list/ImageSettings";
import TierSettings from "@/components/tier-list/TierSettings";
import BoardTitle from "@/components/tier-list/BoardTitle";
import ImageUrlImport from "@/components/tier-list/ImageUrlImport";
import { createBoard, IMAGE_ACCEPT, MAX_IMAGES, MAX_TIERS, nextTierLabel, TIER_COLORS } from "@/constants/tiers";
import { useTierBoard } from "@/hooks/useTierBoard";
import { useImageDrag } from "@/hooks/useImageDrag";
import { labelTextColor, moveImage, removeImage } from "@/lib/board";
import { exportBoard } from "@/lib/export";
import { importImage, importImageUrl } from "@/lib/images";
import type { DropTarget, TierImage } from "@/types/tier-list";

export default function TierListEditor() {
  const { board, ready, saveStatus, update, undo, redo, canUndo, canRedo } = useTierBoard();
  const fileInput = useRef<HTMLInputElement>(null);
  const importLock = useRef(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fileHover, setFileHover] = useState(false);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  const move = useCallback((id: string, target: DropTarget) => update((current) => moveImage(current, id, target)), [update]);
  const { drag, target, tileEvents } = useImageDrag(move);
  const images = new Map(board.images.map((image) => [image.id, image]));
  const rankedCount = board.images.length - board.unranked.length;
  const activeTier = board.tiers.find((tier) => tier.id === editingTier);
  const activeImage = selectedImage ? images.get(selectedImage) : undefined;
  const draggedImage = drag ? images.get(drag.imageId) : undefined;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.error ? 10000 : 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const importFiles = useCallback(async (files: File[], containerId = "unranked") => {
    if (importLock.current || !ready || !files.length) return;
    const remaining = MAX_IMAGES - board.images.length;
    if (remaining <= 0) { setNotice({ message: `This board has reached its ${MAX_IMAGES}-image limit. Remove an image to add another.`, error: true }); return; }
    importLock.current = true;
    setImporting(true);
    const imported: TierImage[] = [];
    let failed = 0;
    for (const file of files.slice(0, remaining)) {
      try { imported.push(await importImage(file)); } catch { failed++; }
    }
    if (imported.length) {
      update((current) => {
        const ids = imported.map((image) => image.id);
        const tierExists = current.tiers.some((tier) => tier.id === containerId);
        return {
          ...current,
          images: [...current.images, ...imported],
          unranked: tierExists ? current.unranked : [...current.unranked, ...ids],
          tiers: current.tiers.map((tier) => tier.id === containerId ? { ...tier, imageIds: [...tier.imageIds, ...ids] } : tier),
        };
      });
    }
    const skipped = Math.max(0, files.length - remaining);
    setNotice({
      message: `${imported.length ? `${imported.length} image${imported.length === 1 ? "" : "s"} added.` : "No images were added."}${failed ? ` ${failed} file${failed === 1 ? "" : "s"} could not be opened. Use supported images under 20 MB and 50 megapixels.` : ""}${skipped ? ` ${skipped} skipped (300-image limit).` : ""}`,
      error: failed > 0 || skipped > 0,
    });
    importLock.current = false;
    setImporting(false);
  }, [ready, board.images.length, update]);

  async function importUrl(url: string): Promise<string | null> {
    if (importLock.current || !ready) return "Please wait for the current operation to finish.";
    if (board.images.length >= MAX_IMAGES) return `This board has reached its ${MAX_IMAGES}-image limit. Remove an image to add another.`;
    importLock.current = true;
    setImporting(true);
    try {
      const image = await importImageUrl(url);
      update((current) => ({ ...current, images: [...current.images, image], unranked: [...current.unranked, image.id] }));
      setNotice({ message: "Image imported from URL." });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "The image could not be imported. Try another link or upload the file instead.";
    } finally {
      importLock.current = false;
      setImporting(false);
    }
  }

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (document.querySelector("dialog[open]") || (event.target instanceof HTMLElement && event.target.closest("input, textarea, [contenteditable]"))) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) { event.preventDefault(); void importFiles(files); }
    };
    const shortcut = (event: KeyboardEvent) => {
      if (!ready || importing || document.querySelector("dialog[open]") || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable], [role='listbox'], [aria-haspopup='listbox']"))) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
    };
    window.addEventListener("paste", paste);
    window.addEventListener("keydown", shortcut);
    return () => { window.removeEventListener("paste", paste); window.removeEventListener("keydown", shortcut); };
  }, [importFiles, importing, ready, undo, redo]);

  function handleFileDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setFileHover(false);
    const container = (event.target as HTMLElement).closest<HTMLElement>("[data-drop-container]");
    void importFiles(Array.from(event.dataTransfer.files), container?.dataset.dropContainer);
  }

  function reorderTier(index: number, direction: -1 | 1) {
    update((current) => {
      const tiers = [...current.tiers];
      const destination = index + direction;
      if (destination < 0 || destination >= tiers.length) return current;
      [tiers[index], tiers[destination]] = [tiers[destination], tiers[index]];
      return { ...current, tiers };
    });
  }

  function saveTier(label: string, color: string) {
    const id = crypto.randomUUID();
    update((current) => editingTier === "new"
      ? { ...current, tiers: [...current.tiers, { id, label, color, imageIds: [] }] }
      : { ...current, tiers: current.tiers.map((tier) => tier.id === editingTier ? { ...tier, label, color } : tier) });
    setEditingTier(null);
  }

  function clearTier(remove: boolean) {
    update((current) => {
      const tier = current.tiers.find((item) => item.id === editingTier);
      if (!tier || (remove && current.tiers.length === 1)) return current;
      return {
        ...current,
        unranked: [...current.unranked, ...tier.imageIds],
        tiers: remove ? current.tiers.filter((item) => item.id !== tier.id) : current.tiers.map((item) => item.id === tier.id ? { ...item, imageIds: [] } : item),
      };
    });
    setEditingTier(null);
  }

  async function download() {
    setExporting(true);
    try { await exportBoard(board); setNotice({ message: "Tier list exported as a PNG." }); }
    catch (error) { setNotice({ message: error instanceof Error ? error.message : "The export failed. Please try again.", error: true }); }
    finally { setExporting(false); }
  }

  function renderImage(id: string) {
    const image = images.get(id);
    if (!image) return null;
    return (
      <button key={id} type="button" data-image-id={id} aria-label={`Image options for ${image.name}`} title={`${image.name} · Drag to rank or click for options`}
        {...tileEvents(id, () => setSelectedImage(id))}
        className={`relative size-[var(--tile-size)] shrink-0 touch-none select-none overflow-hidden bg-black/10 outline-offset-[-3px] transition-opacity hover:z-10 hover:ring-2 hover:ring-inset hover:ring-blue-400 focus-visible:z-10 ${drag?.imageId === id ? "cursor-grabbing opacity-30" : "cursor-grab"} ${target?.beforeId === id ? "border-l-4 border-blue-400" : ""}`}>
        <Image src={image.src} alt={image.name} fill sizes="104px" unoptimized draggable={false} className="pointer-events-none object-cover" />
      </button>
    );
  }

  return (
    <section id="tier-editor" tabIndex={-1} aria-label="Tier list editor" onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
      onDragEnter={(event) => { if (event.dataTransfer.types.includes("Files")) setFileHover(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFileHover(false); }} onDrop={handleFileDrop}
      style={{ "--tile-size": `${board.tileSize}px` } as CSSProperties}>
      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} multiple className="hidden" aria-label="Import image files" onChange={(event) => { void importFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <fieldset disabled={!ready || importing} className="min-w-0">
        <legend className="sr-only">Create and customize your tier list</legend>
        <div className={`overflow-hidden rounded-2xl border bg-surface shadow-sm transition-colors ${fileHover ? "border-blue-400 ring-4 ring-blue-400/10" : "border-line"}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-soft text-muted"><FiGrid size={16} /></span>
              <div className="min-w-0">
                <BoardTitle key={board.title} title={board.title} onSave={(title) => update((current) => current.title === title ? current : { ...current, title })} />
                <p className="mt-1 flex items-center gap-1.5 px-3 text-[10px] text-muted" role="status">
                  {saveStatus === "saved" ? <FiCheck size={11} className="text-emerald-400 light:text-emerald-600" /> : saveStatus === "error" ? <FiInfo size={11} className="text-amber-400" /> : <FiLoader size={11} className="animate-spin motion-reduce:animate-none" />}
                  {saveStatus === "loading" ? "Loading board…" : saveStatus === "saved" ? "Saved on this device" : saveStatus === "error" ? "Not saved — browser storage unavailable" : "Saving on this device…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowHelp(true)} aria-label="How to use the editor" title="How to use" className="px-2.5"><FiHelpCircle size={16} /></Button>
              <Button onClick={() => fileInput.current?.click()}><FiUpload size={14} /> Import images</Button>
              <Button variant="primary" onClick={download} disabled={exporting || !ready} aria-label="Export tier list as PNG">{exporting ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}<span className="hidden min-[400px]:inline">{exporting ? "Exporting…" : "Export PNG"}</span></Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line bg-surface-soft px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={undo} disabled={!canUndo} title="Undo (Ctrl / ⌘ Z)" aria-label="Undo" className="min-h-8 px-2"><FiRotateCcw size={14} /></Button>
              <Button variant="ghost" onClick={redo} disabled={!canRedo} title="Redo (Ctrl / ⌘ Shift Z)" aria-label="Redo" className="min-h-8 px-2"><FiRotateCw size={14} /></Button>
              <span className="mx-2 h-4 w-px bg-line" />
              <span className="text-[11px] text-muted">{board.tiers.length} tiers<span className="mx-2 text-muted/40">/</span>{rankedCount} ranked</span>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="tile-size" className="hidden text-[11px] text-muted sm:block">Image size</label>
              <Dropdown id="tile-size" label="Image size" placement="bottom" icon={<FiSliders size={14} />} value={String(board.tileSize)} disabled={!ready || importing}
                options={[{ value: "56", label: "Small" }, { value: "80", label: "Medium" }, { value: "104", label: "Large" }]}
                onChange={(value) => update((current) => ({ ...current, tileSize: Number(value) }))} />
              <span className="h-4 w-px bg-line" />
              <Button variant="ghost" onClick={() => setShowReset(true)} className="min-h-8 px-1.5 text-[11px]"><FiRotateCcw size={12} /> Reset</Button>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            <div className="overflow-hidden rounded-lg border border-black/60 light:border-line" aria-label="Ranking board">
              {board.tiers.map((tier, index) => (
                <div key={tier.id} className="flex border-b border-black/70 bg-board last:border-b-0 light:border-line">
                  <button onClick={() => setEditingTier(tier.id)} title={`Edit ${tier.label} tier`} aria-label={`Edit tier ${tier.label}`} className="flex w-[72px] shrink-0 items-center justify-center self-stretch border-r border-black/20 px-2 py-3 text-center text-base font-semibold wrap-anywhere transition-[filter] hover:brightness-110 sm:w-[104px] sm:text-lg" style={{ backgroundColor: tier.color, color: labelTextColor(tier.color) }}>{tier.label}</button>
                  <div data-drop-container={tier.id} aria-label={`${tier.label} tier images`} className={`relative flex min-h-[max(80px,var(--tile-size))] min-w-0 flex-1 flex-wrap content-start items-start transition-colors ${target?.containerId === tier.id ? "bg-blue-400/10 ring-2 ring-inset ring-blue-400" : ""}`}>
                    {tier.imageIds.map(renderImage)}
                    {!tier.imageIds.length && <span className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] ${target?.containerId === tier.id ? "text-blue-400" : "text-muted/30"}`}><FiPlus size={12} className="hidden sm:block" />{target?.containerId === tier.id ? "Drop here" : "Drop images here"}</span>}
                  </div>
                  <div className="flex w-9 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-black/25 bg-controls py-1 sm:w-16 sm:flex-row sm:gap-0.5">
                    <button onClick={() => setEditingTier(tier.id)} aria-label={`Settings for tier ${tier.label}`} title="Tier settings" className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-foreground"><FiSettings size={15} /></button>
                    <div className="flex flex-col">
                      <button disabled={index === 0} onClick={() => reorderTier(index, -1)} aria-label={`Move tier ${tier.label} up`} title="Move tier up" className="rounded p-1 text-muted hover:text-foreground disabled:opacity-20"><FiChevronUp size={15} /></button>
                      <button disabled={index === board.tiers.length - 1} onClick={() => reorderTier(index, 1)} aria-label={`Move tier ${tier.label} down`} title="Move tier down" className="rounded p-1 text-muted hover:text-foreground disabled:opacity-20"><FiChevronDown size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setEditingTier("new")} disabled={board.tiers.length >= MAX_TIERS} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-xs font-medium text-muted transition-colors hover:border-blue-400/50 hover:bg-blue-400/5 hover:text-blue-400 disabled:opacity-40"><FiPlus size={14} />{board.tiers.length >= MAX_TIERS ? "50-tier limit reached" : "Add a tier"}</button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 px-4 py-3 text-[10px] text-muted sm:px-5">
            <span className="flex min-w-0 items-center gap-1.5 leading-4"><FiInfo size={12} aria-hidden="true" className="block shrink-0" /><span>Drag images to rank. Select a label to edit it.</span></span>
            <span className="flex items-center gap-1.5 leading-4"><FiCheckCircle size={12} aria-hidden="true" className="block shrink-0 text-blue-400 light:text-blue-600" /><span>Images are cropped to a 1:1 ratio</span></span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2.5"><FiImage size={16} className="text-muted" /><h2 className="text-sm font-semibold">Unranked images</h2><span className="rounded-md border border-line bg-surface-soft px-1.5 py-0.5 text-[10px] tabular-nums text-muted">{board.unranked.length}</span></div>
            <span className="hidden text-[11px] text-muted sm:inline">Images not yet assigned to a tier</span>
          </div>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div data-drop-container="unranked" aria-label="Unranked image tray" className={`min-h-40 rounded-xl border border-dashed transition-colors ${target?.containerId === "unranked" || fileHover ? "border-blue-400 bg-blue-400/10" : "border-line bg-surface-soft"}`}>
              {board.unranked.length ? <div className="flex flex-wrap gap-2 p-3">{board.unranked.map(renderImage)}<button onClick={() => fileInput.current?.click()} aria-label="Add more images" className="flex size-[var(--tile-size)] shrink-0 items-center justify-center rounded-md border border-dashed border-line text-muted hover:border-blue-400 hover:text-blue-400"><FiPlus size={22} /></button></div> :
                <button onClick={() => fileInput.current?.click()} className="group flex min-h-48 w-full flex-col items-center justify-center px-4 py-7 text-center">
                  <span className="mb-3 flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-blue-400 shadow-sm transition-transform group-hover:-translate-y-0.5">{importing ? <FiLoader size={20} className="animate-spin" /> : <FiUpload size={20} />}</span>
                  <span className="text-sm font-medium">{importing ? "Processing images…" : fileHover ? "Drop images here" : board.images.length ? "All images have been ranked" : "Drop images here"}</span>
                  <span className="mt-1.5 text-xs text-muted">{board.images.length ? "Return images here or " : "or "}<span className="text-blue-400 light:text-blue-600">browse files</span> to import {board.images.length ? "more images" : "images"}</span>
                  <span className="mt-4 text-[10px] tracking-wide text-muted/65">PNG, JPG, WEBP, GIF & more · Up to 20 MB each</span>
                </button>}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><span>{importing ? "Processing images…" : "Paste images from your clipboard or import a direct link."}</span><Button onClick={() => setShowUrlImport(true)} disabled={board.images.length >= MAX_IMAGES}><FiLink size={14} />Import from URL</Button></div>
              <span>{board.images.length} / {MAX_IMAGES} images</span>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 px-1 sm:grid-cols-3 sm:gap-8">
        {[{ icon: FiUpload, title: "Import images", text: "Add files from your device, drag or paste images, or import a direct image or CDN link." }, { icon: FiSliders, title: "Customize tiers", text: "Edit labels, choose colors, and reorder tiers to suit your ranking criteria." }, { icon: FiShield, title: "Private by default", text: "Images are processed and saved in your browser. Importing a URL contacts the image host; no images are uploaded to our servers." }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3"><Icon className="mt-0.5 shrink-0 text-muted/70" size={16} /><div><h3 className="text-xs font-medium">{title}</h3><p className="mt-1.5 text-[11px] leading-5 text-muted">{text}</p></div></div>)}
      </div>

      {(editingTier === "new" || activeTier) && <TierSettings key={editingTier} tier={activeTier ?? { label: nextTierLabel(board.tiers.map((tier) => tier.label)), color: TIER_COLORS[board.tiers.length % TIER_COLORS.length] }} isNew={editingTier === "new"} canDelete={board.tiers.length > 1} hasImages={!!activeTier?.imageIds.length} onSave={saveTier} onClear={() => clearTier(false)} onDelete={() => clearTier(true)} onClose={() => setEditingTier(null)} />}
      {activeImage && <ImageSettings key={activeImage.id} image={activeImage} tiers={board.tiers} containerId={board.tiers.find((tier) => tier.imageIds.includes(activeImage.id))?.id ?? "unranked"} onClose={() => setSelectedImage(null)} onMove={(containerId) => { move(activeImage.id, { containerId }); setSelectedImage(null); }} onDelete={() => { update((current) => removeImage(current, activeImage.id)); setSelectedImage(null); }} />}
      {showUrlImport && <ImageUrlImport onImport={importUrl} onClose={() => setShowUrlImport(false)} />}
      {showReset && <Modal title="Reset board" description="Choose what to reset. Both actions can be undone." onClose={() => setShowReset(false)}>
        <div className="space-y-3">
          <button className="w-full rounded-xl border border-line bg-surface-soft p-4 text-left hover:border-blue-400/60" onClick={() => { update((current) => ({ ...current, unranked: [...current.unranked, ...current.tiers.flatMap((tier) => tier.imageIds)], tiers: current.tiers.map((tier) => ({ ...tier, imageIds: [] })) })); setShowReset(false); }}><span className="text-sm font-medium">Reset rankings</span><span className="mt-1 block text-xs leading-5 text-muted">Return all images to the tray. Keep your title, tiers, and colors.</span></button>
          <button className="w-full rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-left hover:border-red-400/50" onClick={() => { update(() => createBoard()); setShowReset(false); }}><span className="text-sm font-medium text-red-400 light:text-red-600">Start a new board</span><span className="mt-1 block text-xs leading-5 text-muted">Remove all images and restore the default S–D tiers.</span></button>
        </div><Button className="mt-5 w-full" onClick={() => setShowReset(false)}>Cancel</Button>
      </Modal>}
      {showHelp && <Modal title="How to use Tier List" description="Import images, organize your rankings, and export the finished board." onClose={() => setShowHelp(false)}>
        <div className="space-y-5 text-xs leading-6 text-muted">
          <p><strong className="text-foreground">1. Import images.</strong> Import multiple files, drop them on the board, paste from your clipboard, or select Import from URL to add a direct image or CDN link. The image host must allow browser downloads. Images are center-cropped to a square. Animated images become a still frame.</p>
          <p><strong className="text-foreground">2. Arrange rankings.</strong> Drag images into a tier or between other images to reorder them. Mouse and touch are supported. Select an image to open a keyboard-accessible move menu.</p>
          <p><strong className="text-foreground">3. Customize tiers.</strong> Select a tier label or the settings icon <FiSettings aria-hidden="true" className="inline-block align-middle" /> to edit its name or color. Use the arrow controls <FiArrowUp aria-hidden="true" className="inline-block align-middle" /> / <FiArrowDown aria-hidden="true" className="inline-block align-middle" /> to reorder tiers. Choose a preset color, use the color wheel, or enter a HEX value.</p>
          <p><strong className="text-foreground">4. Export the board.</strong> Download your ranked board as a PNG. Unranked images and editor controls are not included.</p>
          <div className="rounded-lg border border-line bg-surface-soft p-3"><p><strong className="text-foreground">Undo:</strong> Ctrl / ⌘ Z <span className="mx-2">·</span> <strong className="text-foreground">Redo:</strong> Ctrl / ⌘ Shift Z</p><p className="mt-2">Your latest board is saved automatically in this browser. Clearing site data removes it. Export a PNG to keep a copy of your rankings.</p></div>
        </div>
      </Modal>}
      {drag && draggedImage && <div className="pointer-events-none fixed z-[100] size-[var(--tile-size)] -translate-x-1/2 -translate-y-1/2 rotate-3 overflow-hidden rounded-md border-2 border-blue-400 bg-surface shadow-2xl" style={{ left: drag.x, top: drag.y }}><Image src={draggedImage.src} alt="" fill sizes="104px" unoptimized className="object-cover" /></div>}
      {notice && <div role={notice.error ? "alert" : "status"} aria-live={notice.error ? "assertive" : "polite"} aria-atomic="true" className={`fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border bg-surface px-4 py-3.5 text-xs leading-5 shadow-xl min-[601px]:top-6 min-[601px]:w-[356px] ${notice.error ? "border-amber-400/40" : "border-line"}`}>
        {notice.error ? <FiInfo size={18} className="shrink-0 text-amber-400" /> : <FiCheckCircle size={18} className="shrink-0 text-emerald-400" />}<span className="flex-1">{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification" className="p-1 text-muted"><FiX size={16} /></button>
      </div>}
    </section>
  );
}