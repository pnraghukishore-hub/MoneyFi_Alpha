/**
 * fhs-profile.js — MoneyFi FHS Profile Onboarding
 * Version: 1.0.0 | Satellite Pattern — Zero refactor
 *
 * Renders a multi-step onboarding modal.
 * Writes to Firestore: fhsProfiles/{uid}
 * Reads from: window._fbUser, window._fbDb
 *
 * Namespaced under window.FHSProfile
 */

(function () {
  'use strict';

  const MODAL_ID = 'fhs-profile-modal';

  // ══════════════════════════════════════════════════════════════════════
  // STYLES
  // ══════════════════════════════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById('fhs-profile-styles')) return;
    const style = document.createElement('style');
    style.id = 'fhs-profile-styles';
    style.textContent = `
      /* ── FHS Profile Modal ─────────────────────────── */
      #fhs-profile-modal {
        position: fixed;
        inset: 0;
        z-index: 9990;
        display: flex;
        align-items: flex-end;
        background: rgba(0,0,0,0.45);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      #fhs-profile-modal.open {
        opacity: 1;
        pointer-events: all;
      }

      .fhs-modal-sheet {
        background: var(--white, #fff);
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
        border-radius: 20px 20px 0 0;
        padding: 0 0 env(safe-area-inset-bottom, 20px);
        transform: translateY(40px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-height: 90vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      #fhs-profile-modal.open .fhs-modal-sheet {
        transform: translateY(0);
      }

      .fhs-modal-handle {
        width: 36px; height: 4px;
        background: #E0E0E0;
        border-radius: 2px;
        margin: 12px auto 0;
      }

      .fhs-modal-header {
        padding: 16px 20px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .fhs-modal-title {
        font-size: 1.1em;
        font-weight: 900;
        color: #1E2A6E;
      }

      .fhs-modal-close {
        width: 28px; height: 28px;
        background: #F0F0F0;
        border: none;
        border-radius: 50%;
        font-size: 0.85em;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #666;
      }

      .fhs-steps-progress {
        display: flex;
        gap: 6px;
        padding: 10px 20px;
      }

      .fhs-step-dot {
        height: 4px;
        flex: 1;
        border-radius: 2px;
        background: #E0E0E0;
        transition: background 0.3s;
      }
      .fhs-step-dot.active { background: #4F46E5; }
      .fhs-step-dot.done   { background: #10B981; }

      .fhs-step-content {
        padding: 8px 20px 0;
      }

      .fhs-step-emoji {
        font-size: 2em;
        margin-bottom: 6px;
      }

      .fhs-step-heading {
        font-size: 1em;
        font-weight: 800;
        color: #1E2A6E;
        margin-bottom: 4px;
      }

      .fhs-step-desc {
        font-size: 0.8em;
        color: var(--text-med, #666);
        margin-bottom: 16px;
        line-height: 1.5;
      }

      .fhs-form-group {
        margin-bottom: 14px;
      }

      .fhs-form-label {
        font-size: 0.78em;
        font-weight: 700;
        color: #374151;
        margin-bottom: 5px;
        display: block;
      }

      .fhs-form-input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1.5px solid #E0E0E0;
        border-radius: 10px;
        font-size: 0.95em;
        font-weight: 600;
        color: #1E2A6E;
        background: var(--white, #fff);
        outline: none;
        transition: border-color 0.2s;
        -webkit-appearance: none;
      }
      .fhs-form-input:focus { border-color: #4F46E5; }

      .fhs-form-hint {
        font-size: 0.7em;
        color: var(--text-light, #999);
        margin-top: 4px;
      }

      .fhs-score-preview {
        background: linear-gradient(135deg, #EEF2FF 0%, #F0F4FF 100%);
        border: 1px solid #C7D2FE;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 14px;
        text-align: center;
      }

      .fhs-preview-label {
        font-size: 0.72em;
        color: #6366F1;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .fhs-preview-score {
        font-size: 2em;
        font-weight: 900;
        color: #4F46E5;
      }

      .fhs-modal-footer {
        padding: 14px 20px 20px;
        display: flex;
        gap: 10px;
      }

      .fhs-btn-back {
        flex: 0 0 auto;
        background: #F0F0F0;
        color: #374151;
        border: none;
        border-radius: 12px;
        padding: 13px 18px;
        font-size: 0.85em;
        font-weight: 700;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .fhs-btn-back:active { opacity: 0.75; }

      .fhs-btn-next {
        flex: 1;
        background: #4F46E5;
        color: white;
        border: none;
        border-radius: 12px;
        padding: 13px;
        font-size: 0.9em;
        font-weight: 800;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: opacity 0.15s;
      }
      .fhs-btn-next:active { opacity: 0.85; }
      .fhs-btn-next:disabled { opacity: 0.45; cursor: default; }

      .fhs-save-success {
        text-align: center;
        padding: 24px 20px 10px;
      }

      .fhs-success-emoji { font-size: 3em; margin-bottom: 8px; }
      .fhs-success-title { font-size: 1.1em; font-weight: 900; color: #10B981; margin-bottom: 6px; }
      .fhs-success-sub   { font-size: 0.82em; color: var(--text-med, #666); line-height: 1.5; }
    `;
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════

  let _step = 0;
  let _formData = {
    retirementAge: '',
    dependents: '',
    insuranceCoverDeclared: '',
    educationTarget: '',
    riskTolerance: 'moderate'
  };

  const STEPS = [
    {
      emoji: '🏛️',
      heading: 'Retirement Goal',
      desc: 'At what age would you like to retire? We use this to calculate your Retirement Track score.',
      fields: [
        { key: 'retirementAge', label: 'Target Retirement Age', type: 'number', placeholder: 'e.g. 60', hint: 'Most common targets: 55, 60, 65' }
      ]
    },
    {
      emoji: '📋',
      heading: 'Life Insurance Cover',
      desc: 'How much life insurance cover do you currently have (total across all policies)? Leave blank if you have none.',
      fields: [
        { key: 'insuranceCoverDeclared', label: 'Total Life Insurance Cover', type: 'number', placeholder: 'e.g. 500000', hint: 'Enter the sum assured / death benefit in your display currency' },
        { key: 'dependents', label: 'Number of Dependents', type: 'number', placeholder: 'e.g. 2', hint: 'Including spouse, children, parents who rely on your income' }
      ]
    },
    {
      emoji: '🎓',
      heading: 'Education Goal',
      desc: "What's your target corpus for children's education or your own further education? Leave blank to skip.",
      fields: [
        { key: 'educationTarget', label: 'Education Target Amount', type: 'number', placeholder: 'e.g. 100000', hint: 'Total amount you want to save for education costs' }
      ]
    }
  ];

  // ══════════════════════════════════════════════════════════════════════
  // BUILD MODAL HTML
  // ══════════════════════════════════════════════════════════════════════

  function buildModal() {
    let el = document.getElementById(MODAL_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = MODAL_ID;
      // Close on backdrop click
      el.addEventListener('click', e => { if (e.target === el) close(); });
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="fhs-modal-sheet" id="fhs-modal-inner"></div>`;
  }

  function renderStep() {
    const sheet = document.getElementById('fhs-modal-inner');
    if (!sheet) return;

    // Progress dots
    const dots = STEPS.map((_, i) => {
      const cls = i < _step ? 'done' : i === _step ? 'active' : '';
      return `<div class="fhs-step-dot ${cls}"></div>`;
    }).join('');

    if (_step >= STEPS.length) {
      // Save + success
      renderSaving(sheet);
      return;
    }

    const step = STEPS[_step];
    const fieldsHtml = step.fields.map(f => `
      <div class="fhs-form-group">
        <label class="fhs-form-label">${f.label}</label>
        <input
          class="fhs-form-input"
          id="fhsp-${f.key}"
          type="${f.type}"
          inputmode="${f.type === 'number' ? 'decimal' : 'text'}"
          placeholder="${f.placeholder}"
          value="${_formData[f.key] || ''}"
          oninput="FHSProfile._update('${f.key}', this.value)"
        />
        <div class="fhs-form-hint">${f.hint}</div>
      </div>
    `).join('');

    const backBtn = _step > 0
      ? `<button class="fhs-btn-back" onclick="FHSProfile._prev()">← Back</button>`
      : '';

    const isLast = _step === STEPS.length - 1;

    sheet.innerHTML = `
      <div class="fhs-modal-handle"></div>
      <div class="fhs-modal-header">
        <div class="fhs-modal-title">🎯 FHS Profile Setup</div>
        <button class="fhs-modal-close" onclick="FHSProfile.close()">✕</button>
      </div>
      <div class="fhs-steps-progress">${dots}</div>
      <div class="fhs-step-content">
        <div class="fhs-step-emoji">${step.emoji}</div>
        <div class="fhs-step-heading">${step.heading}</div>
        <div class="fhs-step-desc">${step.desc}</div>
        ${fieldsHtml}
      </div>
      <div class="fhs-modal-footer">
        ${backBtn}
        <button class="fhs-btn-next" onclick="FHSProfile._next()">
          ${isLast ? 'Save Profile →' : 'Next →'}
        </button>
      </div>
    `;
  }

  function renderSaving(sheet) {
    sheet.innerHTML = `
      <div class="fhs-modal-handle"></div>
      <div class="fhs-save-success">
        <div class="fhs-success-emoji">⏳</div>
        <div class="fhs-success-title">Saving…</div>
        <div class="fhs-success-sub">Updating your FHS profile</div>
      </div>
    `;
    _saveProfile().then(() => {
      sheet.innerHTML = `
        <div class="fhs-modal-handle"></div>
        <div class="fhs-save-success">
          <div class="fhs-success-emoji">🎉</div>
          <div class="fhs-success-title">Profile Saved!</div>
          <div class="fhs-success-sub">Your Life Insurance and Education scores are now live.<br>Closing in a moment…</div>
        </div>
      `;
      setTimeout(() => {
        close();
        // Refresh FHS engine cache + re-render score card
        if (typeof window.FHS?.refreshProfile === 'function') window.FHS.refreshProfile();
        if (typeof window.FHS?.mount === 'function') window.FHS.mount();
      }, 1800);
    }).catch(err => {
      sheet.innerHTML = `
        <div class="fhs-modal-handle"></div>
        <div class="fhs-save-success">
          <div class="fhs-success-emoji">⚠️</div>
          <div class="fhs-success-title" style="color:#EF4444">Save Failed</div>
          <div class="fhs-success-sub">${err?.message || 'Please try again.'}</div>
        </div>
        <div class="fhs-modal-footer">
          <button class="fhs-btn-next" onclick="FHSProfile._prev(); FHSProfile._renderStep();">← Try Again</button>
        </div>
      `;
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIRESTORE SAVE
  // ══════════════════════════════════════════════════════════════════════

  function _saveProfile() {
    return new Promise((resolve, reject) => {
      const user = window._fbUser;
      const db = window._fbDb;
      if (!user || !db) { reject(new Error('Not signed in')); return; }

      const payload = {
        retirementAge: Number(_formData.retirementAge) || 60,
        dependents: Number(_formData.dependents) || 0,
        insuranceCoverDeclared: Number(_formData.insuranceCoverDeclared) || 0,
        educationTarget: Number(_formData.educationTarget) || 0,
        riskTolerance: _formData.riskTolerance || 'moderate',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        currency: window.currentCurrency?.code || 'USD'
      };

      db.collection('fhsProfiles').doc(user.uid)
        .set(payload, { merge: true })
        .then(resolve)
        .catch(reject);
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════════════════════

  function _next() {
    _step = Math.min(_step + 1, STEPS.length);
    renderStep();
  }

  function _prev() {
    _step = Math.max(_step - 1, 0);
    renderStep();
  }

  function _update(key, val) {
    _formData[key] = val;
  }

  // ══════════════════════════════════════════════════════════════════════
  // OPEN / CLOSE
  // ══════════════════════════════════════════════════════════════════════

  function open() {
    // Pre-populate from saved profile if available
    const p = window.FHS?._profile;
    if (p) {
      _formData.retirementAge = p.retirementAge || '';
      _formData.dependents = p.dependents || '';
      _formData.insuranceCoverDeclared = p.insuranceCoverDeclared || '';
      _formData.educationTarget = p.educationTarget || '';
      _formData.riskTolerance = p.riskTolerance || 'moderate';
    }
    _step = 0;
    buildModal();
    renderStep();
    requestAnimationFrame(() => {
      document.getElementById(MODAL_ID)?.classList.add('open');
    });
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    el.classList.remove('open');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.FHSProfile = {
    open,
    close,
    _next,
    _prev,
    _update,
    _renderStep: renderStep
  };

  injectStyles();

})();
