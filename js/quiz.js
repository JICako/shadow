/**
 * quiz.js — Shadow Quiz  «Көлеңкені тап!»
 *
 * Shows a shadow PNG (or canvas fallback) and presents multiple-choice answers.
 * Driven entirely by the JSON quiz array + objects lookup.
 *
 * JSON format:
 *   { shadow: "assets/shadow_car.png", shape: "car",
 *     options: ["ball","car","house"], correct: "car" }
 *
 * Exposed on window as: window.quiz  (so onclick="quiz.checkAnswer(...)" works)
 */

class ShadowQuiz {
  /**
   * @param {string} containerId - ID of the container <div>
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    /** @type {Array}        All quiz questions (shuffled per run) */
    this.questions  = [];

    /** @type {Object}       name → object data lookup */
    this.objects    = {};

    this.state = {
      current:  0,
      score:    0,
      total:    0,
      answered: false,
    };
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────── */

  /**
   * Load quiz data from content JSON.
   * @param {Array}  quizData    - array of quiz question objects
   * @param {Array}  objectsData - array of object definitions (for labels/emojis)
   */
  load(quizData, objectsData) {
    // Build object lookup map
    this.objects = {};
    objectsData.forEach(obj => { this.objects[obj.name] = obj; });

    // Shuffle questions
    this.questions      = [...quizData].sort(() => Math.random() - 0.5);
    this.state.total    = Math.min(this.questions.length, 10);
    this.state.current  = 0;
    this.state.score    = 0;
    this.state.answered = false;

    this._renderQuestion();
  }

  /** Called by HTML onclick */
  checkAnswer(selected, correct, btn) {
    if (this.state.answered) return;
    this.state.answered = true;

    const isCorrect = selected === correct;

    if (isCorrect) {
      this.state.score++;
      btn.classList.add('correct');
    } else {
      btn.classList.add('wrong');
      // Highlight the correct button
      this.container.querySelectorAll('.quiz-opt').forEach(b => {
        if (b.dataset.name === correct) b.classList.add('correct');
      });
    }

    // Show feedback badge
    const badge = this.container.querySelector('#quiz-feedback');
    if (badge) {
      badge.textContent = isCorrect ? '✅ Дұрыс!' : '❌ Дұрыс емес!';
      badge.className   = `quiz-feedback ${isCorrect ? 'ok' : 'fail'}`;
    }

    // Show Next button
    const nextBtn = this.container.querySelector('#quiz-next');
    if (nextBtn) nextBtn.classList.add('visible');
  }

  /** Advance to the next question */
  next() {
    this.state.current++;
    this._renderQuestion();
  }

  /** Restart the quiz */
  restart() {
    this.questions      = [...this.questions].sort(() => Math.random() - 0.5);
    this.state.current  = 0;
    this.state.score    = 0;
    this.state.answered = false;
    this._renderQuestion();
  }

  /* ─────────────────────────────────────────────────────────
     RENDERING
  ───────────────────────────────────────────────────────── */

  _renderQuestion() {
    const { current, total } = this.state;

    if (current >= total) {
      this._renderResult();
      return;
    }

    const q = this.questions[current];
    this.state.answered = false;

    // Build options list with labels from object map
    const options = q.options.map(name => ({
      name,
      label: this.objects[name]?.label || name,
      emoji: this.objects[name]?.emoji || '❓',
    }));

    // Progress percentage
    const pct = Math.round((current / total) * 100);

    this.container.innerHTML = `
      <div class="quiz-card">

        <!-- Progress bar -->
        <div class="quiz-progress">
          <span class="qp-text">${current + 1} / ${total}</span>
          <div class="qp-track">
            <div class="qp-fill" style="width:${pct}%"></div>
          </div>
          <span class="qp-score">⭐ ${this.state.score}</span>
        </div>

        <!-- Shadow display -->
        <div class="quiz-shadow-wrap">
          <p class="quiz-prompt">Бұл не? Көлеңке бойынша тап! 🔍</p>
          <canvas id="quiz-canvas" class="quiz-canvas" width="280" height="280"></canvas>
        </div>

        <!-- Options -->
        <div class="quiz-options">
          ${options.map(opt => `
            <button class="quiz-opt"
                    data-name="${opt.name}"
                    onclick="quiz.checkAnswer('${opt.name}','${q.correct}',this)">
              <span class="opt-emoji">${opt.emoji}</span>
              <span class="opt-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Feedback badge -->
        <div id="quiz-feedback" class="quiz-feedback"></div>

        <!-- Next button -->
        <button id="quiz-next" class="quiz-next" onclick="quiz.next()">
          ${current + 1 >= total ? 'Нәтижені көру 🏆' : 'Келесі →'}
        </button>

      </div>
    `;

    // Draw the shadow on the canvas after DOM is ready
    requestAnimationFrame(() => {
      const canvas = document.getElementById('quiz-canvas');
      if (canvas) this._drawShadowCanvas(canvas, q.shadow, q.shape);
    });
  }

  /**
   * Draw the shadow PNG (or shape fallback) on the quiz display canvas.
   * Dark background with ambient glow to simulate a shadow viewer.
   */
  _drawShadowCanvas(canvas, shadowSrc, shape) {
    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;

    // Dark background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Ambient radial glow (mystery!)
    const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55);
    glow.addColorStop(0, 'rgba(255,220,50,0.07)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Attempt to load the PNG
    const img   = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => {
      ctx.save();
      ctx.globalAlpha = 0.94;
      const size = Math.min(W, H) * 0.66;
      ctx.drawImage(img, W / 2 - size / 2, H / 2 - size / 2, size, size);
      ctx.restore();

      // Scan-lines effect for drama
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = 'black';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.restore();
    };
    img.onerror = () => {
      // Canvas-drawn fallback silhouette
      Shapes.draw(ctx, shape, W / 2, H / 2, W * 0.3, 'rgba(0,0,0,0.92)');
    };
    img.src = shadowSrc;
  }

  /** Final score screen */
  _renderResult() {
    const { score, total } = this.state;
    const pct   = Math.round((score / total) * 100);
    const stars = pct >= 80 ? '⭐⭐⭐' : pct >= 50 ? '⭐⭐' : pct >= 20 ? '⭐' : '☆';
    const msg   = pct >= 80 ? 'Өте керемет! Көлеңке шебері! 🌟'
                : pct >= 50 ? 'Жақсы! Үйрене бересің! 👍'
                :             'Тырыс! Келесі жолы бақытың болар! 💪';

    this.container.innerHTML = `
      <div class="quiz-result">
        <div class="result-stars">${stars}</div>
        <h2 class="result-title">Ойын бітті!</h2>
        <div class="result-score">${score} <span>/ ${total}</span></div>
        <p class="result-msg">${msg}</p>
        <button class="quiz-restart" onclick="quiz.restart()">🔄 Қайта ойна</button>
      </div>
    `;
  }
}
