"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowRight, FiTrash2 } from "react-icons/fi";
import type { Tier, TierImage } from "@/types/tier-list";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";

export default function ImageSettings({ image, tiers, containerId, onMove, onDelete, onClose }: { image: TierImage; tiers: Tier[]; containerId: string; onMove: (containerId: string) => void; onDelete: () => void; onClose: () => void }) {
  const [destination, setDestination] = useState(containerId);
  return (
    <Modal title="Image options" description="Move this image without dragging, or remove it from your board." onClose={onClose}>
      <Image src={image.src} alt={image.name} width={160} height={160} unoptimized className="mx-auto aspect-square rounded-xl bg-board object-cover" />
      <p className="mb-6 mt-3 text-center text-xs text-muted wrap-anywhere">{image.name}</p>
      <label htmlFor="image-destination" className="text-xs font-medium">Move to</label>
      <div className="mb-4 mt-2">
        <Dropdown id="image-destination" label="Move to" value={destination} fullWidth maxHeight={200} onChange={setDestination}
          options={[{ value: "unranked", label: "Unranked images" }, ...tiers.map((tier) => ({ value: tier.id, label: tier.label }))]} />
      </div>
      <Button variant="primary" className="w-full" onClick={() => onMove(destination)} disabled={destination === containerId}>Move image <FiArrowRight /></Button>
      <div className="mt-5 border-t border-line pt-4"><Button variant="danger" className="w-full" onClick={onDelete}><FiTrash2 /> Remove image</Button><p className="mt-2 text-center text-[11px] text-muted">Use Undo to restore a removed image.</p></div>
    </Modal>
  );
}