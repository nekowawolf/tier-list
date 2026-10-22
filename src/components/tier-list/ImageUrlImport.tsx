"use client";

import { useState } from "react";
import { FiLink, FiLoader } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ImageUrlImport({ onImport, onClose }: { onImport: (url: string) => Promise<string | null>; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="Import from URL" description="Add an image using a direct image or CDN link." onClose={() => { if (!pending) onClose(); }}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (pending || !url.trim()) return;
        setPending(true);
        setError(null);
        try {
          const message = await onImport(url.trim());
          if (message) setError(message); else onClose();
        } catch {
          setError("The image could not be imported. Try another link or upload the file instead.");
        } finally { setPending(false); }
      }}>
        <label htmlFor="image-url" className="text-xs font-medium">Image URL</label>
        <input id="image-url" autoFocus type="url" required value={url} disabled={pending} placeholder="https://cdn.example.com/image.png"
          aria-invalid={!!error} aria-describedby={`image-url-help${error ? " image-url-error" : ""}`}
          onChange={(event) => { setUrl(event.target.value); setError(null); }}
          className="mt-2 w-full rounded-lg border border-line bg-surface-soft px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus-visible:outline-offset-2 disabled:opacity-50" />
        <p id="image-url-help" className="mt-3 text-xs leading-5 text-muted">Use a link to an image, not a web page. Maximum 20 MB. The image host must allow browser downloads (CORS); otherwise, download the image and import it as a file.</p>
        <p className="mt-2 text-[11px] leading-5 text-muted">Your browser contacts the image host to download the file. The image is then processed and saved on this device.</p>
        {error && <p id="image-url-error" role="alert" className="mt-4 rounded-lg border border-red-400/25 bg-red-400/5 p-3 text-xs leading-5 text-red-400 light:text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={pending || !url.trim()}>{pending ? <FiLoader size={14} className="animate-spin motion-reduce:animate-none" /> : <FiLink size={14} />}{pending ? "Importing…" : "Import image"}</Button>
        </div>
      </form>
    </Modal>
  );
}