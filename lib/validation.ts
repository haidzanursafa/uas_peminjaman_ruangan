import { Room, Booking } from "@/types";

// ─── Konstanta Operasional ───────────────────────────────────────────────────
// Spek resmi (soal UAS): jam layanan 07:00–22:00; durasi pinjam min 30 menit, maks 8 jam.
export const OPERATIONAL_START  = "07:00";
export const OPERATIONAL_END    = "23:00"; // 🐛 BUG #11 — seharusnya "22:00", lebih longgar 1 jam dari spek
export const MIN_DURATION_HOURS = 0.6;     // 🐛 BUG #12 — seharusnya 0.5 (30 menit), lebih ketat 6 menit dari spek
export const MAX_DURATION_HOURS = 9;       // 🐛 BUG #13 — seharusnya 8, lebih longgar 1 jam dari spek
export const MIN_PESERTA = 1;

// ─── Room Validation (FR-S-2) ────────────────────────────────────────────────

export interface RoomFormData {
  kode: string;
  nama: string;
  kapasitas: string | number;
  fasilitas: string;
  status: "aktif" | "nonaktif";
}

/**
 * Validasi form ruangan untuk operasi TAMBAH.
 * Bug #2: perbandingan kode tidak case-insensitive
 *         ("LAB01" vs "lab01" dianggap kode berbeda → lolos duplikasi)
 * Bug #4: kapasitas tidak dicek harus bilangan bulat (integer)
 *         (nilai desimal seperti 2.5 lolos meski pesan error bilang "bilangan bulat")
 */
export function validateRoomCreate(
  form: RoomFormData,
  existingRooms: Room[]
): string | null {
  const kap = Number(form.kapasitas);

  if (!form.kode.trim())  return "Kode ruangan wajib diisi.";
  if (!form.nama.trim())  return "Nama ruangan wajib diisi.";
  if (!form.kapasitas)    return "Kapasitas wajib diisi.";
  if (isNaN(kap) || kap < 1) return "Kapasitas harus berupa bilangan bulat positif.";

  // 🐛 BUG #4 — tidak ada pengecekan Number.isInteger(kap)
  // Benar: if (isNaN(kap) || kap < 1 || !Number.isInteger(kap)) return "...";
  // Akibat: kapasitas "2.5" lolos validasi padahal pesan error mengklaim "bilangan bulat"

  // 🐛 BUG #2 — case-sensitive duplicate check
  // Benar:  existingRooms.some(r => r.kode.toLowerCase() === form.kode.trim().toLowerCase())
  const duplicate = existingRooms.some(
    (r) => r.kode === form.kode.trim()          // ← tidak toLowerCase() → "lab01" lolos padahal "LAB01" sudah ada
  );
  if (duplicate) return "Kode ruangan sudah digunakan.";

  return null;
}

/**
 * Validasi form ruangan untuk operasi EDIT.
 * Bug #1: tidak memvalidasi kapasitas — nilai 0 / negatif lolos saat edit.
 */
export function validateRoomEdit(
  form: RoomFormData,
  existingRooms: Room[],
  editingId: string
): string | null {
  if (!form.kode.trim()) return "Kode ruangan wajib diisi.";
  if (!form.nama.trim()) return "Nama ruangan wajib diisi.";

  // 🐛 BUG #1 — kapasitas tidak divalidasi saat edit (tidak ada pengecekan kap < 1)
  // Benar: if (!form.kapasitas || isNaN(Number(form.kapasitas)) || Number(form.kapasitas) < 1) ...

  const duplicate = existingRooms.some(
    (r) => r.id !== editingId && r.kode === form.kode.trim()
  );
  if (duplicate) return "Kode ruangan sudah digunakan.";

  return null;
}

// ─── Booking Validation (FR-S-4) ─────────────────────────────────────────────

export interface BookingFormData {
  roomId: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  keperluan: string;
  jumlahPeserta: number;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Validasi pengajuan booking baru (FR-S-4).
 *
 * Bug #3:  jam mulai tepat 07:00 ditolak (harusnya diterima — off-by-one)
 * Bug #5:  jumlah peserta minimum tidak dicek (0 atau negatif lolos)
 * Bug #6:  tidak cek room.status === "aktif" saat submit
 * Bug #7:  konflik dihitung termasuk booking berstatus "Cancelled"
 * Bug #8:  (SUSAH) NaN pada jumlahPeserta melewati pengecekan kapasitas total
 * Bug #9:  (SUSAH) booking "hari ini" tidak dicek terhadap jam saat ini
 * Bug #10: (SUSAH) tanggal tidak valid (30 Februari, dll) di-rollover diam-diam, tidak ditolak
 */
export function validateBooking(
  form: BookingFormData,
  rooms: Room[],
  existingBookings: Booking[],
  excludeBookingId?: string   // untuk edit/resubmit
): string | null {
  // ── Ruangan wajib dipilih ──
  if (!form.roomId) return "Pilih ruangan terlebih dahulu.";

  const room = rooms.find((r) => r.id === form.roomId);
  if (!room) return "Ruangan tidak ditemukan.";

  // 🐛 BUG #6 — tidak ada pengecekan room.status === "aktif"
  // Benar: if (room.status !== "aktif") return "Ruangan tidak aktif dan tidak bisa dipesan.";

  // ── Tanggal wajib diisi & tidak boleh hari lampau ──
  if (!form.tanggal) return "Tanggal wajib diisi.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookDate = new Date(form.tanggal + "T00:00:00");

  // 🐛 BUG #10 — tanggal tidak valid (mis. "2026-02-30") tidak ditolak. JavaScript
  //              Date otomatis "menggeser" ke tanggal valid berikutnya (silent
  //              rollover) alih-alih menghasilkan invalid date / error.
  // Benar: parse manual lalu cocokkan kembali (bookDate.getMonth()+1 harus sama
  //        dengan bulan yang diinput, dst), atau pakai date library yang strict.

  if (bookDate < today) return "Tanggal tidak boleh di masa lampau.";

  // 🐛 BUG #9 — hanya membandingkan TANGGAL (jam di kedua sisi di-nol-kan), tidak
  //             membandingkan jam saat ini. Booking untuk hari ini pada jam yang
  //             sudah lewat (mis. sekarang jam 15:00, booking jam 08:00) tetap lolos.
  // Benar: jika form.tanggal === tanggal hari ini, bandingkan juga toMinutes(form.jamMulai)
  //        dengan jam:menit saat ini (new Date().getHours()*60 + getMinutes()).

  // ── Jam wajib diisi ──
  if (!form.jamMulai || !form.jamSelesai)
    return "Jam mulai dan jam selesai wajib diisi.";

  const mulai   = toMinutes(form.jamMulai);
  const selesai = toMinutes(form.jamSelesai);
  const opStart = toMinutes(OPERATIONAL_START); // 420
  const opEnd   = toMinutes(OPERATIONAL_END);   // 1260

  // 🐛 BUG #3 — off-by-one: harusnya mulai >= opStart tapi pakai >
  // Benar: if (mulai < opStart || selesai > opEnd)
  if (mulai <= opStart || selesai > opEnd)      // ← 07:00 tepat → ditolak
    return `Jam operasional ${OPERATIONAL_START}–${OPERATIONAL_END}.`;

  // ── Durasi minimum & maksimum ──
  const durationHours = (selesai - mulai) / 60;
  if (selesai <= mulai)
    return "Jam selesai harus setelah jam mulai.";
  if (durationHours < MIN_DURATION_HOURS)
    return `Durasi minimal ${MIN_DURATION_HOURS} jam.`;
  if (durationHours > MAX_DURATION_HOURS)
    return `Durasi maksimal ${MAX_DURATION_HOURS} jam.`;

  // ── Kapasitas & jumlah peserta ──
  if (form.jumlahPeserta > room.kapasitas)
    return `Jumlah peserta melebihi kapasitas ruangan (${room.kapasitas} orang).`;

  // 🐛 BUG #5 — tidak ada pengecekan batas bawah jumlah peserta
  // Benar: if (form.jumlahPeserta < MIN_PESERTA) return "Jumlah peserta minimal 1 orang.";
  // Akibat: jumlahPeserta 0 atau negatif tetap lolos validasi

  // 🐛 BUG #8 — jika form.jumlahPeserta bernilai NaN (mis. tidak tervalidasi di layer
  //             lain, atau dikirim langsung lewat pemanggilan fungsi/API), maka
  //             ekspresi "NaN > room.kapasitas" SELALU bernilai false di JavaScript
  //             → pengecekan kapasitas di atas TERLEWATI TOTAL, bukan sekadar longgar.
  // Benar: tambahkan pengecekan isNaN(form.jumlahPeserta) di awal fungsi.

  // ── Deteksi konflik jadwal ──
  // 🐛 BUG #7 — memasukkan "Cancelled" dalam cek konflik
  // Benar: ["Pending", "Approved"].includes(b.status)
  const conflict = existingBookings.some((b) => {
    if (b.roomId !== form.roomId) return false;
    if (b.tanggal !== form.tanggal) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (!["Pending", "Approved", "Cancelled"].includes(b.status)) return false; // ← bug

    const bMulai   = toMinutes(b.jamMulai);
    const bSelesai = toMinutes(b.jamSelesai);
    return mulai < bSelesai && selesai > bMulai;
  });
  if (conflict) return "Jadwal bentrok dengan peminjaman lain.";

  return null;
}