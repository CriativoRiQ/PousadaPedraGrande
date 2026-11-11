/* =========================================================
   Pousada Pedra Grande — interações, animações, formulários,
   consentimento (LGPD) e rastreamento.
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.PPG_CONFIG || {};
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PPG = window.PPG || {};
  var track = PPG.track || function () {};
  var getUtm = PPG.getUtm || function () { return {}; };
  var store = PPG.store;

  /* ---------- Toast ---------- */
  var toastEl = $('.toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('is-visible');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 4200);
  }

  /* ---------- Header, progresso, voltar ao topo, CTA móvel ---------- */
  var header = $('.site-header'), progress = $('.scroll-progress'), toTop = $('.back-to-top'), mCta = $('.mobile-cta');
  var hero = $('#inicio'), contact = $('#contato'), booking = $('#reserva');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = doc.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 40);
    progress.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    toTop.classList.toggle('is-visible', y > 700);
    var heroEnd = hero.offsetHeight * 0.8;
    var cTop = contact.getBoundingClientRect().top, bRect = booking.getBoundingClientRect();
    var bookingVisible = bRect.top < window.innerHeight && bRect.bottom > 0;
    mCta.classList.toggle('is-visible', y > heroEnd && cTop > window.innerHeight * 0.6 && !bookingVisible);
    parallax();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(onScroll); });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); $('.brand').focus({ preventScroll: true }); });

  /* ---------- Paralaxe leve ---------- */
  var parEls = reduceMotion ? [] : $$('[data-parallax]').filter(function (el) { return !(el.classList.contains('welcome-art') && window.innerWidth < 992); });
  function parallax() {
    var vh = window.innerHeight;
    parEls.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var offset = (r.top + r.height / 2 - vh / 2) * -speed;
      var base = el.classList.contains('welcome-art') && window.innerWidth >= 992 ? 'translateY(-50%) ' : '';
      el.style.transform = base + 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  /* ---------- Menu móvel ---------- */
  var toggle = $('.menu-toggle');
  function setMenu(open) {
    doc.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setMenu(!doc.body.classList.contains('menu-open')); });
  $$('.main-nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeFaq(); } });

  /* Link ativo conforme a seção visível */
  var navLinks = $$('.main-nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- Texto dividido em palavras (animação) ---------- */
  $$('.split').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) { return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>'; }).join(' ');
  });

  /* ---------- Revelação ao rolar ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion) return;
    var start = null, dur = 1600;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1), v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealTargets = $$('[data-anim], .split, .score-ring, [data-bars], [data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.hasAttribute('data-count')) countUp(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { obs.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Slider principal (textos entram/saem com blur suave) ---------- */
  $$('.slide-title[data-words]').forEach(function (t) {
    var i = 0;
    t.setAttribute('aria-label', t.textContent.replace(/\s+/g, ' ').trim());
    $$('.line', t).forEach(function (line) {
      line.setAttribute('aria-hidden', 'true');
      line.innerHTML = line.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="wd">' + w.split('').map(function (ch) { return '<span class="ch" style="--c:' + (i++) + '">' + ch + '</span>'; }).join('') + '</span>';
      }).join(' ');
    });
  });
  requestAnimationFrame(function () { doc.documentElement.classList.add('is-loaded'); });
  (function slider() {
    var slides = $$('.hero .slide'); if (slides.length < 2) return;
    var idx = 0, DURATION = 7500, startT = 0, elapsed = 0, paused = false;
    var bar = $('.slider-bar i'), cur = $('[data-current]');
    function go(n) {
      var old = slides[idx];
      old.classList.remove('is-active'); old.classList.add('is-leaving'); old.setAttribute('inert', '');
      setTimeout(function () { old.classList.remove('is-leaving'); }, 1700);
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.remove('is-leaving');
      slides[idx].classList.add('is-active'); slides[idx].removeAttribute('inert');
      cur.textContent = ('0' + (idx + 1)).slice(-2);
      elapsed = 0; startT = performance.now();
    }
    function loop(t) {
      if (!paused) {
        var p = (elapsed + t - startT) / DURATION;
        if (p >= 1) { go(idx + 1); p = 0; }
        bar.style.transform = 'scaleX(' + Math.min(p, 1) + ')';
      }
      requestAnimationFrame(loop);
    }
    function pause() { if (!paused) { paused = true; elapsed += performance.now() - startT; } }
    function resume() { if (paused) { paused = false; startT = performance.now(); } }
    $('[data-next]').addEventListener('click', function () { go(idx + 1); });
    $('[data-prev]').addEventListener('click', function () { go(idx - 1); });
    var heroEl = $('.hero');
    heroEl.addEventListener('focusin', pause); heroEl.addEventListener('focusout', resume);
    heroEl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
    doc.addEventListener('visibilitychange', function () { doc.hidden ? pause() : resume(); });
    var sx = null;
    heroEl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    heroEl.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); sx = null; });
    if (reduceMotion) DURATION = 10000;
    startT = performance.now(); requestAnimationFrame(loop);
  })();

  /* ---------- Pilha de cartas arrastáveis (Motion) ---------- */
  /* Usa as molas do Motion (motion.dev) quando a biblioteca carrega; senão, uma mola própria equivalente. */
  function spring(onUpdate, opts, done) {
    opts = opts || {};
    var stiffness = opts.stiffness || 260, damping = opts.damping || 24;
    if (reduceMotion) { onUpdate(1); if (done) done(); return { stop: function () {} }; }
    var M = window.Motion;
    if (M && typeof M.animate === 'function') {
      try {
        var ctrl = M.animate(0, 1, { type: 'spring', stiffness: stiffness, damping: damping, onUpdate: onUpdate, onComplete: done });
        return { stop: function () { try { ctrl.stop(); } catch (e) {} } };
      } catch (e) { /* segue para a mola própria */ }
    }
    var x = 0, v = 0, last = performance.now(), raf, stopped = false;
    function step(t) {
      if (stopped) return;
      var dt = Math.min((t - last) / 1000, 1 / 30); last = t;
      var a = -stiffness * (x - 1) - damping * v; v += a * dt; x += v * dt;
      onUpdate(x);
      if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) { onUpdate(1); if (done) done(); return; }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return { stop: function () { stopped = true; cancelAnimationFrame(raf); } };
  }
  (function cardStack() {
    var stack = $('.card-stack'); if (!stack) return;
    var cards = $$('.stack-card', stack);
    var order = cards.map(function (_, i) { return i; });
    var st = cards.map(function () { return { x: 0, y: 0, r: 0, s: 1, anim: null }; });
    var details = $$('.exp-detail'), counter = $('[data-stack-current]');
    var busy = false;

    function slot(p) {
      var rot = [0, -5, 4.5][p] || 0;
      return { x: [0, -16, 18][p] || 0, y: p * 16, r: rot, s: 1 - p * 0.06 };
    }
    function render(i) { var c = st[i]; cards[i].style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0) rotate(' + c.r.toFixed(2) + 'deg) scale(' + c.s.toFixed(3) + ')'; }
    function animateTo(i, tgt, opts, done) {
      var c = st[i]; if (c.anim) c.anim.stop();
      var from = { x: c.x, y: c.y, r: c.r, s: c.s };
      c.anim = spring(function (p) {
        c.x = from.x + (tgt.x - from.x) * p; c.y = from.y + (tgt.y - from.y) * p;
        c.r = from.r + (tgt.r - from.r) * p; c.s = from.s + (tgt.s - from.s) * p; render(i);
      }, opts, done);
    }
    function layout() {
      order.forEach(function (ci, p) {
        cards[ci].style.zIndex = String(cards.length - p);
        cards[ci].setAttribute('aria-hidden', p === 0 ? 'false' : 'true');
        animateTo(ci, slot(p), { stiffness: 220, damping: 22 });
      });
      var active = order[0];
      details.forEach(function (d) { d.classList.toggle('is-active', +d.getAttribute('data-detail') === active); });
      counter.textContent = ('0' + (active + 1)).slice(-2);
    }
    function throwTop(dir) {
      if (busy) return; busy = true;
      var ci = order[0], w = stack.offsetWidth;
      animateTo(ci, { x: dir * w * 1.15, y: st[ci].y + 30, r: dir * 22, s: 1 }, { stiffness: 170, damping: 26 });
      setTimeout(function () {
        order.push(order.shift());
        cards[ci].style.zIndex = '0';
        layout(); busy = false;
      }, 280);
      track('stack_card', { direction: dir > 0 ? 'next' : 'drag_left' });
    }
    function bringBack() {
      if (busy) return; busy = true;
      var ci = order.pop(); order.unshift(ci);
      st[ci].x = -stack.offsetWidth * 1.15; st[ci].r = -22; st[ci].y = 30; render(ci);
      cards[ci].style.zIndex = String(cards.length + 1);
      layout(); setTimeout(function () { busy = false; }, 250);
    }

    /* arrastar (pointer events) */
    var drag = null;
    stack.addEventListener('pointerdown', function (e) {
      var ci = order[0], card = cards[ci];
      if (!card.contains(e.target) || busy) return;
      if (st[ci].anim) st[ci].anim.stop();
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bx: st[ci].x, by: st[ci].y, lastX: e.clientX, lastT: performance.now(), vx: 0, moved: false };
      card.setPointerCapture(e.pointerId); card.classList.add('is-dragging');
    });
    stack.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var ci = order[0], dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, now = performance.now();
      drag.vx = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1); drag.lastX = e.clientX; drag.lastT = now;
      if (Math.abs(dx) > 3) drag.moved = true;
      st[ci].x = drag.bx + dx; st[ci].y = drag.by + dy * 0.25; st[ci].r = dx / 16; st[ci].s = 1.02; render(ci);
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var ci = order[0], dx = st[ci].x, v = drag.vx;
      cards[ci].classList.remove('is-dragging');
      drag = null;
      if (Math.abs(dx) > stack.offsetWidth * 0.28 || Math.abs(v) > 0.6) throwTop(dx !== 0 ? Math.sign(dx) : Math.sign(v));
      else animateTo(ci, slot(0), { stiffness: 380, damping: 20 });
    }
    stack.addEventListener('pointerup', endDrag);
    stack.addEventListener('pointercancel', endDrag);
    stack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); throwTop(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); bringBack(); }
    });
    $('[data-stack-next]').addEventListener('click', function () { throwTop(1); });
    $('[data-stack-prev]').addEventListener('click', bringBack);
    order.forEach(function (ci, p) { var t = slot(p); st[ci].x = t.x; st[ci].y = t.y + 60; st[ci].r = t.r * 2; st[ci].s = t.s; render(ci); });
    layout();
  })();

  /* ---------- Depoimentos ---------- */
  (function testimonials() {
    var track_ = $('.t-track'); if (!track_) return;
    var items = $$('.t-item', track_), dots = $('.t-dots'), i = 0, timer;
    items.forEach(function (_, n) {
      var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Depoimento ' + (n + 1));
      b.addEventListener('click', function () { show(n); restart(); }); dots.appendChild(b);
    });
    function show(n) {
      i = (n + items.length) % items.length;
      track_.style.transform = 'translateX(' + (-100 * i) + '%)';
      $$('button', dots).forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      items.forEach(function (it, k) { it.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    }
    function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { show(i + 1); }, 6500); }
    var vp = $('.t-viewport'), sx = null;
    vp.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); restart(); } sx = null; });
    vp.addEventListener('mouseenter', function () { clearInterval(timer); });
    vp.addEventListener('mouseleave', restart);
    show(0); restart();
  })();

  /* ---------- Datas e contadores da reserva ---------- */
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function linkDates(inEl, outEl) {
    var today = new Date();
    inEl.min = iso(today);
    var t2 = new Date(today); t2.setDate(t2.getDate() + 1); outEl.min = iso(t2);
    inEl.addEventListener('change', function () {
      if (!inEl.value) return;
      var d = new Date(inEl.value + 'T12:00:00'); d.setDate(d.getDate() + 1);
      outEl.min = iso(d);
      if (!outEl.value || outEl.value <= inEl.value) outEl.value = iso(d);
    });
  }
  linkDates($('#b-in'), $('#b-out'));
  linkDates($('#f-in'), $('#f-out'));
  $$('.stepper').forEach(function (st) {
    var out = $('output', st), min = parseInt(st.getAttribute('data-min') || '1', 10), max = 12;
    $$('button', st).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(out.value || out.textContent, 10) + parseInt(b.getAttribute('data-step'), 10);
        v = Math.max(min, Math.min(max, v)); out.value = v; out.textContent = v;
      });
    });
  });

  /* ---------- Cotação pelo WhatsApp ---------- */
  function fmtDate(v) { if (!v) return ''; var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function nights(a, b) { var d = (new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5; return d > 0 ? Math.round(d) : 0; }
  function clean(v, max) { return String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200); }
  function buildMessage(d) {
    var n = nights(d.checkin, d.checkout);
    var lines = [
      'Oi, sou ' + d.nome + ', vim do site e gostaria de uma cotação.',
      '',
      '📅 Check-in: ' + fmtDate(d.checkin),
      '📅 Check-out: ' + fmtDate(d.checkout) + (n ? ' (' + n + (n > 1 ? ' noites' : ' noite') + ')' : ''),
      '👥 Adultos: ' + d.adultos,
      '🧒 Crianças: ' + d.criancas
    ];
    if (d.mensagem) lines.push('', '💬 ' + d.mensagem);
    return lines.join('\n');
  }
  function openWhatsApp(text) {
    var num = String(CFG.WHATSAPP || '').replace(/\D/g, '');
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
    var a = doc.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    doc.body.appendChild(a); a.click(); a.remove();
    return url;
  }
  function sendLead(data, origin) {
    var text = buildMessage(data);
    track('generate_lead', { form: origin, method: 'whatsapp' });
    if (CFG.FORM_ENDPOINT) { /* registro opcional do lead (CRM / planilha), sem bloquear o WhatsApp */
      try {
        fetch(CFG.FORM_ENDPOINT, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, data, { origem: origin, pagina: location.href, utm: getUtm(), enviado_em: new Date().toISOString() })) }).catch(function () {});
      } catch (e) {}
    }
    return openWhatsApp(text);
  }
  function stepVal(name) { var o = $('output[name="' + name + '"]'); return parseInt(o.value || o.textContent, 10) || 0; }

  /* Barra de cotação */
  $('#booking-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = $('#b-nome'), ci = $('#b-in'), co = $('#b-out');
    if (clean(nome.value).length < 2) { toast('Informe seu nome para continuar.'); nome.focus(); return; }
    if (!ci.value || !co.value) { toast('Escolha as datas de check-in e check-out.'); (ci.value ? co : ci).focus(); return; }
    if (co.value <= ci.value) { toast('O check-out deve ser depois do check-in.'); co.focus(); return; }
    sendLead({ nome: clean(nome.value, 60), checkin: ci.value, checkout: co.value, adultos: stepVal('adultos'), criancas: stepVal('criancas') }, 'barra_cotacao');
  });

  /* Formulário de contato */
  var form = $('#lead-form'), statusEl = $('.form-status', form);
  function setErr(input, msg) {
    var err = $('#' + input.getAttribute('aria-describedby'));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    if ($('#f-site').value) return; /* honeypot anti-spam */
    var nome = $('#f-nome'), fin = $('#f-in'), fout = $('#f-out'), consent = $('#f-consent'), first = null;
    function fail(el, m) { setErr(el, m); if (!first) first = el; }
    clean(nome.value).length < 2 ? fail(nome, 'Informe seu nome.') : setErr(nome, '');
    !fin.value ? fail(fin, 'Escolha a data de entrada.') : setErr(fin, '');
    !fout.value ? fail(fout, 'Escolha a data de saída.') : (fin.value && fout.value <= fin.value ? fail(fout, 'O check-out deve ser depois do check-in.') : setErr(fout, ''));
    !consent.checked ? fail(consent, 'É necessário autorizar o contato.') : setErr(consent, '');
    if (first) { first.focus(); return; }
    sendLead({ nome: clean(nome.value, 60), checkin: fin.value, checkout: fout.value, adultos: stepVal('f-adultos'), criancas: stepVal('f-criancas'), mensagem: clean($('#f-msg').value, 600) }, 'formulario_contato');
    statusEl.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta — é só tocar em enviar.';
  });

  /* ---------- Perguntas frequentes: pop-up com efeito cortina ---------- */
  var faqModal = $('#faq-modal'), faqBtns = $$('.faq-q'), faqIdx = 0, faqOpener = null, faqTimer;
  function fillFaq(i) {
    faqIdx = (i + faqBtns.length) % faqBtns.length;
    var b = faqBtns[faqIdx];
    $('#fm-q').textContent = $('span', b).textContent;
    $('#fm-a').textContent = b.parentElement.querySelector('.faq-a').textContent;
    $('#fm-n').textContent = faqIdx + 1;
  }
  function openFaq(i, opener) {
    clearTimeout(faqTimer);
    faqOpener = opener || null; fillFaq(i);
    faqModal.hidden = false; faqModal.classList.remove('is-closing');
    doc.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { faqModal.classList.add('is-open'); }); });
    setTimeout(function () { $('[data-faq-next]', faqModal).focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    track('faq_open', { pergunta: faqIdx + 1 });
  }
  function closeFaq() {
    if (!faqModal || faqModal.hidden || faqModal.classList.contains('is-closing')) return;
    faqModal.classList.add('is-closing'); faqModal.classList.remove('is-open');
    faqTimer = setTimeout(function () { faqModal.hidden = true; faqModal.classList.remove('is-closing'); doc.body.style.overflow = ''; if (faqOpener) faqOpener.focus({ preventScroll: true }); }, reduceMotion ? 0 : 1150);
  }
  faqBtns.forEach(function (b, i) { b.addEventListener('click', function () { openFaq(i, b); }); });
  $$('[data-faq-close]', faqModal).forEach(function (b) { b.addEventListener('click', closeFaq); });
  $('[data-faq-next]', faqModal).addEventListener('click', function () {
    var t = $('.curtain-text', faqModal); t.classList.add('is-swapping');
    setTimeout(function () { fillFaq(faqIdx + 1); t.classList.remove('is-swapping'); }, reduceMotion ? 0 : 360);
  });
  faqModal.addEventListener('keydown', function (e) { /* mantém o foco dentro do pop-up */
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button', faqModal);
    if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  onScroll();
})();
