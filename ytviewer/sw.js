const CACHE_NAME = "youtube-viewer-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.png",
  "./icon.ico"
];


/*
 * Install
 */
self.addEventListener("install", (event) => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())

  );

});


/*
 * Activate
 */
self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys()
      .then((keys) => {

        return Promise.all(

          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/*
 * Fetch
 *
 * Local application files use the cache.
 * YouTube resources are left alone so that
 * the embedded player/chat always gets fresh data.
 */
self.addEventListener("fetch", (event) => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }


  const url = new URL(request.url);


  /*
   * Only cache our own site's resources.
   */
  if (url.origin !== self.location.origin) {
    return;
  }


  event.respondWith(

    caches.match(request)
      .then((cachedResponse) => {

        if (cachedResponse) {
          return cachedResponse;
        }


        return fetch(request)
          .then((response) => {

            /*
             * Don't cache invalid responses.
             */
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }


            const responseClone =
              response.clone();


            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });


            return response;

          });

      })

  );

});
