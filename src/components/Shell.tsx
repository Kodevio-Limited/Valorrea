"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard Overview" },
  { prefix: "/users", title: "Manage Users" },
  { prefix: "/content/scripture", title: "Manage Scripture" },
  { prefix: "/content/devotionals-stories", title: "Devotionals & Bible Stories" },
  { prefix: "/content/prayers", title: "Manage Prayers" },
  { prefix: "/community/posts", title: "Community & Groups" },
  { prefix: "/community/prayer-requests", title: "Prayer Wall Requests" },
  { prefix: "/notifications", title: "Push Notifications" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const match = TITLES.find(
    (t) =>
      window.location.pathname === t.prefix ||
      window.location.pathname.startsWith(t.prefix + "/")
  );
  const title = match?.title ?? "Faith Admin";

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center gap-4 bg-surface-bg/80 px-4 py-4 backdrop-blur lg:px-8">
          <button
            className="rounded-card p-2 text-text-muted hover:bg-surface-card lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1 className="font-urbanist text-xl font-bold text-text-primary">
            {title}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-pill bg-surface-card px-3 py-1.5 font-manrope text-xs font-semibold text-text-muted shadow-card sm:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>
        <main className="px-4 pb-12 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
