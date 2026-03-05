/**
 * fhs-ui.js — MoneyFi FHS Screen Renderer
 * Version: 2.0.0 | Satellite Pattern — Zero refactor
 *
 * Renders a full dedicated screen at #fhs-screen-root.
 * Called by switchScreen('fhs') via FHS.renderScreen().
 *
 * Depends on: fhs-engine.js (window.FHS.computeScore)
 */

(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('fhs-ui-styles')) return;
    const s = document.createElement('style');
    s.id = 'fhs-ui-styles';
    s.textContent = `
      #fhs-screen-root { display:block!important;min-height:unset!important;align-items:unset!important;justify-content:unset!important;padding-bottom:32px; }
      .fhs-hero { background:linear-gradient(135deg,#1E2A6E 0%,#3B4FC4 100%);border-radius:var(--radius,16px);padding:24px 20px 20px;margin-bottom:16px;text-align:center;position:relative;overflow:hidden; }
      .fhs-hero::before { content:'';position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.06); }
      .fhs-hero-label { font-size:0.75em;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px; }
      .fhs-hero-score { font-size:4em;font-weight:900;color:#fff;line-height:1;margin-bottom:4px;transition:color 0.4s; }
      .fhs-hero-band { font-size:0.78em;color:rgba(255,255,255,0.6);font-weight:600;margin-bottom:14px; }
      .fhs-hero-bar-track { background:rgba(255,255,255,0.15);border-radius:8px;height:8px;overflow:hidden;margin:0 20px; }
      .fhs-hero-bar-fill { height:100%;border-radius:8px;transition:width 0.9s cubic-bezier(0.4,0,0.2,1); }
      .fhs-hero-grade { margin-top:10px;font-size:0.8em;font-weight:800;color:rgba(255,255,255,0.85); }
      .fhs-section-title { font-size:0.72em;font-weight:800;color:var(--text-light,#999);text-transform:uppercase;letter-spacing:0.08em;margin:18px 0 8px; }
      .fhs-rings-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px; }
      .fhs-ring-card { background:var(--white,#fff);border-radius:14px;box-shadow:var(--card-shadow,0 2px 8px rgba(0,0,0,0.07));padding:14px 8px 12px;display:flex;flex-direction:column;align-items:center;gap:6px; }
      .fhs-ring-svg { width:60px;height:60px;overflow:visible; }
      .fhs-ring-fill { fill:none;stroke-linecap:round;transition:stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1);transform-origin:center;transform:rotate(-90deg); }
      .fhs-ring-track { fill:none;stroke-linecap:round; }
      .fhs-ring-score-text { font-size:13px;font-weight:900;dominant-baseline:middle;text-anchor:middle; }
      .fhs-ring-name { font-size:0.65em;font-weight:700;color:var(--text-dark,#222);text-align:center;line-height:1.2; }
      .fhs-ring-pill { font-size:0.58em;font-weight:700;padding:2px 7px;border-radius:20px;text-align:center;white-space:nowrap; }
      .fhs-pill-good { background:#E8FDF5;color:#059669; }
      .fhs-pill-warn { background:#FFFBE8;color:#D97706; }
      .fhs-pill-alert { background:#FFEEEE;color:#DC2626; }
      .fhs-pill-no-data { background:#F3F4F6;color:#9CA3AF; }
      .fhs-metric-card { background:var(--white,#fff);border-radius:14px;box-shadow:var(--card-shadow,0 2px 8px rgba(0,0,0,0.07));padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px; }
      .fhs-metric-icon-wrap { width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3em;flex-shrink:0; }
      .fhs-metric-body { flex:1;min-width:0; }
      .fhs-metric-name { font-size:0.82em;font-weight:800;color:var(--text-dark,#222);margin-bottom:2px; }
      .fhs-metric-sub { font-size:0.72em;color:var(--text-med,#666);font-weight:500;line-height:1.35; }
      .fhs-metric-bar-track { height:4px;background:var(--border,#EBEBEB);border-radius:4px;overflow:hidden;margin-top:6px; }
      .fhs-metric-bar-fill { height:100%;border-radius:4px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }
      .fhs-metric-score-col { text-align:right;flex-shrink:0; }
      .fhs-metric-score-num { font-size:1.4em;font-weight:900;line-height:1; }
      .fhs-metric-score-den { font-size:0.65em;color:var(--text-light,#999);font-weight:600; }
      .fhs-setup-banner { background:linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%);border:1.5px solid #C7D2FE;border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px; }
      .fhs-setup-banner-text { flex:1;font-size:0.8em;color:#3730A3;font-weight:600;line-height:1.4; }
      .fhs-setup-btn { background:#4F46E5;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-size:0.78em;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;-webkit-tap-highlight-color:transparent; }
      .fhs-setup-btn:active { opacity:0.82; }
      .fhs-loading { text-align:center;padding:48px 20px;color:var(--text-light,#999);font-size:0.9em;font-weight:600; }
      .fhs-loading-spinner { font-size:2em;margin-bottom:8px;animation:fhs-spin 1.2s linear infinite;display:inline-block; }
      @keyframes fhs-spin { to { transform:rotate(360deg); } }
      .fhs-last-updated { font-size:0.68em;color:var(--text-light,#bbb);text-align:center;margin-top:8px;font-weight:500; }
      .fhs-import-nudge { background:var(--white,#fff);border-radius:14px;box-shadow:var(--card-shadow,0 2px 8px rgba(0,0,0,0.07));padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer; }
      .fhs-import-nudge-text { flex:1;font-size:0.78em;color:var(--text-med,#666);font-weight:600;line-height:1.4; }
      .fhs-import-link { font-size:0.75em;font-weight:800;color:#4F46E5;text-decoration:none;white-space:nowrap; }
    `;
    document.head.appendChild(s);
  }

  function scoreColor(score, status) {
    if (status === 'no-data') return '#9CA3AF';
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#3B82F6';
    if (score >= 25) return '#F59E0B';
    return '#EF4444';
  }

  function gradeLabel(score) {
    if (score >= 85) return { label:'Excellent 🌟', color:'#10B981' };
    if (score >= 70) return { label:'Good 👍',      color:'#3B82F6' };
    if (score >= 50) return { label:'Fair 💛',      color:'#F59E0B' };
    if (score >= 30) return { label:'Needs Work ⚠️', color:'#F97316' };
    return                   { label:'Critical 🔴',  color:'#EF4444' };
  }

  function pillClass(status) {
    return ({good:'fhs-pill-good',warn:'fhs-pill-warn',alert:'fhs-pill-alert','no-data':'fhs-pill-no-data'})[status]||'fhs-pill-no-data';
  }
  function pillLabel(status) {
    return ({good:'On track',warn:'Improve',alert:'Action!','no-data':'Set up'})[status]||'—';
  }

  function buildRingSVG(score, status) {
    const r=24,cx=30,cy=30,circ=2*Math.PI*r;
    const noData = status==='no-data';
    const color = scoreColor(score, status);
    const offset = noData ? circ : circ-(score/100)*circ;
    return `<svg class="fhs-ring-svg" viewBox="0 0 60 60">
      <circle class="fhs-ring-track" cx="${cx}" cy="${cy}" r="${r}" stroke="var(--border,#EBEBEB)" stroke-width="6"/>
      <circle class="fhs-ring-fill" cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="6"
        stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
      <text class="fhs-ring-score-text" x="${cx}" y="${cy}" style="fill:${noData?'#9CA3AF':'#1E2A6E'}">${noData?'?':score}</text>
    </svg>`;
  }

  const METRIC_DEFS = [
    { key:'savings',   name:'Savings Rate',      emoji:'💰', iconBg:'#E8FDF5',
      detail:(m)=> m.status==='no-data' ? 'Add income & expenses to calculate' : `Saving ${m.rate}% of income · Target: 20%+` },
    { key:'emergency', name:'Emergency Fund',     emoji:'🛡️', iconBg:'#E8F4FF',
      detail:(m)=> m.status==='no-data' ? 'Add liquid accounts in Net Worth'   : `${m.months} months covered · Target: 3–6 months` },
    { key:'retTrack',  name:'Retirement Track',   emoji:'🏛️', iconBg:'#FFF3E8',
      detail:(m)=> m.status==='no-data' ? 'Add retirement accounts in Net Worth': `${m.multiple}× annual income saved · Target: 25×` },
    { key:'fire',      name:'FIRE Readiness',     emoji:'🔥', iconBg:'#FFF0F0',
      detail:(m)=> m.status==='no-data' ? 'Add retirement & expense data'       :
        `${m.pct}% of FIRE number · Target: ${typeof fmt==='function'?fmt(m.fireNumber||0):(m.fireNumber||0).toLocaleString()}` },
    { key:'insurance', name:'Life Insurance',     emoji:'📋', iconBg:'#F0EBFF',
      detail:(m)=> m.status==='no-data' ? 'Set up your FHS profile below'       : `${m.multiple}× annual income cover · Target: 10×` },
    { key:'education', name:'Education Goal',     emoji:'🎓', iconBg:'#E8F5E9',
      detail:(m)=> m.status==='no-data' ? 'Set up FHS profile to track this'    : `${m.pct}% of target saved` },
  ];

  function renderScreen() {
    const root = document.getElementById('fhs-screen-root');
    if (!root) return;

    root.innerHTML = `<div class="fhs-loading"><div class="fhs-loading-spinner">⚙️</div><div>Calculating your Financial Health Score…</div></div>`;

    if (typeof window.FHS?.computeScore !== 'function') {
      root.innerHTML = `<div class="fhs-loading" style="color:#EF4444;">⚠️ FHS engine not loaded</div>`;
      return;
    }

    window.FHS.computeScore().then(result => {
      if (!result) { root.innerHTML = `<div class="fhs-loading">Sign in to view your FHS score.</div>`; return; }
      _paint(root, result);
    }).catch(err => {
      root.innerHTML = `<div class="fhs-loading" style="color:#EF4444;">⚠️ Could not compute score<br><small>${err?.message||''}</small></div>`;
    });
  }

  function _paint(root, result) {
    const { overall, metrics, hasProfile, inputs } = result;
    const g = gradeLabel(overall);
    const col = scoreColor(overall, overall > 0 ? 'good' : 'no-data');

    const heroHtml = `
      <div class="fhs-hero">
        <div class="fhs-hero-label">Financial Health Score</div>
        <div class="fhs-hero-score" style="color:${col}">${overall}</div>
        <div class="fhs-hero-band">Foundation Band · 6 Metrics</div>
        <div class="fhs-hero-bar-track"><div class="fhs-hero-bar-fill" style="width:${overall}%;background:${col};"></div></div>
        <div class="fhs-hero-grade" style="color:${g.color}">${g.label}</div>
      </div>`;

    const ringsHtml = METRIC_DEFS.map(def => {
      const m = metrics[def.key];
      return `<div class="fhs-ring-card">
        ${buildRingSVG(m.score, m.status)}
        <div class="fhs-ring-name">${def.name}</div>
        <div class="fhs-ring-pill ${pillClass(m.status)}">${pillLabel(m.status)}</div>
      </div>`;
    }).join('');

    const setupBanner = !hasProfile ? `
      <div class="fhs-setup-banner">
        <div style="font-size:1.6em;">⚡</div>
        <div class="fhs-setup-banner-text">Complete your FHS profile to unlock<br>Life Insurance &amp; Education scores</div>
        <button class="fhs-setup-btn" onclick="FHSProfile.open()">Set Up</button>
      </div>` : '';

    const metricsHtml = METRIC_DEFS.map(def => {
      const m = metrics[def.key];
      const c = scoreColor(m.score, m.status);
      return `<div class="fhs-metric-card">
        <div class="fhs-metric-icon-wrap" style="background:${def.iconBg};">${def.emoji}</div>
        <div class="fhs-metric-body">
          <div class="fhs-metric-name">${def.name}</div>
          <div class="fhs-metric-sub">${def.detail(m)}</div>
          <div class="fhs-metric-bar-track"><div class="fhs-metric-bar-fill" style="width:${m.score}%;background:${c};"></div></div>
        </div>
        <div class="fhs-metric-score-col">
          <div class="fhs-metric-score-num" style="color:${c}">${m.status==='no-data'?'—':m.score}</div>
          <div class="fhs-metric-score-den">/100</div>
        </div>
      </div>`;
    }).join('');

    const now = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const navEl = `document.getElementById('nav-fhs')`;

    root.innerHTML = `
      ${heroHtml}
      <div class="fhs-section-title">At a Glance</div>
      <div class="fhs-rings-grid">${ringsHtml}</div>
      <div class="fhs-section-title">Breakdown</div>
      ${setupBanner}
      ${metricsHtml}
      <div class="fhs-import-nudge" onclick="switchScreen('import',${navEl})">
        <span style="font-size:1.4em;">📥</span>
        <div class="fhs-import-nudge-text">Keep your FHS score fresh — import your latest transactions</div>
        <span class="fhs-import-link">Import →</span>
      </div>
      <div class="fhs-last-updated">Score calculated at ${now} · ${inputs.mk}</div>
    `;
  }

  window.FHS = window.FHS || {};
  Object.assign(window.FHS, { renderScreen });
  injectStyles();

})();
