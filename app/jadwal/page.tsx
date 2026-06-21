"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/lib/auth";
import { getAllBookings } from "@/lib/booking";
import { getItem } from "@/lib/storage";
import { Room, Booking } from "@/types";
import { OPERATIONAL_START, OPERATIONAL_END } from "@/lib/validation";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function JadwalPage() {
  const user = useAuthGuard();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

 useEffect(() => {
  const loadData = () => {
    setRooms(getItem<Room>("rooms"));
    setBookings(getAllBookings());
  };
  loadData();
}, []);

  if (!user) return null;

  const today = todayISO();
  const isPastDate = selectedDate < today;
  const isToday = selectedDate === today;

  const nowMinutes = (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();

  const opStart = toMinutes(OPERATIONAL_START);
  const opEnd = toMinutes(OPERATIONAL_END);
  const totalMinutes = opEnd - opStart;

  // 🐛 Catatan: OPERATIONAL_END di sini ikut nilai dari lib/validation.ts (Bug #11),
  // jadi tampilan timeline akan merefleksikan jam operasional versi "buggy" juga —
  // konsisten dengan perilaku validasi booking yang sebenarnya.

  const roomsToShow = rooms.filter(
    (r) => r.status === "aktif" && (selectedRoom === "all" || r.id === selectedRoom)
  );

  function getApprovedBookings(roomId: string) {
    return bookings
      .filter((b) => b.roomId === roomId && b.tanggal === selectedDate && b.status === "Approved")
      .sort((a, b) => toMinutes(a.jamMulai) - toMinutes(b.jamMulai));
  }

  // Lebar overlay "sudah lewat": penuh kalau tanggal di masa lalu, proporsional kalau hari ini, 0 kalau masa depan
  const pastOverlayWidth = isPastDate
    ? 100
    : isToday
    ? Math.max(0, Math.min(100, ((nowMinutes - opStart) / totalMinutes) * 100))
    : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 bg-bg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Jadwal & Ketersediaan Ruangan</h1>
          <p className="text-sm text-muted mt-1">Cek slot yang sudah terisi sebelum mengajukan peminjaman</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-line shadow-sm p-5 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1.5">Ruangan</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            >
              <option value="all">Semua Ruangan</option>
              {rooms.filter((r) => r.status === "aktif").map((r) => (
                <option key={r.id} value={r.id}>{r.kode} — {r.nama}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1.5">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-5 mb-6 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Terisi (disetujui)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-300" /> Sudah lewat</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-bg border border-line" /> Tersedia</span>
        </div>

        {roomsToShow.length === 0 ? (
          <div className="bg-white rounded-2xl border border-line shadow-sm px-6 py-14 text-center">
            <p className="text-sm text-muted">Tidak ada ruangan aktif untuk ditampilkan.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {roomsToShow.map((room) => {
              const approved = getApprovedBookings(room.id);
              return (
                <div key={room.id} className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-line flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-ink">{room.nama}</h2>
                      <p className="text-xs text-muted">{room.kode} &middot; Kapasitas {room.kapasitas} orang</p>
                    </div>
                    <span className="text-xs font-medium text-muted">{approved.length} slot terisi</span>
                  </div>

                  {/* Timeline visual */}
                  <div className="px-6 pt-5">
                    <div className="relative h-9 bg-bg rounded-lg overflow-hidden border border-line">
                      {pastOverlayWidth > 0 && (
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-zinc-200"
                          style={{ width: `${pastOverlayWidth}%` }}
                        />
                      )}
                      {approved.map((b) => {
                        const bMulai = Math.max(toMinutes(b.jamMulai), opStart);
                        const bSelesai = Math.min(toMinutes(b.jamSelesai), opEnd);
                        const left = ((bMulai - opStart) / totalMinutes) * 100;
                        const width = ((bSelesai - bMulai) / totalMinutes) * 100;
                        return (
                          <div
                            key={b.id}
                            title={`${b.jamMulai}–${b.jamSelesai}: ${b.keperluan}`}
                            className="absolute top-0 bottom-0 bg-indigo-500"
                            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted mt-1.5 mb-5">
                      <span>{OPERATIONAL_START}</span>
                      <span>{OPERATIONAL_END}</span>
                    </div>
                  </div>

                  {/* List slot terisi */}
                  <div className="px-6 pb-5">
                    {approved.length === 0 ? (
                      <p className="text-sm text-muted">
                        {isPastDate
                          ? "Tanggal ini sudah lewat, tidak ada data jadwal yang relevan."
                          : "Belum ada jadwal terisi — ruangan sepenuhnya tersedia pada tanggal ini."}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {approved.map((b) => {
                          const sudahLewat = isPastDate || (isToday && toMinutes(b.jamSelesai) <= nowMinutes);
                          return (
                            <li key={b.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${sudahLewat ? "bg-zinc-300" : "bg-indigo-500"}`} />
                                <span className="font-medium text-ink">{b.jamMulai}&ndash;{b.jamSelesai}</span>
                                <span className="text-muted">{b.keperluan}</span>
                              </div>
                              {sudahLewat && <span className="text-xs text-muted">Selesai</span>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}