"use client";

import Link from "next/link";

type Project = {
  id: string;
  title: string;
  status: "Draft" | "Ready" | "Rendering" | "Failed";
  thumb?: string;
  updatedAt: string;
};

const mockProjects: Project[] = [];

export default function DashboardPage() {
  const hasProjects = mockProjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome / CTA */}
      <div className="glass-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-white/70 text-sm">Create a new ad or continue where you left off.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/create" className="btn-primary">Create New Ad</Link>
          <Link href="/app/projects" className="btn-ghost">View Projects</Link>
        </div>
      </div>

      {/* Recent Projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link href="/app/projects" className="text-sm text-white/70 hover:underline">See all</Link>
        </div>

        {hasProjects ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockProjects.map((p) => (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="glass-card block">
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-white/5" />
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium leading-6">{p.title}</div>
                    <div className="text-xs text-white/60">Updated {p.updatedAt}</div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/15 bg-white/10">
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center justify-center text-center py-16">
            <div className="mb-4 h-16 w-16 rounded-2xl border border-white/10 bg-white/5" />
            <h3 className="text-xl font-semibold">No projects yet</h3>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Create your first ad to see it appear here. Your drafts and renders will show up with status.
            </p>
            <Link href="/app/create" className="mt-6 btn-primary">Create your first ad</Link>
          </div>
        )}
      </section>
    </div>
  );
}
