// Kiscsibe Service Worker - Push notifications

self.addEventListener("push", (event) => {
  let data = { title: "Kiscsibe Étterem", body: "Új értesítés", url: "/etlap" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/assets/kiscsibe_logo_round.png",
      badge: "/assets/kiscsibe_logo_round.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/etlap";
  event.waitUntil(clients.openWindow(url));
});
