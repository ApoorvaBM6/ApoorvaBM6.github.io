/* Portfolio analytics: opt-in consent + mapping of visitor interactions to aggregate Umami events.
 *
 * Consent (France / EU):
 *  - Nothing is loaded, sent or stored for analytics before the visitor clicks "Accept".
 *    Until then, interactions are only held in page memory (never on the device) and are
 *    discarded on "Decline" or when the page closes.
 *  - The answer itself is kept in localStorage "analytics-consent" for 6 months (strictly
 *    necessary to remember the choice), after which the visitor is asked again.
 *  - Global Privacy Control / Do Not Track count as a refusal: no banner, no tracking.
 *  - The choice can be changed at any time on /privacy/.
 *
 * Privacy by design: no identify() calls, no fingerprinting, event properties describe the
 * CONTENT (which project, which CV language), never the visitor.
 *
 * Event dictionary (names <= 50 chars, see docs/EVENTS.md in the dashboard repo):
 *  visit:<source>            once per page load: linkedin | google | github | search | referral | direct
 *  campaign                  {source, medium, campaign} when utm_* parameters are present
 *  engaged                   once per page load, after 15 s of visible time or the first interaction
 *  section-view:<id>         section stayed in the middle of the viewport for >= 1 s (top, overview, …)
 *  section-time              {section, bucket, key: "<section>|<bucket>"} cumulative visible time, sent when the tab is hidden
 *  nav-click                 {route: "from>to"} section navigation
 *  cv-download               {file: cv-en|cv-fr|resume-en|resume-fr, doc, lang, placement}
 *  cv-menu-open              hero "Download CV" menu opened
 *  contact                   {channel: linkedin|github|email, placement}  (own profiles / e-mail only)
 *  project-open              {project, category, tag}  (card click → detail drawer)
 *  project-link              {project, type: github|report|slides|paper|video|other}
 *  project-filter            {category}
 *  publication-open          {title}
 *  publication-link          {title}
 *  engagement-link           {name}  (conference pages)
 *  reference-link            {name}
 *  journey-to-projects       {institution}
 *  about-open
 *  external-link             {host}  any other outbound link
 */
(function () {
  'use strict';
  var CFG = window.ANALYTICS_CONFIG || {};
  var DEBUG = /[?&]analytics-debug\b/.test(location.search);
  var ACTIVE = !!CFG.enabled || DEBUG;           // banner + tracking only when configured (or debugging)
  var KEY = 'analytics-consent', MAX_AGE = 182 * 864e5;
  var queue = [], sent = {};

  function privacySignal() {
    try { return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1'; } catch (e) { return false; }
  }
  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < MAX_AGE) return c.v;
    } catch (e) {}
    return null;
  }
  function saveConsent(v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }
  var consent = privacySignal() ? 'denied' : readConsent();

  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function send(name, data) {
    if (window.umami && typeof window.umami.track === 'function') {
      try { data ? window.umami.track(name, data) : window.umami.track(name); } catch (e) { /* never break the page */ }
      return true;
    }
    return false;
  }
  function track(name, data) {
    if (!ACTIVE || consent === 'denied') { if (DEBUG) console.info('[analytics] not sent (no consent):', name); return; }
    name = clip(name, 50);
    if (data) for (var k in data) data[k] = typeof data[k] === 'number' ? data[k] : clip(data[k], 120);
    if (DEBUG) console.info('[analytics]' + (consent === 'granted' ? '' : ' (held until consent)'), name, data || '');
    if (consent !== 'granted' || !send(name, data)) { if (queue.length < 60) queue.push([name, data]); }
  }
  function once(key, name, data) { if (sent[key]) return; sent[key] = 1; track(name, data); }

  function flushWhenReady(tries) {
    if (consent !== 'granted') return;
    if (window.umami && typeof window.umami.track === 'function') { var q = queue; queue = []; q.forEach(function (e) { send(e[0], e[1]); }); }
    else if (tries < 40) setTimeout(function () { flushWhenReady(tries + 1); }, 500);
  }
  function loadTracker() {
    if (!CFG.enabled || !CFG.websiteId || document.getElementById('umami-tracker')) return;
    var s = document.createElement('script');
    s.id = 'umami-tracker'; s.defer = true; s.src = CFG.src;
    s.setAttribute('data-website-id', CFG.websiteId);
    s.setAttribute('data-domains', CFG.domains || location.hostname);
    s.setAttribute('data-do-not-track', 'true');
    document.head.appendChild(s);
  }
  function grant() { consent = 'granted'; saveConsent('granted'); hideBanner(); loadTracker(); flushWhenReady(0); }
  function deny() { consent = 'denied'; saveConsent('denied'); queue = []; hideBanner(); }

  /* ---------- consent banner ---------- */
  var banner = null;
  function hideBanner() { if (banner) { banner.hidden = true; } }
  function showBanner() {
    if (banner || !document.body) return;
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.setAttribute('aria-describedby', 'consent-text');
    banner.innerHTML =
      '<h2 id="consent-title">Anonymous visitor statistics?</h2>' +
      '<p id="consent-text">With your permission, this site counts visits and clicks (e.g. projects viewed, CV downloads) with Umami, hosted in the EU. ' +
      'No ads, no profiling, no personal identifiers. <a href="' + (CFG.privacyUrl || '/privacy/') + '">Change your choice any time</a>.</p>' +
      '<p class="fr" lang="fr">Statistiques anonymes, uniquement avec votre accord.</p>' +
      '<div class="row"><button type="button" data-consent="denied">Decline</button><button type="button" data-consent="granted">Accept</button></div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-consent]'); if (!b) return;
      b.getAttribute('data-consent') === 'granted' ? grant() : deny();
    });
    document.body.appendChild(banner);
  }
  if (ACTIVE) {
    if (consent === 'granted') loadTracker();
    else if (consent === null) (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', showBanner) : showBanner());
  }
  flushWhenReady(0);
  window.portfolioAnalytics = { consent: function () { return consent; } };

  /* ---------- 1. traffic source (classified once per page load) ---------- */
  (function () {
    var params = new URLSearchParams(location.search);
    var utmSource = (params.get('utm_source') || '').toLowerCase();
    var host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (e) {}
    if (host && host === location.hostname) return; // internal reload/navigation: not a new visit
    var probe = utmSource || host, src;
    if (/(^|\.)linkedin\.|lnkd\.in|^linkedin$|^li$/.test(probe)) src = 'linkedin';
    else if (/(^|\.)google\.|^google$/.test(probe)) src = 'google';
    else if (/(^|\.)github\.(com|io)$|^github$/.test(probe)) src = 'github';
    else if (/bing\.|duckduckgo\.|ecosia\.|qwant\.|yahoo\.|yandex\.|baidu\.|startpage\.|brave\.com/.test(probe)) src = 'search';
    else if (probe) src = 'referral';
    else src = 'direct';
    track('visit:' + src);
    if (params.get('utm_campaign') || utmSource) {
      track('campaign', { source: utmSource || host || 'direct', medium: params.get('utm_medium') || '', campaign: params.get('utm_campaign') || '' });
    }
  })();

  /* ---------- 2. engagement (visible time) ---------- */
  var visibleMs = 0, lastTick = document.visibilityState === 'visible' ? Date.now() : 0;
  function tick() { if (lastTick) { var now = Date.now(); visibleMs += now - lastTick; lastTick = now; } }
  function markEngaged() { once('engaged', 'engaged'); }
  setInterval(function () { tick(); if (visibleMs >= 15000) markEngaged(); }, 1000);

  /* ---------- 3. section views and time ---------- */
  var SECTIONS = ['top', 'overview', 'journey', 'projects', 'engagement', 'contact'];
  var secTime = {}, active = null, activeSince = 0, viewTimer = null;
  function closeActive() { if (active && activeSince) { secTime[active] = (secTime[active] || 0) + (Date.now() - activeSince); } activeSince = 0; }
  function setActive(id) {
    if (id === active) return;
    closeActive(); active = id; activeSince = document.visibilityState === 'visible' ? Date.now() : 0;
    clearTimeout(viewTimer);
    viewTimer = setTimeout(function () { if (active === id) once('sv:' + id, 'section-view:' + id); }, 1000);
  }
  function bucket(ms) { var s = ms / 1000; return s < 10 ? '3-10s' : s < 30 ? '10-30s' : s < 60 ? '30-60s' : s < 180 ? '1-3min' : '3min+'; }
  var flushedTime = false;
  function flushTime() {
    if (flushedTime) return; flushedTime = true;
    closeActive(); if (active) activeSince = Date.now();
    SECTIONS.forEach(function (id) {
      if ((secTime[id] || 0) < 3000) return;
      var b = bucket(secTime[id]); track('section-time', { section: id, bucket: b, key: id + '|' + b });
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' }); // same "middle line" rule the site's nav highlighting uses
    var start = function () { SECTIONS.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); }); };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { tick(); lastTick = 0; flushTime(); }
    else { lastTick = Date.now(); if (active) activeSince = Date.now(); }
  });
  window.addEventListener('pagehide', function () { tick(); flushTime(); });

  /* ---------- 4. clicks ---------- */
  function placement(el) {
    if (el.closest('#drawer')) return 'project-drawer';
    if (el.closest('#modal')) return 'about-modal';
    if (el.closest('.cv-menu, .hero')) return 'hero';
    var s = el.closest('section, header'); return s && s.id ? (s.id === 'top' ? 'hero' : s.id) : 'other';
  }
  function drawerProject() {
    var t = document.querySelector('#drawer #dTitle'); return t ? t.textContent : '';
  }
  function linkType(a) {
    var label = (a.textContent || '').toLowerCase(), href = a.href.toLowerCase();
    if (/github\.com/.test(href) || /github/.test(label)) return 'github';
    if (/report/.test(label)) return 'report';
    if (/slides|presentation/.test(label)) return 'slides';
    if (/paper|doi\.org|imavs|springer|arxiv|ieee/.test(label + ' ' + href)) return 'paper';
    if (/video|youtube|vimeo/.test(label + ' ' + href)) return 'video';
    return 'other';
  }

  function onLink(a) {
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return false;
    var url; try { url = new URL(a.href, location.href); } catch (e) { return false; }
    var where = placement(a);

    var file = url.pathname.match(/\/assets\/files\/[^/]*_(CV|Resume)_(en|fr)\.pdf$/i);
    if (file) {
      var doc = file[1].toLowerCase() === 'cv' ? 'cv' : 'resume', lang = file[2].toLowerCase();
      track('cv-download', { file: doc + '-' + lang, doc: doc, lang: lang, placement: where }); return true;
    }
    if (url.protocol === 'mailto:') { track('contact', { channel: 'email', placement: where }); return true; }
    if (url.hostname === location.hostname) return false;

    var host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (/linkedin\.com$/.test(host) && /\/in\/apoorva-bm\/?$/i.test(url.pathname)) { track('contact', { channel: 'linkedin', placement: where }); return true; }
    if (host === 'github.com' && /^\/apoorvabm6\/?$/i.test(url.pathname)) { track('contact', { channel: 'github', placement: where }); return true; }
    if (a.closest('#drawer .links')) { track('project-link', { project: drawerProject(), type: linkType(a) }); return true; }
    if (a.classList.contains('pub-link')) {
      var item = a.closest('.pub-item'), b = item && item.querySelector('.pub-toggle b');
      track('publication-link', { title: b ? b.textContent : host }); return true;
    }
    if (a.classList.contains('eng-link')) { var n = a.querySelector('b'); track('engagement-link', { name: n ? n.textContent : host }); return true; }
    if (a.closest('.ref')) { var r = a.closest('.ref').querySelector('b'); track('reference-link', { name: r ? r.textContent : host }); return true; }
    track('external-link', { host: host });
    return true;
  }

  function onClick(ev) {
    var t = ev.target; if (!t || !t.closest || t.closest('.consent')) return;
    var a = t.closest('a[href]');
    if (a) { if (onLink(a)) markEngaged(); }

    var card = t.closest('[data-open]');
    if (card) {
      markEngaged();
      // The drawer is rendered synchronously by site.js on the same click; read it on the next tick.
      setTimeout(function () {
        var eb = document.querySelector('#drawer .eyebrow'), parts = eb ? eb.textContent.split('·').map(function (s) { return s.trim(); }) : [];
        var h = card.querySelector('h3');
        track('project-open', { project: drawerProject() || (h ? h.textContent : ''), tag: parts[0] || '', category: parts.slice(1).join(', ') });
      }, 0);
      return;
    }
    var nav = t.closest('a[data-s]');
    if (nav) { track('nav-click', { route: (active || 'top') + '>' + nav.getAttribute('data-s') }); markEngaged(); return; }
    var filter = t.closest('#filters .filter');
    if (filter) { track('project-filter', { category: filter.getAttribute('data-cat') || 'all' }); markEngaged(); return; }
    var pub = t.closest('.pub-toggle');
    if (pub && pub.getAttribute('aria-expanded') !== 'true') { // site.js toggles after us (capture phase)
      var pb = pub.querySelector('b'); track('publication-open', { title: pb ? pb.textContent : '' }); markEngaged(); return;
    }
    var uni = t.closest('#timeline [data-uni]');
    if (uni) { track('journey-to-projects', { institution: uni.getAttribute('data-uni') }); markEngaged(); return; }
    if (t.closest('#cvBtn') && document.getElementById('cvBtn').getAttribute('aria-expanded') !== 'true') { track('cv-menu-open'); markEngaged(); return; }
    if (t.closest('.tile[data-modal="about"]')) { track('about-open'); markEngaged(); }
  }
  // Capture phase: runs before site.js handlers change state (e.g. aria-expanded) and before navigation.
  document.addEventListener('click', onClick, true);
  // Middle-click / "open in new tab" on links.
  document.addEventListener('auxclick', function (ev) { if (ev.button === 1) { var a = ev.target.closest && ev.target.closest('a[href]'); if (a) onLink(a); } }, true);
  // Keyboard activation of the clickable tiles (site.js maps Enter/Space to .click(), which we already catch).
})();
