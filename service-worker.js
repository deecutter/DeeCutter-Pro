self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // يترك فارغ حالياً حتى ما يسوي كاش ويخرب تحديثاتك الكودية
});