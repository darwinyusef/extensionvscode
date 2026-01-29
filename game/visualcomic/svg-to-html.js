/**
 * Conversor de SVG Polygon a HTML con clip-path
 */

class SVGToHTMLConverter {
  constructor(svgWidth, svgHeight) {
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
  }

  /**
   * Convierte puntos SVG a porcentajes para clip-path
   */
  pointsToPercentages(points) {
    // Parsear puntos: "x1,y1 x2,y2 x3,y3"
    const coords = points.trim().split(/\s+/);
    const percentages = coords.map(coord => {
      const [x, y] = coord.split(',').map(Number);
      const xPercent = (x / this.svgWidth * 100).toFixed(2);
      const yPercent = (y / this.svgHeight * 100).toFixed(2);
      return `${xPercent}% ${yPercent}%`;
    });

    return `polygon(${percentages.join(', ')})`;
  }

  /**
   * Genera HTML completo desde los polígonos del SVG
   */
  generateHTML(polygons) {
    let html = '<div class="comic-layout">\n';

    polygons.forEach((polygon, index) => {
      const clipPath = this.pointsToPercentages(polygon.points);

      html += `  <div class="panel panel-${index + 1}" data-panel="${index + 1}" style="clip-path: ${clipPath};">\n`;

      if (polygon.image) {
        html += `    <div class="panel-bg" style="background-image: url('${polygon.image}');"></div>\n`;
      } else {
        html += `    <div class="panel-bg gradient-${(index % 6) + 1}"></div>\n`;
      }

      html += `    <div class="panel-overlay"></div>\n`;
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
  generateCSS() {
    return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.comic-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
}

.panel {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.5s ease;
}

.panel-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
}

.panel:hover .panel-bg {
  transform: scale(1.05);
}

.panel-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  transition: opacity 0.5s ease;
  z-index: 1;
}

.panel:hover .panel-overlay,
.panel.active .panel-overlay {
  opacity: 0;
}

.panel-number {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  z-index: 10;
  transition: all 0.3s ease;
}

.panel:hover .panel-number {
  transform: scale(1.2);
  background: #667eea;
  color: #fff;
}

.panel-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
  z-index: 5;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.panel:hover .panel-content,
.panel.active .panel-content {
  opacity: 1;
  transform: translateY(0);
}

.dialogue {
  background: rgba(255, 255, 255, 0.95);
  color: #000;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  font-family: 'Segoe UI', sans-serif;
}

/* Gradientes */
.gradient-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.gradient-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.gradient-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.gradient-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.gradient-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.gradient-6 { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }

/* Interacciones especiales */
.panel.active {
  z-index: 100;
}

.panel.active .panel-bg {
  transform: scale(1.1);
}
    `.trim();
  }

  /**
   * Genera archivo HTML completo
   */
  generateFullHTML(polygons, title = "Comic Layout") {
    const html = this.generateHTML(polygons);
    const css = this.generateCSS();

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}

<script>
// Interacciones
document.querySelectorAll('.panel').forEach(panel => {
  panel.addEventListener('click', () => {
    // Toggle active
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    panel.classList.add('active');
  });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const panels = Array.from(document.querySelectorAll('.panel'));
  const activePanel = document.querySelector('.panel.active');
  const currentIndex = activePanel ? panels.indexOf(activePanel) : -1;

  if (e.key === 'ArrowRight' && currentIndex < panels.length - 1) {
    panels[currentIndex + 1].click();
  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
    panels[currentIndex - 1].click();
  }
});
</script>
</body>
</html>`;
  }
}

// Datos del SVG original
const SVG_DATA = {
  width: 1200,
  height: 759.5,
  polygons: [
    {
      points: "300.6,759.5 0,759.5 0,569.6 0,379.7 300.6,379.7",
      color: "#2B4A9A"
    },
    {
      points: "601.3,759.5 300.6,759.5 300.6,569.6 300.6,379.7 601.3,379.7",
      color: "#2B4A9A"
    },
    {
      points: "805.1,759.5 929,759.5 1074,759.5 1200,759.5 1200,0 985.7,0",
      color: "#E5231E"
    },
    {
      points: "601.3,379.7 601.3,569.6 601.3,759.5 805.1,759.5 895.4,379.7",
      color: "#2B4A9A"
    },
    {
      points: "985.7,0 0,0 0,189.9 0,379.7 895.4,379.7",
      color: "#2B4A9A"
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SVGToHTMLConverter, SVG_DATA };
}
