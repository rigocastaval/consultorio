// Service Worker para Dr. Ramses Castañeda PWA
const CACHE_NAME = 'dr-castaneda-v1';
const ASSETS = [
  '/consultorio/panel_paciente.html',
  '/consultorio/logo_circulo.png',
  '/consultorio/perfil_-_Ramses.jpg',
  '/consultorio/manifest.json'
];

// Instalar: cachear archivos principales
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: red primero, cache como respaldo
self.addEventListener('fetch', function(e){
  // Solo interceptar requests del mismo origen
  if(!e.request.url.startsWith(self.location.origin)) return;
  // No interceptar Supabase ni APIs externas
  if(e.request.url.includes('supabase.co')) return;
  if(e.request.url.includes('anthropic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Guardar copia en cache si es exitoso
        if(response.ok){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function(){
        // Sin red: usar cache
        return caches.match(e.request).then(function(cached){
          return cached || new Response(
            '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px;">Sin conexión</h2><p style="text-align:center;color:#666;">Conecte a internet para ver sus datos actualizados.</p>',
            {headers:{'Content-Type':'text/html'}}
          );
        });
      })
  );
});
