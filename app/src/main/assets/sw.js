/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5db52d43'], (function (workbox) { 'use strict';

  workbox.setCacheNameDetails({
    prefix: "gmessages-v4"
  });
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "d21e89a1fdcad02a04883a50ae051ef1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "02d53411a3fbf9d85d118ffb0b3d514f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "26dd2a1019e4e3e695016f53b1b67aab"
  }, {
    "url": "index.html",
    "revision": "4f80e158ca2c238010f3871158cf710b"
  }, {
    "url": "icon.svg",
    "revision": "720c0ba6ce705b6c27e79d71efa7badd"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "071aff5981b4ba0b393b4f14888d5e5f"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/roboto-latin-700-normal-YuyVweIx.woff",
    "revision": null
  }, {
    "url": "assets/roboto-latin-700-normal-BZpUvMxY.woff2",
    "revision": null
  }, {
    "url": "assets/roboto-latin-500-normal-fsTFPL3E.woff",
    "revision": null
  }, {
    "url": "assets/roboto-latin-500-normal-7RbcRiD8.woff2",
    "revision": null
  }, {
    "url": "assets/roboto-latin-400-normal-D27F5sTu.woff",
    "revision": null
  }, {
    "url": "assets/roboto-latin-400-normal-BqEyEoaF.woff2",
    "revision": null
  }, {
    "url": "assets/index-BbQKljnD.css",
    "revision": null
  }, {
    "url": "assets/index-BaXEOyV5.js",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-700-normal-CV7aHjQV.woff",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-700-normal-B3LHozD6.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-600-normal-opt7x0vn.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-600-normal-DP24O2H-.woff",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-500-normal-D5I8YECE.woff",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-500-normal-C94wcUG3.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-400-normal-gBg6aEjr.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-latin-400-normal-DqTfqlHm.woff",
    "revision": null
  }, {
    "url": "assets/avatar_marcus_vance_1794841053082-c4ffLztv.jpg",
    "revision": null
  }, {
    "url": "pwa-192x192.png",
    "revision": "26dd2a1019e4e3e695016f53b1b67aab"
  }, {
    "url": "pwa-512x512.png",
    "revision": "02d53411a3fbf9d85d118ffb0b3d514f"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d21e89a1fdcad02a04883a50ae051ef1"
  }, {
    "url": "manifest.json",
    "revision": "d2837358db546f8e70f3ab6ed32a2c52"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(({
    url
  }) => url.pathname.startsWith("/api/"), new workbox.NetworkFirst({
    "cacheName": "gmessages-api-cache",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request,
    url
  }) => url.origin === self.location.origin && !url.pathname.startsWith("/src/") && !url.pathname.startsWith("/@") && !url.pathname.startsWith("/node_modules/") && (url.pathname.startsWith("/assets/") || ["font", "image"].includes(request.destination)), new workbox.CacheFirst({
    "cacheName": "gmessages-static-assets",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 150,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
