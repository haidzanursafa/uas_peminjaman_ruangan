import { User, Room } from "@/types";

export function getItem<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

export function setItem<T>(key: string, value: T | T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

const DEFAULT_USERS: User[] = [
  { id: "user1", username: "admin", password: "admin123", role: "admin" },
  { id: "u2", username: "pemohon", password: "pemohon123", role: "pemohon" },
];

const DEFAULT_ROOMS: Room[] = [
  {
    id: "r1",
    kode: "LAB01",
    nama: "Lab Komputer 1",
    kapasitas: 30,
    fasilitas: "PC, Proyektor, AC",
    status: "aktif",
  },
  {
    id: "r2",
    kode: "RK02",
    nama: "Ruang Kelas 2",
    kapasitas: 40,
    fasilitas: "Kursi, Whiteboard, AC",
    status: "aktif",
  },
  {
    id: "r3",
    kode: "LAB03",
    nama: "Lab Jaringan",
    kapasitas: 20,
    fasilitas: "PC, Switch, Kabel UTP",
    status: "nonaktif",
  },
];

export function seedLocalStorage() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem("rooms")) {
    localStorage.setItem("rooms", JSON.stringify(DEFAULT_ROOMS));
  }
  if (!localStorage.getItem("bookings")) {
    localStorage.setItem("bookings", JSON.stringify([]));
  }
}