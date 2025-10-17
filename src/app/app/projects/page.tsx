"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FilterType = "Images" | "Videos" | "All";

type Project = {
  id: string;
  title: string;
  status: "Ready" | "Draft" | "Failed";
  type: "image" | "video";
  updatedAt: string;
  videoUrl?: string;
  // Optional flags/metadata
  upscaled?: boolean;
  taskId?: string;
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState<Project | null>(null);
  const [upscaleScale, setUpscaleScale] = useState<number>(2);
  const [upscaleLoading, setUpscaleLoading] = useState(false);
  const [upscaleStatus, setUpscaleStatus] = useState<string | null>(null);
  const [showUpscale, setShowUpscale] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ugc_projects");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      console.log("Projects loaded from localStorage:", parsed);
      if (Array.isArray(parsed)) {
        // Ensure all items have a type field
        const itemsWithType = parsed.map(item => ({
          ...item,
          // If type is missing, infer from videoUrl or set default to "video"
          type: item.type || "video"
        }));
        console.log("Projects with type field:", itemsWithType);
        setItems(itemsWithType as Project[]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Poll KIE for task completion and update the placeholder item
  function pollUpscaleStatus(taskId: string, placeholderId: string) {
    const started = Date.now();
    const maxMs = 2 * 60 * 1000; // 2 minutes
    const intervalMs = 5000; // check every 5s per spec

    const getUrlFromData = (payload: unknown): string | null => {
      try {
        const d = payload as any;
        const root = d?.data ?? d;
        // Prefer normalized bestUrl from our status API
        if (typeof root?.bestUrl === 'string' && root.bestUrl) return root.bestUrl as string;
        // Try common locations
        const urls: string[] | undefined =
          root?.normalized?.urls ||
          root?.response?.result_urls ||
          root?.response?.urls ||
          root?.urls ||
          root?.resultUrls;
        if (Array.isArray(urls) && urls.length) return urls[0];
        // KIE combined endpoint shapes from our backend
        const primary = root?.primary;
        const alternate = root?.alternate;
        const pickFromParsed = (node: any): string | null => {
          const arr: string[] | undefined = node?.parsedResultJson?.resultUrls;
          if (Array.isArray(arr) && arr.length) return arr[0];
          return null;
        };
        const pUrl = pickFromParsed(primary) || pickFromParsed(alternate);
        if (pUrl) return pUrl;

        // Try to parse resultJson string if present
        const parseStringJson = (val: any): any => {
          if (typeof val === 'string' && val.trim().startsWith('{')) {
            try { return JSON.parse(val); } catch { return undefined; }
          }
          return undefined;
        };
        const pRJ = parseStringJson(primary?.data?.resultJson);
        const aRJ = parseStringJson(alternate?.data?.resultJson);
        const fromPRJ = Array.isArray(pRJ?.resultUrls) && pRJ.resultUrls.length ? pRJ.resultUrls[0] : null;
        const fromARJ = Array.isArray(aRJ?.resultUrls) && aRJ.resultUrls.length ? aRJ.resultUrls[0] : null;
        if (fromPRJ) return fromPRJ;
        if (fromARJ) return fromARJ;

        const url: string | undefined =
          root?.url ||
          root?.imageUrl ||
          root?.downloadUrl ||
          root?.output?.[0]?.image ||
          root?.output?.image ||
          root?.task?.result?.[0]?.image ||
          root?.task?.result?.image ||
          root?.task?.result_urls?.[0];
        return typeof url === 'string' ? url : null;
      } catch {
        return null;
      }
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    };

    const tick = async () => {
      if (Date.now() - started > maxMs) { stop(); return; } // stop silently
      try {
        const res = await fetch(`/api/kie/upscale-status?taskId=${encodeURIComponent(taskId)}`);
        const j = await res.json().catch(() => ({}));
        console.log('Upscale status payload:', j);
        if (res.ok && j?.ok) {
          // Look for completion and final URL
          const url = getUrlFromData(j);
          const flag = j?.data?.normalized?.flag ?? j?.data?.status ?? j?.data?.primary?.data?.state;
          const isDone = Boolean(url) || flag === 1 || flag === 'done' || flag === 'completed' || flag === 'success';
          if (isDone) {
            const key = 'ugc_projects';
            const raw = localStorage.getItem(key);
            const arr: Project[] = raw ? JSON.parse(raw) : [];
            const idx = arr.findIndex(it => it.id === placeholderId);
            if (idx >= 0) {
              arr[idx] = {
                ...arr[idx],
                status: 'Ready',
                updatedAt: 'just now',
                videoUrl: url || arr[idx].videoUrl,
              };
              localStorage.setItem(key, JSON.stringify(arr));
              setItems(arr);
            }
            stop();
            return; // stop polling
          }
        }
      } catch {}
    };

    // kick once immediately then every 10s
    tick();
    intervalId = setInterval(tick, intervalMs);
  }

  // Removed manual attach/refresh actions per product decision

  const openViewer = (p: Project) => {
    setActive(p);
    setShowModal(true);
  };

  const downloadActive = async () => {
    if (!active?.videoUrl) return;
    try {
      const urlObj = new URL(active.videoUrl, window.location.href);
      const sameOrigin = urlObj.origin === window.location.origin;
      const downloadUrl = sameOrigin
        ? active.videoUrl
        : `/api/proxy/download?url=${encodeURIComponent(active.videoUrl)}`;
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      
      // Set appropriate extension based on content type
      let extension = ".mp4";
      if (active.type === "image") {
        extension = blob.type.includes("png") ? ".png" : 
                   blob.type.includes("jpeg") || blob.type.includes("jpg") ? ".jpg" : 
                   ".png";
      }
      
      const prefix = active.type === "image" ? "ugc-image" : "ugc-video";
      a.download = `${active.title?.replace(/\s+/g, "-") || prefix}-${ts}${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {}
  };

  const filtered = items.filter((p) => {
    console.log(`Filtering item: ${p.title}, type: ${p.type}, filter: ${filter}`);
    if (filter === "All") return true;
    if (filter === "Images") return p.type === "image";
    if (filter === "Videos") return p.type === "video";
    return true;
  });
  
  console.log(`Filter: ${filter}, Items: ${items.length}, Filtered: ${filtered.length}`);
  console.log("Filtered items:", filtered);

  const runUpscale = async () => {
    if (!active?.videoUrl || active.type !== "image") return;
    try {
      setUpscaleLoading(true);
      setUpscaleStatus("Starting upscale…");
      const res = await fetch("/api/kie/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: active.videoUrl, scale: upscaleScale, face_enhance: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setUpscaleStatus(`Failed: ${data?.error ? JSON.stringify(data.error) : res.status}`);
        return;
      }
      setUpscaleStatus("Upscale task created.");

      // Create a placeholder project item so it appears under images with a green highlight
      try {
        const key = "ugc_projects";
        const raw = localStorage.getItem(key);
        const arr: any[] = raw ? JSON.parse(raw) : [];
        const now = new Date();
        const newItem: Project = {
          id: `upscaled-${now.getTime()}`,
          title: `Upscaled x${upscaleScale}`,
          status: "Draft",
          type: "image",
          updatedAt: "just now",
          videoUrl: active.videoUrl,
          upscaled: true,
          // API returns { ok: true, data: { code, message, data: { taskId } } }
          taskId: data?.data?.data?.taskId || data?.data?.taskId || undefined,
        };
        const next = [newItem, ...arr];
        localStorage.setItem(key, JSON.stringify(next));
        setItems(next as Project[]);

        // Begin polling task status to update the placeholder with the final upscaled image URL
        if (newItem.taskId) {
          console.log('Starting upscale polling for taskId:', newItem.taskId, 'placeholderId:', newItem.id);
          pollUpscaleStatus(newItem.taskId, newItem.id);
        } else {
          console.warn('No taskId returned from createTask; cannot poll. Raw response:', data);
        }
      } catch {}

      // Close the upscale picker
      setShowUpscale(false);
    } catch {
      setUpscaleStatus("Unexpected error starting upscale.");
    } finally {
      setUpscaleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 !p-4">
        <div className="flex items-center gap-2 text-sm">
          {(["Images", "Videos", "All"] as FilterType[]).map((s) => (
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
              <button key={p.id} onClick={() => openViewer(p)} className={`glass-card block text-left ${p.upscaled ? "ring-2 ring-green-400" : ""}`}>
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                  {p.upscaled && p.status !== 'Ready' ? (
                    <div className="grid h-full place-items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                  ) : p.videoUrl ? (
                    p.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.videoUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={p.videoUrl} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-white/60">No preview</div>
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium leading-6">{p.title}</div>
                    <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                    {p.upscaled && p.status !== 'Ready' && p.taskId ? (
                      <div className="mt-1 text-[10px] text-white/50">Task: {p.taskId}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-card divide-y divide-white/10 p-0">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => openViewer(p)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-white/5">
                <div className={`h-14 w-24 overflow-hidden rounded-lg bg-white/5 ${p.upscaled ? "ring-2 ring-green-400" : ""}`}>
                  {p.upscaled && p.status !== 'Ready' ? (
                    <div className="grid h-full place-items-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    </div>
                  ) : p.videoUrl ? (
                    p.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.videoUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={p.videoUrl} className="h-full w-full object-cover" />
                    )
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                  {p.upscaled && p.status !== 'Ready' && p.taskId ? (
                    <div className="mt-0.5 text-[10px] text-white/50">Task: {p.taskId}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
                </div>
              </button>
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

      {/* Viewer modal */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D12]">
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <div className="text-sm text-white/70">{active?.title || "Preview"}</div>
                <div className="flex gap-2">
                  <button className={`btn-ghost ${!active?.videoUrl ? "pointer-events-none opacity-60" : ""}`} onClick={downloadActive} disabled={!active?.videoUrl}>
                    {active?.type === "image" ? "Download Image" : "Download Video"}
                  </button>
                  {active?.type === "image" && active?.videoUrl && !active?.upscaled ? (
                    <button className="btn-ghost" onClick={() => { setUpscaleStatus(null); setShowUpscale(true); }}>
                      Upscale
                    </button>
                  ) : null}
                  {active?.videoUrl ? (
                    <a className="btn-ghost" href={active.videoUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                  ) : null}
                  <button
                    className="rounded-md border border-red-400 bg-red-500/10 px-3 py-1 text-sm text-red-300"
                    onClick={() => {
                      if (!active) return;
                      const ok = window.confirm('Delete this item? This cannot be undone.');
                      if (!ok) return;
                      try {
                        const key = 'ugc_projects';
                        const raw = localStorage.getItem(key);
                        const arr: Project[] = raw ? JSON.parse(raw) : [];
                        const next = arr.filter(it => it.id !== active.id);
                        localStorage.setItem(key, JSON.stringify(next));
                        setItems(next);
                        setShowModal(false);
                      } catch {}
                    }}
                  >
                    Delete
                  </button>
                  <button className="btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>
              <div className="aspect-video w-full bg-black">
                {active?.videoUrl ? (
                  active?.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={active.videoUrl} alt={active.title} className="h-full w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={active.videoUrl} controls autoPlay className="h-full w-full object-contain" />
                  )
                ) : (
                  <div className="grid h-full place-items-center text-xs text-white/60">No preview</div>
                )}
              </div>
              {upscaleStatus ? (
                <div className="border-t border-white/10 p-3 text-xs text-white/70">{upscaleStatus}</div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Upscale modal */}
      {showModal && showUpscale && active?.type === "image" && active?.videoUrl && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowUpscale(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D12]">
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <div className="text-sm font-semibold">Upscale Image</div>
                <button className="btn-ghost" onClick={() => setShowUpscale(false)}>Close</button>
              </div>
              <div className="grid gap-4 p-4">
                <div className="rounded-xl border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.videoUrl} alt={active.title} className="mx-auto max-h-80 w-auto object-contain" />
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Scale Factor</div>
                  <div className="flex gap-2">
                    {[2,3,4].map((s) => (
                      <button
                        key={s}
                        className={`rounded-xl border px-4 py-2 ${upscaleScale === s ? "bg-white text-black" : "bg-white/10 text-white/90 border-white/15"}`}
                        onClick={() => setUpscaleScale(s)}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 p-3">
                <div className="text-xs text-white/70">{upscaleStatus || ""}</div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => setShowUpscale(false)}>Cancel</button>
                  <button className="btn-primary" disabled={upscaleLoading} onClick={async () => { await runUpscale(); }}>
                    {upscaleLoading ? "Upscaling…" : "Start Upscale"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
