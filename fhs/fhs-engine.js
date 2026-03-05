/**
 * fhs-engine.js — MoneyFi FHS Scoring Engine
 * Version: 1.0.0 | Satellite Pattern — Zero refactor
 *
 * Pure computation only. No DOM writes. No Firebase writes.
 * Reads from: data, computeNetWorth(), convertAmt(), nwConvert()
 * All functions namespaced under window.FHS
 */

(function () {
  'use strict';

  // ── Scoring constants ──────────────────────────────────────────────────
  const SCORE_MAX = 100;

  // ── Cached profile (loaded once per session from Firestore) ───────────
  let _profile = null;
  let _profileLoaded = false;
  let _profilePromise = null;

  // ══════════════════════════════════════════════════════════════════════
  // METRIC CALCULATORS — Foundation Band
  // Each returns 0–100 score + metadata
  // ══════════════════════════════════════════════════════════════════════

  function calcSavingsRate(totalInc, totalExp) {
    if (totalInc <= 0) return { score: 0, rate: 0, status: 'no-data' };
    const rate = ((totalInc - totalExp) / totalInc) * 100;
    let score;
    if (rate >= 30)      score = 100;
    else if (rate >= 20) score = 70 + ((rate - 20) / 10) * 30;
    else if (rate >= 10) score = 40 + ((rate - 10) / 10) * 30;
    else if (rate > 0)   score = (rate / 10) * 40;
    else                 score = 0;
    const status = rate >= 20 ? 'good' : rate >= 10 ? 'warn' : 'alert';
    return { score: Math.round(Math.min(score, SCORE_MAX)), rate: Math.round(rate * 10) / 10, status };
  }

  function calcEmergencyFund(liquidAmt, monthlyExp) {
    if (monthlyExp <= 0) return { score: 0, months: 0, status: 'no-data' };
    const months = liquidAmt / monthlyExp;
    let score;
    if (months >= 6)      score = 100;
    else if (months >= 3) score = 60 + ((months - 3) / 3) * 40;
    else if (months >= 1) score = 20 + ((months - 1) / 2) * 40;
    else                  score = (months) * 20;
    const status = months >= 3 ? 'good' : months >= 1 ? 'warn' : 'alert';
    return { score: Math.round(Math.min(score, SCORE_MAX)), months: Math.round(months * 10) / 10, status };
  }

  function calcRetirementTrack(retirementAmt, monthlyInc, retirementAge) {
    if (monthlyInc <= 0 || retirementAmt < 0) return { score: 0, multiple: 0, status: 'no-data' };
    const annualInc = monthlyInc * 12;
    // Target: 25× annual income (4% safe withdrawal rule) by retirement
    const target = annualInc * 25;
    if (target <= 0) return { score: 0, multiple: 0, status: 'no-data' };
    const pct = (retirementAmt / target) * 100;
    const score = Math.round(Math.min(pct, SCORE_MAX));
    const multiple = annualInc > 0 ? Math.round((retirementAmt / annualInc) * 10) / 10 : 0;
    const status = pct >= 50 ? 'good' : pct >= 20 ? 'warn' : 'alert';
    return { score, multiple, pct: Math.round(pct), status };
  }

  function calcFIREReadiness(retirementAmt, monthlyExp) {
    if (monthlyExp <= 0) return { score: 0, years: 0, status: 'no-data' };
    const annualExp = monthlyExp * 12;
    // FIRE number = 25× annual expenses
    const fireNumber = annualExp * 25;
    const pct = (retirementAmt / fireNumber) * 100;
    const score = Math.round(Math.min(pct, SCORE_MAX));
    const years = fireNumber > 0 ? Math.round((retirementAmt / fireNumber) * 25 * 10) / 10 : 0;
    const status = pct >= 50 ? 'good' : pct >= 20 ? 'warn' : 'alert';
    return { score, pct: Math.round(pct), fireNumber, status };
  }

  function calcLifeInsurance(declaredCover, monthlyInc) {
    if (!declaredCover || declaredCover <= 0) return { score: 0, multiple: 0, status: 'no-data' };
    if (monthlyInc <= 0) return { score: 50, multiple: 0, status: 'warn' }; // declared but can't evaluate
    const annualInc = monthlyInc * 12;
    const multiple = declaredCover / annualInc;
    let score;
    if (multiple >= 10)     score = 100;
    else if (multiple >= 7) score = 70 + ((multiple - 7) / 3) * 30;
    else if (multiple >= 5) score = 40 + ((multiple - 5) / 2) * 30;
    else                    score = (multiple / 5) * 40;
    const status = multiple >= 10 ? 'good' : multiple >= 5 ? 'warn' : 'alert';
    return { score: Math.round(Math.min(score, SCORE_MAX)), multiple: Math.round(multiple * 10) / 10, status };
  }

  function calcEducationGoal(educationAmt, educationTarget) {
    if (!educationTarget || educationTarget <= 0) return { score: 0, pct: 0, status: 'no-data' };
    const pct = (educationAmt / educationTarget) * 100;
    const score = Math.round(Math.min(pct, SCORE_MAX));
    const status = pct >= 75 ? 'good' : pct >= 40 ? 'warn' : 'alert';
    return { score, pct: Math.round(pct), status };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PROFILE LOADER — reads fhsProfiles/{uid} from Firestore
  // ══════════════════════════════════════════════════════════════════════

  function _loadProfile() {
    if (_profileLoaded) return Promise.resolve(_profile);
    if (_profilePromise) return _profilePromise;

    _profilePromise = new Promise((resolve) => {
      const user = window._fbUser;
      if (!user || !window._fbDb) { _profileLoaded = true; resolve(null); return; }

      window._fbDb.collection('fhsProfiles').doc(user.uid).get()
        .then(doc => {
          _profile = doc.exists ? doc.data() : null;
          _profileLoaded = true;
          resolve(_profile);
        })
        .catch(() => { _profileLoaded = true; resolve(null); });
    });
    return _profilePromise;
  }

  // Call this to force a fresh profile load (after onboarding saves)
  function refreshProfile() {
    _profile = null;
    _profileLoaded = false;
    _profilePromise = null;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAIN SCORE COMPUTE
  // ══════════════════════════════════════════════════════════════════════

  async function computeScore() {
    // Guard: MoneyFi globals must exist
    if (typeof computeNetWorth !== 'function' || typeof data === 'undefined') {
      return null;
    }

    const profile = await _loadProfile();
    const nw = computeNetWorth();
    const mk = typeof getCurrentMonthKey === 'function' ? getCurrentMonthKey() : new Date().toISOString().slice(0, 7);
    const m = data[mk] || {};

    const _conv = typeof convertAmt === 'function' ? convertAmt : (a) => Number(a);
    const _nwConv = typeof nwConvert === 'function' ? nwConvert : (a) => Number(a);

    // ── Aggregates ────────────────────────────────────────────────────
    const totalInc = (m.income || []).reduce((s, e) => s + _conv(e.amount, e.currency), 0);
    const totalExp = (m.expenses || []).reduce((s, e) => s + _conv(e.amount, e.currency), 0);

    // Liquid assets: checking + savings + cash (same logic as renderNWInsights)
    const liquid = (nw.byType.checking?.total || 0)
                 + (nw.byType.savings_acc?.total || 0)
                 + (nw.byType.cash?.total || 0);

    // Retirement assets: retirement + brokerage
    const retirementAmt = (nw.byType.retirement?.total || 0)
                        + (nw.byType.brokerage?.total || 0);

    // Education assets: tagged accounts
    const educationAmt = (data._nwAccounts || [])
      .filter(a => a.meta?.fhsTag === 'education')
      .reduce((s, a) => s + _nwConv(a.balance, a.currency), 0);

    // ── Profile fields ────────────────────────────────────────────────
    const retirementAge = profile?.retirementAge || 60;
    const declaredCover = profile?.insuranceCoverDeclared || 0;
    const educationTarget = profile?.educationTarget || 0;

    // ── Compute all 6 Foundation metrics ─────────────────────────────
    const savings     = calcSavingsRate(totalInc, totalExp);
    const emergency   = calcEmergencyFund(liquid, totalExp);
    const retTrack    = calcRetirementTrack(retirementAmt, totalInc, retirementAge);
    const fire        = calcFIREReadiness(retirementAmt, totalExp);
    const insurance   = calcLifeInsurance(declaredCover, totalInc);
    const education   = calcEducationGoal(educationAmt, educationTarget);

    // ── Overall Foundation Band score (weighted average) ──────────────
    // Weight: savings + emergency carry more weight in Foundation band
    const weights = {
      savings: 0.20,
      emergency: 0.20,
      retTrack: 0.20,
      fire: 0.15,
      insurance: 0.15,
      education: 0.10
    };

    const overall = Math.round(
      savings.score   * weights.savings   +
      emergency.score * weights.emergency +
      retTrack.score  * weights.retTrack  +
      fire.score      * weights.fire      +
      insurance.score * weights.insurance +
      education.score * weights.education
    );

    return {
      overall,
      band: 'Foundation',
      metrics: { savings, emergency, retTrack, fire, insurance, education },
      inputs: { totalInc, totalExp, liquid, retirementAmt, educationAmt, mk },
      profile,
      hasProfile: !!profile
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.FHS = window.FHS || {};
  Object.assign(window.FHS, {
    computeScore,
    refreshProfile,
    // Expose calculators for unit testing / fhs-profile.js previews
    _calc: { calcSavingsRate, calcEmergencyFund, calcRetirementTrack, calcFIREReadiness, calcLifeInsurance, calcEducationGoal }
  });

})();
