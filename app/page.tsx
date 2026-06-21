"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { seedLocalStorage } from "@/data/seed";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    seedLocalStorage();
    const user = getCurrentUser();
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}