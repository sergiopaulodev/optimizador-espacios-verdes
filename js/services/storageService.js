/**
 * js/services/storageService.js
 * Propósito: Abstraer el acceso a LocalStorage para guardar y recuperar 
 * las coordenadas del recorrido de forma segura y serializada en JSON.
 */

export class StorageService {
  constructor(key = 'verdegrid_active_route') {
    this.storageKey = key;
  }

  /**
   * Recupera el array de posiciones guardado. Si no existe, devuelve un array vacío.
   * @returns {Array<{lat: number, lng: number, timestamp: number}>}
   */
  getRoute() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al leer de LocalStorage, inicializando array vacío:', error);
      return [];
    }
  }

  /**
   * Guarda una nueva coordenada agregándola al histórico existente.
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Array} El recorrido completo actualizado.
   */
  savePosition(lat, lng) {
    try {
      const route = this.getRoute();
      const newPoint = {
        lat,
        lng,
        timestamp: Date.now()
      };
      route.push(newPoint);
      localStorage.setItem(this.storageKey, JSON.stringify(route));
      return route;
    } catch (error) {
      console.error('Error al guardar la posición en LocalStorage:', error);
      return this.getRoute();
    }
  }

  /**
   * Limpia el registro de la sesión actual en el almacenamiento local.
   */
  clearRoute() {
    localStorage.removeItem(this.storageKey);
  }
}