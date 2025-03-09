"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "../context/AuthContext";

export function Protected({ children }) {
  const { user } = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return <div>{children}</div>;
}
