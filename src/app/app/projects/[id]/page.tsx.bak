"use client";

import Link from "next/link";

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;
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
