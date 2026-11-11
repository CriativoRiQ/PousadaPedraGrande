/* =========================================================
   Pousada Pedra Grande — consentimento (LGPD), UTMs e rastreamento
   Compartilhado por todas as páginas.
   ========================================================= */
(function () {
  'use strict';
  var CFG = window.PPG_CONFIG || {};
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  /* ---------- Armazenamento seguro ---------- */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- UTMs (guardadas na sessão e anexadas aos leads) ---------- */
  (function captureUtm() {
    var params = new URLSearchParams(location.search);
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    var found = {};
    keys.forEach(function (k) { if (params.get(k)) found[k] = params.get(k).slice(0, 100); });
    if (Object.keys(found).length) store.sset('ppg_utm', JSON.stringify(found));
  })();
  function getUtm() { try { return JSON.parse(store.sget('ppg_utm') || '{}'); } catch (e) { return {}; } }

  /* ---------- Rastreamento ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: event }, params));
    if (typeof window.gtag === 'function' && CFG.GA4_ID) window.gtag('event', event, params);
    if (typeof window.fbq === 'function') {
      if (event === 'generate_lead') window.fbq('track', 'Lead', params);
      else if (event === 'cta_reservar') window.fbq('trackCustom', 'CliqueReservar', params);
    }
    if (event === 'generate_lead' && CFG.GOOGLE_ADS_ID && CFG.GOOGLE_ADS_LEAD_LABEL && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: CFG.GOOGLE_ADS_ID + '/' + CFG.GOOGLE_ADS_LEAD_LABEL });
    }
  }
  doc.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'), { label: el.getAttribute('data-track-label') || '' });
  });

  /* ---------- Consentimento (LGPD) + carregamento das tags ---------- */
  var loaded = {};
  function loadScript(src) { var s = doc.createElement('script'); s.async = true; s.src = src; doc.head.appendChild(s); }
  function applyConsent(c) {
    window.gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consent_update', consent_analytics: !!c.analytics, consent_marketing: !!c.marketing });

    if (CFG.GTM_ID && (c.analytics || c.marketing) && !loaded.gtm) {
      loaded.gtm = true;
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CFG.GTM_ID));
    }
    if (!CFG.GTM_ID) {
      var gId = (c.analytics && CFG.GA4_ID) || (c.marketing && CFG.GOOGLE_ADS_ID);
      if (gId && !loaded.gtag) {
        loaded.gtag = true;
        loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gId));
        window.gtag('js', new Date());
      }
      if (c.analytics && CFG.GA4_ID && !loaded.ga4) { loaded.ga4 = true; window.gtag('config', CFG.GA4_ID, { anonymize_ip: true }); }
      if (c.marketing && CFG.GOOGLE_ADS_ID && !loaded.ads) { loaded.ads = true; window.gtag('config', CFG.GOOGLE_ADS_ID); }
      if (c.marketing && CFG.META_PIXEL_ID && !loaded.pixel) {
        loaded.pixel = true;
        /* Meta Pixel (código oficial) */
        !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', CFG.META_PIXEL_ID);
        window.fbq('track', 'PageView');
      }
    }
  }

  var cookieBox = $('#cookie');
  if (!cookieBox) { window.PPG = { track: track, getUtm: getUtm, store: store }; return; }
  function showCookie(prefs) {
    cookieBox.hidden = false;
    var saved = readConsent();
    $('#c-analytics').checked = saved ? !!saved.analytics : false;
    $('#c-marketing').checked = saved ? !!saved.marketing : false;
    cookieBox.classList.toggle('show-prefs', !!prefs);
    $('[data-cookie="save"]', cookieBox).hidden = !prefs;
    $('[data-cookie="prefs"]', cookieBox).hidden = !!prefs;
    requestAnimationFrame(function () { cookieBox.classList.add('is-visible'); });
  }
  function hideCookie() {
    cookieBox.classList.remove('is-visible');
    setTimeout(function () { cookieBox.hidden = true; }, 600);
  }
  function readConsent() { try { return JSON.parse(store.get('ppg_consent') || 'null'); } catch (e) { return null; } }
  function saveConsent(c) { c.date = new Date().toISOString(); c.v = 1; store.set('ppg_consent', JSON.stringify(c)); applyConsent(c); hideCookie(); }

  cookieBox.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cookie]'); if (!b) return;
    var a = b.getAttribute('data-cookie');
    if (a === 'all') saveConsent({ analytics: true, marketing: true });
    else if (a === 'none') saveConsent({ analytics: false, marketing: false });
    else if (a === 'prefs') showCookie(true);
    else if (a === 'save') saveConsent({ analytics: $('#c-analytics').checked, marketing: $('#c-marketing').checked });
  });
  $$('[data-open-cookies]').forEach(function (b) { b.addEventListener('click', function () { showCookie(true); }); });
  var existing = readConsent();
  if (existing) applyConsent(existing); else setTimeout(function () { showCookie(false); }, 1200);

  window.PPG = { track: track, getUtm: getUtm, store: store };
})();
