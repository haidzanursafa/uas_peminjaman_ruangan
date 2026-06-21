import { Booking, BookingStatus } from "@/types";
import { getItem, setItem } from "@/lib/storage";

const KEY = "bookings";

// ─── State-machine transition whitelist (FR-S-5) ─────────────────────────────
//
// 🐛 BUG #4 — "Approved" boleh pindah ke "Rejected"
//    Benar: Approved: ["Cancelled"]
//    Sekarang: Approved: ["Cancelled", "Rejected"]  ← pelanggaran FR-S-5
//
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  Pending:   ["Approved", "Rejected", "Cancelled"],
  Approved:  ["Cancelled", "Rejected"],   // ← Bug #4: "Rejected" seharusnya tidak ada
  Rejected:  [],
  Cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllBookings(): Booking[] {
  return getItem<Booking>(KEY);
}

export function getBookingsByUser(userId: string): Booking[] {
  return getAllBookings().filter((b) => b.userId === userId);
}

export function createBooking(
  data: Omit<Booking, "id" | "status" | "createdAt">
): Booking {
  const bookings = getAllBookings();
  const newBooking: Booking = {
    ...data,
    id: `bk-${Date.now()}`,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  setItem(KEY, [...bookings, newBooking]);
  return newBooking;
}

export function changeBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  catatanAdmin?: string
): { ok: boolean; message: string } {
  const bookings = getAllBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return { ok: false, message: "Booking tidak ditemukan." };

  const current = bookings[idx];
  if (!canTransition(current.status, newStatus)) {
    return {
      ok: false,
      message: `Status tidak bisa diubah dari ${current.status} ke ${newStatus}.`,
    };
  }

  bookings[idx] = {
    ...current,
    status: newStatus,
    catatanAdmin: catatanAdmin ?? current.catatanAdmin,
  };
  setItem(KEY, bookings);
  return { ok: true, message: "Status berhasil diperbarui." };
}

export function cancelBooking(bookingId: string): { ok: boolean; message: string } {
  return changeBookingStatus(bookingId, "Cancelled");
}