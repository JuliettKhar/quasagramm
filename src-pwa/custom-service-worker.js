/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheFirst } from 'workbox-strategies';
import { NetworkFirst } from 'workbox-strategies';

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { Queue } from 'workbox-background-sync';

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

const isBackgroundSyncSupported = 'sync' in self.registration;
console.log(isBackgroundSyncSupported, 'isBackgroundSyncSupported');

if (isBackgroundSyncSupported) {
  const queue = new Queue('createPostQueue', {
    onSync: async ({ queue }) => {
      let entry;
      while ((entry = await queue.shiftRequest())) {
        try {
          await fetch(entry.request);
          console.error('Replay successful for request', entry.request);

          const channel = new BroadcastChannel('sw-messages');
          channel.postMessage({ msg: 'offline-post-uploaded' });
        } catch (error) {
          console.error('Replay failed for request', entry.request, error);

          // Put the entry back in the queue and re-throw the error:
          await queue.unshiftRequest(entry);
          throw error;
        }
      }
      console.log('Replay complete!');
    },
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('createPost')) {
      // Clone the request to ensure it's safe to read when
      // adding to the createPostQueue.
      if(!self.navigator.onLine) {
        const promiseChain = fetch(event.request.clone()).catch((err) => {
          return queue.pushRequest({request: event.request});
        });
      event.waitUntil(promiseChain);
      }
    }
  });
}

registerRoute(
  ({ url }) => url.host.startsWith('fonts.g'),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/posts'),
  new NetworkFirst(),
);

registerRoute(
  ({ url }) => url.href.startsWith('http'),
  new StaleWhileRevalidate(),
);

//events - notifications
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'hello') {
    console.log(action)
  } else if (action === 'goodbye') {
    console.log(action)
  } else {
   event.waitUntil(
     clients.matchAll().then((resClients) => {
       console.log(resClients, 'clients')
       const clientsUsingApp = resClients.find(client => client.visibilityState === 'visible')
       if (clientsUsingApp) {
         console.log(notification.data)
         clientsUsingApp.navigate(notification.data.openUrl);
         clientsUsingApp.focus()
       } else {
         clients.openWindow(notification.data.openUrl);
       }
     }).catch(e => {
       console.log(e.toString())
     })
   )
  }
  // notification.close();
});

//events - push
self.addEventListener('push', event => {
  console.log('push', event)
  if (event.data) {
    const data = JSON.parse(event.data.text());
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'icons/apple-icon-120x120.png',
        badge: 'icons/apple-icon-120x120.png',
        image: data.imageUrl,
        data: {
          openUrl: data.openUrl,
        }
      }),
    );
  }
});

self.addEventListener('notificationclose', event => {
  console.log('close')
})
