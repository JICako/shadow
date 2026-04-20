/**
 * app.js — Main Application Controller
 *
 * Responsibilities:
 *   - Navigation between pages
 *   - Loading content (default embedded + user JSON upload)
 *   - Creating and wiring the simulator / theater / quiz modules
 *   - Toast notifications
 *
 * Content flow:
 *   1. App boots with _defaultContent() (no server required — works on file://)
 *   2. User can click "JSON жүктеу" to upload a custom content.json
 *   3. On load, all modules refresh without page reload
 */

class App {
  constructor() {
    /** @type {{objects, theater, quiz}} */
    this.data = null;

    /** @type {ShadowSimulator|null} */
    this.simulator = null;

    /** @type {ShadowTheater|null} */
    this.theater   = null;

    /** @type {ShadowQuiz|null}     (also available as window.quiz) */
    this.quiz      = null;

    this.currentPage = 'home';

    this._init();
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  _init() {
    // Load default content immediately
    this.data = this._defaultContent();

    // Wire navigation buttons
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => this.navigateTo(btn.dataset.page));
    });

    // Home info-cards also navigate
    document.querySelectorAll('[data-nav]').forEach(card => {
      card.addEventListener('click', () => this.navigateTo(card.dataset.nav));
    });

    // JSON upload
    const fileInput = document.getElementById('json-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this._handleJsonFile(file);
        fileInput.value = ''; // reset so same file can be re-loaded
      });
    }

    // Show home
    this.navigateTo('home');
  }

  /* ─────────────────────────────────────────────────────────
     NAVIGATION
  ───────────────────────────────────────────────────────── */

  navigateTo(page) {
    this.currentPage = page;

    // Toggle page visibility
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Toggle nav-button active state
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    this._initPage(page);
  }

  /** Lazy-initialize a page's module on first visit */
  _initPage(page) {
    switch (page) {

      case 'simulator': {
        if (!this.simulator) {
          this.simulator = new ShadowSimulator('sim-canvas');
          this.simulator.loadObjects(this.data.objects);
          this._buildObjectBtns();
        } else {
          // Re-trigger resize in case the canvas was hidden
          this.simulator._resize();
        }
        break;
      }

      case 'theater': {
        if (!this.theater) {
          this.theater = new ShadowTheater('theater-canvas');
          this.theater.loadHands(this.data.theater);
          this._buildHandBtns();
        } else {
          this.theater._resize();
        }
        break;
      }

      case 'quiz': {
        if (!this.quiz) {
          this.quiz  = new ShadowQuiz('quiz-container');
          window.quiz = this.quiz; // needed for onclick= handlers in quiz HTML
        }
        this.quiz.load(this.data.quiz, this.data.objects);
        break;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────
     DYNAMIC BUTTONS
  ───────────────────────────────────────────────────────── */

  _buildObjectBtns() {
    const wrap = document.getElementById('obj-buttons');
    if (!wrap) return;

    wrap.innerHTML = this.data.objects.map((obj, i) => `
      <button class="obj-btn ${i === 0 ? 'active' : ''}"
              onclick="app.selectObject('${obj.name}')">
        ${obj.emoji || ''} ${obj.label || obj.name}
      </button>
    `).join('');
  }

  _buildHandBtns() {
    const wrap = document.getElementById('hand-buttons');
    if (!wrap) return;

    wrap.innerHTML = this.data.theater.map((item, i) => `
      <button class="obj-btn ${i === 0 ? 'active' : ''}"
              onclick="app.selectHand('${item.name}')">
        ${item.emoji || '🖐'} ${item.label || item.name}
      </button>
    `).join('');
  }

  /* ─────────────────────────────────────────────────────────
     OBJECT / HAND SELECTION  (called from dynamic buttons)
  ───────────────────────────────────────────────────────── */

  selectObject(name) {
    this.simulator?.selectObject(name);
    document.querySelectorAll('#obj-buttons .obj-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset?.name === name ||
                                     btn.textContent.trim().includes(name));
    });
  }

  selectHand(name) {
    this.theater?.selectHand(name);
    document.querySelectorAll('#hand-buttons .obj-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim().includes(name));
    });
  }

  /* ─────────────────────────────────────────────────────────
     JSON UPLOAD
  ───────────────────────────────────────────────────────── */

  /** Trigger the hidden file input */
  openJsonPicker() {
    document.getElementById('json-file-input')?.click();
  }

  _handleJsonFile(file) {
    if (!file.name.endsWith('.json')) {
      this.toast('⚠️ Тек .json файл жарайды!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        // Validate required keys
        if (!parsed.objects || !parsed.theater || !parsed.quiz) {
          throw new Error('JSON структурасы дұрыс емес');
        }

        this.data = parsed;
        this._applyNewData();
        this.toast('✅ JSON сәтті жүктелді!', 'success');
      } catch (err) {
        this.toast(`❌ JSON қате: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  /** Apply freshly loaded data to all already-initialized modules */
  _applyNewData() {
    if (this.simulator) {
      this.simulator.loadObjects(this.data.objects);
      this._buildObjectBtns();
    }
    if (this.theater) {
      this.theater.loadHands(this.data.theater);
      this._buildHandBtns();
    }
    if (this.quiz) {
      this.quiz.load(this.data.quiz, this.data.objects);
    }
  }

  /* ─────────────────────────────────────────────────────────
     TOAST NOTIFICATIONS
  ───────────────────────────────────────────────────────── */

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className   = `toast toast-${type}`;
    el.textContent = message;
    document.body.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });

    // Animate out and remove
    setTimeout(() => {
      el.classList.remove('show');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, 3200);
  }

  /* ─────────────────────────────────────────────────────────
     DEFAULT CONTENT  (embedded so the app works offline / file://)
  ───────────────────────────────────────────────────────── */

  _defaultContent() {
    return {
      objects: [
        {
          name:   'ball',
          label:  'Шар',
          emoji:  '⚽',
          image:  'assets/ball.png',
          shadow: 'assets/shadow_ball.png',
          shape:  'ball',
        },
        {
          name:   'car',
          label:  'Машина',
          emoji:  '🚗',
          image:  'assets/car.png',
          shadow: 'assets/shadow_car.png',
          shape:  'car',
        },
        {
          name:   'tree',
          label:  'Ағаш',
          emoji:  '🌳',
          image:  'assets/tree.png',
          shadow: 'assets/shadow_tree.png',
          shape:  'tree',
        },
        {
          name:   'house',
          label:  'Үй',
          emoji:  '🏠',
          image:  'assets/house.png',
          shadow: 'assets/shadow_house.png',
          shape:  'house',
        },
        {
          name:   'star',
          label:  'Жұлдыз',
          emoji:  '⭐',
          image:  'assets/star.png',
          shadow: 'assets/shadow_star.png',
          shape:  'star',
        },
      ],

      theater: [
        {
          name:   'rabbit',
          label:  'Қоян',
          emoji:  '🐰',
          hand:   'assets/hand_rabbit.png',
          shadow: 'assets/shadow_rabbit.png',
          shape:  'rabbit',
        },
        {
          name:   'bird',
          label:  'Құс',
          emoji:  '🐦',
          hand:   'assets/hand_bird.png',
          shadow: 'assets/shadow_bird.png',
          shape:  'bird',
        },
        {
          name:   'dog',
          label:  'Ит',
          emoji:  '🐕',
          hand:   'assets/hand_dog.png',
          shadow: 'assets/shadow_dog.png',
          shape:  'dog',
        },
        {
          name:   'fox',
          label:  'Түлкі',
          emoji:  '🦊',
          hand:   'assets/hand_fox.png',
          shadow: 'assets/shadow_fox.png',
          shape:  'fox',
        },
      ],

      quiz: [
        {
          shadow:  'assets/shadow_ball.png',
          shape:   'ball',
          options: ['ball', 'star', 'car'],
          correct: 'ball',
        },
        {
          shadow:  'assets/shadow_car.png',
          shape:   'car',
          options: ['tree', 'car', 'house'],
          correct: 'car',
        },
        {
          shadow:  'assets/shadow_tree.png',
          shape:   'tree',
          options: ['star', 'ball', 'tree'],
          correct: 'tree',
        },
        {
          shadow:  'assets/shadow_house.png',
          shape:   'house',
          options: ['house', 'car', 'ball'],
          correct: 'house',
        },
        {
          shadow:  'assets/shadow_star.png',
          shape:   'star',
          options: ['star', 'tree', 'rabbit'],
          correct: 'star',
        },
        {
          shadow:  'assets/shadow_rabbit.png',
          shape:   'rabbit',
          options: ['rabbit', 'dog', 'fox'],
          correct: 'rabbit',
        },
        {
          shadow:  'assets/shadow_bird.png',
          shape:   'bird',
          options: ['fox', 'bird', 'car'],
          correct: 'bird',
        },
        {
          shadow:  'assets/shadow_dog.png',
          shape:   'dog',
          options: ['dog', 'tree', 'star'],
          correct: 'dog',
        },
      ],
    };
  }
}

/* ─────────────────────────────────────────────────────────
   BOOTSTRAP
───────────────────────────────────────────────────────── */
const app = new App();
