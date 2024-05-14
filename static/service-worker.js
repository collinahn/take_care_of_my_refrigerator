// (A) INSTANT WORKER ACTIVATION
self.addEventListener("install", (evt) => self.skipWaiting());

// (B) CLAIM CONTROL INSTANTLY
self.addEventListener("activate", (evt) => self.clients.claim());

// (C) LISTEN TO PUSH
self.addEventListener("push", (evt) => {
  const data = evt.data.json() || {};
  evt.waitUntil(
    self.registration.showNotification(
      data.title || "냉장고를 잘 부탁해 알림",
      {
        tag: data?.tag || "error",
        badge: data?.badge,
        body:
          data?.body ||
          evt.data?.text?.() ||
          "알림 전송에 실패했습니다. 알림 히스토리를 확인해주세요",
        icon: data?.icon || "/favicon.ico",
        image: data?.image || "/favicon.ico",
        data: { url: data?.url || "/settings/push" },
        actions: data?.actions || [],
        vibrate: [200, 100],
      }
    )
  );
});

// LISTEN TO CLICK
self.addEventListener("notificationclick", (evt) => {
  evt.notification.close(); // Android needs explicit close.
  evt.waitUntil(clients.openWindow(evt.notification.data.url));
});
