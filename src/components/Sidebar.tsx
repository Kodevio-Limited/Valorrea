"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./providers";
import type { ModuleKey } from "@/lib/permissions";

interface NavItem {
  key: ModuleKey;
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "📊" },
  { key: "users", href: "/users", label: "Users", icon: "👥" },
  {
    key: "scripture",
    href: "/content/scripture",
    label: "Scripture",
    icon: "📖",
  },
  {
    key: "devotionals_stories",
    href: "/content/devotionals-stories",
    label: "Devotionals & Stories",
    icon: "🕯️",
  },
  { key: "prayers", href: "/content/prayers", label: "Prayers", icon: "🙏" },
  {
    key: "community_posts",
    href: "/community/posts",
    label: "Community",
    icon: "💬",
  },
  {
    key: "prayer_requests",
    href: "/community/prayer-requests",
    label: "Prayer Wall",
    icon: "✉️",
  },
  {
    key: "notifications",
    href: "/notifications",
    label: "Notifications",
    icon: "🔔",
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { can } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-primary-dark/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-surface-card shadow-raised transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pb-6 pt-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-card bg-primary-gradient text-xl text-white shadow-card">
            ✝
          </div>
          <div>
            <p className="font-urbanist text-lg font-bold leading-tight text-text-primary">
              Faith Admin
            </p>
            <p className="font-manrope text-xs text-text-muted">
              Adult + Kids Console
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {NAV_ITEMS.filter((item) => can(item.key)).map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-card px-3 py-3 font-urbanist text-sm font-medium transition-all ${
                  active
                    ? "bg-primary-gradient text-white shadow-card"
                    : "text-text-muted hover:bg-surface-bg hover:text-text-primary"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-card text-base ${
                    active ? "bg-white/15" : "bg-surface-bg"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Role */}
        <div className="border-t border-text-faint/20 p-4">
          <div className="flex items-center gap-3 rounded-card bg-surface-bg px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-primary text-sm font-semibold text-white">
              S
            </div>
            <div className="min-w-0">
              <p className="truncate font-urbanist text-sm font-semibold text-text-primary">
                Super Admin
              </p>
              <p className="font-manrope text-xs text-text-muted">Signed in</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
