"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/lib/auth";
import { getAllBookings } from "@/lib/booking";
import { getItem } from "@/lib/storage";
import { Room, Booking, BookingStatus } from "@/types";

function statusBadge(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    Approved: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-rose-50 text-rose-700",
    Cancelled: "bg-zinc-100 text-zinc-500",
    Pending: "bg-amber-50 text-amber-700",
  };
  return map[status];
}

export default function DashboardPage() {
  const user = useAuthGuard();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    function loadData() {
      setRooms(getItem<Room>("rooms"));
      setBookings(getAllBookings());
    }
    loadData();
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const myBookings = isAdmin
    ? bookings
    : bookings.filter((b) => b.userId === user.id);

  // Stat card berbeda tergantung role: admin lihat data ruangan, pemohon lihat ringkasan peminjamannya sendiri
  const stats = isAdmin
    ? [
        {
          label: "Total Ruangan",
          value: rooms.length,
          tint: "bg-indigo-50 text-indigo-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
          ),
        },
        {
          label: "Ruangan Aktif",
          value: rooms.filter((r) => r.status === "aktif").length,
          tint: "bg-emerald-50 text-emerald-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ),
        },
        {
          label: "Total Peminjaman",
          value: myBookings.length,
          tint: "bg-amber-50 text-amber-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
            </svg>
          ),
        },
        {
          label: "Menunggu Approve",
          value: myBookings.filter((b) => b.status === "Pending").length,
          tint: "bg-rose-50 text-rose-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          ),
        },
      ]
    : [
        {
          label: "Total Peminjaman",
          value: myBookings.length,
          tint: "bg-indigo-50 text-indigo-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
            </svg>
          ),
        },
        {
          label: "Menunggu",
          value: myBookings.filter((b) => b.status === "Pending").length,
          tint: "bg-amber-50 text-amber-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          ),
        },
        {
          label: "Disetujui",
          value: myBookings.filter((b) => b.status === "Approved").length,
          tint: "bg-emerald-50 text-emerald-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ),
        },
        {
          label: "Ditolak",
          value: myBookings.filter((b) => b.status === "Rejected").length,
          tint: "bg-rose-50 text-rose-600",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ),
        },
      ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 bg-bg">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
            <p className="text-sm text-muted mt-1">
              Selamat datang kembali, <span className="font-medium text-ink">{user.username}</span>
            </p>
          </div>
          {!isAdmin && (
            <Link
              href="/bookings"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajukan Peminjaman
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-line p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.tint}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-ink font-display">{s.value}</p>
              <p className="text-sm text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-semibold text-ink">
              {isAdmin ? "Peminjaman Terbaru" : "Peminjaman Saya Terbaru"}
            </h2>
            {!isAdmin && myBookings.length > 0 && (
              <Link href="/history" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Lihat semua riwayat &rarr;
              </Link>
            )}
          </div>

          {myBookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-bg items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
              </div>
              <p className="text-sm text-muted mb-4">Belum ada data peminjaman.</p>
              {!isAdmin && (
                <Link
                  href="/bookings"
                  className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Ajukan peminjaman pertama kamu &rarr;
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide">Ruangan</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Jam</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.slice(-5).reverse().map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  return (
                    <tr key={b.id} className="border-b border-line last:border-0 hover:bg-bg/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-ink">{room?.nama ?? b.roomId}</td>
                      <td className="py-3.5 text-muted">{b.tanggal}</td>
                      <td className="py-3.5 text-muted">{b.jamMulai}&ndash;{b.jamSelesai}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}