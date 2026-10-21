"use client";

import { useEffect, useState } from "react";

export function EnableNotifications() {
  const [state, setState] = useState<NotificationPermission | "unsupported" | null>(null);

  useEffect(() => {
    setState("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  if (state !== "default") return null;
  return (
    <button
      type="button"
      onClick={async () => setState(await Notification.requestPermission())}
      className="btn-ghost"
    >
      🔔 Enable desktop reminders
    </button>
  );
}
