"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check current registration and subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      setError("Browser kamu belum mendukung Web Push Notifications.");
      return false;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError("VAPID Public Key belum dikonfigurasi.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request Notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Izin notifikasi ditolak. Kamu bisa mengaktifkannya di pengaturan browser.");
        setIsLoading(false);
        return false;
      }

      // 2. Register service worker if not already
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      await navigator.serviceWorker.ready;

      // 3. Subscribe with PushManager
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // 4. Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.toJSON().keys?.p256dh,
            auth: sub.toJSON().keys?.auth,
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan langganan notifikasi ke server.");
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error("[usePushNotifications] Error subscribing:", err);
      setError(err.message || "Gagal mengaktifkan notifikasi.");
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Unsubscribe locally
        await sub.unsubscribe();

        // Inform backend
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: sub.endpoint,
          }),
        });
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error("[usePushNotifications] Error unsubscribing:", err);
      setError(err.message || "Gagal menonaktifkan notifikasi.");
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
