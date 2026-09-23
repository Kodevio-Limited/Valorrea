import type { User } from "@/types";
import { mockUsers } from "@/lib/mock/users";

/** Simulated network latency so UI code is already async-ready. */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---- Queries ----

export interface UserListParams {
  search?: string;
  app_type?: User["app_type"];
  status?: User["status"];
  age_group?: User["age_group"];
  verified?: "yes" | "no";
}

export function getUsers(params: UserListParams = {}): Promise<User[]> {
  const { search, app_type, status, age_group, verified } = params;
  return delay(
    mockUsers.filter((u) => {
      if (
        search &&
        !`${u.name} ${u.email} ${u.phone ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (app_type && u.app_type !== app_type) return false;
      if (status && u.status !== status) return false;
      if (age_group && u.age_group !== age_group) return false;
      if (verified && (u.email_verified ? "yes" : "no") !== verified) return false;
      return true;
    })
  );
}

export function getUserById(id: string): Promise<User | undefined> {
  return delay(mockUsers.find((u) => u.id === id));
}

// ---- Mutations ----

export function updateUserStatus(
  userIds: string[],
  status: User["status"]
): Promise<User[]> {
  for (const u of mockUsers) {
    if (userIds.includes(u.id)) u.status = status;
  }
  return delay(mockUsers.filter((u) => userIds.includes(u.id)));
}

export function verifyUserEmails(userIds: string[]): Promise<User[]> {
  for (const u of mockUsers) {
    if (userIds.includes(u.id)) u.email_verified = true;
  }
  return delay(mockUsers.filter((u) => userIds.includes(u.id)));
}

export function deleteUser(userIds: string[]): Promise<{ deleted: number }> {
  let deleted = 0;
  for (let i = mockUsers.length - 1; i >= 0; i--) {
    if (userIds.includes(mockUsers[i].id)) {
      mockUsers.splice(i, 1);
      deleted++;
    }
  }
  return delay({ deleted });
}

export function resetUserPassword(
  userId: string
): Promise<{ tempPassword: string }> {
  const temp = `FTH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return delay({ tempPassword: temp });
}
