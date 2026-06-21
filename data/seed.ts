import { User, Room, Booking } from "@/types";

export const DEFAULT_USERS: User[] = [
  { id: "user1", username: "admin", password: "admin123", role: "admin" },
  { id: "u2", username: "pemohon", password: "pemohon123", role: "pemohon" },
];

export const DEFAULT_ROOMS: Room[] = [
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

export const DEFAULT_BOOKINGS: Booking[] = [];

export function seedLocalStorage() {
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem("rooms")) {
    localStorage.setItem("rooms", JSON.stringify(DEFAULT_ROOMS));
  }
  if (!localStorage.getItem("bookings")) {
    localStorage.setItem("bookings", JSON.stringify(DEFAULT_BOOKINGS));
  }
}