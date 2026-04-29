/**
 * shapes.js — Shape drawing utility
 *
 * Used as a fallback renderer when PNG asset files are not found.
 * All shapes are drawn as silhouettes on a canvas and returned
 * as Image objects (via data URL) for use in shadow rendering.
 *
 * Usage:
 *   Shapes.draw(ctx, 'car', cx, cy, radius, 'black')
 *   const img = Shapes.createImage('rabbit', 256, 'rgba(0,0,0,0.85)')
 */

const Shapes = {

  /**
   * Draw a named shape silhouette onto an existing 2D context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} type  - shape name (see switch below)
   * @param {number} cx    - center X
   * @param {number} cy    - center Y
   * @param {number} r     - base radius / half-size
   * @param {string} color - CSS fill color
   */
  draw(ctx, type, cx, cy, r, color = 'black') {
    ctx.save();
    ctx.fillStyle   = color;
    ctx.strokeStyle = color;

    switch (type) {

      /* ─── Objects ──────────────────────────────────── */

      case 'ball':
      case 'circle': {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'car': {
        // Body
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - r * 0.95, cy - r * 0.18, r * 1.9, r * 0.78, r * 0.12);
        else               ctx.rect(cx - r * 0.95, cy - r * 0.18, r * 1.9, r * 0.78);
        ctx.fill();
        // Cabin
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - r * 0.52, cy - r * 0.72, r * 1.04, r * 0.58, r * 0.1);
        else               ctx.rect(cx - r * 0.52, cy - r * 0.72, r * 1.04, r * 0.58);
        ctx.fill();
        // Wheels
        [cx - r * 0.58, cx + r * 0.58].forEach(wx => {
          ctx.beginPath();
          ctx.arc(wx, cy + r * 0.5, r * 0.27, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'tree': {
        // Bottom layer (wide)
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.75);
        ctx.lineTo(cx - r * 0.9, cy + r * 0.75);
        ctx.lineTo(cx, cy - r * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.75);
        ctx.lineTo(cx + r * 0.9, cy + r * 0.75);
        ctx.lineTo(cx, cy - r * 0.05);
        ctx.closePath();
        ctx.fill();
        // Middle layer
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.72, cy + r * 0.3);
        ctx.lineTo(cx + r * 0.72, cy + r * 0.3);
        ctx.lineTo(cx, cy - r * 0.48);
        ctx.closePath();
        ctx.fill();
        // Top
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.52, cy - r * 0.2);
        ctx.lineTo(cx + r * 0.52, cy - r * 0.2);
        ctx.lineTo(cx, cy - r);
        ctx.closePath();
        ctx.fill();
        // Trunk
        ctx.fillRect(cx - r * 0.12, cy + r * 0.72, r * 0.24, r * 0.32);
        break;
      }

      case 'house': {
        // Body
        ctx.fillRect(cx - r * 0.78, cy - r * 0.22, r * 1.56, r * 0.9);
        // Roof triangle
        ctx.beginPath();
        ctx.moveTo(cx - r, cy - r * 0.22);
        ctx.lineTo(cx, cy - r);
        ctx.lineTo(cx + r, cy - r * 0.22);
        ctx.closePath();
        ctx.fill();
        // Door
        ctx.fillRect(cx - r * 0.16, cy + r * 0.2, r * 0.32, r * 0.48);
        break;
      }

      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const rd    = i % 2 ? r * 0.4 : r;
          const x     = cx + Math.cos(angle) * rd;
          const y     = cy + Math.sin(angle) * rd;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }

      /* ─── Theater hands ────────────────────────────── */

      case 'rabbit': {
        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.28, r * 0.52, r * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.22, r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.2, cy - r * 0.7, r * 0.1, r * 0.4, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.2, cy - r * 0.7, r * 0.1, r * 0.4, 0.18, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'bird': {
        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 0.58, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left wing
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.18, cy);
        ctx.bezierCurveTo(cx - r, cy - r * 0.55, cx - r * 0.92, cy + r * 0.42, cx - r * 0.18, cy + r * 0.28);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.18, cy);
        ctx.bezierCurveTo(cx + r, cy - r * 0.55, cx + r * 0.92, cy + r * 0.42, cx + r * 0.18, cy + r * 0.28);
        ctx.closePath();
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(cx + r * 0.1, cy - r * 0.3, r * 0.26, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.35, cy - r * 0.3);
        ctx.lineTo(cx + r * 0.72, cy - r * 0.22);
        ctx.lineTo(cx + r * 0.35, cy - r * 0.16);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'dog': {
        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.3, r * 0.56, r * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.08, r * 0.44, 0, Math.PI * 2);
        ctx.fill();
        // Floppy ears
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.4, cy - r * 0.08, r * 0.16, r * 0.42, -0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.4, cy - r * 0.08, r * 0.16, r * 0.42, 0.28, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.14, cy + r * 0.14, r * 0.24, r * 0.18, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.lineWidth = r * 0.14;
        ctx.lineCap   = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.52, cy + r * 0.56);
        ctx.bezierCurveTo(cx + r, cy + r * 0.22, cx + r * 1.12, cy - r * 0.2, cx + r * 0.8, cy - r * 0.32);
        ctx.stroke();
        break;
      }

      case 'fox': {
        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.22, r * 0.52, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.18, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Pointy left ear
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.34, cy - r * 0.46);
        ctx.lineTo(cx - r * 0.52, cy - r * 0.94);
        ctx.lineTo(cx - r * 0.12, cy - r * 0.56);
        ctx.closePath();
        ctx.fill();
        // Pointy right ear
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.34, cy - r * 0.46);
        ctx.lineTo(cx + r * 0.52, cy - r * 0.94);
        ctx.lineTo(cx + r * 0.12, cy - r * 0.56);
        ctx.closePath();
        ctx.fill();
        // Snout / muzzle
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.12, cy - r * 0.06, r * 0.24, r * 0.16, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Bushy tail
        ctx.lineWidth = r * 0.22;
        ctx.lineCap   = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.48, cy + r * 0.56);
        ctx.bezierCurveTo(cx + r * 1.1, cy + r * 0.4, cx + r * 1.3, cy - r * 0.1, cx + r, cy - r * 0.4);
        ctx.stroke();
        break;
      }

      default: {
        // Fallback: generic circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  },

  /**
   * Create an HTMLImageElement with the shape drawn at the given size.
   * Returns synchronously; the image `src` is a data URL so it's immediately usable.
   *
   * @param {string} type    - shape name
   * @param {number} size    - canvas width & height in pixels
   * @param {string} color   - CSS fill color
   * @returns {HTMLImageElement}
   */
  createImage(type, size = 256, color = 'black') {
    const offscreen = document.createElement('canvas');
    offscreen.width  = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d');
    this.draw(ctx, type, size / 2, size / 2, size * 0.38, color);

    const img = new Image();
    img.src   = offscreen.toDataURL('image/webp');
    return img;
  },

  /** Convenience colors for colored (non-shadow) object previews */
  objectColor(shape) {
    const palette = {
      ball:   '#FF6B6B',
      car:    '#4ECDC4',
      tree:   '#6BCB77',
      house:  '#FFD93D',
      star:   '#FFB347',
      rabbit: '#F4A261',
      bird:   '#74B9FF',
      dog:    '#D4A96A',
      fox:    '#E17055',
    };
    return palette[shape] || '#8B7CF8';
  }
};
