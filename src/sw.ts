/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

let timerId: ReturnType<typeof setTimeout> | null = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_REST_TIMER') {
    const { delay, title, body } = event.data;
    
    // Cancela timer anterior se houver
    if (timerId) clearTimeout(timerId);

    timerId = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/Treino/favicon.svg', // Ajustado para o base path
        badge: '/Treino/favicon.svg',
        tag: 'rest-timer'
      });
      timerId = null;
    }, delay);
  }

  if (event.data && event.data.type === 'CANCEL_REST_TIMER') {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/Treino/');
    })
  );
});
