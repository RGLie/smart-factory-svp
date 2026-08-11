"use client";

import { useCallback, useEffect, useState } from "react";
import type { BoothState } from "./types";

export function useBoothState(intervalMs = 1000) {
  const [state, setState] = useState<BoothState | null>(null);
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const payload = (await response.json()) as BoothState & { error?: string };
      if (!response.ok) throw new Error(payload.error || "데이터를 불러오지 못했습니다.");
      setState(payload);
      setReceivedAt(Date.now());
      setError(null);
      return payload;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "연결이 원활하지 않습니다.");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs, refresh]);

  return { state, receivedAt, error, refresh };
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
