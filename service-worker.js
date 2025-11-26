//Adds the essential files to cache upon installation
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("weather-cache").then((cache) => {
            return cache.addAll([
                "index.html",
                "style.css",
                "app.js",
                "manifest.json",
                "icon-192.png",
                "registration-decor.png"
            ]);
        })
    );
});
 
//Checks cache first, if data not present, check network
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});