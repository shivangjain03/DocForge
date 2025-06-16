"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [tokenChecked, setTokenChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login");
    }
    setTokenChecked(true);
  }, []);

  if (!tokenChecked) return <div>Loading...</div>;

  return <>{children}</>;
}
