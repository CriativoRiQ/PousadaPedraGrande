/* =========================================================
   Trilha sonora — piano suave com sax (jazz lento)
   • Se PPG_CONFIG.MUSIC_URL tiver um arquivo de áudio licenciado (mp3),
     ele é tocado em loop.
   • Caso contrário, a trilha é gerada ao vivo no navegador (Web Audio),
     sem arquivos externos: piano elétrico + baixo + sax com vibrato.
   Nunca toca sozinha: só começa após o clique do visitante.
   ========================================================= */
(function () {
  'use strict';
  var btn = document.querySelector('.music-toggle'); if (!btn) return;
  var CFG = window.PPG_CONFIG || {};
  var VOLUME = 0.55;
  var playing = false, engine = null;

  function track(ev) { if (window.PPG && window.PPG.track) window.PPG.track(ev); }

  /* ---------- Opção 1: arquivo de áudio ---------- */
  function fileEngine(url) {
    var a = new Audio(url); a.loop = true; a.preload = 'none'; a.volume = 0;
    var fadeT;
    function fade(to, ms, done) {
      clearInterval(fadeT); var from = a.volume, t0 = performance.now();
      fadeT = setInterval(function () {
        var p = Math.min((performance.now() - t0) / ms, 1); a.volume = from + (to - from) * p;
        if (p >= 1) { clearInterval(fadeT); if (done) done(); }
      }, 40);
    }
    return {
      start: function () { var p = a.play(); if (p && p.catch) p.catch(function () {}); fade(VOLUME * 0.6, 2500); },
      stop: function () { fade(0, 1200, function () { a.pause(); }); }
    };
  }

  /* ---------- Opção 2: trilha gerada (Web Audio) ---------- */
  function synthEngine() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    var ctx = new AC();
    var master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    var tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200;
    master.connect(tone); tone.connect(comp); comp.connect(ctx.destination);

    /* reverberação de sala, gerada */
    var rev = ctx.createConvolver(), len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = ir;
    var wet = ctx.createGain(); wet.gain.value = 0.42; rev.connect(wet); wet.connect(master);
    var dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(master);
    function out(node, send) { node.connect(dry); var s = ctx.createGain(); s.gain.value = send; node.connect(s); s.connect(rev); }

    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    var BPM = 64, BEAT = 60 / BPM, BAR = BEAT * 4;

    /* progressão em Fá maior: Fmaj9 – Dm9 – Gm9 – C13sus */
    var PROG = [
      { bass: 41, chord: [57, 60, 64, 67], scale: [65, 67, 69, 72, 74, 76, 79] },
      { bass: 38, chord: [53, 57, 60, 64], scale: [62, 65, 67, 69, 72, 74, 77] },
      { bass: 43, chord: [58, 62, 65, 69], scale: [62, 65, 67, 70, 72, 74, 77] },
      { bass: 36, chord: [58, 62, 64, 69], scale: [64, 65, 67, 70, 72, 74, 76] }
    ];

    /* piano elétrico suave (tipo Rhodes) */
    function piano(m, t, vel, dur) {
      var g = ctx.createGain(), f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1800 + vel * 1400;
      [[1, 1, 'sine'], [2, 0.22, 'sine'], [3.01, 0.05, 'triangle'], [0.5, 0.08, 'sine']].forEach(function (p) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = p[2]; o.frequency.value = hz(m) * p[0]; og.gain.value = p[1];
        o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.1);
      });
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11 * vel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.04 * vel, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      f.connect(g); out(g, 0.55);
    }
    function bass(m, t, dur) {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.value = 420;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); out(g, 0.15); o.start(t); o.stop(t + dur + 0.1);
    }
    /* sax: dente-de-serra filtrada + formante + vibrato + sopro */
    var noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = noiseBuf.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    function sax(m, t, dur, vel) {
      var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      var lp = ctx.createBiquadFilter(), form = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 1.003;
      var o2g = ctx.createGain(); o2g.gain.value = 0.25;
      lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1500 + vel * 900, t + 0.18); lp.frequency.linearRampToValueAtTime(1200, t + dur);
      form.type = 'peaking'; form.frequency.value = 1150; form.Q.value = 1.4; form.gain.value = 7;
      hp.type = 'highpass'; hp.frequency.value = 180;
      var lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.frequency.value = 5.2; lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(hz(m) * 0.006, t + Math.min(dur * 0.6, 0.6));
      lfo.connect(lfoG); lfoG.connect(o.frequency); lfoG.connect(o2.frequency);
      var nz = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      nz.buffer = noiseBuf; nz.loop = true; nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 0.8; ng.gain.value = 0.05;
      nz.connect(nf); nf.connect(ng); ng.connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.075 * vel, t + 0.09);
      g.gain.setValueAtTime(0.07 * vel, t + Math.max(dur - 0.22, 0.1));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(lp); o2.connect(o2g); o2g.connect(lp); lp.connect(form); form.connect(hp); hp.connect(g); out(g, 0.6);
      [o, o2, lfo, nz].forEach(function (n) { n.start(t); n.stop(t + dur + 0.05); });
    }

    /* frases do sax: notas da escala do acorde, ritmo calmo e espaçado */
    var RHYTHMS = [[1, 0.5, 0.5, 2], [1.5, 0.5, 2], [0.5, 0.5, 1, 2], [2, 1, 1], [1, 1, 2]];
    function phrase(bar, t0) {
      var c = PROG[bar % 4], r = RHYTHMS[Math.floor(Math.random() * RHYTHMS.length)];
      var start = Math.random() < 0.5 ? 0.5 : 1, pos = start, idx = 2 + Math.floor(Math.random() * 3);
      r.forEach(function (beats, n) {
        idx = Math.max(0, Math.min(c.scale.length - 1, idx + [-2, -1, 1, 2, 0][Math.floor(Math.random() * 5)]));
        var len = Math.min(beats, 8 - pos) * BEAT; if (len <= 0.1) return;
        sax(c.scale[idx], t0 + pos * BEAT, len * 0.95, n === r.length - 1 ? 0.8 : 1);
        pos += beats;
      });
    }

    var nextBar = 0, nextTime = 0, timer = null;
    function schedule() {
      while (nextTime < ctx.currentTime + 1.2) {
        var c = PROG[nextBar % 4], t = nextTime;
        bass(c.bass, t, BEAT * 2.6); bass(c.bass + (Math.random() < 0.5 ? 7 : 12), t + BEAT * 2.5, BEAT * 1.4);
        c.chord.forEach(function (m, i) { piano(m, t + i * 0.035, 0.75, BAR * 0.95); });
        if (Math.random() < 0.6) c.chord.slice(1).forEach(function (m, i) { piano(m, t + BEAT * 2.5 + i * 0.03, 0.45, BEAT * 1.6); });
        if (Math.random() < 0.5) piano(c.scale[4] + 12, t + BEAT * 3.5, 0.35, BEAT * 1.5);
        /* sax entra depois da introdução, em frases de 2 compassos com respiro */
        if (nextBar >= 4 && nextBar % 4 === 0) phrase(nextBar, t);
        if (nextBar >= 4 && nextBar % 4 === 2 && Math.random() < 0.55) phrase(nextBar, t);
        nextBar++; nextTime += BAR;
      }
    }
    return {
      start: function () {
        if (ctx.state === 'suspended') ctx.resume();
        if (!timer) { nextTime = ctx.currentTime + 0.15; timer = setInterval(schedule, 200); schedule(); }
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 3);
      },
      stop: function () {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
        setTimeout(function () { if (!playing) { clearInterval(timer); timer = null; nextBar = 0; ctx.suspend(); } }, 1400);
      }
    };
  }

  function setState(on) {
    playing = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Pausar trilha sonora' : 'Ativar trilha sonora');
  }
  btn.addEventListener('click', function () {
    btn.classList.remove('nudge');
    if (!engine) engine = CFG.MUSIC_URL ? fileEngine(CFG.MUSIC_URL) : synthEngine();
    if (!engine) { btn.hidden = true; return; }
    if (playing) { setState(false); engine.stop(); track('music_pause'); }
    else { setState(true); engine.start(); track('music_play'); }
  });
  /* pausa quando a aba fica oculta */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing && engine) { engine.stop(); btn.dataset.resume = '1'; setState(false); }
    else if (!document.hidden && btn.dataset.resume && engine) { delete btn.dataset.resume; setState(true); engine.start(); }
  });
  setTimeout(function () { if (!playing) btn.classList.add('nudge'); }, 4000);
})();
