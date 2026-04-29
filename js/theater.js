/**
 * theater.js — Shadow Theater (Тень театры)
 *
 * Shows a hand silhouette the user can drag around a dark canvas.
 * A fixed off-screen "lamp" casts a shadow using the same physics as
 * the simulator.  Shadow PNG is used (or canvas fallback).
 *
 * Layout:
 *   - Dark theater stage (black bg with red curtain vignette)
 *   - White "screen" area where projected shadow appears
 *   - Hand silhouette follows the pointer/finger (draggable)
 *   - Light source is fixed at top-left (lamp)
 */

class ShadowTheater {
  /**
   * @param {string} canvasId - ID of the <canvas> element
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');

    /** @type {Array<{name,label,shape,handImg:Image,shadowImg:Image}>} */
    this.hands    = [];
    this.selected = null;

    // Hand position in logical pixels (user drags this)
    this.handPos  = { x: 0, y: 0 };

    // Fixed lamp position (logical)
    this.lamp     = { x: 0, y: 0 };

    this.isDragging = false;

    // Logical canvas dimensions
    this.W = 0;
    this.H = 0;

    this._resize();
    this._bindEvents();
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────── */

  /**
   * Load theater hands from the JSON content array.
   * Each entry: { name, label, shape, hand (path), shadow (path) }
   */
  loadHands(theaterData) {
    this.hands = theaterData.map(item => ({
      ...item,
      handImg:   this._loadImage(item.hand,   item.shape, false),
      shadowImg: this._loadImage(item.shadow, item.shape, true),
    }));

    if (!this.selected && this.hands.length > 0) {
      this.selected = this.hands[0];
    }

    this.render();
    return this;
  }

  /** Select the active hand figure by name */
  selectHand(name) {
    const found = this.hands.find(h => h.name === name);
    if (found) {
      this.selected = found;
      this.render();
    }
  }

  /* ─────────────────────────────────────────────────────────
     SHADOW PHYSICS (same formulas as simulator)
  ───────────────────────────────────────────────────────── */

  _calcShadow(hx, hy) {
    const dx       = hx - this.lamp.x;
    const dy       = hy - this.lamp.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const shadowScale = 1 + (distance / 300);
    const shadowX     = hx + dx * 0.8;   // more offset for dramatic theater effect
    const shadowY     = hy + dy * 0.8;
    const opacity     = Math.max(0.25, Math.min(0.96, 1 - distance / 650));

    return { shadowX, shadowY, shadowScale, opacity, distance };
  }

  /* ─────────────────────────────────────────────────────────
     RENDERING
  ───────────────────────────────────────────────────────── */

  render() {
    const { ctx, W, H } = this;
    if (W === 0 || H === 0) return;

    ctx.clearRect(0, 0, W, H);

    this._drawStage();
    if (!this.selected) return;

    const hx       = this.handPos.x;
    const hy       = this.handPos.y;
    const handSize = Math.min(W, H) * 0.28;
    const shadow   = this._calcShadow(hx, hy);

    // Draw shadow first (on the "screen")
    this._drawHandShadow(shadow, handSize);

    // Draw hand on top
    this._drawHand(hx, hy, handSize);

    // Lamp indicator
    this._drawLamp();

    // Hint
    this._drawHint();
  }

  _drawStage() {
    const { ctx, W, H } = this;

    // Black stage background
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, W, H);

    // Projection screen — bright white canvas where shadows appear
    const screenX = W * 0.12;
    const screenY = H * 0.06;
    const screenW = W * 0.76;
    const screenH = H * 0.72;

    // White screen base
    ctx.fillStyle = '#f8f5ee';
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Subtle warm inner glow (lamp light)
    const screenGlow = ctx.createRadialGradient(
      screenX + screenW * 0.35, screenY + screenH * 0.4, 0,
      screenX + screenW * 0.5,  screenY + screenH * 0.5, screenW * 0.7
    );
    screenGlow.addColorStop(0,   'rgba(255,245,210,0.55)');
    screenGlow.addColorStop(1,   'rgba(240,230,200,0)');
    ctx.fillStyle = screenGlow;
    ctx.fillRect(screenX, screenY, screenW, screenH);

    // Screen border / frame
    ctx.strokeStyle = 'rgba(180,160,120,0.6)';
    ctx.lineWidth   = 3;
    ctx.strokeRect(screenX, screenY, screenW, screenH);

    // Left curtain gradient
    const lgCurtain = ctx.createLinearGradient(0, 0, W * 0.13, 0);
    lgCurtain.addColorStop(0, 'rgba(100,12,18,0.92)');
    lgCurtain.addColorStop(1, 'rgba(100,12,18,0)');
    ctx.fillStyle = lgCurtain;
    ctx.fillRect(0, 0, W * 0.13, H);

    // Right curtain gradient
    const rgCurtain = ctx.createLinearGradient(W * 0.87, 0, W, 0);
    rgCurtain.addColorStop(0, 'rgba(100,12,18,0)');
    rgCurtain.addColorStop(1, 'rgba(100,12,18,0.92)');
    ctx.fillStyle = rgCurtain;
    ctx.fillRect(W * 0.87, 0, W * 0.13, H);

    // Stage floor
    const floor = ctx.createLinearGradient(0, H * 0.78, 0, H);
    floor.addColorStop(0, '#1a0e05');
    floor.addColorStop(1, '#0a0804');
    ctx.fillStyle = floor;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
  }

  /**
   * Draw the projected shadow on the screen area.
   * The shadow is larger and offset relative to the hand position.
   */
  _drawHandShadow(shadow, handSize) {
    const { ctx } = this;
    const { shadowX, shadowY, shadowScale, opacity } = shadow;
    const img = this.selected?.shadowImg;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Shadow is larger to simulate projection onto a distant screen
    const sw = handSize * shadowScale * 1.8;
    const sh = handSize * shadowScale * 1.8;

    ctx.save();
    ctx.globalAlpha = opacity;

    // No rotation — shadow falls exactly as the silhouette looks
    ctx.drawImage(img, shadowX - sw / 2, shadowY - sh / 2, sw, sh);

    ctx.restore();
  }

  /** Draw the hand/figure the user is dragging */
  _drawHand(x, y, size) {
    const { ctx } = this;
    const img = this.selected?.handImg;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    } else {
      // Fallback shape
      ctx.save();
      Shapes.draw(ctx, this.selected?.shape || 'bunny',
                  x, y, size / 2, Shapes.objectColor(this.selected?.shape));
      ctx.restore();
    }
  }

  /** Fixed lamp indicator in top-left area */
  _drawLamp() {
    const { ctx } = this;
    const { x, y } = this.lamp;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, 55);
    glow.addColorStop(0,   'rgba(255,240,180,0.95)');
    glow.addColorStop(0.4, 'rgba(255,190,60,0.5)');
    glow.addColorStop(1,   'rgba(255,130,0,0)');

    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 55, 0, Math.PI * 2);
    ctx.fill();

    // Bulb
    ctx.fillStyle = '#fffde0';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,240,180,0.7)';
    ctx.font      = `bold ${Math.max(10, this.W * 0.017)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('💡 Шам', x, y + 30);
    ctx.restore();
  }

  /** Bottom hint text */
  _drawHint() {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font      = `${Math.max(11, W * 0.02)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✋ Канвасты сүйреп жылжытыңыз', W / 2, H * 0.96);
    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────
     IMAGE LOADING
  ───────────────────────────────────────────────────────── */

  _loadImage(src, shape, isShadow) {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload  = () => this.render();
    img.onerror = () => {
      const color = isShadow ? 'rgba(0,0,0,0.9)' : Shapes.objectColor(shape);
      const off   = document.createElement('canvas');
      off.width   = 256;
      off.height  = 256;
      Shapes.draw(off.getContext('2d'), shape, 128, 128, 96, color);

      img.onerror = null;
      img.onload  = () => this.render();
      img.src     = off.toDataURL('image/webp');
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
    const cssH = this.canvas.clientHeight || 460;

    this.canvas.width  = cssW * dpr;
    this.canvas.height = cssH * dpr;

    this.W = cssW;
    this.H = cssH;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fixed lamp: top-left of stage
    this.lamp    = { x: cssW * 0.09, y: cssH * 0.14 };
    // Default hand center
    this.handPos = { x: cssW * 0.42, y: cssH * 0.46 };

    this.render();
  }

  /* ─────────────────────────────────────────────────────────
     EVENT BINDING
  ───────────────────────────────────────────────────────── */

  _bindEvents() {
    const canvas = this.canvas;

    const toLogical = (e) => {
      const rect  = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    // Drag hand on mouse
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.handPos    = toLogical(e);
      this.render();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.handPos = toLogical(e);
      this.render();
    });

    canvas.addEventListener('mouseup',   () => { this.isDragging = false; });
    canvas.addEventListener('mouseleave',() => { this.isDragging = false; });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.handPos    = toLogical(e);
      this.render();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handPos = toLogical(e);
      this.render();
    }, { passive: false });

    canvas.addEventListener('touchend', () => { this.isDragging = false; });

    window.addEventListener('resize', () => this._resize());
  }
}
