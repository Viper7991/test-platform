"use client";

import { useEffect } from "react";
import { trySyncQueue } from "@/lib/test-engine/syncQueue";
import { pullMarkedFromCloud } from "@/lib/test-engine/markedQuestions";

export default function SyncManager() {
  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me").catch(() => null);
      const meData = meRes ? await meRes.json().catch(() => null) : null;
      if (meData?.user) {
        await pullMarkedFromCloud();
      }
      trySyncQueue();
    }
    init();

    function handleOnline() {
      trySyncQueue();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}