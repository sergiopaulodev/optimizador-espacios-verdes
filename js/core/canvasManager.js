/**
 * js/core/canvasManager.js
 * Propósito: Capa de Presentación y Gestión del Canvas HTML5.
 * Procesa el histórico de coordenadas, gestiona la matriz analítica
 * de reincidencia y renderiza el mapa de calor a escala 1px = 1m.
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

  /**
   * FASES C y D: Procesa todo el recorrido, llena la matriz lógica
   * y dibuja físicamente los resultados aplicando la escala cromática.
   * @param {Array<{lat: number, lng: number}>} route - Historial de coordenadas de la sesión.
   */
  renderizarRecorrido(route) {
    if (!route || route.length === 0) return;

    // 1. Configurar el escenario físico y lógico (Fases A y B)
    const metadatosOrigen = this.configurarDimensionesDinamicas(route);
    if (!metadatosOrigen) return;

    const { latMin, lngMin, factorLongitud } = metadatosOrigen;
    this.inicializarMatrizReincidencia(this.canvas.width, this.canvas.height);

    // 2. FASE C: Mapeo del recorrido e incremento de contadores en la Matriz
    for (const coordenada of route) {
      // Traducir deltas geográficos a metros lineales relativos al origen (0,0)
      const metrosX = (coordenada.lng - lngMin) * factorLongitud;
      const metrosY = (coordenada.lat - latMin) * this.METROS_POR_GRADO;

      // Obtener índices enteros correspondientes para la celda
      const celdaX = Math.floor(metrosX);
      const celdaY = Math.floor(metrosY);

      // Validación de fronteras para evitar desbordamientos de memoria
      if (celdaX >= 0 && celdaX < this.canvas.width && celdaY >= 0 && celdaY < this.canvas.height) {
        this.matriz[celdaX][celdaY].visitas += 1;
      }
    }

    // 3. FASE D: Renderizado Físico en Canvas aplicando Escala Analítica
    // Limpiar por completo el lienzo antes de redibujar
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Bucles anidados de alta eficiencia para barrer la cuadrícula
    for (let x = 0; x < this.canvas.width; x++) {
      for (let y = 0; y < this.canvas.height; y++) {
        const celda = this.matriz[x][y];
        
        // Criterio de aceptación: Si no hay visitas, mantener fondo transparente
        if (celda.visitas === 0) continue;

        // Evaluación de la escala analítica de reincidencia
        if (celda.visitas >= 1 && celda.visitas <= 2) {
          this.ctx.fillStyle = '#2ECC71'; // Verde: Corte Óptimo
        } else if (celda.visitas >= 3 && celda.visitas <= 5) {
          this.ctx.fillStyle = '#F1C40F'; // Amarillo/Ocre: Zona de Maniobra
        } else if (celda.visitas >= 6) {
          this.ctx.fillStyle = '#E74C3C'; // Rojo: Reincidencia Crítica
        }

        // Pintar físicamente el bloque elemental de 1 metro cuadrado (1px x 1px)
        this.ctx.fillRect(x, y, 1, 1);
      }
    }

    console.log('🎨 Renderizado físico del mapa de calor completado con éxito.');
  }
}