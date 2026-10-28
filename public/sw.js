// Caloria Service Worker - Native Web Push & Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Event: Parse incoming JSON payload and display notification
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: "Caloria",
      body: event.data.text() || "Kamu punya notifikasi baru!",
    };
  }

  const title = payload.title || "Caloria 🍽️";
  const options = {
    body: payload.body || "Jangan lupa pantau nutrisi harianmu!",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || payload.icon || "/icons/icon-192x192.png",
    data: {
      url: payload.url || "/dashboard",
      dateOfArrival: Date.now(),
    },
    tag: payload.tag || "caloria-notification",
    renotify: true,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event: Focus existing window or open a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || "/dashboard";
  const fullTargetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If there's an existing open tab for Caloria, focus it and navigate
        for (const client of windowClients) {
          if (client.url && client.url.startsWith(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(fullTargetUrl);
            }
            return client;
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullTargetUrl);
        }
      })
  );
});
