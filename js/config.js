// =====================================================================
//  CONFIGURACIÓN DEL LOCAL — editá estos valores antes de publicar
// =====================================================================
window.CONFIG = {
  nombre: "La Salte Empanadas",

  // Celular de la empanadería en formato internacional, SIN "+", espacios ni guiones.
  // Ej. Argentina, Salta (387) 555-1234  ->  "5493875551234"
  whatsapp: "5493875818272",
  contacto: "Nancy", // nombre que se muestra junto al número en el pie

  // Datos para la transferencia
  alias: "Nancygf.mp",
  cvu: "0000003100011152445441",
  titular: "Nancy Gisela Frías",

  // Ubicación del carro (desde donde se mide el radio de envío y se muestra el mapa del pie).
  // Para obtenerla: Google Maps -> clic derecho sobre el lugar -> copiar coordenadas.
  local: {
    // Esquina Antonio Alice y Av. Ciudad de Asunción (OpenStreetMap)
    lat: -24.797662,
    lng: -65.374612,
    direccion: "Antonio Alice N° 12, esquina Av. Asunción (B° Autódromo)",
  },

  // Horario de atención (se muestra en el pie de la página)
  horario: "Lunes a sábados de 10:30 a 14:30",

  // Zona donde se buscan las direcciones (sólo se muestran resultados dentro de este recuadro).
  // Cubre Salta Capital: oeste, norte, este, sur.
  zonaBusqueda: {
    ciudad: "Salta",
    provincia: "Salta",
    oeste: -65.52,
    norte: -24.68,
    este: -65.30,
    sur: -24.90,
  },

  // Radio máximo de envío en kilómetros (distancia en línea recta)
  radioKm: 4,

  // Precios (en pesos)
  precios: {
    docena: 14000,
    media: 7000,
    unidad: 1300,
  },

  // Para mostrar una foto en una variedad, agregá foto: "img/archivo.jpg"
  variedades: [
    { id: "carne",  nombre: "Carne",  desc: "Carne, cebolla y morrón.", emoji: "🥩" },
    { id: "pollo",  nombre: "Pollo",  desc: "Pollo, cebolla y morrón.",              emoji: "🍗" },
    { id: "arabe",  nombre: "Árabe",  desc: "Carne, cebolla, tomate y limón.", emoji: "🔺" },
    { id: "queso",  nombre: "Queso",  desc: "Queso, cebolla y morrón.",                              emoji: "🧀" },
  ],

  tipos: [
    { id: "horno", nombre: "Al horno" },
    { id: "cruda", nombre: "Cruda (congelada)" },
  ],
};
