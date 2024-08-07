"use client";

import { useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to chat.js
        router.push("/chat");
      } else {
        // No user is signed in, redirect to login.js
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}
