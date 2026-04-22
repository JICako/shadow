/**
 * pages.js — Logic for new educational pages
 *
 * Pages handled:
 *   - organize   : Ұйымдастыру кезең (slider)
 *   - bekitu     : Бекіту тапсырмалары (flashcard Q&A)
 *   - tolkyn     : Толқын мен сәуле (dropdowns)
 *   - sen        : Сен білесіңбе? (video + test placeholder)
 *   - sergiту    : Сергіту сәті (dance video)
 */

/* ================================================================
   1. ORGANIZE — Slider / Stepper
================================================================ */

const organizeSlides = [
  { text: "Дайындал!",            img: "assets/down.png" },
  { text: "Күн шықты!",           img: "assets/up.png" },
  { text: "Көлеңке пайда болды!", img: "assets/down.png" },
  { text: "Күн жасырынды!",       img: "assets/cover.png" },
  { text: "Желмен қозғалады!",    img: "assets/wave.png" },
];

let organizeIndex = 0;

// Placeholder emojis shown when slide image isn't found
const organizeFallbackEmojis = ['', '', '', '', ''];

function organizeRender() {
  const slide  = organizeSlides[organizeIndex];
  const total  = organizeSlides.length;
  const imgEl  = document.getElementById('org-img');
  const txtEl  = document.getElementById('org-text');
  const phEl   = document.getElementById('org-placeholder');
  const dotCnt = document.getElementById('org-dots');
  const btnPrev = document.getElementById('org-prev');
  const btnNext = document.getElementById('org-next');

  if (!imgEl) return;

  // Fade-out then update
  imgEl.classList.add('fade-out');
  txtEl.classList.add('fade-out');

  setTimeout(() => {
    imgEl.src = slide.img;
    imgEl.alt = slide.text;
    txtEl.textContent = slide.text;

    // Show placeholder emoji if image fails
    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      if (phEl) { phEl.textContent = organizeFallbackEmojis[organizeIndex] || '🌟'; phEl.style.opacity = '0.5'; }
    };
    imgEl.onload = () => {
      imgEl.style.display = '';
      if (phEl) phEl.style.opacity = '0.18';
    };

    // Dots
    if (dotCnt) {
      dotCnt.innerHTML = organizeSlides.map((_, i) =>
        `<span class="org-dot ${i === organizeIndex ? 'active' : ''}"></span>`
      ).join('');
    }

    // Button states
    if (btnPrev) btnPrev.disabled = (organizeIndex === 0);
    if (btnNext) btnNext.disabled = (organizeIndex === total - 1);

    imgEl.classList.remove('fade-out');
    txtEl.classList.remove('fade-out');
  }, 180);
}

function organizePrev() {
  if (organizeIndex > 0) { organizeIndex--; organizeRender(); }
}

function organizeNext() {
  if (organizeIndex < organizeSlides.length - 1) { organizeIndex++; organizeRender(); }
}

// Init on first page visit
function initOrganize() {
  organizeIndex = 0;
  organizeRender();
}


/* ================================================================
   2. BEKITU — Flashcard Q&A
================================================================ */

const bekituQuestions = [
  { q: "Көлеңке пайда болу үшін жарық көзі қажет пе?",                     a: "Иә" },
  { q: "Мөлдір заттар көлеңке түсіре ме?",                                  a: "Жоқ" },
  { q: "Көлеңке дененің пішінін қайталай ма?",                               a: "Иә" },
  { q: "Қараңғы бөлмеде көлеңке айқын көріне ме?",                          a: "Жоқ" },
  { q: "Жарық сәулесі мөлдір емес денені өте ала ма?",                      a: "Жоқ" },
  { q: "Айдың тұтылуы — Жердің көлеңкесі Айға түскенде болады?",            a: "Иә" },
  { q: "Күннің толық тұтылуы жиі кездеседі ме?",                            a: "Жоқ" },
];

let bekituIndex   = 0;
let bekituAnswered = false;

function bekituRender() {
  const container = document.getElementById('bekitu-container');
  if (!container) return;

  const q     = bekituQuestions[bekituIndex];
  const total = bekituQuestions.length;

  container.innerHTML = `
    <div class="bek-progress">
      <span class="bek-num">${bekituIndex + 1} / ${total}</span>
      <div class="bek-track"><div class="bek-fill" style="width:${((bekituIndex+1)/total)*100}%"></div></div>
    </div>

    <div class="bek-card" id="bek-card">
      <div class="bek-question">${q.q}</div>
      <div class="bek-buttons" id="bek-buttons">
        <button class="bek-btn bek-yes" onclick="bekituAnswer('Иә')">✅ Иә</button>
        <button class="bek-btn bek-no"  onclick="bekituAnswer('Жоқ')">❌ Жоқ</button>
      </div>
      <div class="bek-feedback" id="bek-feedback"></div>
    </div>

    ${bekituIndex < total - 1
      ? `<button class="bek-nav-btn" id="bek-next-btn" style="display:none" onclick="bekituNext()">Келесі сұрақ →</button>`
      : `<button class="bek-nav-btn bek-restart" id="bek-next-btn" style="display:none" onclick="bekituRestart()">🔄 Қайта бастау</button>`
    }
  `;

  bekituAnswered = false;
}

function bekituAnswer(chosen) {
  if (bekituAnswered) return;
  bekituAnswered = true;

  const q        = bekituQuestions[bekituIndex];
  const correct  = q.a;
  const feedback = document.getElementById('bek-feedback');
  const btns     = document.querySelectorAll('.bek-btn');
  const nextBtn  = document.getElementById('bek-next-btn');

  btns.forEach(btn => {
    btn.disabled = true;
    const label = btn.classList.contains('bek-yes') ? 'Иә' : 'Жоқ';
    if (label === correct)  btn.classList.add('bek-correct');
    if (label !== correct)  btn.classList.add('bek-wrong');
  });

  if (feedback) {
    feedback.textContent = chosen === correct ? '🎉 Дұрыс!' : `❌ Дұрыс жауап: ${correct}`;
    feedback.className   = 'bek-feedback ' + (chosen === correct ? 'bek-fb-ok' : 'bek-fb-fail');
  }

  if (nextBtn) nextBtn.style.display = 'block';
}

function bekituNext() {
  if (bekituIndex < bekituQuestions.length - 1) {
    bekituIndex++;
    bekituRender();
  }
}

function bekituRestart() {
  bekituIndex = 0;
  bekituRender();
}

function initBekitu() {
  bekituIndex = 0;
  bekituRender();
}


/* ================================================================
   3. TOLKYN — Accordion info panels (Толқын мен сәуле)
================================================================ */

/**
 * Toggle an accordion panel open/closed.
 * Reusable: pass any accordion element id.
 * @param {string} id - id of the .tolkyn-accordion wrapper
 */
function tolkynToggle(id) {
  const accordion = document.getElementById(id);
  if (!accordion) return;

  const isOpen = accordion.classList.contains('open');
  const header = accordion.querySelector('.tolkyn-accord-header');
  const body   = accordion.querySelector('.tolkyn-accord-body');

  if (isOpen) {
    // Close: collapse height from scrollHeight → 0
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => {
      body.style.maxHeight = '0';
    });
    accordion.classList.remove('open');
    if (header) header.setAttribute('aria-expanded', 'false');
  } else {
    // Open: expand to content height
    body.style.maxHeight = body.scrollHeight + 'px';
    accordion.classList.add('open');
    if (header) header.setAttribute('aria-expanded', 'true');
    // Clear inline style after transition so content can resize freely
    body.addEventListener('transitionend', () => {
      if (accordion.classList.contains('open')) body.style.maxHeight = 'none';
    }, { once: true });
  }
}

function initTolkyn() {
  // Reset both accordions to closed on page (re)visit
  ['accord-diff', 'accord-sim'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    const body   = el.querySelector('.tolkyn-accord-body');
    const header = el.querySelector('.tolkyn-accord-header');
    if (body)   body.style.maxHeight = '0';
    if (header) header.setAttribute('aria-expanded', 'false');
  });
}


/* ================================================================
   4. SEN — Video + text + test (Сен білесіңбе?)
================================================================ */

function initSen() {
  // placeholder — content set via HTML comments
}


/* ================================================================
   5. SERGIТУ — Dance video (Сергіту сәті)
================================================================ */

function initSergiту() {
  // placeholder — video set via HTML comment
}
