"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/lib/auth";
import { getItem, setItem } from "@/lib/storage";
import { validateRoomCreate, validateRoomEdit, RoomFormData } from "@/lib/validation";
import { Room } from "@/types";

const EMPTY_FORM: RoomFormData = {
  kode: "",
  nama: "",
  kapasitas: "",
  fasilitas: "",
  status: "aktif",
};

export default function RoomPage() {
  const user = useAuthGuard();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<RoomFormData>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null); // ⬅️ baru

  useEffect(() => {
    function loadData() {
      setRooms(getItem<Room>("rooms"));
    }
    loadData();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
    setSuccess("");
  }

  if (!user) return null;

  function handleSubmit() {
    setError("");
    setSuccess("");

    const existing = getItem<Room>("rooms");
    const validationError = editId
      ? validateRoomEdit(form, existing, editId)
      : validateRoomCreate(form, existing);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (editId) {
      const updated = existing.map((r) =>
        r.id === editId
          ? { ...r, kode: form.kode, nama: form.nama, fasilitas: form.fasilitas, status: form.status }
          : r
      );
      setItem("rooms", updated);
      setSuccess("Ruangan berhasil diperbarui!");
    } else {
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        kode: form.kode,
        nama: form.nama,
        kapasitas: Number(form.kapasitas),
        fasilitas: form.fasilitas,
        status: form.status,
      };
      setItem("rooms", [...existing, newRoom]);
      setSuccess("Ruangan berhasil ditambahkan!");
    }

    setRooms(getItem<Room>("rooms"));
    resetForm();
  }

  function handleEdit(room: Room) {
    setEditId(room.id);
    setForm({
      kode: room.kode,
      nama: room.nama,
      kapasitas: String(room.kapasitas),
      fasilitas: room.fasilitas,
      status: room.status,
    });
    setError("");
    setSuccess("");
  }

  // ⬅️ baru: buka modal, bukan langsung hapus
  function requestDelete(room: Room) {
    setDeleteTarget(room);
  }

  // ⬅️ baru: eksekusi hapus setelah dikonfirmasi
  function confirmDelete() {
    if (!deleteTarget) return;
    const updated = getItem<Room>("rooms").filter((r) => r.id !== deleteTarget.id);
    setItem("rooms", updated);
    setRooms(updated);
    setSuccess(`Ruangan "${deleteTarget.nama}" berhasil dihapus.`);
    setDeleteTarget(null);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10 bg-bg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Manajemen Ruangan</h1>
          <p className="text-sm text-muted mt-1">Kelola data ruangan dan laboratorium</p>
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-ink mb-5">{editId ? "Edit Ruangan" : "Tambah Ruangan Baru"}</h2>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3.5 py-2.5 mb-4">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3.5 py-2.5 mb-4">{success}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Kode Ruangan</label>
              <input
                type="text"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                value={form.kode}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Nama Ruangan</label>
              <input
                type="text"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Kapasitas</label>
              <input
                type="number"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                value={form.kapasitas}
                onChange={(e) => setForm({ ...form, kapasitas: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Status</label>
              <select
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-white"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "aktif" | "nonaktif" })}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted mb-1.5">Fasilitas</label>
              <input
                type="text"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                placeholder="Contoh: AC, Proyektor, Whiteboard"
                value={form.fasilitas}
                onChange={(e) => setForm({ ...form, fasilitas: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {editId ? "Simpan Perubahan" : "Tambah Ruangan"}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-ink">Daftar Ruangan</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted">Belum ada ruangan.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide">Kode</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Nama</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Kapasitas</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Fasilitas</th>
                  <th className="py-3 font-medium text-muted text-xs uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 font-medium text-muted text-xs uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg/60 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{r.kode}</td>
                    <td className="py-3.5 font-medium text-ink">{r.nama}</td>
                    <td className="py-3.5 text-muted">{r.kapasitas} orang</td>
                    <td className="py-3.5 text-muted">{r.fasilitas}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status === "aktif" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(r)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-600"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ⬇️ Modal konfirmasi hapus — baru */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-ink mb-1.5">Hapus ruangan ini?</h3>
              <p className="text-sm text-muted mb-6">
                Ruangan <span className="font-medium text-ink">&ldquo;{deleteTarget.nama}&rdquo;</span> ({deleteTarget.kode}) akan dihapus permanen dan tidak bisa dikembalikan.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}