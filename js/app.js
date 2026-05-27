/**
 * js/app.js
 * Propósito: Orquestador central de la aplicación. Inicializa los servicios,
 * registra el Service Worker y coordina los eventos de la interfaz de usuario.
 */

import { WakeLockManager } from './utils/wakeLock.js';

// Instancias globales de control
const wakeLockManager = new WakeLockManager();

// Elementos del DOM
const wakeLockStatusEl = document.getElementById('wakelock-status');

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
}

// Arrancar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);