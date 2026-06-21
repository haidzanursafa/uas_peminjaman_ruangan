"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/lib/auth";
import { getAllBookings } from "@/lib/booking";
import { getItem } from "@/lib/storage";
import { Room, Booking, BookingStatus } from "@/types";

const STATUS_STYLE: Record<BookingStatus, { badge: string; dot: string }> = {
  Approved: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Rejected: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  Cancelled: { badge: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
  Pending: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

type FilterOption = "Semua" | "Approved" | "Rejected" | "Cancelled";

export default function HistoryPage() {
  const user = useAuthGuard();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterOption>("Semua");

  useEffect(() => {
    function loadData() {
      setRooms(getItem<Room>("rooms"));
      setBookings(getAllBookings());
    }
    loadData();
  }, []);

  if (!user) return null;

  const history = user.role === "admin"
    ? bookings
    : bookings.filter((b) => b.userId === user.id);

  const doneBookings = history.filter(
    (b) => b.status === "Approved" || b.status === "Rejected" || b.status === "Cancelled"
  );

  const filtered = filter === "Semua"
    ? doneBookings
    : doneBookings.filter((b) => b.status === filter);

  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]));

  const filterOptions: FilterOption[] = ["Semua", "Approved", "Rejected", "Cancelled"];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 bg-bg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Riwayat Peminjaman</h1>
          <p className="text-sm text-muted mt-1">
            {user.role === "admin" ? "Histori seluruh peminjaman yang sudah selesai diproses" : "Histori peminjaman kamu yang sudah selesai diproses"}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-6 bg-white border border-line rounded-xl p-1.5 w-fit shadow-sm">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === opt
                  ? "bg-indigo-600 text-white"
                  : "text-muted hover:text-ink hover:bg-bg"
              }`}
            >
              {opt}
              {opt !== "Semua" && (
                <span className={`ml-1.5 text-xs ${filter === opt ? "text-white/70" : "text-muted/70"}`}>
                  {doneBookings.filter((b) => b.status === opt).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-bg items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 3" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                {filter === "Semua" ? "Belum ada riwayat peminjaman." : `Tidak ada riwayat dengan status "${filter}".`}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide">Ruangan</th>
                  {user.role === "admin" && (
                    <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Peminjam</th>
                  )}
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Jam</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Keperluan</th>
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice().reverse().map((b) => {
                  const room = roomMap[b.roomId];
                  return (
                    <tr key={b.id} className="border-b border-line last:border-0 hover:bg-bg/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-ink">{room?.nama ?? b.roomId}</td>
                      {user.role === "admin" && (
                        <td className="py-3.5 text-xs text-muted">{b.userId}</td>
                      )}
                      <td className="py-3.5 text-muted">{b.tanggal}</td>
                      <td className="py-3.5 text-muted">{b.jamMulai}&ndash;{b.jamSelesai}</td>
                      <td className="py-3.5 text-muted max-w-50 truncate">{b.keperluan}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={b.status} />
                        {b.catatanAdmin && (
                          <p className="text-xs text-muted mt-1 max-w-40 truncate">&ldquo;{b.catatanAdmin}&rdquo;</p>
                        )}
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