"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/lib/auth";
import { getItem } from "@/lib/storage";
import { validateBooking } from "@/lib/validation";
import {
  getAllBookings,
  createBooking,
  changeBookingStatus,
} from "@/lib/booking";
import { Room, Booking, BookingStatus } from "@/types";

const EMPTY_FORM = {
  roomId: "",
  tanggal: "",
  jamMulai: "",
  jamSelesai: "",
  keperluan: "",
  jumlahPeserta: 1,
};

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

export default function BookingsPage() {
  const user = useAuthGuard();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [catatanModal, setCatatanModal] = useState("");
  const [actionTarget, setActionTarget] = useState<{ id: string; action: BookingStatus; roomName: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");

  useEffect(() => {
    function loadData() {
      setRooms(getItem<Room>("rooms"));
      setBookings(getAllBookings());
    }
    loadData();
  }, []);

  function reload() {
    setRooms(getItem<Room>("rooms"));
    setBookings(getAllBookings());
  }

  if (!user) return null;

  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]));

  const baseBookings = user.role === "admin"
    ? bookings
    : bookings.filter((b) => b.userId === user.id);

  const myBookings = baseBookings.filter((b) => {
    const room = roomMap[b.roomId];
    const matchSearch =
      searchQuery === "" ||
      room?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room?.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.keperluan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = [
    { label: "Pending", count: baseBookings.filter((b) => b.status === "Pending").length, tint: "bg-amber-50 text-amber-600" },
    { label: "Approved", count: baseBookings.filter((b) => b.status === "Approved").length, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Rejected", count: baseBookings.filter((b) => b.status === "Rejected").length, tint: "bg-rose-50 text-rose-600" },
    { label: "Cancelled", count: baseBookings.filter((b) => b.status === "Cancelled").length, tint: "bg-zinc-100 text-zinc-500" },
  ];

  function handleSubmit() {
    setError("");
    setSuccess("");

    const err = validateBooking({ ...form }, rooms, bookings);
    if (err) { setError(err); return; }

    createBooking({
      userId: user!.id,
      roomId: form.roomId,
      tanggal: form.tanggal,
      jamMulai: form.jamMulai,
      jamSelesai: form.jamSelesai,
      keperluan: form.keperluan,
    });

    setForm(EMPTY_FORM);
    setSuccess("Peminjaman berhasil diajukan, menunggu persetujuan.");
    setShowForm(false);
    reload();
  }

  function openAction(id: string, action: BookingStatus, roomName: string) {
    setActionTarget({ id, action, roomName });
    setCatatanModal("");
  }

  function confirmAction() {
    if (!actionTarget) return;
    const result = changeBookingStatus(
      actionTarget.id,
      actionTarget.action,
      catatanModal || undefined
    );
    if (result.ok) { setSuccess(result.message); }
    else { setError(result.message); }
    setActionTarget(null);
    reload();
  }

  function confirmCancel() {
    if (!cancelTarget) return;
    const result = changeBookingStatus(cancelTarget.id, "Cancelled");
    if (result.ok) { setSuccess("Peminjaman dibatalkan."); }
    else { setError(result.message); }
    setCancelTarget(null);
    reload();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 bg-bg">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Peminjaman Ruang/Lab</h1>
            <p className="text-sm text-muted mt-1">
              {user.role === "admin" ? "Kelola seluruh pengajuan peminjaman" : "Ajukan dan pantau peminjaman kamu"}
            </p>
          </div>
          {user.role === "pemohon" && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {showForm ? "Tutup Form" : "Ajukan Peminjaman"}
            </button>
          )}
        </div>

        {/* Ringkasan status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summary.map((s) => (
            <div
              key={s.label}
              onClick={() => setFilterStatus(filterStatus === s.label as BookingStatus ? "all" : s.label as BookingStatus)}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 cursor-pointer transition-all ${
                filterStatus === s.label ? "border-indigo-400 ring-2 ring-indigo-100" : "border-line hover:border-zinc-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-sm ${s.tint}`}>
                {s.count}
              </div>
              <p className="text-sm font-medium text-ink">{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3.5 py-2.5 mb-5">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3.5 py-2.5 mb-5">{success}</p>
        )}

        {user.role === "pemohon" && showForm && (
          <div className="bg-white rounded-2xl border border-line shadow-sm p-6 mb-8">
            <h2 className="font-semibold text-ink mb-5">Ajukan Peminjaman</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted mb-1.5">Ruangan</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} &mdash; {r.nama} (kap. {r.kapasitas}, {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Jumlah Peserta</label>
                <input
                  type="number"
                  min={1}
                  value={form.jumlahPeserta}
                  onChange={(e) => setForm({ ...form, jumlahPeserta: Number(e.target.value) })}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Jam Mulai</label>
                <input
                  type="time"
                  value={form.jamMulai}
                  onChange={(e) => setForm({ ...form, jamMulai: e.target.value })}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Jam Selesai</label>
                <input
                  type="time"
                  value={form.jamSelesai}
                  onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted mb-1.5">Keperluan</label>
                <textarea
                  value={form.keperluan}
                  onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
                  rows={2}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
                  placeholder="Praktikum Basis Data, dst."
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Ajukan Peminjaman
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          {/* Header + Search/Filter */}
          <div className="px-6 py-4 border-b border-line flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="font-semibold text-ink flex-1">
              {user.role === "admin" ? "Semua Peminjaman" : "Peminjaman Saya"}
              {(searchQuery || filterStatus !== "all") && (
                <span className="ml-2 text-xs font-normal text-muted">
                  {myBookings.length} hasil ditemukan
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari ruangan / keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow w-52"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as BookingStatus | "all")}
                className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option value="all">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {(searchQuery || filterStatus !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                  className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 border border-line rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {myBookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-bg items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                {searchQuery || filterStatus !== "all"
                  ? "Tidak ada peminjaman yang cocok dengan filter."
                  : "Belum ada data peminjaman."}
              </p>
              {(searchQuery || filterStatus !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Hapus filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  {user.role === "admin" && (
                    <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide">Pemohon</th>
                  )}
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Ruangan</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Tanggal</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Jam</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Keperluan</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.slice().reverse().map((b) => {
                  const room = roomMap[b.roomId];
                  return (
                    <tr key={b.id} className="border-b border-line last:border-0 hover:bg-bg/60 transition-colors">
                      {user.role === "admin" && (
                        <td className="px-6 py-3.5 text-xs text-muted">{b.userId}</td>
                      )}
                      <td className="py-3.5 font-medium text-ink">{room?.nama ?? b.roomId}</td>
                      <td className="py-3.5 text-muted">{b.tanggal}</td>
                      <td className="py-3.5 text-muted">{b.jamMulai}&ndash;{b.jamSelesai}</td>
                      <td className="py-3.5 text-muted max-w-45 truncate">{b.keperluan}</td>
                      <td className="py-3.5">
                        <StatusBadge status={b.status} />
                        {b.catatanAdmin && (
                          <p className="text-xs text-muted mt-1 max-w-40 truncate">&ldquo;{b.catatanAdmin}&rdquo;</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {user.role === "admin" && b.status === "Pending" && (
                          <>
                            <button
                              onClick={() => openAction(b.id, "Approved", room?.nama ?? b.roomId)}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openAction(b.id, "Rejected", room?.nama ?? b.roomId)}
                              className="text-xs font-medium text-rose-500 hover:text-rose-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.role === "admin" && b.status === "Approved" && (
                          <button
                            onClick={() => openAction(b.id, "Rejected", room?.nama ?? b.roomId)}
                            className="text-xs font-medium text-rose-500 hover:text-rose-600"
                          >
                            Reject
                          </button>
                        )}
                        {user.role === "pemohon" && b.status === "Pending" && (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal konfirmasi approve/reject — admin */}
        {actionTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
                actionTarget.action === "Approved" ? "bg-emerald-50" : "bg-rose-50"
              }`}>
                {actionTarget.action === "Approved" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="font-semibold text-ink mb-1.5">
                {actionTarget.action === "Approved" ? "Setujui peminjaman ini?" : "Tolak peminjaman ini?"}
              </h3>
              <p className="text-sm text-muted mb-4">
                Peminjaman ruangan <span className="font-medium text-ink">&ldquo;{actionTarget.roomName}&rdquo;</span> akan ditandai sebagai <span className="font-medium text-ink">{actionTarget.action}</span>.
              </p>

              <label className="block text-xs font-medium text-muted mb-1.5">Catatan (opsional)</label>
              <textarea
                value={catatanModal}
                onChange={(e) => setCatatanModal(e.target.value)}
                rows={3}
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
                placeholder="Alasan approve/reject..."
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setActionTarget(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 text-white py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    actionTarget.action === "Approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionTarget.action === "Approved" ? "Setujui" : "Tolak"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal konfirmasi batalkan — pemohon */}
        {cancelTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <div className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-ink mb-1.5">Batalkan peminjaman ini?</h3>
              <p className="text-sm text-muted mb-6">
                Peminjaman ruangan <span className="font-medium text-ink">&ldquo;{roomMap[cancelTarget.roomId]?.nama ?? cancelTarget.roomId}&rdquo;</span> pada {cancelTarget.tanggal} akan dibatalkan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Tidak
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}