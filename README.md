# La Salte Empanadas — Pedidos online

Sitio web estático (HTML + CSS + JavaScript, sin base de datos ni backend) para que los clientes armen su pedido y lo envíen por WhatsApp.

## Funcionalidades

- Menú con 4 variedades (Carne, Pollo, Árabe, Queso) en 2 tipos (Al horno / Cruda).
- Carrito con cantidades por gusto y tipo (+1, +6, +12).
- Precio calculado sobre el **total** de empanadas: docenas ($14.000), medias docenas ($8.000) y unidades ($1.500). Se pueden combinar gustos dentro de la misma docena.
- Retiro en el local o envío a domicilio.
- Para envío: ubicación por GPS, búsqueda de dirección (OpenStreetMap) o marcando el punto en el mapa. Se valida que esté a **menos de 4 km** del local (distancia en línea recta).
- Al confirmar, se genera un link de WhatsApp al celular del local con el pedido, total, dirección/ubicación y el alias para transferir. La validación del pago es manual.
- Nada se guarda: todo vive en la memoria del navegador.

## Configuración

Editá `js/config.js`:

| Campo | Qué es |
|---|---|
| `whatsapp` | Celular del local en formato internacional sin `+` (ej. `5493875551234`) |
| `alias` / `titular` | Datos para la transferencia |
| `local.lat` / `local.lng` | Coordenadas del local (Google Maps → clic derecho → copiar coordenadas) |
| `local.direccion` | Dirección que se muestra para el retiro |
| `radioKm` | Radio máximo de envío |
| `precios` | Precio por docena, media y unidad |
| `variedades` / `tipos` | Gustos y tipos del menú |

## Probar localmente

```bash
python3 -m http.server 8080
```

y abrir http://localhost:8080

> La geolocalización del navegador requiere HTTPS (o `localhost`).

## Publicar

Al ser estático se puede subir gratis a GitHub Pages, Netlify, Vercel o Cloudflare Pages. En GitHub Pages: *Settings → Pages → Deploy from a branch* y elegir la rama.

## Actualizar el sitio publicado

Después de cambiar `css/` o `js/`, subí el número `?v=...` que aparece en `index.html`
(en los `<link>` y `<script>` del sitio) para que los navegadores descarguen la versión nueva
en lugar de usar la guardada en caché.
