/**
 * js/utils/geoUtils.js
 * Propósito: Utilidades matemáticas para cálculos geográficos.
 */

/**
 * Calcula la distancia en metros entre dos puntos geográficos usando Haversine.
 * @param {number} lat1 - Latitud punto origen
 * @param {number} lng1 - Longitud punto origen
 * @param {number} lat2 - Latitud punto destino
 * @param {number} lng2 - Longitud punto destino
 * @returns {number} Distancia física real en metros lineales
 */
export function calcularDistanciaMetros(lat1, lng1, lat2, lng2) {
  const RADIO_TIERRA_METROS = 6371000; // R = 6,371 km

  // Convertir grados decimales a radianes
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distancia final en metros lineales
  return RADIO_TIERRA_METROS * c;
}