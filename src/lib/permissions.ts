export type Role = "super_admin" | "content_editor" | "moderator" | "support_admin";

export type ModuleKey =
  | "dashboard"
  | "users"
  | "scripture"
  | "devotionals_stories"
  | "prayers"
  | "community_posts"
  | "prayer_requests"
  | "notifications";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  content_editor: "Content Editor",
  moderator: "Content Moderator",
  support_admin: "Support Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/dashboard",
  content_editor: "/dashboard",
  moderator: "/dashboard",
  support_admin: "/dashboard",
};

/** Which sidebar modules each role can see. Super Admin sees everything. */
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  super_admin: [
    "dashboard",
    "users",
    "scripture",
    "devotionals_stories",
    "prayers",
    "community_posts",
    "prayer_requests",
    "notifications",
  ],
  content_editor: [
    "dashboard",
    "scripture",
    "devotionals_stories",
    "prayers",
  ],
  moderator: ["dashboard", "community_posts", "prayer_requests"],
  support_admin: ["dashboard", "users"],
};

export function roleCan(role: Role, module: ModuleKey): boolean {
  return ROLE_MODULES[role]?.includes(module) ?? false;
}
