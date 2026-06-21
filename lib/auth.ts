"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getItem, setItem, removeItem } from "@/lib/storage";
import { User } from "@/types";

export function login(username: string, password: string): User | null {
  const users = getItem<User>("users");
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return null;
  setItem<User>("currentUser", [user]);
  return user;
}

export function loginUser(user: User) {
  setItem<User>("currentUser", [user]);
}

export function logoutUser() {
  removeItem("currentUser");
}

export function getCurrentUser(): User | null {
  const users = getItem<User>("users");
  const current = getItem<User>("currentUser")[0] ?? null;
  if (!current) return null;
  return users.find((u) => u.id === current.id) ?? null;
}

export function useAuthGuard(allowedRoles?: string[]): User | null {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    function loadUser() {
      const current = getCurrentUser();
      if (!current) { router.push("/login"); return; }
      if (allowedRoles && !allowedRoles.includes(current.role)) {
        router.push("/dashboard"); return;
      }
      setUser(current);
    }
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return user;
}