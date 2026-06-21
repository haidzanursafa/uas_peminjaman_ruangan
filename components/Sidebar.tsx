"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/auth";
import { useState } from "react";
import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  jadwal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  room: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
    </svg>
  ),
  booking: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 3" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  function handleLogoutConfirm() {
    logoutUser();
    router.replace("/login");
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["admin", "pemohon"] },
    { href: "/jadwal", label: "Jadwal", icon: "jadwal", roles: ["admin", "pemohon"] },
    { href: "/room", label: "Ruangan", icon: "room", roles: ["admin"] },
    { href: "/bookings", label: "Peminjaman", icon: "booking", roles: ["admin", "pemohon"] },
    { href: "/history", label: "Riwayat", icon: "history", roles: ["admin", "pemohon"] },
  ];

  const filtered = links.filter((l) => user && l.roles.includes(user.role));

  return (
    <>
      <aside className="w-64 min-h-screen bg-[#111113] text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display font-bold text-lg tracking-tight">
            Peminjaman<span className="text-indigo-400">.</span>
          </p>
          <p className="text-xs text-white/40 mt-0.5">Ruang & Lab</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {filtered.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {ICONS[l.icon]}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2.5 mb-2 rounded-lg bg-white/5">
            <p className="text-sm font-medium truncate">{user?.username ?? "—"}</p>
            <p className="text-xs text-white/40 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Modal konfirmasi logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </div>
            <h3 className="font-semibold text-ink mb-1.5">Keluar dari aplikasi?</h3>
            <p className="text-sm text-muted mb-6">
              Sesi kamu akan diakhiri. Kamu perlu login kembali untuk mengakses aplikasi.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}