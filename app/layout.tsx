"use client";
import type { Metadata } from "next";
import "./globals.css";
import { useEffect } from "react";
import { seedLocalStorage } from "@/lib/storage";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    seedLocalStorage();
  }, []);

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}