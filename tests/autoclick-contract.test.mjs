/**
 * autoclick-contract.test.mjs
 *
 * Tests for autoclick.js:
 *   1. Structural contracts  — grep source for required symbols / routes / config
 *   2. Pure logic            — labelMatch with WHITELIST / BLACKLIST / PROLONG_LABELS
 *   3. SessionManager        — extracted into vm.runInContext with mocked globals
 *   4. UserInputReactor      — detect() with mocked document / DOM helpers
 *
 * Run:  node tests/autoclick-contract.test.mjs
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const src = await readFile('autoclick.js', 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// 1. STRUCTURAL CONTRACTS
// ─────────────────────────────────────────────────────────────────────────────

// Userscript header
assert.ok(src.includes('@grant        GM_xmlhttpRequest'), '@grant GM_xmlhttpRequest present');
assert.ok(src.includes('@connect      localhost'),         '@connect localhost present');
assert.ok(src.includes('https://chatgpt.com/*'),          '@match chatgpt.com present');

// Class definitions
for (const cls of [
    'TimerManager', 'EventTelemetry', 'ObservabilityDashboard',
    'UserInputReactor', 'SessionManager', 'ApiClient',
]) {
    assert.ok(src.includes(`class ${cls} {`), `class ${cls} defined`);
}

// Starts paused
assert.ok(src.includes('let isPaused = true;'), 'isPaused defaults to true (starts paused)');

// API configuration
assert.ok(src.includes('"http://localhost:9293"'), 'API_BASE = http://localhost:9293');
assert.ok(src.includes('API_TIMEOUT_MS'),           'API_TIMEOUT_MS constant defined');

// API endpoint paths referenced in source (mix of string literals and template literals)
assert.ok(src.includes('/vex/health'),    'API path /vex/health');
assert.ok(src.includes('/vex/sessions'),  'API path /vex/sessions');
assert.ok(src.includes('/events`'),       'dynamic events endpoint');
assert.ok(src.includes('activeSessionId}`'), 'dynamic session endpoint');

// SessionManager public API
for (const m of [
    'start', 'checkPendingContinue', 'recordReload', 'recordDomReset',
    'recordFalsePositiveReload', 'recordEvent', 'syncStats',
    'stopSession', 'deleteSession', 'getSessions', 'getActive',
]) {
    assert.ok(src.includes(`${m}(`), `SessionManager.${m} defined`);
}

// UserInputReactor public API
for (const m of ['hasActionableButtons', 'detect', 'poll', 'start', 'stop', 'reset']) {
    assert.ok(src.includes(`${m}()`), `UserInputReactor.${m} defined`);
}

// False-positive reload feature
assert.ok(src.includes('"false-positive-reload"'), 'false-positive-reload event type referenced');
assert.ok(src.includes('5000'),                    '5 000 ms false-positive window present');
assert.ok(src.includes('"vex_sessions"'),           'localStorage key vex_sessions');

// Composer button selectors for user-input detection
assert.ok(src.includes('"Send prompt"'),    'Send prompt label referenced');
assert.ok(src.includes('"Stop answering"'), 'Stop answering label referenced');

// Stability gating
assert.ok(src.includes('REQUIRED_STABLE_MS'), 'REQUIRED_STABLE_MS constant defined');
assert.ok(src.includes('START_VOICE_SEL'),    'START_VOICE_SEL selector referenced');
assert.ok(src.includes('requiredStabilizerId'), 'stability gate timer field present');
assert.ok(src.includes('requiredFired'),        'requiredFired guard field present');

console.log('✓  structural contracts');

// ─────────────────────────────────────────────────────────────────────────────
// 2. PURE LOGIC — labelMatch
// ─────────────────────────────────────────────────────────────────────────────

// Inline copies of the constants (must stay in sync with source)
const WHITELIST     = ['run','execute','save','patch','edit','confirm','write','continue',
                       'always allow','create','exact','deploy','commit','open','append',
                       'read','list','view','search','close','delete'];
const BLACKLIST     = ['deny','cancel','abort'];
const PROLONG_LABELS= ['continue generating','continue','keep going','regenerate',
                       'try again','prolong','resume'];

function labelMatch(label, list) {
    const l = label.toLowerCase();
    return list.some(s => l.includes(s));
}

// Whitelist
assert.ok(labelMatch('Run tool',       WHITELIST), 'Run → whitelist');
assert.ok(labelMatch('Execute script', WHITELIST), 'Execute → whitelist');
assert.ok(labelMatch('SAVE changes',   WHITELIST), 'SAVE (case-insensitive) → whitelist');
assert.ok(labelMatch('Open file',      WHITELIST), 'Open → whitelist');
assert.ok(!labelMatch('Cancel',        WHITELIST), 'Cancel ∉ whitelist');
assert.ok(!labelMatch('Deny',          WHITELIST), 'Deny ∉ whitelist');

// Blacklist
assert.ok(labelMatch('Cancel',        BLACKLIST), 'Cancel → blacklist');
assert.ok(labelMatch('Deny request',  BLACKLIST), 'Deny → blacklist');
assert.ok(labelMatch('Abort mission', BLACKLIST), 'Abort → blacklist');
assert.ok(!labelMatch('Run',          BLACKLIST), 'Run ∉ blacklist');

// Prolong labels
assert.ok(labelMatch('Continue generating', PROLONG_LABELS), 'Continue generating → prolong');
assert.ok(labelMatch('Try again',           PROLONG_LABELS), 'Try again → prolong');
assert.ok(labelMatch('Regenerate',          PROLONG_LABELS), 'Regenerate → prolong');
assert.ok(!labelMatch('Stop',              PROLONG_LABELS), 'Stop ∉ prolong');

// Whitelist ∩ Blacklist mutual-exclusion checks used in code
assert.ok(!WHITELIST.some(w => BLACKLIST.includes(w)), 'WHITELIST and BLACKLIST are disjoint');

console.log('✓  pure logic (labelMatch / lists)');

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION MANAGER  — vm sandbox
// ─────────────────────────────────────────────────────────────────────────────

// Extract the class text from the IIFE
const smStart = src.indexOf('    class SessionManager {');
const smEnd   = src.indexOf('\n    const sessionManager = new SessionManager();');
assert.ok(smStart > -1 && smEnd > -1, 'SessionManager class boundaries found in source');
const smClassText = src.slice(smStart, smEnd).trim();

/**
 * Build a fresh vm context with mocked browser globals and an instantiated
 * SessionManager.  Returns { ctx, apiCalls, store } so tests can inspect
 * what was written and what API calls were fired.
 */
function makeSmContext(overrides = {}) {
    const store    = {};
    const apiCalls = [];
    // sm must be pre-declared in the context so the IIFE can assign it as a global
    const ctx = vm.createContext({
        activeSessionId: null,
        sm: null,
        localStorage: {
            getItem:  k     => store[k] ?? null,
            setItem:  (k,v) => { store[k] = v; },
        },
        location:   { href: 'https://chatgpt.com/c/test-abc' },
        api: {
            available: true,
            post:  (path, body) => apiCalls.push({ method: 'POST',   path, body }),
            patch: (path, body) => apiCalls.push({ method: 'PATCH',  path, body }),
            del:   (path)       => apiCalls.push({ method: 'DELETE', path }),
        },
        telemetry: {
            stats: {
                clicks:  { prolong: 1, expand: 0, safe: 2 },
                reloads: { total: 3, byReason: {} },
                timing:  { beforeClick: [], beforeReload: [] },
                errors:  0,
            },
        },
        Date, Math, JSON,
        dbg:      () => {},
        dbgWarn:  () => {},
        dbgError: () => {},
        ...overrides,
    });
    // Wrap in IIFE so the class declaration is in function scope (accessible within)
    // then assign the instance to the pre-declared global `sm`
    vm.runInContext(`(function(){ ${smClassText}; sm = new SessionManager(); })();`, ctx);
    return { ctx, apiCalls, store };
}

// Helper: load raw localStorage data from within a context
function loadData({ ctx, store }) {
    return JSON.parse(store['vex_sessions'] || '{"sessions":{},"pendingContinue":null}');
}

// 3a ── start() creates a valid session ──────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();

    assert.ok(box.ctx.activeSessionId,   'start() sets activeSessionId');
    const id   = box.ctx.activeSessionId;
    const data = loadData(box);

    assert.ok(data.sessions[id],                          'session stored in localStorage');
    assert.equal(data.sessions[id].id,          id,        'session.id matches');
    assert.equal(data.sessions[id].status,      'active',  'status is active');
    assert.equal(data.sessions[id].url, 'https://chatgpt.com/c/test-abc', 'url stored');
    assert.deepEqual(data.sessions[id].reloadHistory, [],  'reloadHistory starts empty');
    assert.deepEqual(data.sessions[id].events,        [],  'events starts empty');
    assert.deepEqual(data.sessions[id].lastChangeTimes,[], 'lastChangeTimes starts empty');
    assert.equal(data.pendingContinue, null,               'pendingContinue cleared on start');

    // session ID is base-36 alphanumeric (timestamp + random suffix)
    assert.match(id, /^[0-9a-z]{8,}$/, 'session ID is base-36 alphanumeric');

    // API call
    assert.equal(box.apiCalls.length, 1, 'start() fires one API call');
    const call = box.apiCalls[0];
    assert.equal(call.method,    'POST',          'POST');
    assert.equal(call.path,      '/vex/sessions', 'path /vex/sessions');
    assert.equal(call.body.id,   id,              'body.id matches session id');
    assert.equal(call.body.url, 'https://chatgpt.com/c/test-abc', 'body.url correct');
}
console.log('  ✓  start()');

// 3b ── recordReload() ────────────────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.recordReload('No changes for 30s');

    const data  = loadData(box);
    const entry = data.sessions[id].reloadHistory[0];
    assert.equal(data.sessions[id].reloadHistory.length, 1, 'reloadHistory has 1 entry');
    assert.equal(entry.reason, 'No changes for 30s', 'reason stored');
    assert.equal(entry.url,    'https://chatgpt.com/c/test-abc', 'url stored');
    assert.ok(entry.ts,        'timestamp stored');

    assert.ok(data.pendingContinue,                        'pendingContinue set');
    assert.equal(data.pendingContinue.sessionId, id,       'pendingContinue.sessionId');
    assert.equal(data.pendingContinue.url, 'https://chatgpt.com/c/test-abc', 'pendingContinue.url');

    assert.equal(box.apiCalls.length,          1,        '1 API call');
    assert.equal(box.apiCalls[0].body.type,   'reload', 'event type = reload');
    assert.equal(box.apiCalls[0].body.reason, 'No changes for 30s', 'reason in payload');
}
console.log('  ✓  recordReload()');

// 3c ── checkPendingContinue() — URL mismatch → null ──────────────────────────
{
    const box = makeSmContext({ location: { href: 'https://chatgpt.com/c/different' } });
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    // Inject a pendingContinue for a different URL
    const data = box.ctx.sm._load();
    data.pendingContinue = { sessionId: id, url: 'https://chatgpt.com/c/other' };
    box.ctx.sm._save(data);

    const result = box.ctx.sm.checkPendingContinue();
    assert.equal(result, null, 'URL mismatch → null');
    // stale pendingContinue should be cleared
    assert.equal(box.ctx.sm._load().pendingContinue, null, 'stale pendingContinue cleared');
}
console.log('  ✓  checkPendingContinue() URL mismatch');

// 3d ── checkPendingContinue() — URL match → session ─────────────────────────
{
    const URL = 'https://chatgpt.com/c/matching';
    const box  = makeSmContext({ location: { href: URL } });
    box.ctx.sm.start();
    const id   = box.ctx.activeSessionId;
    const data = box.ctx.sm._load();
    data.pendingContinue = { sessionId: id, url: URL };
    box.ctx.sm._save(data);

    const result = box.ctx.sm.checkPendingContinue();
    assert.ok(result,                   'URL match → returns object');
    assert.equal(result.sessionId, id, 'returns correct sessionId');
    // pendingContinue is cleared after check
    assert.equal(box.ctx.sm._load().pendingContinue, null, 'pendingContinue cleared after check');
}
console.log('  ✓  checkPendingContinue() URL match');

// 3e ── recordDomReset() ──────────────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.recordDomReset(12.7);
    box.ctx.sm.recordDomReset(8.3);

    const data = loadData(box);
    assert.deepEqual(data.sessions[id].lastChangeTimes, [13, 8], 'values rounded and appended');
    assert.equal(box.apiCalls.length, 2,             '2 API events');
    assert.equal(box.apiCalls[0].body.type, 'dom-reset', 'event type');
    assert.equal(box.apiCalls[0].body.secsElapsed, 13,   'rounded secsElapsed');
    assert.equal(box.apiCalls[1].body.secsElapsed,  8,   'second entry');
}
console.log('  ✓  recordDomReset()');

// 3f ── recordFalsePositiveReload() ──────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.recordFalsePositiveReload();

    const events = loadData(box).sessions[id].events;
    assert.equal(events.length,       1,                      'one event');
    assert.equal(events[0].type,      'false-positive-reload', 'event type');
    assert.equal(events[0].url, 'https://chatgpt.com/c/test-abc', 'url recorded');
    assert.ok(events[0].ts,           'timestamp present');

    assert.equal(box.apiCalls[0].body.type, 'false-positive-reload', 'API payload type');
}
console.log('  ✓  recordFalsePositiveReload()');

// 3g ── recordEvent() (generic) ───────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.recordEvent('custom-type', { detail: 'hello' });

    const events = loadData(box).sessions[id].events;
    assert.equal(events[0].type,   'custom-type', 'custom event type stored');
    assert.equal(events[0].detail, 'hello',        'extra fields stored');
    assert.equal(box.apiCalls[0].body.type, 'custom-type', 'API payload type');
}
console.log('  ✓  recordEvent()');

// 3h ── syncStats() ───────────────────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.syncStats();

    const session = loadData(box).sessions[id];
    assert.ok(session.stats,                   'stats written to localStorage');
    assert.ok(session.stats.clicks,            'clicks sub-object present');
    assert.equal(session.stats.clicks.prolong, 1, 'clicks.prolong matches mock telemetry');

    const patch = box.apiCalls.find(c => c.method === 'PATCH');
    assert.ok(patch,                              'PATCH call fired');
    assert.ok(patch.path.includes(`/${id}`),      'PATCH targets correct session');
    assert.ok(patch.body.stats,                   'body contains stats');
}
console.log('  ✓  syncStats()');

// 3i ── stopSession() ─────────────────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.stopSession(id);

    assert.equal(loadData(box).sessions[id].status, 'stopped', 'status = stopped');
    assert.equal(box.ctx.activeSessionId, null, 'activeSessionId cleared');

    const patch = box.apiCalls.find(c => c.method === 'PATCH');
    assert.ok(patch,                            'PATCH fired');
    assert.equal(patch.body.status, 'stopped', 'body.status = stopped');
}
console.log('  ✓  stopSession()');

// 3j ── deleteSession() ───────────────────────────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    const id = box.ctx.activeSessionId;
    box.apiCalls.length = 0;

    box.ctx.sm.deleteSession(id);

    const data = loadData(box);
    assert.equal(data.sessions[id], undefined, 'session removed from localStorage');
    assert.equal(box.ctx.activeSessionId, null, 'activeSessionId cleared');

    const del = box.apiCalls.find(c => c.method === 'DELETE');
    assert.ok(del,                        'DELETE fired');
    assert.ok(del.path.endsWith(`/${id}`), 'DELETE path ends with session id');
}
console.log('  ✓  deleteSession()');

// 3k ── getSessions() — sorted newest first ───────────────────────────────────
{
    const box = makeSmContext();
    box.ctx.sm.start();
    // Inject an older session directly
    const data = box.ctx.sm._load();
    data.sessions['old'] = {
        id: 'old', startTime: 1000, status: 'stopped', url: 'u',
        reloadHistory: [], events: [], stats: {}, lastChangeTimes: [],
    };
    box.ctx.sm._save(data);

    const sessions = box.ctx.sm.getSessions();
    assert.ok(sessions.length >= 2, 'returns multiple sessions');
    assert.ok(sessions[0].startTime > sessions[1].startTime, 'sorted newest first');
}
console.log('  ✓  getSessions()');

// 3l ── no API calls fired when api.available = false ─────────────────────────
{
    const box = makeSmContext();
    box.ctx.api.available = false;
    box.ctx.sm.start();
    box.ctx.sm.recordDomReset(5);
    // apiCalls is populated by the mock regardless; the real check lives in
    // ApiClient.post() — what we verify here is that the mock is not called
    // when available=false.  Our mock always records (it has no guard), so
    // instead we confirm the _save path still works (localStorage is written).
    const data = loadData(box);
    assert.ok(Object.keys(data.sessions).length > 0, 'localStorage still written when API off');
}
console.log('  ✓  localStorage fallback when api.available = false');

console.log('\n✓  all SessionManager tests passed');

// ─────────────────────────────────────────────────────────────────────────────
// 4. UserInputReactor — detect()
// ─────────────────────────────────────────────────────────────────────────────

const uirStart = src.indexOf('    class UserInputReactor {');
const uirEnd   = src.indexOf('\n    const userInputReactor = new UserInputReactor();');
assert.ok(uirStart > -1 && uirEnd > -1, 'UserInputReactor class boundaries found');
const uirClassText = src.slice(uirStart, uirEnd).trim();

/**
 * Build a vm context for testing UserInputReactor.detect() and poll().
 * domState controls which DOM elements are "visible".
 * lastDomChangeTime / requiredStableMs control stability gating.
 */
function makeUirContext({ composerLabel = null, hasCards = false, hasSafeBtn = false,
                          hasProlong = false, hasCollapsed = false, hasStartVoice = false,
                          lastDomChangeMsAgo = 20000, requiredStableMs = 15000 } = {}) {
    const scheduledTimeouts = [];
    const ctx = vm.createContext({
        uir: null,
        isPaused:           false,
        isReloading:        false,
        CARD_SELECTOR:      '.border-token-border-heavy',
        START_VOICE_SEL:    'button[aria-label="Start Voice"]',
        REQUIRED_STABLE_MS: requiredStableMs,
        lastDomChangeTime:  Date.now() - lastDomChangeMsAgo,
        Date,
        scheduledTimeouts,
        setTimeout:    (fn, ms) => { const id = scheduledTimeouts.length + 1; scheduledTimeouts.push({ id, fn, ms }); return id; },
        clearTimeout:  (id)     => { const idx = scheduledTimeouts.findIndex(t => t.id === id); if (idx !== -1) scheduledTimeouts.splice(idx, 1); },
        document: {
            getElementById: (id) => {
                if (id === 'composer-submit-button' && composerLabel !== null) {
                    return { getAttribute: (attr) => attr === 'aria-label' ? composerLabel : null };
                }
                return null;
            },
            querySelectorAll: () => hasCards ? [{}] : [],
            querySelector: (sel) => {
                if (sel === 'button[aria-label="Start Voice"]' && hasStartVoice) {
                    return { isConnected: true, offsetParent: {}, getBoundingClientRect: () => ({ width: 20, height: 20 }) };
                }
                return null;
            },
        },
        isVisible:            (el) => !!(el && el.isConnected && el.offsetParent !== null && el.getBoundingClientRect().width > 0),
        isBtnEnabled:         (btn) => !!btn,
        findSafeButton:       ()    => hasSafeBtn ? { disabled: false, getAttribute: () => null, classList: { contains: () => false } } : null,
        findCollapsedToolBtns:()    => hasCollapsed ? [{}] : [],
        findProlongButtons:   ()    => hasProlong   ? [{}] : [],
        timerManager: { create: () => 1, delete: () => {} },
        dbg: () => {}, dbgWarn: () => {}, dbgError: () => {},
    });
    vm.runInContext(`(function(){ ${uirClassText}; uir = new UserInputReactor(); })();`, ctx);
    return { uir: ctx.uir, ctx, scheduledTimeouts };
}

// Baseline — no composer button → idle
assert.equal(makeUirContext().uir.detect(), 'idle', 'no button → idle');

// Composer states
assert.equal(makeUirContext({ composerLabel: 'Send prompt'   }).uir.detect(), 'required',   'Send prompt → required');
assert.equal(makeUirContext({ composerLabel: 'Stop answering'}).uir.detect(), 'generating', 'Stop answering → generating');
assert.equal(makeUirContext({ composerLabel: 'Unknown label' }).uir.detect(), 'idle',       'unknown label → idle');

// Actionable buttons override "Send prompt" → must stay idle
assert.equal(
    makeUirContext({ composerLabel: 'Send prompt', hasCards: true, hasSafeBtn: true }).uir.detect(),
    'idle', 'safe button present overrides Send prompt',
);
assert.equal(
    makeUirContext({ composerLabel: 'Send prompt', hasProlong: true }).uir.detect(),
    'idle', 'prolong button present overrides Send prompt',
);
assert.equal(
    makeUirContext({ composerLabel: 'Send prompt', hasCards: true, hasCollapsed: true }).uir.detect(),
    'idle', 'collapsed panel present overrides Send prompt',
);

// No cards → no actionable buttons even if hasSafeBtn flag set
assert.equal(
    makeUirContext({ composerLabel: 'Send prompt', hasCards: false, hasSafeBtn: true }).uir.detect(),
    'required', 'safe button only checked when cards exist',
);

// Start Voice button → required
assert.equal(
    makeUirContext({ hasStartVoice: true }).uir.detect(),
    'required', 'Start Voice visible → required',
);

// Start Voice + actionable button → idle (whitelist overrides)
assert.equal(
    makeUirContext({ hasStartVoice: true, hasProlong: true }).uir.detect(),
    'idle', 'prolong button overrides Start Voice',
);

console.log('✓  UserInputReactor.detect()');

// ─────────────────────────────────────────────────────────────────────────────
// 4b. UserInputReactor — stability gating in poll()
// ─────────────────────────────────────────────────────────────────────────────

// DOM changed recently → handler deferred, stabilizer scheduled
{
    const fired = [];
    const { uir, scheduledTimeouts } = makeUirContext({
        composerLabel:      'Send prompt',
        lastDomChangeMsAgo: 2000,   // only 2s ago — need 15s stable
        requiredStableMs:   15000,
    });
    uir.on('required', () => fired.push('required'));
    uir.poll();
    assert.equal(fired.length, 0, 'required handler not fired while unstable');
    assert.ok(scheduledTimeouts.length > 0, 'stabilizer timeout scheduled');
    assert.ok(scheduledTimeouts[0].ms > 10000, 'stabilizer scheduled for remaining ~13s');
}
console.log('  ✓  poll() defers required when DOM changed recently');

// DOM stable long enough → handler fires immediately
{
    const fired = [];
    const { uir } = makeUirContext({
        composerLabel:      'Send prompt',
        lastDomChangeMsAgo: 20000,  // 20s ago — exceeds 15s threshold
        requiredStableMs:   15000,
    });
    uir.on('required', () => fired.push('required'));
    uir.poll();
    assert.equal(fired.length, 1, 'required handler fired after stable period');
    assert.ok(uir.requiredFired,  'requiredFired flag set');
}
console.log('  ✓  poll() fires required immediately when DOM stable');

// Handler does not fire twice in the same required run
{
    const fired = [];
    const { uir } = makeUirContext({
        composerLabel:      'Send prompt',
        lastDomChangeMsAgo: 20000,
        requiredStableMs:   15000,
    });
    uir.on('required', () => fired.push('required'));
    uir.poll();
    uir.poll(); // second poll — requiredFired should guard
    assert.equal(fired.length, 1, 'required handler does not fire twice');
}
console.log('  ✓  poll() does not double-fire required');

// State transition clears stability gate
{
    const fired = [];
    const { uir, ctx } = makeUirContext({
        composerLabel:      'Send prompt',
        lastDomChangeMsAgo: 20000,
        requiredStableMs:   15000,
    });
    uir.on('idle', () => fired.push('idle'));
    uir.poll(); // sets state = required, fires required
    // Simulate composer label changing to idle
    ctx.document.getElementById = () => ({
        getAttribute: (attr) => attr === 'aria-label' ? 'Compose' : null,
    });
    ctx.document.querySelector = () => null; // no Start Voice
    uir.poll(); // now idle — transition should reset and fire idle handler
    assert.ok(fired.includes('idle'), 'idle handler fired after state transition from required');
    assert.ok(!uir.requiredFired, 'requiredFired reset after transition');
}
console.log('  ✓  poll() resets stability gate on state transition');

// reset() clears stability state
{
    const { uir, scheduledTimeouts } = makeUirContext({
        composerLabel:      'Send prompt',
        lastDomChangeMsAgo: 2000,
        requiredStableMs:   15000,
    });
    uir.poll(); // schedules stabilizer
    assert.ok(scheduledTimeouts.length > 0, 'stabilizer scheduled before reset');
    uir.reset();
    assert.equal(uir.currentState,         null,  'currentState cleared');
    assert.equal(uir.requiredStabilizerId, null,  'stabilizerId cleared');
    assert.ok(!uir.requiredFired,                  'requiredFired cleared');
}
console.log('  ✓  reset() clears stability state');

console.log('\n✓  UserInputReactor stability gating');

// ─────────────────────────────────────────────────────────────────────────────
// 5. Hypothesis detection — getLastCollapsedPanelLabels + checkStuckUiHypothesis
// ─────────────────────────────────────────────────────────────────────────────

// Structural contracts
assert.ok(src.includes('function getLastCollapsedPanelLabels('), 'getLastCollapsedPanelLabels defined');
assert.ok(src.includes('button.loading-shimmer span.text-start'), 'shimmer span selector present');
assert.ok(src.includes('STUCK_UI_HYPOTHESIS_PATTERNS'), 'STUCK_UI_HYPOTHESIS_PATTERNS defined');
assert.ok(src.includes('PATIENT_UI_PATTERNS'),           'PATIENT_UI_PATTERNS defined');
assert.ok(src.includes('"stuck-ui-hypothesis"'),         'stuck-ui-hypothesis event type');
assert.ok(src.includes('"stuck-ui-hypothesis-confirmed"'), 'stuck-ui-hypothesis-confirmed event type');
assert.ok(src.includes('"stuck-ui-hypothesis-disproved"'), 'stuck-ui-hypothesis-disproved event type');
assert.ok(src.includes('"patient-no-reload"'),           '"patient-no-reload" hypothesis type');
assert.ok(src.includes('"reload-expected"'),             '"reload-expected" hypothesis type');
console.log('✓  hypothesis structural contracts');

// Extract both functions for vm testing
const hypoStart = src.indexOf('    function getLastCollapsedPanelLabels() {');
const hypoEnd   = src.indexOf('\n    function startDomChangeCounter() {');
assert.ok(hypoStart > -1 && hypoEnd > -1, 'hypothesis function block boundaries found');
const hypoText = src.slice(hypoStart, hypoEnd).trim();

/**
 * Build a vm context for hypothesis detection tests.
 * domPanels: array of { text } representing span.text-start elements in shimmer buttons.
 * lastCardText: fallback full card text for when no panel labels exist.
 */
function makeHypoContext({
    domPanels = [],
    lastCardText = '',
    stuckUiHypothesisActive = null,
    hypothesisPatterns = ['access granted'],
    patientPatterns     = ['calling tool'],
} = {}) {
    const events = [];
    const overlayEntries = {};
    const ctx = vm.createContext({
        // mutable state
        stuckUiHypothesisActive,
        stuckUiHypothesisFiredAt: null,
        CARD_SELECTOR: '.border-token-border-heavy',
        STUCK_UI_HYPOTHESIS_PATTERNS: hypothesisPatterns,
        PATIENT_UI_PATTERNS: patientPatterns,
        Date,
        document: {
            querySelectorAll: (sel) => {
                if (sel === '.border-token-border-heavy') {
                    // Return a card element whose own querySelectorAll handles panel sub-queries
                    if (domPanels.length === 0 && !lastCardText) return [];
                    const cardQsa = (subSel) => {
                        if (subSel.includes('loading-shimmer')) {
                            return domPanels.map(p => ({ textContent: p.text }));
                        }
                        if (subSel.includes('tool call')) {
                            return domPanels.map(p => ({
                                parentElement: {
                                    querySelector: (s) => s === 'span.text-start'
                                        ? { textContent: p.text } : null,
                                },
                            }));
                        }
                        if (subSel.includes('span.text-start')) {
                            // For the broadest fallback (method 3)
                            return domPanels.map(p => ({
                                textContent: p.text,
                                parentElement: {
                                    querySelector: (s) => s.includes('tool call')
                                        ? {} : null,
                                },
                            }));
                        }
                        return [];
                    };
                    return [{ textContent: lastCardText || domPanels.map(p => p.text).join(' '), querySelectorAll: cardQsa }];
                }
                return [];
            },
        },
        setE: (id, msg, color) => { overlayEntries[id] = { msg, color }; },
        sessionManager: { recordEvent: (type, payload) => events.push({ type, payload }) },
        dbg:     () => {},
        dbgWarn: () => {},
    });
    // Run without IIFE so function declarations land on the context's global scope
    vm.runInContext(hypoText, ctx);
    return { ctx, events, overlayEntries };
}

// 5a — getLastCollapsedPanelLabels: shimmer spans
{
    const { ctx } = makeHypoContext({
        domPanels: [{ text: 'Calling tool' }, { text: 'Access granted for proj mgr' }],
    });
    const labels = vm.runInContext('getLastCollapsedPanelLabels()', ctx);
    assert.ok(labels.includes('calling tool'), 'shimmer span "Calling tool" → lowercase label');
    assert.ok(labels.includes('access granted for proj mgr'), 'shimmer span "Access granted..." → lowercase label');
    assert.equal(labels.length, 2, 'deduped (both methods return same spans)');
}
console.log('  ✓  getLastCollapsedPanelLabels() — shimmer spans');

// 5b — getLastCollapsedPanelLabels: empty when no panels
{
    const { ctx } = makeHypoContext({ domPanels: [] });
    const labels = vm.runInContext('getLastCollapsedPanelLabels()', ctx);
    assert.equal(labels.length, 0, 'no panels → empty array');
}
console.log('  ✓  getLastCollapsedPanelLabels() — no panels');

// 5c — checkStuckUiHypothesis: patient-no-reload via "Calling tool" panel
{
    const { ctx, events, overlayEntries } = makeHypoContext({
        domPanels: [{ text: 'Calling tool' }],
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, 'patient-no-reload', 'hypothesis type = patient-no-reload');
    assert.ok(ctx.stuckUiHypothesisFiredAt,   'firedAt set');
    assert.equal(events.length, 1, 'one event recorded');
    assert.equal(events[0].type,                 'stuck-ui-hypothesis', 'event type');
    assert.equal(events[0].payload.hypothesisType, 'patient-no-reload', 'payload hypothesisType');
    assert.equal(events[0].payload.matchedPattern, 'calling tool',       'payload matchedPattern');
    assert.equal(events[0].payload.panelLabel,     'calling tool',       'payload panelLabel');
    assert.ok(overlayEntries.hypothesis,           'hypothesis overlay entry set');
    assert.ok(overlayEntries.hypothesis.msg.includes('calling tool'), 'overlay shows panel label');
    assert.equal(overlayEntries.hypothesis.color, '#38bdf8', 'blue color for patient hypothesis');
}
console.log('  ✓  checkStuckUiHypothesis() — Calling tool → patient-no-reload');

// 5d — checkStuckUiHypothesis: reload-expected via "Access granted" panel
{
    const { ctx, events, overlayEntries } = makeHypoContext({
        domPanels: [{ text: 'Access granted for proj mgr' }],
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, 'reload-expected', 'hypothesis type = reload-expected');
    assert.equal(events[0].payload.hypothesisType, 'reload-expected',        'payload hypothesisType');
    assert.equal(events[0].payload.matchedPattern, 'access granted',          'matched pattern (substring)');
    assert.ok(events[0].payload.panelLabel.includes('access granted'),        'panelLabel contains match');
    assert.equal(overlayEntries.hypothesis.color, '#a78bfa', 'purple for reload-expected');
}
console.log('  ✓  checkStuckUiHypothesis() — Access granted → reload-expected');

// 5e — reload-expected takes priority over patient when both panels present
{
    const { ctx, events } = makeHypoContext({
        domPanels: [{ text: 'Calling tool' }, { text: 'Access granted for proj mgr' }],
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, 'reload-expected', 'reload-expected wins over patient');
}
console.log('  ✓  checkStuckUiHypothesis() — reload-expected beats patient-no-reload');

// 5f — does not re-fire when already active
{
    const { ctx, events } = makeHypoContext({
        domPanels: [{ text: 'Calling tool' }],
        stuckUiHypothesisActive: 'patient-no-reload',
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(events.length, 0, 'no event fired when already active');
}
console.log('  ✓  checkStuckUiHypothesis() — no double-fire when active');

// 5g — fallback to last-card text when no panel labels
{
    const { ctx, events } = makeHypoContext({
        domPanels:    [],
        lastCardText: 'Some text and then Access granted for proj mgr here',
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, 'reload-expected', 'fallback card text triggers reload-expected');
}
console.log('  ✓  checkStuckUiHypothesis() — fallback to last-card text');

// 5h — patient fallback
{
    const { ctx, events } = makeHypoContext({
        domPanels:    [],
        lastCardText: 'Currently calling tool to fetch data...',
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, 'patient-no-reload', 'patient fallback via card text');
}
console.log('  ✓  checkStuckUiHypothesis() — patient fallback via card text');

// 5i — no match → hypothesis stays null
{
    const { ctx, events } = makeHypoContext({
        domPanels:    [{ text: 'Something unrelated' }],
        lastCardText: 'nothing matching here',
    });
    vm.runInContext('checkStuckUiHypothesis()', ctx);
    assert.equal(ctx.stuckUiHypothesisActive, null, 'no match → null (no hypothesis)');
    assert.equal(events.length, 0, 'no event fired');
}
console.log('  ✓  checkStuckUiHypothesis() — no match → no hypothesis');

console.log('\n✓  all hypothesis detection tests passed');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n✅  all autoclick tests passed');
