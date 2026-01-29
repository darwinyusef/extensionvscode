/**
 * Generador Simple de Teselación con Polígonos
 * Sin espacios negros, todo aleatorio
 */

class TesselationGenerator {
  constructor() {
    this.layouts = [];
  }

  /**
   * Genera layout tipo A: h 100 - w 66.66 33.33
   * Una fila completa, dividida en 2 columnas (66% y 33%)
   */
  generateLayoutA() {
    return [
      {
        id: 'panel-a1',
        polygon: 'polygon(0 0, 66.66% 0, 66.66% 100%, 0 100%)'
      },
      {
        id: 'panel-a2',
        polygon: 'polygon(66.66% 0, 100% 0, 100% 100%, 66.66% 100%)'
      }
    ];
  }

  /**
   * Genera layout tipo B:
   * Sección izquierda 66.66% dividida en 2 filas
   * Sección derecha 33.33% completa
   */
  generateLayoutB() {
    return [
      // Izquierda superior
      {
        id: 'panel-b1',
        polygon: 'polygon(0 0, 66.66% 0, 66.66% 50%, 0 50%)'
      },
      // Izquierda inferior
      {
        id: 'panel-b2',
        polygon: 'polygon(0 50%, 66.66% 50%, 66.66% 100%, 0 100%)'
      },
      // Derecha completa
      {
        id: 'panel-b3',
        polygon: 'polygon(66.66% 0, 100% 0, 100% 100%, 66.66% 100%)'
      }
    ];
  }

  /**
   * Layout con perspectiva trapezoidal
   */
  generateLayoutTrapezoid() {
    return [
      // Superior izquierdo (trapecio)
      {
        id: 'panel-t1',
        polygon: 'polygon(0 0, 30% 5%, 32% 48%, 0 50%)'
      },
      // Superior centro
      {
        id: 'panel-t2',
        polygon: 'polygon(30% 5%, 70% 5%, 68% 48%, 32% 48%)'
      },
      // Superior derecho
      {
        id: 'panel-t3',
        polygon: 'polygon(70% 5%, 100% 0, 100% 50%, 68% 48%)'
      },
      // Inferior izquierdo
      {
        id: 'panel-t4',
        polygon: 'polygon(0 50%, 32% 52%, 30% 95%, 0 100%)'
      },
      // Inferior centro
      {
        id: 'panel-t5',
        polygon: 'polygon(32% 52%, 68% 52%, 70% 95%, 30% 95%)'
      },
      // Inferior derecho
      {
        id: 'panel-t6',
        polygon: 'polygon(68% 52%, 100% 50%, 100% 100%, 70% 95%)'
      }
    ];
  }

  /**
   * Layout diagonal con trapecio
   */
  generateLayoutDiagonal() {
    return [
      {
        id: 'panel-d1',
        polygon: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)'
      },
      {
        id: 'panel-d2',
        polygon: 'polygon(90% 0, 100% 0, 100% 100%)'
      }
    ];
  }

  /**
   * Layout con división vertical variada
   */
  generateLayoutVerticalMix() {
    return [
      // Izquierda completa
      {
        id: 'panel-v1',
        polygon: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
      },
      // Derecha superior
      {
        id: 'panel-v2',
        polygon: 'polygon(50% 0, 100% 0, 100% 60%, 50% 60%)'
      },
      // Derecha inferior
      {
        id: 'panel-v3',
        polygon: 'polygon(50% 60%, 100% 60%, 100% 100%, 50% 100%)'
      }
    ];
  }

  /**
   * Layout random con teselación garantizada
   */
  generateRandom() {
    const layouts = [
      this.generateLayoutA(),
      this.generateLayoutB(),
      this.generateLayoutTrapezoid(),
      this.generateLayoutDiagonal(),
      this.generateLayoutVerticalMix()
    ];

    return layouts[Math.floor(Math.random() * layouts.length)];
  }

  /**
   * Layout personalizado con parámetros
   * @param {Object} config - { splitH: [50, 50], splitW: [66.66, 33.33] }
   */
  generateCustom(config) {
    const { splitH = [100], splitW = [50, 50] } = config;
    const panels = [];
    let panelId = 0;

    let currentY = 0;
    splitH.forEach((heightPercent, rowIndex) => {
      let currentX = 0;
      splitW.forEach((widthPercent, colIndex) => {
        panels.push({
          id: `panel-custom-${panelId++}`,
          polygon: `polygon(${currentX}% ${currentY}%, ${currentX + widthPercent}% ${currentY}%, ${currentX + widthPercent}% ${currentY + heightPercent}%, ${currentX}% ${currentY + heightPercent}%)`
        });
        currentX += widthPercent;
      });
      currentY += heightPercent;
    });

    return panels;
  }

  /**
   * Layout con formas orgánicas (teselación irregular)
   */
  generateOrganic() {
    const variance = () => Math.random() * 10 - 5; // -5 a +5

    return [
      {
        id: 'panel-o1',
        polygon: `polygon(${0 + variance()}% ${0 + variance()}%, ${33 + variance()}% ${0 + variance()}%, ${33 + variance()}% ${50 + variance()}%, ${0 + variance()}% ${50 + variance()}%)`
      },
      {
        id: 'panel-o2',
        polygon: `polygon(${33 + variance()}% ${0 + variance()}%, ${66 + variance()}% ${0 + variance()}%, ${66 + variance()}% ${50 + variance()}%, ${33 + variance()}% ${50 + variance()}%)`
      },
      {
        id: 'panel-o3',
        polygon: `polygon(${66 + variance()}% ${0 + variance()}%, ${100}% ${0 + variance()}%, ${100}% ${50 + variance()}%, ${66 + variance()}% ${50 + variance()}%)`
      },
      {
        id: 'panel-o4',
        polygon: `polygon(${0 + variance()}% ${50 + variance()}%, ${50 + variance()}% ${50 + variance()}%, ${50 + variance()}% ${100}%, ${0 + variance()}% ${100}%)`
      },
      {
        id: 'panel-o5',
        polygon: `polygon(${50 + variance()}% ${50 + variance()}%, ${100}% ${50 + variance()}%, ${100}% ${100}%, ${50 + variance()}% ${100}%)`
      }
    ];
  }

  /**
   * Genera HTML completo
   */
  toHTML(panels) {
    let html = '<div class="comic-layout">\n';

    panels.forEach((panel, index) => {
      html += `  <div class="panel ${panel.id}" style="clip-path: ${panel.polygon};">\n`;
      html += `    <div class="panel-bg gradient-${(index % 6) + 1}"></div>\n`;
      html += `    <div class="panel-number">${index + 1}</div>\n`;
      html += `    <div class="panel-content">\n`;
      html += `      <div class="dialogue">Panel ${index + 1}</div>\n`;
      html += `    </div>\n`;
      html += `  </div>\n`;
    });

    html += '</div>';
    return html;
  }

  /**
   * Genera CSS base
   */
  getBaseCSS() {
    return `
.comic-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.panel {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  transition: filter 0.5s ease;
  filter: grayscale(0.7) brightness(0.6);
}

.panel:hover, .panel.active {
  filter: grayscale(0) brightness(1);
  z-index: 100;
}

.panel-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.panel-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  z-index: 3;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
}

.dialogue {
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
}

.panel-number {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(102, 126, 234, 0.9);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 10;
}

.gradient-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.gradient-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.gradient-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.gradient-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.gradient-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.gradient-6 { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }
    `.trim();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesselationGenerator;
}
