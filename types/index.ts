export type Role = "admin" | "pemohon";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
}

export interface Room {
  id: string;
  kode: string;
  nama: string;
  kapasitas: number;
  fasilitas: string;
  status: "aktif" | "nonaktif";
}

export type BookingStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  keperluan: string;
  status: BookingStatus;
  catatanAdmin?: string;
  createdAt: string;
}