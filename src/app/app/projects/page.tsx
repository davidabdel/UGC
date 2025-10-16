"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UpscaleDialog from "@/components/UpscaleDialog";

type FilterType = "Images" | "Videos" | "All";

type Project = {
  id: string;
  title: string;
  status: "Ready" | "Draft" | "Failed";
  type: "image" | "video";
  updatedAt: string;
  videoUrl?: string;
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState<Project | null>(null);
  const [showUpscaleDialog, setShowUpscaleDialog] = useState(false);

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
      if (e.key === "Escape") {
        setShowModal(false);
        setShowUpscaleDialog(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openViewer = (p: Project) => {
    setActive(p);
    setShowModal(true);
  };

  const downloadActive = async () => {
    if (!active?.videoUrl) return;
    try {
      const res = await fetch(active.videoUrl);
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

  const handleUpscale = () => {
    if (active?.type === "image" && active?.videoUrl) {
      setShowUpscaleDialog(true);
      setShowModal(false);
    }
  };

  const handleUpscaleComplete = (newImageUrl: string) => {
    // Update the active project with the new upscaled image URL
    if (active) {
      const updatedProject = { ...active, videoUrl: newImageUrl };
      setActive(updatedProject);
      
      // Update the project in the items array
      const updatedItems = items.map(item => 
        item.id === active.id ? updatedProject : item
      );
      setItems(updatedItems);
      
      // Save to localStorage
      try {
        localStorage.setItem("ugc_projects", JSON.stringify(updatedItems));
      } catch {}
      
      // Show the modal with the upscaled image
      setShowModal(true);
    }
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
              <button key={p.id} onClick={() => openViewer(p)} className="glass-card block text-left">
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                  {p.videoUrl ? (
                    p.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.videoUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
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
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-card divide-y divide-white/10 p-0">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => openViewer(p)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-white/5">
                <div className="h-14 w-24 overflow-hidden rounded-lg bg-white/5">
                  {p.videoUrl ? (
                    p.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.videoUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <video src={p.videoUrl} className="h-full w-full object-cover" />
                    )
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">{p.status}</span>
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
                  {active?.type === "image" && (
                    <button className="btn-ghost" onClick={handleUpscale}>
                      Upscale
                    </button>
                  )}
                  <button className={`btn-ghost ${!active?.videoUrl ? "pointer-events-none opacity-60" : ""}`} onClick={downloadActive} disabled={!active?.videoUrl}>
                    {active?.type === "image" ? "Download Image" : "Download Video"}
                  </button>
                  {active?.videoUrl ? (
                    <a className="btn-ghost" href={active.videoUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                  ) : null}
                  <button className="btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>
              <div className="aspect-video w-full bg-black">
                {active?.videoUrl ? (
                  active?.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={active.videoUrl} alt={active.title} className="h-full w-full object-contain" />
                  ) : (
                    <video src={active.videoUrl} controls autoPlay className="h-full w-full object-contain" />
                  )
                ) : (
                  <div className="grid h-full place-items-center text-xs text-white/60">No preview</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upscale Dialog */}
      {showUpscaleDialog && active?.videoUrl && (
        <UpscaleDialog
          imageUrl={active.videoUrl}
          onUpscaleComplete={handleUpscaleComplete}
          open={showUpscaleDialog}
          onOpenChange={setShowUpscaleDialog}
        />
      )}
    </div>
  );
}
