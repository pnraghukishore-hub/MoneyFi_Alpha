/**
 * fhs-ui.js — MoneyFi FHS Score UI
 * Version: 1.0.0 | Satellite Pattern — Zero refactor
 *
 * Renders the FHS Score Card into the MoneyFi home screen.
 * No modifications to moneyfi HTML structure — injects one card div
 * after the home insights card.
 *
 * Depends on: fhs-engine.js
 */

(function () {
  'use strict';

  // Injected card element id
  const CARD_ID = 'fhs-score-card';

  // ══════════════════════════════════════════════════════════════════════
  // STYLES — injected once into <head>
  // ══════════════════════════════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById('fhs-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'fhs-ui-styles';
    style.textContent = `
      /* ── FHS Score Card ─────────────────────────────── */
      #fhs-score-card {
        background: var(--white, #fff);
        border-radius: var(--radius, 16px);
        box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.07));
        margin: 0 0 16px 0;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .fhs-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 10px;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      }

      .fhs-card-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .fhs-card-title {
        font-weight: 800;
        font-size: 0.92em;
        color: #1E2A6E;
        letter-spacing: 0.01em;
      }

      .fhs-card-subtitle {
        font-size: 0.72em;
        color: var(--text-light, #888);
        font-weight: 500;
      }

      .fhs-overall-pill {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .fhs-overall-score {
        font-size: 1.5em;
        font-weight: 900;
        line-height: 1;
        transition: color 0.4s;
      }

      .fhs-overall-label {
        font-size: 0.7em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.75;
      }

      .fhs-toggle-arrow {
        font-size: 0.85em;
        color: var(--text-light, #888);
        transition: transform 0.25s ease;
        margin-left: 4px;
      }
      .fhs-toggle-arrow.open { transform: rotate(180deg); }

      /* ── Rings Row ──────────────────────────────────── */
      .fhs-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .fhs-body.open { max-height: 600px; }

      .fhs-rings-row {
        display: flex;
        justify-content: space-around;
        align-items: flex-start;
        padding: 6px 8px 14px;
        gap: 4px;
        flex-wrap: wrap;
      }

      .fhs-ring-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        flex: 1;
        min-width: 52px;
        max-width: 72px;
      }

      .fhs-ring-svg {
        width: 52px;
        height: 52px;
        overflow: visible;
      }

      .fhs-ring-track {
        fill: none;
        stroke-linecap: round;
      }

      .fhs-ring-fill {
        fill: none;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center;
        transform: rotate(-90deg);
      }

      .fhs-ring-text-score {
        font-size: 11px;
        font-weight: 900;
        fill: #1E2A6E;
        dominant-baseline: middle;
        text-anchor: middle;
      }

      .fhs-ring-label {
        font-size: 0.62em;
        font-weight: 700;
        color: var(--text-med, #555);
        text-align: center;
        line-height: 1.2;
        letter-spacing: 0.01em;
      }

      .fhs-ring-status {
        font-size: 0.6em;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 20px;
        text-align: center;
      }
      .fhs-ring-status.good    { background: #E8FDF5; color: #10B981; }
      .fhs-ring-status.warn    { background: #FFFBE8; color: #D97706; }
      .fhs-ring-status.alert   { background: #FFEEEE; color: #EF4444; }
      .fhs-ring-status.no-data { background: #F0F0F0; color: #999; }

      /* ── Profile nudge banner ───────────────────────── */
      .fhs-profile-nudge {
        margin: 0 14px 14px;
        padding: 10px 12px;
        background: linear-gradient(135deg, #EEF2FF 0%, #F0F4FF 100%);
        border: 1px solid #C7D2FE;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .fhs-profile-nudge-text {
        font-size: 0.75em;
        color: #4338CA;
        font-weight: 600;
        line-height: 1.3;
      }

      .fhs-setup-btn {
        background: #4F46E5;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.72em;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }
      .fhs-setup-btn:active { opacity: 0.85; }

      /* ── Score colour scale ─────────────────────────── */
      .fhs-col-great  { color: #10B981; }
      .fhs-col-good   { color: #3B82F6; }
      .fhs-col-warn   { color: #F59E0B; }
      .fhs-col-alert  { color: #EF4444; }
      .fhs-col-nodata { color: #9CA3AF; }

      /* ── Loading skeleton ───────────────────────────── */
      .fhs-skeleton {
        padding: 14px 16px;
        text-align: center;
        font-size: 0.8em;
        color: var(--text-light, #999);
      }
    `;
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════

  function scoreColor(score, status) {
    if (status === 'no-data') return '#9CA3AF';
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#3B82F6';
    if (score >= 25) return '#F59E0B';
    return '#EF4444';
  }

  function overallClass(score) {
    if (score >= 75) return 'fhs-col-great';
    if (score >= 50) return 'fhs-col-good';
    if (score >= 25) return 'fhs-col-warn';
    return 'fhs-col-alert';
  }

  function statusLabel(status) {
    return { good: 'On track', warn: 'Improve', alert: 'Action needed', 'no-data': 'Set up' }[status] || '—';
  }

  // SVG arc ring — r=20, circumference ≈ 125.66
  function buildRing(score, status) {
    const r = 20;
    const cx = 26, cy = 26;
    const circ = 2 * Math.PI * r;
    const noData = status === 'no-data';
    const fillColor = scoreColor(score, status);
    const trackColor = 'var(--border, #EBEBEB)';
    const dashOffset = noData ? circ : circ - (score / 100) * circ;

    return `
      <svg class="fhs-ring-svg" viewBox="0 0 52 52">
        <circle class="fhs-ring-track" cx="${cx}" cy="${cy}" r="${r}"
          stroke="${trackColor}" stroke-width="5.5"/>
        <circle class="fhs-ring-fill" cx="${cx}" cy="${cy}" r="${r}"
          stroke="${fillColor}" stroke-width="5.5"
          stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}"/>
        <text class="fhs-ring-text-score" x="${cx}" y="${cy}" style="fill:${noData ? '#9CA3AF' : '#1E2A6E'}">
          ${noData ? '?' : score}
        </text>
      </svg>
    `;
  }

  const METRIC_META = [
    { key: 'savings',   label: 'Savings\nRate',  emoji: '💰' },
    { key: 'emergency', label: 'Emergency\nFund', emoji: '🛡️' },
    { key: 'retTrack',  label: 'Retirement\nTrack', emoji: '🏛️' },
    { key: 'fire',      label: 'FIRE\nReady',    emoji: '🔥' },
    { key: 'insurance', label: 'Life\nInsurance', emoji: '📋' },
    { key: 'education', label: 'Education\nGoal', emoji: '🎓' },
  ];

  let _open = false;

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════

  function renderCard(result) {
    const card = document.getElementById(CARD_ID);
    if (!card) return;

    if (!result) {
      card.innerHTML = `<div class="fhs-skeleton">⏳ Loading FHS score…</div>`;
      return;
    }

    const { overall, metrics, hasProfile } = result;
    const oClass = overallClass(overall);

    const ringsHtml = METRIC_META.map(m => {
      const metric = metrics[m.key];
      const { score, status } = metric;
      return `
        <div class="fhs-ring-item">
          ${buildRing(score, status)}
          <div class="fhs-ring-label">${m.label.replace('\n', '<br>')}</div>
          <div class="fhs-ring-status ${status}">${statusLabel(status)}</div>
        </div>
      `;
    }).join('');

    const nudge = !hasProfile ? `
      <div class="fhs-profile-nudge">
        <div class="fhs-profile-nudge-text">⚡ Set up your FHS profile to unlock Life Insurance &amp; Education scores</div>
        <button class="fhs-setup-btn" onclick="FHS.openProfile()">Set Up</button>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="fhs-card-header" onclick="FHS._toggleCard()">
        <div class="fhs-card-header-left">
          <span style="font-size:1.2em;">🎯</span>
          <div>
            <div class="fhs-card-title">Financial Health Score</div>
            <div class="fhs-card-subtitle">Foundation Band · 6 Metrics</div>
          </div>
        </div>
        <div class="fhs-overall-pill">
          <div>
            <div class="fhs-overall-score ${oClass}">${overall}</div>
            <div class="fhs-overall-label ${oClass}">/ 100</div>
          </div>
          <span class="fhs-toggle-arrow ${_open ? 'open' : ''}" id="fhs-toggle-arrow">▾</span>
        </div>
      </div>
      <div class="fhs-body ${_open ? 'open' : ''}" id="fhs-body">
        <div class="fhs-rings-row">${ringsHtml}</div>
        ${nudge}
      </div>
    `;
  }

  function _toggleCard() {
    _open = !_open;
    const body = document.getElementById('fhs-body');
    const arrow = document.getElementById('fhs-toggle-arrow');
    if (body)  body.classList.toggle('open', _open);
    if (arrow) arrow.classList.toggle('open', _open);
  }

  // ══════════════════════════════════════════════════════════════════════
  // MOUNT — called from renderHome() hook
  // ══════════════════════════════════════════════════════════════════════

  function mountCard() {
    // Anchor: hsec-invest — FHS card lives at screen-home level, AFTER both
    // hsec-spending and hsec-invest, so it's always visible regardless of tab.
    // Inserting inside hsec-spending would hide the card when user switches to Investing tab.
    const investSection = document.getElementById('hsec-invest');
    if (!investSection) return;

    // Create or reuse the card container
    let card = document.getElementById(CARD_ID);
    if (!card) {
      card = document.createElement('div');
      card.id = CARD_ID;
      // Insert after hsec-invest, still inside #screen-home
      investSection.parentNode.insertBefore(card, investSection.nextSibling);
    }

    // Only show loading skeleton on first render (card is empty).
    // renderHome() fires on every tab switch — skip expensive recompute if card already has content.
    const isEmpty = !card.querySelector('.fhs-card-header');
    if (isEmpty) {
      card.innerHTML = `<div class="fhs-skeleton">⏳ Calculating FHS score…</div>`;
    }

    // Debounce: clear any pending compute, schedule fresh one
    if (window._fhsMountTimer) clearTimeout(window._fhsMountTimer);
    window._fhsMountTimer = setTimeout(() => {
      if (typeof window.FHS?.computeScore === 'function') {
        window.FHS.computeScore().then(result => {
          renderCard(result);
        }).catch(() => {
          card.innerHTML = `<div class="fhs-skeleton" style="color:#EF4444;">⚠️ FHS score unavailable</div>`;
        });
      }
    }, 120); // 120ms debounce — lets rapid tab switches settle before computing
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.FHS = window.FHS || {};
  Object.assign(window.FHS, {
    mount: mountCard,
    _toggleCard,
    openProfile: () => {
      if (typeof window.FHSProfile?.open === 'function') window.FHSProfile.open();
    }
  });

  // Inject styles immediately
  injectStyles();

})();
