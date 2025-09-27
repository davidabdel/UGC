"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "All" | "Draft" | "Ready" | "Failed";

type Project = {
  id: string;
  title: string;
  status: Exclude<Status, "All">;
  updatedAt: string;
  videoUrl?: string;
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Status>("All");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<Project[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ugc_projects");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setItems(parsed as Project[]);
    } catch {}
  }, []);

  const filtered = items.filter((p) => (filter === "All" ? true : p.status === filter));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 !p-4">
        <div className="flex items-center gap-2 text-sm">
          {(["All", "Draft", "Ready", "Failed"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 ${
                filter === s ? "bg-white text-black" : "border border-white/15 bg-white/10 text-white/90"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            className={`rounded-xl border px-3 py-1 ${layout === "grid" ? "bg-white/10" : "bg-transparent"}`}
            onClick={() => setLayout("grid")}
          >
            Grid
          </button>
          <button
            className={`rounded-xl border px-3 py-1 ${layout === "list" ? "bg-white/10" : "bg-transparent"}`}
            onClick={() => setLayout("list")}
          >
            List
          </button>
        </div>
      </div>

      {filtered.length ? (
        layout === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="glass-card block">
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                  {p.videoUrl ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={p.videoUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-white/60">No preview</div>
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium leading-6">{p.title}</div>
                    <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card divide-y divide-white/10 p-0">
            {filtered.map((p) => (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5">
                <div className="h-14 w-24 overflow-hidden rounded-lg bg-white/5">
                  {p.videoUrl ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={p.videoUrl} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 h-16 w-16 rounded-2xl border border-white/10 bg-white/5" />
          <h3 className="text-xl font-semibold">No projects yet</h3>
          <p className="mt-2 max-w-sm text-sm text-white/70">Create New Ad to get started.</p>
          <Link href="/app/create" className="mt-6 btn-primary">Create New Ad</Link>
        </div>
      )}
    </div>
  );
}
