/**
 * js/core/canvasManager.js
 * Propósito: Capa de Presentación y Gestión del Canvas HTML5.
 * Calcula los extremos geográficos de la sesión, auto-dimensiona el lienzo
 * a escala 1px = 1m e inicializa la matriz lógica de reincidencia.
 */

export class CanvasManager {
  /**
   * @param {string} canvasId - El ID del elemento HTML5 Canvas.
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`No se encontró el elemento Canvas con ID: ${canvasId}`);
    }
    this.ctx = this.canvas.getContext('2d');
    this.matriz = [];
    
    // Constante de aproximación métrica de la Tierra por grado decimal
    this.METROS_POR_GRADO = 111132;
  }

  /**
   * FASE A: Determina los límites geográficos, calcula las distancias métricas
   * y ajusta la resolución interna del Canvas a escala estricta 1px = 1m.
   * @param {Array<{lat: number, lng: number}>} route - Array de coordenadas guardadas.
   * @returns {Object} Coordenadas del punto de origen (mínimos) y dimensiones calculadas.
   */
  configurarDimensionesDinamicas(route) {
    if (!route || route.length === 0) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      return null;
    }

    // Inicializar extremos con el primer punto
    let latMin = route[0].lat;
    let latMax = route[0].lat;
    let lngMin = route[0].lng;
    let lngMax = route[0].lng;

    // Buscar mínimos y máximos absolutos del recorrido
    for (let i = 1; i < route.length; i++) {
      const p = route[i];
      if (p.lat < latMin) latMin = p.lat;
      if (p.lat > latMax) latMax = p.lat;
      if (p.lng < lngMin) lngMin = p.lng;
      if (p.lng > lngMax) lngMax = p.lng;
    }

    // Calcular el factor de longitud corregido basado en el coseno de la latitud media
    const latMediaRad = ((latMin + latMax) / 2) * (Math.PI / 180);
    const factorLongitud = this.METROS_POR_GRADO * Math.cos(latMediaRad);

    // Conversión de deltas geográficos a metros lineales (Ejes X e Y planos)
    const deltaX = (lngMax - lngMin) * factorLongitud;
    const deltaY = (latMax - latMin) * this.METROS_POR_GRADO;

    // Ajustar las dimensiones físicas del Canvas (1 píxel = 1 metro)
    // Agregamos un margen mínimo de 2 metros para evitar colisiones con los bordes rígidos
    this.canvas.width = Math.ceil(deltaX) + 2;
    this.canvas.height = Math.ceil(deltaY) + 2;

    console.log(`📏 Canvas Redimensionado: ${this.canvas.width}x${this.canvas.height} píxeles (${this.canvas.width * this.canvas.height}m² totales de caja envolvente).`);

    return { latMin, lngMin, factorLongitud };
  }

  /**
   * FASE B: Inicializa una estructura de datos matricial pura (Array de Arrays)
   * mapeando las dimensiones del Canvas actual rellenado con objetos de control.
   * @param {number} ancho - Columnas de la matriz (canvas.width)
   * @param {number} alto - Filas de la matriz (canvas.height)
   */
  inicializarMatrizReincidencia(ancho, alto) {
    this.matriz = new Array(ancho);
    
    for (let x = 0; x < ancho; x++) {
      this.matriz[x] = new Array(alto);
      for (let y = 0; y < alto; y++) {
        // Objeto estructurado para el contador analítico según especificación
        this.matriz[x][y] = { visitas: 0 };
      }
    }
    
    console.log(`📊 Matriz Analítica Inicializada en Memoria: ${ancho} columnas x ${alto} filas.`);
  }
}