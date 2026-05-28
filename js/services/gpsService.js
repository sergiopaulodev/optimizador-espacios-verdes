/**
 * js/services/gpsService.js
 * Propósito: Envolver la API de Geolocalización nativa para escuchar cambios 
 * de posición con alta precisión y notificarlos mediante un callback.
 */

export class GpsService {
  constructor() {
    this.watchId = null;
    this.options = {
      enableHighAccuracy: true, // Fuerza el uso del hardware GPS del móvil
      timeout: 10000,           // Máximo tiempo de espera por lectura
      maximumAge: 0             // Evita usar posiciones guardadas en caché
    };
  }

  /**
   * Inicia el rastreo de la ubicación del dispositivo en tiempo real.
   * @param {Function} onPositionSuccess - Callback activado al recibir coordenadas válidas.
   * @param {Function} onPositionError - Callback activado en caso de fallo del sensor.
   */
  startTracking(onPositionSuccess, onPositionError) {
    if (!('geolocation' in navigator)) {
      onPositionError(new Error('La geolocalización no está disponible en este dispositivo.'));
      return;
    }

    if (this.watchId !== null) return; // Ya está activo

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onPositionSuccess(latitude, longitude);
      },
      (error) => {
        console.error(`Código de error GPS [${error.code}]: ${error.message}`);
        onPositionError(error);
      },
      this.options
    );
  }

  /**
   * Detiene el rastreo del hardware GPS para conservar batería.
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('Sensor GPS desactivado.');
    }
  }
}