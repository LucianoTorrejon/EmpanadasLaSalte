// =====================================================================
//  CONFIGURACIÓN DEL LOCAL — editá estos valores antes de publicar
// =====================================================================
window.CONFIG = {
  nombre: "La Salte Empanadas",

  // Celular de la empanadería en formato internacional, SIN "+", espacios ni guiones.
  // Ej. Argentina, Salta (387) 555-1234  ->  "5493875551234"
  whatsapp: "5493874822291",

  // Datos para la transferencia
  alias: "polea.barco.pepe",
  titular: "La Salte Empanadas",

  // Ubicación del local (desde donde se mide el radio de envío).
  // Para obtenerla: Google Maps -> clic derecho sobre el local -> copiar coordenadas.
  local: {
    // Tomadas de https://maps.app.goo.gl/E2skAaCMjAkmTPub9
    lat: -24.797555,
    lng: -65.374583,
    direccion: "Obispo Trejo 380, Nueva Córdoba",
  },

  // Radio máximo de envío en kilómetros (distancia en línea recta)
  radioKm: 4,

  // Precios (en pesos)
  precios: {
    docena: 14000,
    media: 8000,
    unidad: 1500,
  },

  // Para mostrar una foto en una variedad, agregá foto: "img/archivo.jpg"
  variedades: [
    { id: "carne",  nombre: "Carne",  desc: "Carne cortada a cuchillo, cebolla, huevo y especias.", emoji: "🥩" },
    { id: "pollo",  nombre: "Pollo",  desc: "Pollo desmenuzado con verdeo y morrón.",              emoji: "🍗" },
    { id: "arabe",  nombre: "Árabe",  desc: "Carne, tomate, cebolla y limón, cerrada en triángulo.", emoji: "🔺" },
    { id: "queso",  nombre: "Queso",  desc: "Muzzarella bien cremosa.",                              emoji: "🧀" },
  ],

  tipos: [
    { id: "horno", nombre: "Al horno" },
    { id: "cruda", nombre: "Cruda (congelada)" },
  ],
};
