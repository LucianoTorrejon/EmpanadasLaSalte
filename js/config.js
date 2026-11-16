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

  // Fotos: están en la carpeta img/. Para usar fotos propias, reemplazá los archivos
  // y borrá el campo "credito" (sólo hace falta para fotos de terceros).
  variedades: [
    { id: "carne",  nombre: "Carne",  desc: "Carne cortada a cuchillo, cebolla, huevo y especias.", emoji: "🥩", foto: "img/carne.jpg",
      credito: { autor: "Gonzalo Rivero", licencia: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Empanadas_salte%C3%B1as_1.jpg" } },
    { id: "pollo",  nombre: "Pollo",  desc: "Pollo desmenuzado con verdeo y morrón.",              emoji: "🍗", foto: "img/pollo.jpg",
      credito: { autor: "Horacio Cambeiro", licencia: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Empanadas_argentinas_fritas_de_pollo_(Argentina).jpg" } },
    { id: "arabe",  nombre: "Árabe",  desc: "Carne, tomate, cebolla y limón, cerrada en triángulo.", emoji: "🔺", foto: "img/arabe.jpg",
      credito: { autor: "Carlosdisogra", licencia: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Empanadas_argentinas_llamadas_%C3%A1rabes,_similares_a_las_Sfiha_cerradas.JPG" } },
    { id: "queso",  nombre: "Queso",  desc: "Muzzarella bien cremosa.",                              emoji: "🧀", foto: "img/queso.jpg",
      credito: { autor: "E4024", licencia: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Empanadas_de_queso_(Argentinian_or_Chilean_cuisine).jpg" } },
  ],

  tipos: [
    { id: "horno", nombre: "Al horno" },
    { id: "cruda", nombre: "Cruda (congelada)" },
  ],
};
