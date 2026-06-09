import type { AdminRole } from "@/types/database";

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "support_admin",
  "auth_inspector",
  "finance_admin",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  auth_inspector: "Authentication Inspector",
  finance_admin: "Finance Admin",
};

type Permission =
  | "users:read"
  | "users:write"
  | "listings:read"
  | "listings:write"
  | "leads:read"
  | "leads:write"
  | "dealers:read"
  | "dealers:write"
  | "auth:read"
  | "auth:write"
  | "transactions:read"
  | "transactions:write"
  | "revenue:read"
  | "support:read"
  | "support:write"
  | "campaigns:read"
  | "campaigns:write"
  | "stories:read"
  | "stories:write"
  | "push:read"
  | "push:write"
  | "social:read"
  | "social:write"
  | "analytics:read"
  | "settings:read"
  | "settings:write"
  | "audit:read";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "users:read", "users:write",
    "listings:read", "listings:write",
    "leads:read", "leads:write",
    "dealers:read", "dealers:write",
    "auth:read", "auth:write",
    "transactions:read", "transactions:write",
    "revenue:read",
    "support:read", "support:write",
    "campaigns:read", "campaigns:write",
    "stories:read", "stories:write",
    "push:read", "push:write",
    "social:read", "social:write",
    "analytics:read",
    "settings:read", "settings:write",
    "audit:read",
  ],
  support_admin: [
    "users:read", "users:write",
    "listings:read",
    "leads:read", "leads:write",
    "dealers:read", "dealers:write",
    "support:read", "support:write",
    "campaigns:read", "campaigns:write",
    "stories:read", "stories:write",
    "push:read", "push:write",
    "social:read", "social:write",
    "analytics:read",
  ],
  auth_inspector: [
    "users:read",
    "listings:read", "listings:write",
    "auth:read", "auth:write",
    "analytics:read",
  ],
  finance_admin: [
    "users:read",
    "transactions:read", "transactions:write",
    "revenue:read",
    "analytics:read",
    "audit:read",
  ],
};

export function hasPermission(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function canAccessRoute(role: AdminRole | null | undefined, route: string): boolean {
  const routePermissions: Record<string, Permission> = {
    "/": "analytics:read",
    "/users": "users:read",
    "/listings": "listings:read",
    "/leads": "leads:read",
    "/dealers": "dealers:read",
    "/campaigns": "campaigns:read",
    "/stories": "stories:read",
    "/push-notifications": "push:read",
    "/social-media": "social:read",
    "/authentication": "auth:read",
    "/transactions": "transactions:read",
    "/revenue": "revenue:read",
    "/support": "support:read",
    "/notifications": "analytics:read",
    "/analytics": "analytics:read",
    "/audit-logs": "audit:read",
    "/settings": "settings:read",
  };

  const permission = routePermissions[route];
  if (!permission) return true;
  return hasPermission(role, permission);
}
