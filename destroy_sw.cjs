const fs = require("fs");
let content = `
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
    // DO NOTHING, DO NOT CACHE
});
`;
fs.writeFileSync("sw.js", content);
console.log("Replaced sw.js with an empty cache destroyer");
