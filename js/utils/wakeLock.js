/**
 * js/utils/wakeLock.js
 * Propósito: Gestionar el ciclo de vida de la Screen Wake Lock API para evitar
 * que el dispositivo entre en modo de suspensión durante la sesión de trabajo.
 */

export class WakeLockManager {
  constructor() {
    this.wakeLock = null;
  }

  /**
   * Solicita el control de energía de la pantalla de forma asincrónica.
   * @returns {Promise<boolean>} Verdadero si se activó con éxito, falso en caso contrario.
   */
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        
        // Escuchar si el sistema operativo revoca el bloqueo (ej. por batería baja)
        this.wakeLock.addEventListener('release', () => {
          console.warn('Wake Lock fue liberado por el sistema operativo.');
        });

        console.log('Wake Lock activado exitosamente.');
        return true;
      } catch (err) {
        console.error(`Error al activar Wake Lock: ${err.name}, ${err.message}`);
        return false;
      }
    } else {
      console.error('La Screen Wake Lock API no es compatible con este navegador.');
      return false;
    }
  }

  /**
   * Libera el control de la pantalla para permitir el comportamiento normal del dispositivo.
   */
  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Wake Lock liberado manualmente.');
      } catch (err) {
        console.error(`Error al liberar Wake Lock: ${err.message}`);
      }
    }
  }
}