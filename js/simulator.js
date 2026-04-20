/**
 * simulator.js — Shadow Physics Simulator
 *
 * Core shadow physics (per task spec):
 *   shadowScale = 1 + (distance / 300)
 *   shadowX     = objectX + (objectX - lightX) * 0.5
 *   shadowY     = objectY + (objectY - lightY) * 0.5
 *   rotation    = atan2(objectY - lightY, objectX - lightX)
 *
 * Shadow images are PNG silhouettes (with canvas fallback).
 * NO CSS blur or box-shadow — only PNG/canvas silhouettes.
 */

class ShadowSimulator {
  /**
   * @param {string} canvasId - ID of the <canvas> element
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');

    /** @type {Array<{name,label,emoji,shape,image:Image,shadowImg:Image}>} */
    this.objects        = [];
    this.selectedObject = null;

    // Light source position in logical (CSS) pixels
    this.light = { x: 150, y: 120 };

    this.showLight  = true;
    this.showRay    = true;
    this.showInfo   = true;

    // Logical canvas dimensions (CSS pixels)
    this.W = 0;
    this.H = 0;

    this._bindEvents();
    this._resize();
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────── */

  /**
   * Load objects from the JSON content array.
   * Each entry must have: name, label, emoji, shape, image (path), shadow (path)
   */
  loadObjects(objects) {
    this.objects = objects.map(obj => ({
      ...obj,
      image:     this._loadImage(obj.image,  obj.shape, false),
      shadowImg: this._loadImage(obj.shadow, obj.shape, true),
    }));

    if (!this.selectedObject && this.objects.length > 0) {
      this.selectedObject = this.objects[0];
    } else if (this.selectedObject) {
      // Keep selection by name if possible
      const keep = this.objects.find(o => o.name === this.selectedObject.name);
      this.selectedObject = keep || this.objects[0];
    }

    this.render();
    return this;
  }

  /** Select active object by name */
  selectObject(name) {
    const found = this.objects.find(o => o.name === name);
    if (found) {
      this.selectedObject = found;
      this.render();
    }
  }

  /** Toggle light-source indicator visibility */
  toggleLight() {
    this.showLight = !this.showLight;
    this.render();
  }

  /* ─────────────────────────────────────────────────────────
     SHADOW PHYSICS
  ───────────────────────────────────────────────────────── */

  /**
   * Calculate shadow transform parameters from light + object positions.
   * All coordinates in logical pixels.
   *
   * @param {number} objX - object center X
   * @param {number} objY - object center Y
   * @returns {{ shadowX, shadowY, shadowScale, rotation, opacity, distance }}
   */
  _calcShadow(objX, objY) {
    const dx       = objX - this.light.x;
    const dy       = objY - this.light.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Bigger shadow when light is closer
    const shadowScale = 1 + (distance / 300);

    // Shadow is projected opposite the light direction
    const shadowX = objX + dx * 0.5;
    const shadowY = objY + dy * 0.5;

    // Soft opacity falloff — shadow fades as light moves far away
    const opacity = Math.max(0.12, Math.min(0.88, 1 - distance / 750));

    // Light is "below horizon" if its Y exceeds the horizon line
    const belowHorizon = this.light.y >= this.H * 0.54;

    return { shadowX, shadowY, shadowScale, opacity, distance, belowHorizon };
  }

  /* ─────────────────────────────────────────────────────────
     RENDERING
  ───────────────────────────────────────────────────────── */

  render() {
    const { ctx, W, H } = this;
    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    this._drawBackground();

    if (!this.selectedObject) return;

    // Object anchored at center-bottom area
    const objX    = W / 2;
    const objY    = H * 0.60;
    const objSize = Math.min(W, H) * 0.22;

    const shadow = this._calcShadow(objX, objY);

    // Draw shadow first (behind the object)
    this._drawShadow(shadow, objX, objY, objSize);

    // Draw object
    this._drawObject(objX, objY, objSize);

    // Light ray (dashed line from light to object)
    if (this.showRay) this._drawRay(objX, objY);

    // Light source indicator
    if (this.showLight) this._drawLight();

    // Info overlay (distance, scale)
    if (this.showInfo) this._drawInfo(shadow);
  }

  _drawBackground() {
    const { ctx, W, H } = this;

    // Night sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#0d0d2b');
    sky.addColorStop(1, '#1a1a45');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Ground / floor
    const ground = ctx.createLinearGradient(0, H * 0.55, 0, H);
    ground.addColorStop(0, '#c8a97e');
    ground.addColorStop(1, '#7a5c3a');
    ctx.fillStyle = ground;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    // Horizon line
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, H * 0.54, W, 4);

    // Subtle stars in sky
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    // Deterministic star positions (so they don't flicker on re-render)
    const starSeeds = [0.12,0.88,0.3,0.67,0.45,0.78,0.22,0.55,0.9,0.08];
    starSeeds.forEach((s, i) => {
      const sx = (s * W * 1.3) % W;
      const sy = ((starSeeds[(i + 3) % 10] * H * 0.5)) % (H * 0.48);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Draw the shadow PNG (or canvas fallback), applying physics transforms.
   * The shadow stretches in the direction from light to object.
   */
  _drawShadow(shadow, objX, objY, objSize) {
    const { ctx, W, H } = this;
    const { shadowX, shadowY, shadowScale, opacity, belowHorizon } = shadow;
    const img = this.selectedObject?.shadowImg;

    // No shadow if light is at or below the horizon
    if (belowHorizon) {
      // Show "below horizon" notice instead
      ctx.save();
      ctx.fillStyle = 'rgba(255,120,0,0.72)';
      ctx.font      = `bold ${Math.max(12, W * 0.022)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🌅 Күн көкжиектен төмен — көлеңке жоқ', W / 2, H * 0.80);
      ctx.restore();
      return;
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Shadow width = object size × scale (grows with distance)
    const sw = objSize * shadowScale * 1.7;
    // Shadow height = flatten significantly (floor projection effect)
    const sh = objSize * shadowScale * 0.38;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'multiply'; // darken floor naturally

    // No rotation — shadow only changes size and position
    ctx.drawImage(img, shadowX - sw / 2, shadowY - sh / 2, sw, sh);

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  /** Draw the object PNG (or canvas fallback) */
  _drawObject(x, y, size) {
    const { ctx } = this;
    const img = this.selectedObject?.image;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    } else {
      // Still loading — draw placeholder shape
      ctx.save();
      Shapes.draw(ctx, this.selectedObject?.shape || 'circle',
                  x, y, size / 2, Shapes.objectColor(this.selectedObject?.shape));
      ctx.restore();
    }
  }

  /** Draw glowing light-source indicator */
  _drawLight() {
    const { ctx } = this;
    const { x, y } = this.light;

    // Outer glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 70);
    glow.addColorStop(0,   'rgba(255,220,50,0.92)');
    glow.addColorStop(0.3, 'rgba(255,170,30,0.5)');
    glow.addColorStop(1,   'rgba(255,120,0,0)');

    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.fill();

    // Core disc
    ctx.fillStyle = '#FFE033';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,240,180,0.8)';
    ctx.font = `bold ${Math.max(11, this.W * 0.018)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('☀ Жарық', x, y + 32);

    ctx.restore();
  }

  /** Dashed line from light source to object */
  _drawRay(objX, objY) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,220,50,0.12)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.moveTo(this.light.x, this.light.y);
    ctx.lineTo(objX, objY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /** Physics info overlay (top-left) */
  _drawInfo(shadow) {
    const { ctx, W } = this;
    const fs = Math.max(11, W * 0.018);
    const label2 = shadow.belowHorizon
      ? '🌅 Күн горизонт астында'
      : `🔍 Масштаб:  ${shadow.shadowScale.toFixed(2)}×`;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(10, 10, 260, 72, 10);
    else               ctx.rect(10, 10, 260, 72);
    ctx.fill();

    ctx.fillStyle = '#FFE033';
    ctx.font      = `bold ${fs}px Nunito, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`📏 Қашықтық: ${Math.round(shadow.distance)} px`, 22, 36);
    ctx.fillText(label2, 22, 62);
    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     IMAGE LOADING
  ───────────────────────────────────────────────────────── */

  /**
   * Load a PNG asset; fall back to a canvas-generated silhouette on error.
   * @param {string}  src      - asset path (e.g. "assets/ball.png")
   * @param {string}  shape    - shape name for fallback renderer
   * @param {boolean} isShadow - true ⇒ render black silhouette, else object color
   * @returns {HTMLImageElement}
   */
  _loadImage(src, shape, isShadow) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload  = () => this.render();
    img.onerror = () => {
      // Generate canvas-drawn fallback silhouette
      const color = isShadow ? 'rgba(0,0,0,0.88)' : Shapes.objectColor(shape);
      const off   = document.createElement('canvas');
      off.width   = 256;
      off.height  = 256;
      Shapes.draw(off.getContext('2d'), shape, 128, 128, 96, color);

      img.onerror = null;       // prevent infinite loop
      img.onload  = () => this.render();
      img.src     = off.toDataURL('image/png');
    };

    img.src = src;
    return img;
  }

  /* ─────────────────────────────────────────────────────────
     CANVAS RESIZE
  ───────────────────────────────────────────────────────── */

  _resize() {
    const dpr  = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth  || 800;
    const cssH = this.canvas.clientHeight || 440;

    // Physical pixels
    this.canvas.width  = cssW * dpr;
    this.canvas.height = cssH * dpr;

    // Logical pixel dimensions stored for drawing code
    this.W = cssW;
    this.H = cssH;

    // Scale once (replaces any previous transform)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Default light position (top-left quadrant)
    this.light = { x: cssW * 0.18, y: cssH * 0.22 };

    this.render();
  }

  /* ─────────────────────────────────────────────────────────
     EVENT BINDING
  ───────────────────────────────────────────────────────── */

  _bindEvents() {
    const canvas = this.canvas;

    /** Convert mouse/touch event to logical canvas coordinates */
    const toLogical = (e) => {
      const rect  = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    // Mouse
    canvas.addEventListener('mousemove', (e) => {
      e.preventDefault();
      this.light = toLogical(e);
      this.render();
    });

    // Touch
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.light = toLogical(e);
      this.render();
    }, { passive: false });

    // Resize
    window.addEventListener('resize', () => this._resize());
  }
}
