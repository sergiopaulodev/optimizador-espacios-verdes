/**
 * js/app.js
 * Propósito: Orquestador central de la aplicación. Inicializa los servicios,
 * registra el Service Worker y coordina los eventos de la interfaz de usuario.
 */

import { WakeLockManager } from './utils/wakeLock.js';
import { StorageService } from './services/storageService.js';
import { GpsService } from './services/gpsService.js';
import { CanvasManager } from './core/canvasManager.js';
import { calcularDistanciaMetros } from './utils/geoUtils.js';

// Instancias globales de control
const wakeLockManager = new WakeLockManager();
const storageService = new StorageService();
const gpsService = new GpsService();
const canvasManager = new CanvasManager('terrain-canvas');

// Estado en memoria de la sesión activa de muestreo
let lastSavedTime = 0;
const GPS_SAMPLE_INTERVAL_MS = 3000; // Criterio de aceptación: 3 segundos

// Elementos del DOM
const wakeLockStatusEl = document.getElementById('wakelock-status');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const geoCounterEl = document.getElementById('geo-counter');
const geoDebugEl = document.getElementById('geo-debug');

/**
 * Actualiza visualmente el estado del Wake Lock en la interfaz de usuario.
 * @param {boolean} isActive 
 */
function updateWakeLockUI(isActive) {
  if (isActive) {
    wakeLockStatusEl.textContent = 'Activo';
    wakeLockStatusEl.className = 'px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700';
  } else {
    wakeLockStatusEl.textContent = 'Inactivo';
    wakeLockStatusEl.className = 'px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700';
  }
}

/**
 * Actualiza los contadores y paneles de depuración de la interfaz.
 */
function updateRouteUI() {
  const currentRoute = storageService.getRoute();
  geoCounterEl.textContent = currentRoute.length;
}

/**
 * Procesa las coordenadas entrantes aplicando el doble filtro analítico:
 * 1. Filtro de Tiempo: Mínimo 3 segundos.
 * 2. Filtro de Espacio: Desplazamiento real mayor a 1 metro (Elimina el Jitter).
 * @param {number} lat 
 * @param {number} lng 
 */
function handleGpsTracking(lat, lng) {
  const now = Date.now();
  
  // Telemetría en tiempo real en la pantalla
  geoDebugEl.classList.remove('hidden');
  geoDebugEl.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

  // 1. PRIMER CANDADO: Validar filtro de tiempo (3 segundos)
  if (now - lastSavedTime >= GPS_SAMPLE_INTERVAL_MS) {
    const route = storageService.getRoute();
    
    // Si es el primer punto de la sesión, se guarda directamente de forma incondicional
    if (route.length === 0) {
      storageService.savePosition(lat, lng);
      lastSavedTime = now;
      updateRouteUI();
      return;
    }

    // Obtener el último punto físico guardado en el disco
    const ultimoPunto = route[route.length - 1];

    // Calcular la distancia matemática real usando Haversine
    const distanciaDesplazada = calcularDistanciaMetros(
      ultimoPunto.lat, 
      ultimoPunto.lng, 
      lat, 
      lng
    );

    console.log(`📡 Telemetría - Distancia calculada desde último punto: ${distanciaDesplazada.toFixed(2)} metros.`);

    // 2. SEGUNDO CANDADO: Validar filtro de espacio (Mayor a 1 metro real)
    if (distanciaDesplazada >= 1.0) {
      storageService.savePosition(lat, lng);
      lastSavedTime = now;
      updateRouteUI();
      
      // Animación visual de confirmación
      geoCounterEl.classList.add('bg-green-200');
      setTimeout(() => geoCounterEl.classList.remove('bg-green-200'), 300);
    } else {
      console.log('⏳ Coordenada descartada por el filtro de Jitter (Desplazamiento menor a 1 metro). El operario está quieto.');
    }
  }
}

/**
 * Inicia formalmente el registro y bloquea los controles correspondientes.
 */
function startSession() {

  console.log('Sesión iniciada. Limpiando datos anteriores para nueva medición...');
  
  // Limpiar el recorrido previo en el almacenamiento local para empezar en limpio
  storageService.clearRoute();
  updateRouteUI();

  btnStart.disabled = true;
  btnStart.className = 'flex-1 bg-gray-200 text-gray-400 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-not-allowed text-center';
  
  btnStop.disabled = false;
  btnStop.className = 'flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer text-center';

  // Forzar reseteo de tiempo para guardar el primer punto de inmediato
  lastSavedTime = 0; 

  gpsService.startTracking(
    (lat, lng) => handleGpsTracking(lat, lng),
    (error) => {
      alert(`Error de localización: ${error.message}. Asegúrate de dar permisos de GPS.`);
      stopSession();
    }
  );
}

/**
 * Detiene el registro de coordenadas del hardware.
 */
function stopSession() {

  console.log('Sesión finalizada. Procesando datos para el mapa de calor...');

  btnStop.disabled = true;
  btnStop.className = 'flex-1 bg-gray-200 text-gray-400 font-medium py-2.5 px-4 rounded-lg transition-colors cursor-not-allowed text-center';
  
  btnStart.disabled = false;
  btnStart.className = 'flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer text-center';

  gpsService.stopTracking();
  geoDebugEl.classList.add('hidden');

  // Recuperar las coordenadas acumuladas en la sesión actual
  const finalRoute = storageService.getRoute();
  
  // Invocar al CanvasManager para procesar la matriz dinámica y pintar la escala de colores
  if (finalRoute.length > 0) {
    canvasManager.renderizarRecorrido(finalRoute);
  } else {
    console.log('No se capturaron puntos suficientes para generar el mapa de calor.');
  }
}

/**
 * Inicialización de listeners de eventos y ciclo de vida de la App
 */
async function init() {
  // 1. Registro del Service Worker para capacidades offline
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registrado con éxito en el alcance:', registration.scope);
    } catch (error) {
      console.error('Fallo el registro del Service Worker:', error);
    }
  }

  // 2. Activación automática del Wake Lock para la sesión del MVP
  // Nota: En navegadores estrictos puede requerir interacción del usuario, 
  // pero al integrarse con el flujo lo lanzamos en la inicialización base.
  const lockAcquired = await wakeLockManager.requestWakeLock();
  updateWakeLockUI(lockAcquired);

  // Re-solicitar el Wake Lock si la app vuelve a primer plano (pestaña minimizada/recuperada)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      const reacquired = await wakeLockManager.requestWakeLock();
      updateWakeLockUI(reacquired);
    }
  });

  // 3. Vincular eventos de la interfaz
  btnStart.addEventListener('click', startSession);
  btnStop.addEventListener('click', stopSession);

  // Intentar renderizar si el usuario recarga la página con datos existentes en el almacenamiento
  const existingRoute = storageService.getRoute();
  if (existingRoute.length > 0) {
    canvasManager.renderizarRecorrido(existingRoute);
  }

}

// Arrancar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);