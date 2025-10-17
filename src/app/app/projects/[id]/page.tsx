"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [imageUrl, setImageUrl] = useState("");
  const [scale, setScale] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const runUpscale = async () => {
    if (!imageUrl) {
      setStatus("Please enter an image URL");
      return;
    }
    setLoading(true);
    setStatus("Starting upscale…");
    try {
      const res = await fetch("/api/kie/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl, scale, face_enhance: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setStatus(`Failed: ${data?.error ? JSON.stringify(data.error) : res.status}`);
        return;
      }
      setStatus("Upscale task created. Check Renders or status endpoint.");
    } catch (e) {
      setStatus("Unexpected error starting upscale.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card !p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Project #{id}</h1>
            <div className="text-xs text-white/60">Status: Draft • Created today • Updated just now</div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost">Duplicate</button>
            <button className="btn-ghost">Delete</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card !p-0">
        <div className="flex gap-2 border-b border-white/10 px-4 py-2 text-sm">
          <button className="rounded-xl bg-white/10 px-3 py-1">Assets</button>
          <button className="rounded-xl px-3 py-1 hover:bg-white/5">Renders</button>
          <button className="rounded-xl px-3 py-1 hover:bg-white/5">Notes</button>
        </div>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Product image</div>
              <div className="mt-2 aspect-video w-full rounded-lg bg-white/5" />
              <div className="mt-2 flex gap-2 text-sm">
                <button className="btn-ghost">Download</button>
                <button className="btn-ghost">Replace</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Persona image</div>
              <div className="mt-2 aspect-video w-full rounded-lg bg-white/5" />
              <div className="mt-2 flex gap-2 text-sm">
                <button className="btn-ghost">Download</button>
                <button className="btn-ghost">Replace</button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Generated image</div>
              <div className="mt-2 aspect-video w-full rounded-lg bg-white/5" />
              <div className="mt-2 flex gap-2 text-sm">
                <button className="btn-ghost">Download</button>
                <button className="btn-ghost">Replace</button>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL to upscale"
                  className="w-full rounded-md bg-white/10 px-3 py-2 outline-none"
                />
                <div className="flex items-center gap-2">
                  <label className="text-white/70">Scale</label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="rounded-md bg-white/10 px-2 py-1"
                  >
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={4}>4x</option>
                  </select>
                  <button
                    onClick={runUpscale}
                    disabled={loading}
                    className="btn-ghost"
                  >
                    {loading ? "Upscaling…" : "Upscale"}
                  </button>
                </div>
                {status ? <div className="text-xs text-white/70">{status}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-white/70">
        <Link href="/app/projects" className="hover:underline">Back to projects</Link>
      </div>
    </div>
  );
}
