// ==UserScript==
// @name         vexPerimental
// @namespace    auto-card-handler
// @version      16.1
// @description  Thinking countdown, 90s generic reload, 44s waiting-for-card reload, prolong button clicks, timer priority (longer wins), auto-scroll, enabled-only button clicks, expand fix, background-throttle proof, centralized timer management, event telemetry, draggable+collapsible overlay, observability dashboard (Ctrl+`), precondition validation, mutation debouncing, DOM change timer reset, fixed reload mutex
// @match        https://chatgpt.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
    "use strict";

    // ============================
    // CONFIGURATION
    // ============================

    const CARD_SELECTOR = ".border-token-border-heavy";
    const CRITICAL_ERROR_SUBSTRING =
        "something went wrong while generating the response. if this issue persists please contact us through our help center";

    // Remote-configurable via GET /vex/config — use `let` so loadConfig() can override
    let WHITELIST = [
        "run",
        "execute",
        "save",
        "patch",
        "edit",
        "confirm",
        "write",
        "continue",
        "always allow",
        "create",
        "exact",
        "deploy",
        "commit",
        "open",
        "append",
        "read",
        "list",
        "view",
        "search",
        "close",
        "delete",
    ];
    let BLACKLIST = ["deny", "cancel", "abort"];

    // Prolong button labels — buttons that continue/prolong the conversation when it stalls
    let PROLONG_LABELS = [
        "continue generating",
        "continue",
        "keep going",
        "regenerate",
        "try again",
        "prolong",
        "resume",
    ];

    // Persistence API
    const API_BASE = "http://localhost:9293";
    const API_TIMEOUT_MS = 2000;

    // Timing constants (remote-configurable)
    let GENERIC_RELOAD_INTERVAL = 90;    // seconds
    let THINKING_COUNTDOWN_SECS = 45;    // seconds (increased to accommodate reasoning models like o1/o3)
    let WAITING_FOR_CARD_TIMEOUT = 44;   // seconds — reload if no card appears within this window
    let STUCK_THRESHOLD = 30;            // seconds
    let NO_CHANGE_RELOAD_SECS = 30;      // seconds — reload if no DOM change for this long
    let REQUIRED_STABLE_MS = 15000;      // ms — user-input-required must be stable this long before acting
    let FALSE_POSITIVE_WINDOW_MS = 12000; // ms — window after reload-continue to detect a false-positive
    let RAPID_RELOAD_MAX = 10;           // max reloads before pausing to recover
    // Patterns triggering "reload expected" hypothesis: last card text contains any of these
    let STUCK_UI_HYPOTHESIS_PATTERNS = ["access granted"];
    // Patterns triggering "patient, no reload expected" hypothesis: model is actively executing
    let PATIENT_UI_PATTERNS = ["calling tool"];
    // How often to poll backend for remote commands (seconds)
    let COMMAND_POLL_INTERVAL = 5;

    // Fixed timing constants (not remote-configurable)
    const BUTTON_POLL_INTERVAL = 5;      // seconds
    const CRIT_ERR_WAIT_SECS = 5;        // seconds to wait before reloading on critical error
    const FALLBACK_POLL_INTERVAL = 5000; // ms - Forces a check every 5s even if DOM is frozen in background
    const PROLONG_POLL_INTERVAL = 3000;  // ms — how often to scan for prolong buttons
    const PROLONG_CLICK_DELAY_MIN = 500; // ms — min random delay before clicking prolong
    const PROLONG_CLICK_DELAY_MAX = 2000;// ms — max random delay before clicking prolong
    const SCROLL_INTERVAL = 3000;        // ms — how often to auto-scroll down
    const SCROLL_BEHAVIOR = "smooth";    // "smooth" or "instant"

    // Selectors
    const ASSISTANT_MSG_SEL = '[data-message-author-role="assistant"]';
    const THINKING_SHIMMER_SEL = ".loading-shimmer";
    const START_VOICE_SEL = 'button[aria-label="Start Voice"]';
    const STOP_ANSWERING_SEL =
        'button[aria-label="Stop answering"], button[data-estid="stop-button"]';

    // Prolong button selectors (CSS)
    const PROLONG_SELECTORS = [
        'button[aria-label="Continue generating"]',
        'button[aria-label="Continue"]',
        'button[aria-label="Regenerate"]',
        'button[aria-label="Try again"]',
    ];

    // Expand selectors (ordered by specificity, fallbacks last)
    const EXPAND_SELECTORS = [
        'button[aria-label="Open tool call list"][data-state="closed"]',
        'button[aria-label="Open tool call list"]',
        'button[aria-label*="tool call" i]',
        'button[aria-expanded="false"][data-state="closed"]',
        'button[data-state="closed"]',
        'button[aria-expanded="false"]',
    ];

    // ============================
    // DEBUG LOGGER
    // ============================

    const DBG = true; // Master debug switch — set false to silence all logs

    function dbg(tag, ...args) {
        if (!DBG) return;
        const ts = new Date().toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        console.log(`[TM-Debug ${ts}] [${tag}]`, ...args);
    }

    function dbgWarn(tag, ...args) {
        if (!DBG) return;
        const ts = new Date().toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        console.warn(`[TM-Debug ${ts}] [${tag}]`, ...args);
    }

    function dbgError(tag, ...args) {
        // Always log errors even if DBG is off
        const ts = new Date().toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        console.error(`[TM-Debug ${ts}] [${tag}]`, ...args);
    }

    // Snapshot helper — logs a concise DOM state summary
    function dbgSnapshot(label) {
        if (!DBG) return;
        const cards = document.querySelectorAll(CARD_SELECTOR).length;
        const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL).length;
        const shimmer = document.querySelectorAll(THINKING_SHIMMER_SEL).length;
        const startVoice = !!document.querySelector(START_VOICE_SEL);
        const stopBtn = !!document.querySelector(STOP_ANSWERING_SEL);
        const url = location.href;
        dbg(
            "SNAPSHOT",
            `${label} | cards=${cards} msgs=${msgs} shimmer=${shimmer} startVoice=${startVoice} stopBtn=${stopBtn} url=${url}`,
        );
    }

    // ============================
    // STATE
    // ============================

    let isReloading = false;
    let isPaused = true; // when true, all timers/clicks/reloads are suppressed
    let lastPauseReason = null; // reason for the most recent pause
    let pendingReloadId = null; // Mutex-style reload scheduling
    let checkTimeout = null;
    let checkScheduled = false; // For MutationObserver debouncing
    let checkDebounceTimer = null; // Cooldown timer for debouncing
    let processedButtons = new WeakSet();
    let stuckTimers = new Map();
    let buttonPollInts = new Set(); // active button-poll intervals
    let lastUrl = location.href;
    let activeSessionId = null; // ID of the currently active session

    // Per-URL retry tracking helper functions
    function getUrlKey() {
        return `tm_retry_${btoa(location.href)}`; // Base64 encode URL for safe key
    }

    function getRetryCount() {
        const key = getUrlKey();
        const data = JSON.parse(sessionStorage.getItem(key) || "{}");
        return data.count || 0;
    }

    function setRetryCount(count) {
        const key = getUrlKey();
        const data = JSON.parse(sessionStorage.getItem(key) || "{}");
        data.count = count;
        data.url = location.href;
        data.timestamp = Date.now();
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    function getLastRetryTime() {
        const key = getUrlKey();
        const data = JSON.parse(sessionStorage.getItem(key) || "{}");
        return data.timestamp || 0;
    }

    function resetRetryCount() {
        setRetryCount(0);
    }

    // Thinking countdown per messageId
    let thinkingTimers = new Map(); // msgId → { interval, secsLeft, startedAt }

    // Generic 90-s reload
    let genericTimer = null;
    let genericDisplayInt = null;
    let genericStartTime = null;
    let wasInStartVoice = false;

    // Critical Error Listener
    let critErrorTimer = null;

    // Waiting-for-card timer
    let waitingForCardStart = null; // timestamp when we first detected no cards
    let waitingForCardInt = null; // interval for overlay countdown

    // Prolong button tracking
    let prolongPollInt = null; // interval for scanning prolong buttons
    let clickedProlongBtns = new WeakSet(); // track clicked prolong buttons to avoid re-clicks

    // Last DOM change counter
    let lastDomChangeTime = Date.now();
    let domChangeCounterInt = null;

    // Stuck-UI hypothesis tracking (null | "reload-expected" | "patient-no-reload")
    let stuckUiHypothesisActive = null;
    let stuckUiHypothesisFiredAt = null;

    // Remote command polling
    let commandPollInt = null;

    // Auto-scroll
    let scrollInterval = null; // interval for auto-scrolling
    let lastScrollHeight = 0; // track scroll height to detect new content

    // Multi-entry overlay
    let overlayEntries = new Map(); // id → entry obj
    let overlayRAF = null;

    // ============================
    // TIMER MANAGER
    // ============================

    class TimerManager {
        constructor() {
            this.timers = new Map(); // id -> { type, interval, timeout, cleanup, options }
            this.nextId = 0;
        }

        create(type, fn, delay, options = {}) {
            const id = ++this.nextId;
            const timer = { type, id, delay, options, createdAt: Date.now() };

            if (options.repeat) {
                timer.interval = setInterval(() => {
                    // Validate before firing
                    if (options.validate && !options.validate()) {
                        dbg(
                            "TIMER",
                            `Timer ${type}:${id} validation failed — clearing`,
                        );
                        this.delete(id);
                        return;
                    }
                    fn();
                }, delay);
            } else {
                timer.timeout = setTimeout(() => {
                    fn();
                    this.delete(id);
                }, delay);
            }

            timer.cleanup = () => {
                if (timer.interval) clearInterval(timer.interval);
                if (timer.timeout) clearTimeout(timer.timeout);
            };

            this.timers.set(id, timer);
            dbg(
                "TIMER",
                `Created timer ${type}:${id} (delay=${delay}ms, repeat=${!!options.repeat})`,
            );
            return id;
        }

        delete(id) {
            const timer = this.timers.get(id);
            if (timer) {
                timer.cleanup();
                this.timers.delete(id);
                dbg("TIMER", `Cleared timer ${timer.type}:${id}`);
            }
        }

        clearByType(type) {
            let count = 0;
            for (const [id, timer] of this.timers) {
                if (timer.type === type) {
                    this.delete(id);
                    count++;
                }
            }
            if (count > 0)
                dbg("TIMER", `Cleared ${count} timer(s) of type '${type}'`);
        }

        clearAll() {
            const count = this.timers.size;
            dbg("TIMER", `Clearing all timers (${count} active)`);
            for (const [id, timer] of this.timers) {
                timer.cleanup();
            }
            this.timers.clear();
        }

        getByType(type) {
            return [...this.timers.values()].filter((t) => t.type === type);
        }

        getStats() {
            const byType = {};
            for (const timer of this.timers.values()) {
                byType[timer.type] = (byType[timer.type] || 0) + 1;
            }
            return { total: this.timers.size, byType };
        }
    }

    const timerManager = new TimerManager();

    // ============================
    // EVENT TELEMETRY SYSTEM
    // ============================

    class EventTelemetry {
        constructor() {
            this.events = []; // All events
            this.stats = {
                clicks: { prolong: 0, expand: 0, safe: 0 },
                reloads: { total: 0, byReason: {} },
                timing: { beforeClick: [], beforeReload: [] },
                errors: 0,
            };
            this.sessionStart = Date.now();
        }

        // Record a click event with timing info
        recordClick(type, label, timeRemainingMs = null) {
            const event = {
                type: "click",
                subType: type, // prolong, expand, safe
                label: label,
                timeRemainingMs: timeRemainingMs,
                timestamp: Date.now(),
                elapsed: Date.now() - this.sessionStart,
            };
            this.events.push(event);
            this.stats.clicks[type]++;
            if (timeRemainingMs !== null) {
                this.stats.timing.beforeClick.push(timeRemainingMs);
            }
            dbg(
                "TELEMETRY",
                `Click: ${type} - "${label.slice(0, 30)}" ${timeRemainingMs !== null ? `(${timeRemainingMs}ms remaining)` : ""}`,
            );
            this.updateOverlay();
        }

        // Record a reload event
        recordReload(reason, delay, retryCount) {
            const event = {
                type: "reload",
                reason: reason,
                delay: delay,
                retryCount: retryCount,
                timestamp: Date.now(),
                elapsed: Date.now() - this.sessionStart,
            };
            this.events.push(event);
            this.stats.reloads.total++;
            this.stats.reloads.byReason[reason] =
                (this.stats.reloads.byReason[reason] || 0) + 1;
            this.stats.timing.beforeReload.push(delay * 1000); // Convert to ms
            dbg(
                "TELEMETRY",
                `Reload: "${reason.slice(0, 40)}" delay=${delay}s retry=${retryCount}`,
            );
            this.updateOverlay();
        }

        // Record an error
        recordError(source, message) {
            const event = {
                type: "error",
                source: source,
                message: message,
                timestamp: Date.now(),
                elapsed: Date.now() - this.sessionStart,
            };
            this.events.push(event);
            this.stats.errors++;
            dbgError("TELEMETRY", `Error in ${source}: ${message}`);
            this.updateOverlay();
        }

        // Get timing statistics
        getTimingStats() {
            const avgClick =
                this.stats.timing.beforeClick.length > 0
                    ? Math.round(
                          this.stats.timing.beforeClick.reduce(
                              (a, b) => a + b,
                              0,
                          ) / this.stats.timing.beforeClick.length,
                      )
                    : 0;
            const avgReload =
                this.stats.timing.beforeReload.length > 0
                    ? Math.round(
                          this.stats.timing.beforeReload.reduce(
                              (a, b) => a + b,
                              0,
                          ) / this.stats.timing.beforeReload.length,
                      )
                    : 0;
            return { avgClick, avgReload };
        }

        // Get session info
        getSessionInfo() {
            const elapsed = Date.now() - this.sessionStart;
            const mins = Math.floor(elapsed / 60000);
            const secs = Math.floor((elapsed % 60000) / 1000);
            return { elapsed, mins, secs };
        }

        // Update the telemetry overlay (mini stats)
        updateOverlay() {
            const { avgClick, avgReload } = this.getTimingStats();
            const { mins, secs } = this.getSessionInfo();
            const totalClicks =
                this.stats.clicks.prolong +
                this.stats.clicks.expand +
                this.stats.clicks.safe;

            let statsText = `📊 ${mins}m${secs}s | 🗯️ ${totalClicks} | 🔄 ${this.stats.reloads.total}`;
            if (avgClick > 0) statsText += ` | ⏰ ${avgClick}ms`;
            if (this.stats.errors > 0)
                statsText += ` | ❗ ${this.stats.errors}`;

            // telemetry row hidden by design (stats visible in dashboard only)

            // Update dashboard if visible
            if (typeof dashboard !== "undefined" && dashboard.visible) {
                dashboard.update();
            }
        }

        // Get detailed stats for the dashboard
        getDetailedStats() {
            const { avgClick, avgReload } = this.getTimingStats();
            const { elapsed, mins, secs } = this.getSessionInfo();
            const totalClicks =
                this.stats.clicks.prolong +
                this.stats.clicks.expand +
                this.stats.clicks.safe;

            return {
                session: {
                    elapsed,
                    mins,
                    secs,
                    startTime: new Date(this.sessionStart).toLocaleTimeString(),
                },
                clicks: {
                    ...this.stats.clicks,
                    total: totalClicks,
                    avgMs: avgClick,
                },
                reloads: { ...this.stats.reloads, avgDelayMs: avgReload },
                errors: this.stats.errors,
                recentEvents: this.events.slice(-20).reverse(), // Last 20 events
            };
        }

        // Get enhanced timing stats with min/max/percentiles
        getEnhancedTimingStats() {
            const clickTimes = this.stats.timing.beforeClick;
            const reloadTimes = this.stats.timing.beforeReload;

            const calcStats = (arr) => {
                if (arr.length === 0)
                    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0 };
                const sorted = [...arr].sort((a, b) => a - b);
                return {
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    avg: Math.round(
                        sorted.reduce((a, b) => a + b, 0) / sorted.length,
                    ),
                    p50: sorted[Math.floor(sorted.length * 0.5)],
                    p95: sorted[Math.floor(sorted.length * 0.95)],
                };
            };

            return {
                clicks: calcStats(clickTimes),
                reloads: calcStats(reloadTimes),
            };
        }

        // Export telemetry data as JSON
        exportData() {
            const data = {
                version: "16.1",
                exportDate: new Date().toISOString(),
                session: {
                    startTime: new Date(this.sessionStart).toISOString(),
                    elapsedMs: Date.now() - this.sessionStart,
                },
                stats: this.stats,
                events: this.events,
                timingStats: this.getEnhancedTimingStats(),
            };
            return JSON.stringify(data, null, 2);
        }

        // Reset all telemetry data
        reset() {
            const oldStats = { ...this.stats };
            this.stats = {
                clicks: { prolong: 0, expand: 0, safe: 0 },
                reloads: { total: 0, byReason: {} },
                timing: { beforeClick: [], beforeReload: [] },
                errors: 0,
            };
            this.events = [];
            this.sessionStart = Date.now();
            const prevTotal =
                oldStats.clicks.prolong +
                oldStats.clicks.expand +
                oldStats.clicks.safe;
            dbg(
                "TELEMETRY",
                `Stats reset. Previous: clicks=${prevTotal} reloads=${oldStats.reloads.total}`,
            );
            this.updateOverlay();
        }
    }

    const telemetry = new EventTelemetry();

    // ============================
    // OBSERVABILITY DASHBOARD
    // ============================

    class ObservabilityDashboard {
        constructor(telemetrySystem) {
            this.telemetry = telemetrySystem;
            this.visible = false;
            this.overlay = null;
            this.updateInterval = null;
            this.activeTab = "stats";
        }

        create() {
            const overlay = document.createElement("div");
            overlay.id = "tm-dashboard";
            Object.assign(overlay.style, {
                position: "fixed",
                top: "20px",
                left: "20px",
                zIndex: "999998",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(15, 15, 20, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                color: "#fff",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                maxWidth: "380px",
                width: "340px",
                boxShadow: "0 10px 50px rgba(0, 0, 0, 0.5)",
                transition: "all 0.3s ease",
                opacity: "0",
                transform: "translateY(-20px)",
                display: "none",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "13px",
                lineHeight: "1.5",
            });

            // Header
            const header = document.createElement("div");
            header.style.cssText =
                "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
            header.innerHTML = `
                <span style="font-weight:600;font-size:14px;color:#4ade80;">📊 Observability Dashboard</span>
                <button id="tm-dashboard-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;font-size:16px;">×</button>
            `;

            // Content container
            const content = document.createElement("div");
            content.id = "tm-dashboard-content";
            content.style.cssText =
                "display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;";

            // Tab bar
            const tabBar = document.createElement("div");
            tabBar.id = "tm-dashboard-tabs";
            tabBar.style.cssText = "display:flex;gap:4px;margin-bottom:8px;";
            tabBar.innerHTML = `
                <button class="tm-tab" data-tab="stats" style="flex:1;">📊 Stats</button>
                <button class="tm-tab" data-tab="sessions" style="flex:1;">🗂 Sessions</button>
            `;
            tabBar.querySelectorAll(".tm-tab").forEach(btn => {
                btn.addEventListener("click", () => {
                    this.activeTab = btn.dataset.tab;
                    this.update();
                });
            });

            overlay.appendChild(header);
            overlay.appendChild(tabBar);
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            // Close button handler
            document
                .getElementById("tm-dashboard-close")
                .addEventListener("click", () => this.hide());

            this.overlay = overlay;
            dbg("DASHBOARD", "Observability dashboard created");
        }

        toggle() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        }

        show() {
            if (!this.overlay) this.create();
            this.overlay.style.display = "flex";
            requestAnimationFrame(() => {
                this.overlay.style.opacity = "1";
                this.overlay.style.transform = "translateY(0)";
            });
            this.visible = true;
            this.update();
            // Start auto-refresh (every 1 second)
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => this.update(), 1000);
            dbg("DASHBOARD", "Dashboard shown");
        }

        hide() {
            if (!this.overlay) return;
            this.overlay.style.opacity = "0";
            this.overlay.style.transform = "translateY(-20px)";
            setTimeout(() => {
                this.overlay.style.display = "none";
            }, 300);
            this.visible = false;
            // Stop auto-refresh
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            dbg("DASHBOARD", "Dashboard hidden");
        }

        renderSessions() {
            // Sync active tab button styles
            document.querySelectorAll("#tm-dashboard-tabs .tm-tab").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.tab === this.activeTab);
            });

            const sessions = sessionManager.getSessions();
            if (!sessions.length) {
                return `<div style="color:#64748b;font-size:12px;padding:8px;text-align:center;">No sessions yet.<br>Press ▶ to start.</div>`;
            }
            return sessions.map(s => {
                const isActive = s.id === activeSessionId;
                const startStr = new Date(s.startTime).toLocaleTimeString();
                const urlShort = s.url.replace("https://chatgpt.com", "").slice(0, 28) || "/";
                const avgGap = s.lastChangeTimes.length > 0
                    ? Math.round(s.lastChangeTimes.reduce((a, b) => a + b, 0) / s.lastChangeTimes.length)
                    : 0;
                const fpCount = (s.events || []).filter(e => e.type === "false-positive-reload").length;
                const borderCol = isActive ? "74,222,128" : s.status === "stopped" ? "100,116,139" : "255,255,255";
                return `
                    <div style="padding:8px;background:rgba(${borderCol},0.05);border-radius:8px;border:1px solid rgba(${borderCol},0.15);margin-bottom:6px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                            <span style="color:${isActive ? "#4ade80" : "#94a3b8"};font-size:11px;font-weight:600;font-family:monospace;">
                                ${isActive ? "● " : "○ "}${s.id}
                            </span>
                            <span style="color:${s.status === "active" ? "#4ade80" : "#64748b"};font-size:10px;background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:4px;">${s.status}</span>
                        </div>
                        <div style="font-size:10px;color:#64748b;margin-bottom:2px;">⏱ ${startStr}</div>
                        <div style="font-size:10px;color:#64748b;margin-bottom:4px;" title="${s.url}">🔗 ${urlShort}…</div>
                        <div style="font-size:10px;color:#94a3b8;margin-bottom:${fpCount > 0 ? 3 : 6}px;">
                            🔄 ${s.reloadHistory.length} reloads &nbsp;|&nbsp;
                            📝 ${s.lastChangeTimes.length} resets &nbsp;|&nbsp;
                            avg ${avgGap}s gap
                        </div>
                        ${fpCount > 0 ? `<div style="font-size:10px;color:#fbbf24;margin-bottom:6px;">⚠️ ${fpCount} false-positive reload${fpCount > 1 ? "s" : ""}</div>` : ""}
                        <div style="display:flex;gap:4px;">
                            ${s.status === "active" && !isActive ? `<button class="tm-session-stop" data-id="${s.id}" style="flex:1;padding:3px 6px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);border-radius:4px;color:#fbbf24;font-size:10px;cursor:pointer;">Stop</button>` : ""}
                            <button class="tm-session-delete" data-id="${s.id}" style="flex:1;padding:3px 6px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:4px;color:#f87171;font-size:10px;cursor:pointer;">Delete</button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        update() {
            if (!this.visible || !this.overlay) return;

            // Sync tab button styles
            document.querySelectorAll("#tm-dashboard-tabs .tm-tab").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.tab === this.activeTab);
            });

            const content = document.getElementById("tm-dashboard-content");
            if (!content) return;

            if (this.activeTab === "sessions") {
                content.innerHTML = this.renderSessions();
                content.querySelectorAll(".tm-session-stop").forEach(btn => {
                    btn.onclick = () => { sessionManager.stopSession(btn.dataset.id, "manual-stop"); this.update(); };
                });
                content.querySelectorAll(".tm-session-delete").forEach(btn => {
                    btn.onclick = () => { sessionManager.deleteSession(btn.dataset.id, "manual-delete"); this.update(); };
                });
                return;
            }

            const stats = this.telemetry.getDetailedStats();
            const timingStats = this.telemetry.getEnhancedTimingStats();

            // Build HTML content
            let html = `
                <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:8px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="color:#94a3b8;">Session</span>
                        <span style="color:#fff;font-weight:500;">${stats.session.mins}m ${stats.session.secs}s</span>
                    </div>
                    <div style="font-size:11px;color:#64748b;">Started: ${stats.session.startTime}</div>
                </div>

                <div style="padding:8px;background:rgba(74,222,128,0.1);border-radius:8px;border:1px solid rgba(74,222,128,0.2);">
                    <div style="color:#4ade80;font-weight:600;margin-bottom:6px;">🗯️ Clicks</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:11px;">
                        <div style="text-align:center;">
                            <div style="color:#94a3b8;">Prolong</div>
                            <div style="color:#fff;font-weight:600;">${stats.clicks.prolong}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="color:#94a3b8;">Expand</div>
                            <div style="color:#fff;font-weight:600;">${stats.clicks.expand}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="color:#94a3b8;">Safe</div>
                            <div style="color:#fff;font-weight:600;">${stats.clicks.safe}</div>
                        </div>
                    </div>
                    ${
                        stats.clicks.avgMs > 0
                            ? `
                    <div style="margin-top:6px;font-size:10px;color:#94a3b8;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                        <span>Avg: <span style="color:#4ade80;">${stats.clicks.avgMs}ms</span></span>
                        <span>Min/Max: <span style="color:#4ade80;">${timingStats.clicks.min}/${timingStats.clicks.max}ms</span></span>
                    </div>`
                            : ""
                    }
                </div>

                <div style="padding:8px;background:rgba(248,113,113,0.1);border-radius:8px;border:1px solid rgba(248,113,113,0.2);">
                    <div style="color:#f87171;font-weight:600;margin-bottom:6px;">🔄 Reloads</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="color:#94a3b8;">Total</span>
                        <span style="color:#fff;font-weight:600;">${stats.reloads.total}</span>
                    </div>
                    ${stats.reloads.avgDelayMs > 0 ? `<div style="font-size:11px;color:#94a3b8;">Avg delay: <span style="color:#f87171;">${stats.reloads.avgDelayMs}ms</span></div>` : ""}
                    ${
                        Object.keys(stats.reloads.byReason).length > 0
                            ? `
                        <div style="margin-top:6px;font-size:10px;color:#64748b;">
                            ${Object.entries(stats.reloads.byReason)
                                .map(
                                    ([reason, count]) =>
                                        `• ${reason.slice(0, 25)} (${count})`,
                                )
                                .join("<br>")}
                        </div>
                    `
                            : ""
                    }
                </div>

                ${
                    stats.errors > 0
                        ? `
                <div style="padding:8px;background:rgba(251,191,36,0.1);border-radius:8px;border:1px solid rgba(251,191,36,0.2);">
                    <div style="color:#fbbf24;font-weight:600;">⚠️ Errors: ${stats.errors}</div>
                </div>
                `
                        : ""
                }

                <div style="padding:8px;background:rgba(0,0,0,0.2);border-radius:8px;">
                    <div style="color:#94a3b8;font-weight:600;margin-bottom:4px;">📝 Recent Events</div>
                    ${stats.recentEvents
                        .map(
                            (e) => `
                        <div style="font-size:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="color:${e.type === "click" ? "#4ade80" : e.type === "reload" ? "#f87171" : "#fbbf24"};">
                                ${e.type === "click" ? "🗯️" : e.type === "reload" ? "🔄" : "⚠️"}
                            </span>
                            <span style="color:#94a3b8;">${e.subType || e.type}</span>
                            ${e.label ? `<span style="color:#fff;">"${e.label.slice(0, 20)}"</span>` : ""}
                        </div>
                    `,
                        )
                        .join("")}
                </div>

                ${this._addActionButtons()}
            `;

            content.innerHTML = html;

            // Add event listeners for export/reset buttons
            const exportBtn = document.getElementById("tm-dashboard-export");
            const resetBtn = document.getElementById("tm-dashboard-reset");
            if (exportBtn) {
                exportBtn.onclick = () => {
                    const data = this.telemetry.exportData();
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `telemetry-export-${new Date().toISOString().slice(0, 19)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    dbg("DASHBOARD", "Telemetry data exported");
                };
            }
            if (resetBtn) {
                resetBtn.onclick = () => {
                    if (
                        confirm(
                            "Reset all telemetry data? This cannot be undone.",
                        )
                    ) {
                        this.telemetry.reset();
                        this.update();
                    }
                };
            }
        }

        // Add export and reset buttons to dashboard
        _addActionButtons() {
            return `
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button id="tm-dashboard-export" style="flex:1;padding:6px 12px;background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.4);border-radius:6px;color:#60a5fa;font-size:11px;cursor:pointer;hover:background:rgba(59,130,246,0.3);">
                        📤 Export
                    </button>
                    <button id="tm-dashboard-reset" style="flex:1;padding:6px 12px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);border-radius:6px;color:#f87171;font-size:11px;cursor:pointer;hover:background:rgba(239,68,68,0.3);">
                        🗑️ Reset
                    </button>
                </div>
            `;
        }
    }

    const dashboard = new ObservabilityDashboard(telemetry);

    // Keyboard shortcut: Ctrl+` (backtick) — avoids Alt+D which hijacks the browser address bar
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "`") {
            e.preventDefault();
            dashboard.toggle();
        }
    });

    // ============================
    // USER INPUT REACTOR
    // ============================

    class UserInputReactor {
        constructor() {
            this.handlers = { required: [], generating: [], idle: [] };
            this.currentState = null;
            this.timerId = null;
            this.requiredStabilizerId = null; // native setTimeout for stability gate
            this.requiredFired = false;       // prevents re-firing within same required run
        }

        on(state, fn) {
            if (this.handlers[state]) this.handlers[state].push(fn);
        }

        hasActionableButtons() {
            // If any safe/expand/prolong buttons exist, autopilot can handle them
            // — that means no human input is needed regardless of composer state
            const cards = [...document.querySelectorAll(CARD_SELECTOR)];
            if (cards.length > 0) {
                const card = cards[cards.length - 1];
                if (findCollapsedToolBtns(card).length > 0) return true;
                const safe = findSafeButton(card);
                if (safe && isBtnEnabled(safe)) return true;
            }
            if (findProlongButtons().length > 0) return true;
            return false;
        }

        detect() {
            // Actionable buttons present → autopilot handles them, no user input needed
            if (this.hasActionableButtons()) return "idle";
            const btn = document.getElementById("composer-submit-button");
            if (btn) {
                const label = btn.getAttribute("aria-label") || "";
                if (label === "Send prompt") return "required";
                if (label === "Stop answering") return "generating";
            }
            // Start Voice button visible = waiting for voice input = user input required
            const startVoice = document.querySelector(START_VOICE_SEL);
            if (startVoice && isVisible(startVoice)) return "required";
            return "idle";
        }

        poll() {
            if (isPaused || isReloading) return;
            const state = this.detect();

            // State transition: reset stability gate on any change
            if (state !== this.currentState) {
                dbg("INPUT-DETECT", `User input state: ${this.currentState} → ${state}`);
                this.currentState = state;
                if (this.requiredStabilizerId) {
                    clearTimeout(this.requiredStabilizerId);
                    this.requiredStabilizerId = null;
                }
                this.requiredFired = false;
                // Non-required states fire immediately
                if (state !== "required") {
                    (this.handlers[state] || []).forEach(fn => {
                        try { fn(); } catch (e) { dbgError("INPUT-REACTOR", e.message); }
                    });
                    return;
                }
            }

            // "required" only fires after REQUIRED_STABLE_MS with no DOM changes
            if (state === "required" && !this.requiredFired && !this.requiredStabilizerId) {
                const elapsed = Date.now() - lastDomChangeTime;
                const remaining = REQUIRED_STABLE_MS - elapsed;
                if (remaining <= 0) {
                    this.requiredFired = true;
                    dbg("INPUT-DETECT", `required stable for ${Math.round(elapsed / 1000)}s — firing`);
                    (this.handlers.required || []).forEach(fn => {
                        try { fn(); } catch (e) { dbgError("INPUT-REACTOR", e.message); }
                    });
                } else {
                    dbg("INPUT-DETECT", `required detected — waiting ${Math.round(remaining / 1000)}s for stability`);
                    this.requiredStabilizerId = setTimeout(() => {
                        this.requiredStabilizerId = null;
                        this.poll();
                    }, remaining + 200);
                }
            }
        }

        start() {
            if (this.timerId) return;
            this.timerId = timerManager.create("input-detect", () => this.poll(), 1500, { repeat: true });
            dbg("INPUT-DETECT", "User input detector started");
        }

        stop() {
            if (this.timerId) {
                timerManager.delete(this.timerId);
                this.timerId = null;
            }
            if (this.requiredStabilizerId) {
                clearTimeout(this.requiredStabilizerId);
                this.requiredStabilizerId = null;
            }
            this.requiredFired = false;
        }

        reset() {
            this.currentState = null;
            if (this.requiredStabilizerId) {
                clearTimeout(this.requiredStabilizerId);
                this.requiredStabilizerId = null;
            }
            this.requiredFired = false;
        }
    }

    const userInputReactor = new UserInputReactor();

    // ============================
    // SESSION MANAGER
    // ============================

    class SessionManager {
        constructor() {
            this.storageKey = "vex_sessions";
        }

        _load() {
            try {
                return JSON.parse(localStorage.getItem(this.storageKey) || '{"sessions":{},"pendingContinue":null}');
            } catch (_) {
                return { sessions: {}, pendingContinue: null };
            }
        }

        _save(data) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
            } catch (_) {
                dbgError("SESSION", "Failed to save to localStorage");
            }
        }

        start() {
            const data = this._load();
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const startTime = Date.now();
            const url = location.href;
            data.sessions[id] = {
                id,
                startTime,
                status: "active",
                url,
                urls: [{ url, ts: startTime }],
                reloadHistory: [],
                events: [],
                stats: {},
                lastChangeTimes: [],
            };
            data.pendingContinue = null;
            this._save(data);
            activeSessionId = id;
            dbg("SESSION", `New session started: ${id}`);
            api.post("/vex/sessions", { id, startTime, url });
            return id;
        }

        checkPendingContinue() {
            const data = this._load();
            const pc = data.pendingContinue;
            if (!pc || pc.url !== location.href) {
                if (pc) { data.pendingContinue = null; this._save(data); }
                return null;
            }
            data.pendingContinue = null;
            this._save(data);
            dbg("SESSION", `Resuming session ${pc.sessionId} after reload`);
            return pc;
        }

        recordReload(reason) {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            const reloadEntry = { url: location.href, ts: Date.now(), reason };
            session.reloadHistory.push(reloadEntry);
            data.pendingContinue = { sessionId: activeSessionId, url: location.href };
            this._save(data);
            api.post(`/vex/sessions/${activeSessionId}/events`, { type: "reload", ...reloadEntry });
        }

        recordDomReset(secsElapsed) {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            const secs = Math.round(secsElapsed);
            session.lastChangeTimes.push(secs);
            this._save(data);
            api.post(`/vex/sessions/${activeSessionId}/events`, { type: "dom-reset", ts: Date.now(), secsElapsed: secs });
        }

        syncStats() {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            session.stats = { ...telemetry.stats };
            this._save(data);
            api.patch(`/vex/sessions/${activeSessionId}`, { stats: session.stats });
        }

        stopSession(id, reason = "manual-stop") {
            const data = this._load();
            if (data.sessions[id]) {
                data.sessions[id].status = "stopped";
                if (!data.sessions[id].events) data.sessions[id].events = [];
                data.sessions[id].events.push({ type: "stop", ts: Date.now(), reason });
                this._save(data);
            }
            api.patch(`/vex/sessions/${id}`, { status: "stopped", reason });
            api.post(`/vex/sessions/${id}/events`, { type: "stop", ts: Date.now(), reason });
            if (activeSessionId === id) activeSessionId = null;
        }

        deleteSession(id, reason = "manual-delete") {
            api.post(`/vex/sessions/${id}/events`, { type: "stop", ts: Date.now(), reason });
            api.del(`/vex/sessions/${id}`);
            const data = this._load();
            delete data.sessions[id];
            this._save(data);
            if (activeSessionId === id) activeSessionId = null;
        }

        recordUrlChange(fromUrl, toUrl) {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            if (!session.urls) session.urls = [];
            session.urls.push({ url: toUrl, ts: Date.now() });
            this._save(data);
            api.post(`/vex/sessions/${activeSessionId}/events`, { type: "url-change", ts: Date.now(), fromUrl, toUrl });
        }

        recordFalsePositiveReload() {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            if (!session.events) session.events = [];
            const ev = { type: "false-positive-reload", ts: Date.now(), url: location.href };
            session.events.push(ev);
            this._save(data);
            api.post(`/vex/sessions/${activeSessionId}/events`, ev);
            dbgWarn("SESSION", `False-positive reload recorded for session ${activeSessionId}`);
        }

        recordEvent(type, detail = {}) {
            if (!activeSessionId) return;
            const data = this._load();
            const session = data.sessions[activeSessionId];
            if (!session) return;
            if (!session.events) session.events = [];
            const ev = { type, ts: Date.now(), ...detail };
            session.events.push(ev);
            this._save(data);
            api.post(`/vex/sessions/${activeSessionId}/events`, ev);
        }

        getSessions() {
            const data = this._load();
            return Object.values(data.sessions).sort((a, b) => b.startTime - a.startTime);
        }

        getActive() {
            if (!activeSessionId) return null;
            const data = this._load();
            return data.sessions[activeSessionId] || null;
        }
    }

    const sessionManager = new SessionManager();

    // ============================
    // API CLIENT  (localhost:9293 persistence)
    // ============================

    class ApiClient {
        constructor() {
            this.available = false;
            this._healthInterval = null;
        }

        checkHealth() {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `${API_BASE}/vex/health`,
                    timeout: 1500,
                    onload: (res) => {
                        const was = this.available;
                        this.available = res.status >= 200 && res.status < 300;
                        if (!was && this.available) {
                            dbg("API", "localhost API reachable — remote persistence enabled");
                            setE("api-status", "🟢 API connected", "#4ade80");
                            setTimeout(() => delE("api-status"), 4000);
                        } else if (was && !this.available) {
                            dbgWarn("API", "localhost API went offline — falling back to localStorage");
                            setE("api-status", "🔴 API offline", "#f87171");
                            setTimeout(() => delE("api-status"), 5000);
                        }
                        resolve(this.available);
                    },
                    onerror: () => { this.available = false; resolve(false); },
                    ontimeout: () => { this.available = false; resolve(false); },
                });
            });
        }

        startHealthPolling() {
            this.checkHealth(); // immediate probe on start
            if (!this._healthInterval) {
                // Plain setInterval — must survive timerManager.clearAll() (pause)
                this._healthInterval = setInterval(() => this.checkHealth(), 30000);
            }
        }

        _req(method, path, body) {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method,
                    url: `${API_BASE}${path}`,
                    headers: { "Content-Type": "application/json" },
                    data: body !== undefined ? JSON.stringify(body) : undefined,
                    timeout: API_TIMEOUT_MS,
                    onload: (res) => {
                        if (res.status < 200 || res.status >= 300)
                            dbgWarn("API", `${method} ${path} → HTTP ${res.status}`);
                        resolve(res.status >= 200 && res.status < 300);
                    },
                    onerror: () => resolve(false),
                    ontimeout: () => resolve(false),
                });
            });
        }

        // Fire-and-forget wrappers — callers don't await
        post(path, body) { if (this.available) this._req("POST", path, body); }
        patch(path, body) { if (this.available) this._req("PATCH", path, body); }
        del(path) { if (this.available) this._req("DELETE", path); }

        // Query the backend for what action to take on user-input-required for a given session.
        // Calls cb({ action, text? }) on success; calls cb({ action: "pause" }) on any failure.
        fetchUserInputAction(sessionId, cb) {
            if (!this.available || !sessionId) { cb({ action: "pause" }); return; }
            GM_xmlhttpRequest({
                method: "GET",
                url: `${API_BASE}/vex/sessions/${sessionId}/config/user-input-required`,
                timeout: 2000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        try { cb(JSON.parse(res.responseText)); return; } catch (_) {}
                    }
                    cb({ action: "pause" });
                },
                onerror:   () => cb({ action: "pause" }),
                ontimeout: () => cb({ action: "pause" }),
            });
        }

        // Poll for a pending remote command. Calls cb(cmd) only when cmd.type is non-null.
        consumeCommand(sessionId, cb) {
            if (!this.available || !sessionId) return;
            GM_xmlhttpRequest({
                method: "GET",
                url: `${API_BASE}/vex/sessions/${encodeURIComponent(sessionId)}/command`,
                timeout: 2000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const cmd = JSON.parse(res.responseText);
                            if (cmd && cmd.type !== null && cmd.type !== undefined) cb(cmd);
                        } catch (_) {}
                    }
                },
                onerror: () => {},
                ontimeout: () => {},
            });
        }

        // Fetch remote config and call applyFn(cfg) if successful.
        // Expected shape: { GENERIC_RELOAD_INTERVAL, THINKING_COUNTDOWN_SECS,
        //   WAITING_FOR_CARD_TIMEOUT, STUCK_THRESHOLD, NO_CHANGE_RELOAD_SECS,
        //   REQUIRED_STABLE_MS, FALSE_POSITIVE_WINDOW_MS, RAPID_RELOAD_MAX,
        //   WHITELIST, BLACKLIST, PROLONG_LABELS, COMMAND_POLL_INTERVAL }
        loadConfig(applyFn) {
            GM_xmlhttpRequest({
                method: "GET",
                url: `${API_BASE}/vex/config`,
                timeout: 2000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const cfg = JSON.parse(res.responseText);
                            applyFn(cfg);
                            dbg("CONFIG", "Remote config applied: " + JSON.stringify(cfg));
                        } catch (e) {
                            dbgWarn("CONFIG", "Failed to parse remote config: " + e.message);
                        }
                    }
                },
                onerror: () => {},
                ontimeout: () => {},
            });
        }
    }

    const api = new ApiClient();

    // ============================
    // CSS
    // ============================

    function injectStyles() {
        const s = document.createElement("style");
        s.textContent = `
            @keyframes tm-crit-pulse{
                0%{box-shadow:0 0 10px rgba(255,50,50,.4);border-color:rgba(255,50,50,.6)}
                50%{box-shadow:0 0 30px rgba(255,50,50,.9);border-color:rgba(255,50,50,1)}
                100%{box-shadow:0 0 10px rgba(255,50,50,.4);border-color:rgba(255,50,50,.6)}
            }
            @keyframes tm-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            #tm-overlay{animation:tm-fadein .3s ease}
            #tm-overlay.tm-crit{background:rgba(40,0,0,.94)!important;border:1px solid rgba(255,50,50,.6)!important;animation:tm-crit-pulse 1.5s infinite ease-in-out}
            #tm-overlay-hdr{transition:border-color .2s}
            #tm-overlay-hdr:hover{border-bottom-color:rgba(255,255,255,.14)!important}
            .tm-row{display:flex;flex-direction:column;gap:3px;padding:3px 0}
            .tm-row+.tm-row{border-top:1px solid rgba(255,255,255,.08);margin-top:5px;padding-top:6px}
            .tm-row-txt{font-size:12.5px;line-height:1.35;word-break:break-word}
            .tm-pbar-wrap{height:3px;width:65%;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;margin-top:2px}
            .tm-pbar{height:100%;border-radius:3px;transition:width .15s linear}
            #tm-dashboard-content::-webkit-scrollbar{width:6px}
            #tm-dashboard-content::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:3px}
            #tm-dashboard-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}
            #tm-dashboard-content::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.3)}
            #tm-overlay-content:empty::before{content:'⏳ Waiting…';font-size:12.5px;color:#64748b}
            .tm-tab{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#64748b;padding:4px 8px;font-size:11px;cursor:pointer;transition:background .15s,color .15s;}
            .tm-tab.active,.tm-tab:hover{background:rgba(255,255,255,0.12);color:#e2e8f0;}
            #tm-overlay-play-btn{width:100%;padding:7px 0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:0.04em;transition:background .15s,border-color .15s,color .15s;}
        `;
        document.head.appendChild(s);
        dbg("INIT", "Styles injected");
    }

    // ============================
    // PAUSE / ENABLE TOGGLE
    // ============================

    function setPaused(p, reason = "manual") {
        isPaused = p;
        if (p) lastPauseReason = reason;
        else lastPauseReason = null;
        const playBtn = document.getElementById("tm-overlay-play-btn");
        if (playBtn) {
            if (p) {
                const isInputRequired = reason === "user-input-required";
                playBtn.textContent = isInputRequired ? "⚡  Send prompt + Start" : "▶  Start";
                playBtn.style.background = isInputRequired
                    ? "rgba(88,166,255,0.15)" : "rgba(74,222,128,0.15)";
                playBtn.style.border = isInputRequired
                    ? "1px solid rgba(88,166,255,0.45)" : "1px solid rgba(74,222,128,0.35)";
                playBtn.style.color = isInputRequired ? "#58a6ff" : "#4ade80";
            } else {
                playBtn.textContent = "⏸  Pause";
                playBtn.style.background = "rgba(245,158,11,0.15)";
                playBtn.style.border = "1px solid rgba(245,158,11,0.35)";
                playBtn.style.color = "#f59e0b";
            }
        }
        if (p) {
            // Stop ALL timers and operations
            timerManager.clearAll();
            stopProlongScanner();
            stopAutoScroll();
            cancelGenericTimer();
            stopWaitingForCard();
            stopDomChangeCounter();
            clearAllThinking();
            clearAllButtonPolls();
            userInputReactor.stop();

            // Clear critical error timer
            if (critErrorTimer) {
                clearInterval(critErrorTimer);
                critErrorTimer = null;
            }

            // Cancel any pending reload countdown
            isReloading = true;
            pendingReloadId = Date.now();
            delE("reload");
            delE("crit-err");

            setE("main", "⏸ AutoPilot paused", "#f59e0b");
            sessionManager.recordEvent("pause", { reason });
        } else {
            // Resume operations
            isReloading = false;
            pendingReloadId = null;
            delE("user-input");

            // Create a new session only if none is active (not a reload-continue)
            if (activeSessionId === null) {
                sessionManager.start();
            }

            sessionManager.recordEvent("resume", { reason });
            userInputReactor.reset();
            userInputReactor.start();
            startProlongScanner();
            startAutoScroll();
            startDomChangeCounter();
            startCommandPoller();
            scheduleCheck();
        }
        dbg("PAUSE", p ? `AutoPilot paused (${reason})` : `AutoPilot resumed (${reason})`);
    }

    // ============================
    // MULTI-ENTRY OVERLAY
    // ============================

    function createOverlay() {
        const b = document.createElement("div");
        b.id = "tm-overlay";
        Object.assign(b.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: "999999",
            padding: "10px 14px 12px",
            borderRadius: "14px",
            background: "rgba(12,12,18,.93)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            color: "#fff",
            fontFamily:
                "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            maxWidth: "220px",
            width: "193px",
            boxShadow:
                "0 12px 48px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.09)",
            transition:
                "opacity .3s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.4,0,.2,1)",
            opacity: "0",
            transform: "translateY(20px)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            border: "1px solid rgba(255,255,255,0.09)",
        });

        // ── Header: drag handle, title, control buttons ──────────────
        const hdr = document.createElement("div");
        hdr.id = "tm-overlay-hdr";
        hdr.style.cssText =
            "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,0.08);cursor:move;user-select:none;";

        const titleEl = document.createElement("span");
        titleEl.style.cssText =
            "font-size:10px;color:#475569;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;pointer-events:none;";
        titleEl.textContent = "⚙︎ AutoPilot";

        const ctrlRow = document.createElement("div");
        ctrlRow.style.cssText = "display:flex;gap:5px;align-items:center;";

        function makeHdrBtn(label, title) {
            const btn = document.createElement("button");
            btn.textContent = label;
            btn.title = title;
            btn.style.cssText =
                "background:rgba(255,255,255,0.07);border:none;border-radius:5px;cursor:pointer;padding:2px 6px;font-size:12px;color:#cbd5e1;opacity:0.6;transition:opacity .15s,background .15s;line-height:1.4;";
            btn.onmouseenter = () => {
                btn.style.opacity = "1";
                btn.style.background = "rgba(255,255,255,0.14)";
            };
            btn.onmouseleave = () => {
                btn.style.opacity = "0.6";
                btn.style.background = "rgba(255,255,255,0.07)";
            };
            return btn;
        }

        // ── Manual reload button (click starts 3 s countdown; click again cancels) ──
        const reloadBtn = makeHdrBtn("↺", "Reload page now");
        reloadBtn.id = "tm-overlay-reload-btn";
        let reloadCd = null;
        reloadBtn.onclick = (e) => {
            e.stopPropagation();
            if (reloadCd) {
                clearInterval(reloadCd);
                reloadCd = null;
                reloadBtn.textContent = "↺";
                reloadBtn.title = "Reload page now";
                reloadBtn.style.color = "#cbd5e1";
                return;
            }
            let c = 3;
            reloadBtn.textContent = `${c}s`;
            reloadBtn.style.color = "#f87171";
            reloadBtn.title = "Click again to cancel";
            reloadCd = setInterval(() => {
                c--;
                if (c <= 0) {
                    clearInterval(reloadCd);
                    reloadCd = null;
                    sessionManager.recordReload("manual-ui-reload");
                    location.reload();
                } else {
                    reloadBtn.textContent = `${c}s`;
                }
            }, 1000);
        };

        const dashBtn = makeHdrBtn("📊", "Toggle Dashboard  Ctrl+\`");
        dashBtn.id = "tm-overlay-dash-btn";
        dashBtn.onclick = (e) => {
            e.stopPropagation();
            dashboard.toggle();
        };

        const minBtn = makeHdrBtn("−", "Collapse");
        minBtn.id = "tm-overlay-min-btn";

        ctrlRow.appendChild(reloadBtn);
        ctrlRow.appendChild(dashBtn);
        ctrlRow.appendChild(minBtn);
        hdr.appendChild(titleEl);
        hdr.appendChild(ctrlRow);

        // ── Large play / pause button ─────────────────────────────────
        const playRow = document.createElement("div");
        playRow.style.cssText = "margin-bottom:6px;";
        const playBtn = document.createElement("button");
        playBtn.id = "tm-overlay-play-btn";
        playBtn.textContent = "▶  Start";
        playBtn.style.cssText = "width:100%;padding:7px 0;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.35);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#4ade80;transition:background .15s,border-color .15s,color .15s;";
        playBtn.onmouseenter = () => {
            if (!isPaused) { playBtn.style.background = "rgba(245,158,11,0.28)"; return; }
            playBtn.style.background = lastPauseReason === "user-input-required"
                ? "rgba(88,166,255,0.28)" : "rgba(74,222,128,0.28)";
        };
        playBtn.onmouseleave = () => {
            if (!isPaused) { playBtn.style.background = "rgba(245,158,11,0.15)"; return; }
            playBtn.style.background = lastPauseReason === "user-input-required"
                ? "rgba(88,166,255,0.15)" : "rgba(74,222,128,0.15)";
        };
        playBtn.onclick = (e) => {
            e.stopPropagation();
            if (isPaused && lastPauseReason === "user-input-required") {
                // Click the "Send prompt" button before resuming autopilot
                const sendBtn = document.getElementById("composer-submit-button");
                if (sendBtn && sendBtn.getAttribute("aria-label") === "Send prompt") {
                    sendBtn.click();
                    dbg("PLAY-BTN", "Clicked Send prompt before resuming");
                }
            }
            setPaused(!isPaused);
        };
        playRow.appendChild(playBtn);

        // ── Content area ──────────────────────────────────────────────
        const content = document.createElement("div");
        content.id = "tm-overlay-content";
        content.style.cssText = "display:flex;flex-direction:column;gap:2px;";

        let minimized = false;
        minBtn.onclick = (e) => {
            e.stopPropagation();
            minimized = !minimized;
            content.style.display = minimized ? "none" : "flex";
            playRow.style.display = minimized ? "none" : "block";
            hdr.style.marginBottom = minimized ? "0" : "8px";
            hdr.style.paddingBottom = minimized ? "0" : "7px";
            hdr.style.borderBottom = minimized
                ? "none"
                : "1px solid rgba(255,255,255,0.08)";
            b.style.paddingBottom = minimized ? "6px" : "12px";
            minBtn.textContent = minimized ? "+" : "−";
            minBtn.title = minimized ? "Expand" : "Collapse";
        };

        b.appendChild(hdr);
        b.appendChild(playRow);
        b.appendChild(content);

        // ── Drag behaviour (via header bar) ───────────────────────────
        let isDragging = false,
            dragX = 0,
            dragY = 0;
        hdr.addEventListener("mousedown", (e) => {
            if (e.target.tagName === "BUTTON") return;
            isDragging = true;
            const rect = b.getBoundingClientRect();
            dragX = e.clientX - rect.left;
            dragY = e.clientY - rect.top;
            b.style.transition = "none";
            e.preventDefault();
        });
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            b.style.right = "auto";
            b.style.bottom = "auto";
            b.style.left =
                Math.max(
                    0,
                    Math.min(
                        window.innerWidth - b.offsetWidth,
                        e.clientX - dragX,
                    ),
                ) + "px";
            b.style.top =
                Math.max(
                    0,
                    Math.min(
                        window.innerHeight - b.offsetHeight,
                        e.clientY - dragY,
                    ),
                ) + "px";
        });
        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                b.style.transition =
                    "opacity .3s cubic-bezier(.4,0,.2,1),transform .3s cubic-bezier(.4,0,.2,1)";
            }
        });

        document.body.appendChild(b);
        requestAnimationFrame(() => {
            b.style.opacity = "1";
            b.style.transform = "translateY(0)";
        });
        dbg("INIT", "Overlay created");
    }

    function renderOverlay() {
        const box = document.getElementById("tm-overlay");
        if (!box) return;
        box.classList.toggle(
            "tm-crit",
            [...overlayEntries.values()].some((e) => e.isCrit),
        );
        // Target the content div \u2014 never clobber the header/buttons
        const content = document.getElementById("tm-overlay-content");
        if (!content) return;
        content.innerHTML = "";
        if (!overlayEntries.size) {
            const t = document.createElement("div");
            t.className = "tm-row-txt";
            t.style.color = "#475569";
            t.textContent = "\u23f3 Waiting\u2026";
            content.appendChild(t);
            return;
        }
        for (const [, e] of overlayEntries) {
            const row = document.createElement("div");
            row.className = "tm-row";
            const txt = document.createElement("div");
            txt.className = "tm-row-txt";
            txt.textContent = e.text;
            txt.style.color = e.color || "#fff";
            row.appendChild(txt);
            if (e.showBar) {
                const wrap = document.createElement("div");
                wrap.className = "tm-pbar-wrap";
                const bar = document.createElement("div");
                bar.className = "tm-pbar";
                bar.style.width = Math.max(0, Math.min(100, e.pct || 0)) + "%";
                bar.style.background = e.barColor || "#4ade80";
                wrap.appendChild(bar);
                row.appendChild(wrap);
            }
            content.appendChild(row);
        }
    }

    function schedRender() {
        if (overlayRAF) cancelAnimationFrame(overlayRAF);
        overlayRAF = requestAnimationFrame(renderOverlay);
    }

    function setE(
        id,
        text,
        color = "#fff",
        showBar = false,
        pct = 0,
        barColor = "#4ade80",
        isCrit = false,
    ) {
        const prev = overlayEntries.get(id);
        if (prev && prev.text === text && prev.pct === pct) return; // skip no-change renders
        overlayEntries.set(id, { text, color, showBar, pct, barColor, isCrit });
        schedRender();
    }
    function delE(id) {
        if (!overlayEntries.has(id)) return;
        overlayEntries.delete(id);
        schedRender();
        dbg("OVERLAY", `Removed entry: ${id}`);
    }

    // ============================
    // VISIBILITY HELPERS
    // ============================

    function isVisible(el) {
        if (!el || !el.isConnected) return false;
        if (el.offsetParent === null) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    }

    function isStartVoiceMode() {
        if (
            document.querySelector(STOP_ANSWERING_SEL) &&
            isVisible(document.querySelector(STOP_ANSWERING_SEL))
        )
            return false;
        return (
            document.querySelector(START_VOICE_SEL) &&
            isVisible(document.querySelector(START_VOICE_SEL))
        );
    }

    // ============================
    // TIMER PRIORITY SYSTEM
    // ============================
    // When multiple countdown timers are active, the one with the most
    // remaining time wins.  Shorter timers defer to longer ones instead
    // of triggering competing reloads.
    //
    // Timer hierarchy (by max duration):
    //   Generic  90s > Thinking  45s > Wait-Card  44s > Stuck  30s
    //
    // Before any timer calls scheduleReload(), it must check whether a
    // longer-lived timer still has remaining time.  If so, the shorter
    // timer yields.

    /**
     * Collect remaining seconds for every active countdown timer.
     * Returns an array of { name, remaining } sorted descending by remaining.
     */
    function getActiveTimersRemaining() {
        const timers = [];

        // Generic 90-s timer
        if (genericStartTime !== null) {
            const rem = Math.max(
                0,
                GENERIC_RELOAD_INTERVAL -
                    (Date.now() - genericStartTime) / 1000,
            );
            timers.push({ name: "generic", remaining: rem });
        }

        // Thinking timers
        for (const [mid, t] of thinkingTimers) {
            timers.push({
                name: `thinking:${mid}`,
                remaining: Math.max(0, t.secsLeft || 0),
            });
        }

        // Waiting-for-card timer
        if (waitingForCardStart !== null) {
            const rem = Math.max(
                0,
                WAITING_FOR_CARD_TIMEOUT -
                    (Date.now() - waitingForCardStart) / 1000,
            );
            timers.push({ name: "wait-card", remaining: rem });
        }

        // Stuck timers
        for (const [card, startTime] of stuckTimers) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rem = Math.max(0, STUCK_THRESHOLD - elapsed);
            timers.push({ name: "stuck", remaining: rem });
        }

        // Critical error timer
        if (critErrorTimer) {
            // Best effort — we don't track secsLeft for crit, assume small remaining
            timers.push({ name: "crit-err", remaining: CRIT_ERR_WAIT_SECS });
        }

        timers.sort((a, b) => b.remaining - a.remaining);
        return timers;
    }

    /**
     * Should the calling timer (identified by `callerName`) proceed with its
     * scheduleReload, or defer to a longer-lived timer?
     *
     * Returns true if the caller is the longest-running active timer
     * (or is within 1s of the longest — to avoid deadlocks when timers
     * expire at nearly the same moment).
     */

    // ============================
    // PRECONDITION VALIDATORS
    // ============================
    // Each timer validates its triggering precondition before taking action
    // to prevent phantom reloads based on stale state.

    const PRECONDITION_VALIDATORS = {
        "wait-card": () => {
            const cards = document.querySelectorAll(CARD_SELECTOR);
            return cards.length === 0;
        },
        thinking: (msgId) => {
            const el = document.querySelector(`[data-message-id="${msgId}"]`);
            if (!el || !el.isConnected) return false;
            // Presence of any loading shimmer is sufficient — text varies by model
            return !!el.querySelector(THINKING_SHIMMER_SEL);
        },
        stuck: () => {
            const cards = document.querySelectorAll(CARD_SELECTOR);
            if (!cards.length) return false;
            const card = cards[cards.length - 1];
            if (!card.isConnected) return false;
            return hasPanel(card, "request") && !hasPanel(card, "response");
        },
        generic: () => isStartVoiceMode(),
        "crit-err": () => {
            const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
            return [...msgs].some((m) =>
                m.textContent.toLowerCase().includes(CRITICAL_ERROR_SUBSTRING),
            );
        },
    };

    function _shouldFireReloadByPriority(callerName) {
        const timers = getActiveTimersRemaining();
        if (!timers.length) return true; // no competing timers

        const caller = timers.find((t) => t.name === callerName);
        if (!caller) return true; // caller not found — let it fire

        const longest = timers[0];

        // If this caller IS the longest timer, or within 1s of it, allow fire
        if (caller.remaining >= longest.remaining - 1) {
            dbg(
                "TIMER-PRIORITY",
                `${callerName} is the longest timer (${caller.remaining.toFixed(
                    1,
                )}s remaining) — proceeding with reload`,
            );
            return true;
        }

        // A longer timer is still running — defer
        dbg(
            "TIMER-PRIORITY",
            `${callerName} wants to reload but ${
                longest.name
            } has more time left (${longest.remaining.toFixed(
                1,
            )}s vs ${caller.remaining.toFixed(1)}s) — deferring to longer timer`,
        );
        return false;
    }

    /**
     * Enhanced shouldFireReload with precondition validation.
     * Checks both timer priority and that the triggering condition still exists.
     */
    function shouldFireReload(callerName) {
        // 1. Check timer priority (existing logic)
        if (!_shouldFireReloadByPriority(callerName)) return false;

        // 2. Validate caller-specific precondition
        // Note: "thinking:" validators receive msgId as context
        const context = callerName.startsWith("thinking:")
            ? callerName.split(":")[1]
            : null;
        const validatorKey = context ? "thinking" : callerName;
        const validator = PRECONDITION_VALIDATORS[validatorKey];

        if (validator) {
            const isValid = context ? validator(context) : validator();
            if (!isValid) {
                dbg(
                    "RELOAD",
                    `${callerName} precondition failed — aborting reload`,
                );
                return false;
            }
        }

        return true;
    }

    // ============================
    // AUTO-SCROLL DOWN
    // ============================

    function scrollToBottom() {
        const sh = document.documentElement.scrollHeight;
        const atBottom = window.innerHeight + window.scrollY >= sh - 120;

        if (sh !== lastScrollHeight || !atBottom) {
            try {
                window.scrollTo({ top: sh, behavior: SCROLL_BEHAVIOR });
            } catch (_) {
                // Fallback for browsers that don't support smooth scroll options
                window.scrollTo(0, sh);
            }
            lastScrollHeight = sh;
        }
    }

    function startAutoScroll() {
        if (scrollInterval) return; // already running
        dbg(
            "SCROLL",
            `Starting auto-scroll (every ${SCROLL_INTERVAL}ms, behavior: ${SCROLL_BEHAVIOR})`,
        );
        scrollInterval = timerManager.create(
            "scroll",
            () => {
                if (isReloading) return;
                scrollToBottom();
            },
            SCROLL_INTERVAL,
            { repeat: true },
        );
    }

    function stopAutoScroll() {
        if (scrollInterval) {
            timerManager.delete(scrollInterval);
            scrollInterval = null;
        }
    }

    // ============================
    // WAITING-FOR-CARD TIMER (44s reload)
    // ============================

    function startWaitingForCard() {
        if (waitingForCardStart !== null) return; // already counting
        waitingForCardStart = Date.now();
        dbg(
            "WAIT-CARD",
            `No cards found — starting ${WAITING_FOR_CARD_TIMEOUT}s countdown to reload`,
        );

        waitingForCardInt = timerManager.create(
            "wait-card",
            () => {
                if (waitingForCardStart === null) {
                    stopWaitingForCard();
                    return;
                }

                const elapsed = (Date.now() - waitingForCardStart) / 1000;
                const remaining = Math.max(
                    0,
                    WAITING_FOR_CARD_TIMEOUT - elapsed,
                );
                const pct = (remaining / WAITING_FOR_CARD_TIMEOUT) * 100;
                const urgent = remaining <= 8;
                const col = urgent ? "#f87171" : "#fb923c";

                setE(
                    "wait-card",
                    `\u23f3 Waiting for card\u2026 reload in ${Math.ceil(
                        remaining,
                    )}s`,
                    col,
                    true,
                    pct,
                    col,
                    urgent,
                );

                if (remaining <= 0) {
                    stopWaitingForCard();
                    // Check timer priority before reloading
                    if (shouldFireReload("wait-card")) {
                        dbgWarn(
                            "WAIT-CARD",
                            `${WAITING_FOR_CARD_TIMEOUT}s elapsed with no card — scheduling reload`,
                        );
                        // DISABLED: Only DOM change counter triggers reloads now
                        dbg(
                            "WAIT-CARD",
                            "Reload disabled - waiting for DOM change counter instead",
                        );
                    } else {
                        // Priority check not needed
                        // Overlay message not needed - DOM change counter shows status
                        // Re-check cycle removed - DOM change counter handles reloads now
                        // Re-check timer removed - DOM change counter handles this
                    }
                }
            },
            500,
            { repeat: true },
        );
    }

    function stopWaitingForCard() {
        if (waitingForCardInt) {
            timerManager.delete(waitingForCardInt);
            waitingForCardInt = null;
        }
        waitingForCardStart = null;
        delE("wait-card");
    }

    // ============================
    // PROLONG BUTTON SCANNER
    // ============================

    function findProlongButtons() {
        const found = [];

        // 1. Check by known CSS selectors
        for (const sel of PROLONG_SELECTORS) {
            try {
                const btns = document.querySelectorAll(sel);
                for (const btn of btns) {
                    if (
                        isVisible(btn) &&
                        isBtnEnabled(btn) &&
                        !clickedProlongBtns.has(btn)
                    ) {
                        found.push({
                            btn,
                            source: `selector:${sel}`,
                            label:
                                btn.getAttribute("aria-label") ||
                                btn.textContent.trim().slice(0, 40),
                        });
                    }
                }
            } catch (_) {
                /* skip bad selector */
            }
        }

        // 2. Check all buttons in the last assistant message for prolong-label text
        const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
        if (msgs.length) {
            const lastMsg = msgs[msgs.length - 1];
            for (const btn of lastMsg.querySelectorAll("button")) {
                const text = btn.textContent.trim().toLowerCase();
                if (
                    isVisible(btn) &&
                    isBtnEnabled(btn) &&
                    !clickedProlongBtns.has(btn)
                ) {
                    if (
                        labelMatch(text, PROLONG_LABELS) &&
                        !labelMatch(text, BLACKLIST)
                    ) {
                        found.push({
                            btn,
                            source: "text-match",
                            label: btn.textContent.trim().slice(0, 40),
                        });
                    }
                }
            }
        }

        // 3. Check buttons at the bottom of the page (e.g., "Continue generating" row)
        const allButtons = document.querySelectorAll("button");
        for (const btn of allButtons) {
            const text = btn.textContent.trim().toLowerCase();
            const ariaLabel = (
                btn.getAttribute("aria-label") || ""
            ).toLowerCase();
            if (
                !isVisible(btn) ||
                !isBtnEnabled(btn) ||
                clickedProlongBtns.has(btn)
            )
                continue;
            if (
                (labelMatch(text, PROLONG_LABELS) ||
                    labelMatch(ariaLabel, PROLONG_LABELS)) &&
                !labelMatch(text, BLACKLIST)
            ) {
                // Avoid duplicates
                if (!found.some((f) => f.btn === btn)) {
                    found.push({
                        btn,
                        source: "global-scan",
                        label:
                            btn.textContent.trim().slice(0, 40) ||
                            ariaLabel.slice(0, 40),
                    });
                }
            }
        }

        return found;
    }

    function clickProlongButtons() {
        const found = findProlongButtons();
        if (!found.length) return;

        for (const { btn, source, label } of found) {
            if (clickedProlongBtns.has(btn)) continue;
            clickedProlongBtns.add(btn);

            const delay = randDelay(
                PROLONG_CLICK_DELAY_MIN,
                PROLONG_CLICK_DELAY_MAX,
            );
            dbg(
                "PROLONG",
                `Found prolong button "${label}" (via ${source}) — clicking in ${delay}ms`,
            );

            setE(
                "prolong",
                `\u27a1\ufe0f Prolong: "${label}" in ${(delay / 1000).toFixed(
                    1,
                )}s`,
                "#a78bfa",
                true,
                100,
                "#a78bfa",
            );

            let rem = delay / 1000;
            const iv = setInterval(() => {
                rem -= 0.1;
                const pct = (rem / (delay / 1000)) * 100;
                setE(
                    "prolong",
                    `\u27a1\ufe0f Prolong: "${label}" in ${rem.toFixed(1)}s`,
                    "#a78bfa",
                    true,
                    pct,
                    "#a78bfa",
                );
                if (rem < 0.05) {
                    clearInterval(iv);
                    if (btn.isConnected) {
                        btn.click();
                        dbg("PROLONG", `Clicked prolong button "${label}"`);
                        telemetry.recordClick("prolong", label, delay - rem * 1000);
                        sessionManager.recordEvent("click", { buttonType: "prolong", buttonText: label });
                        setE(
                            "prolong",
                            `\u2714 Prolong clicked: "${label}"`,
                            "#4ade80",
                        );
                        setTimeout(() => delE("prolong"), 2500);
                        recordActivity();
                        // Reset waiting-for-card timer since action was taken
                        stopWaitingForCard();
                        // Schedule a re-check
                        scheduleCheck();
                        // Scroll after clicking
                        setTimeout(scrollToBottom, 500);
                    } else {
                        dbgWarn(
                            "PROLONG",
                            `Button "${label}" detached before click — skipping`,
                        );
                        delE("prolong");
                    }
                }
            }, 100);
        }
    }

    function startProlongScanner() {
        if (prolongPollInt) return; // already running
        dbg(
            "PROLONG",
            `Starting prolong button scanner (every ${PROLONG_POLL_INTERVAL}ms)`,
        );
        prolongPollInt = timerManager.create(
            "prolong-scan",
            () => {
                if (isReloading) return;
                clickProlongButtons();
            },
            PROLONG_POLL_INTERVAL,
            { repeat: true },
        );
    }

    function stopProlongScanner() {
        if (prolongPollInt) {
            timerManager.delete(prolongPollInt);
            prolongPollInt = null;
        }
        delE("prolong");
    }

    // ============================
    // ACTIVITY + GENERIC 90-S RELOAD
    // ============================

    let lastSnapshot = null; // Track DOM content for change detection

    function recordActivity() {
        if (isStartVoiceMode()) startGenericTimer();
    }

    /**
     * Generic DOM change detector - resets countdown timers when meaningful
     * new content appears. This prevents stale timers from firing when the
     * page has clearly progressed.
     */
    function resetTimersOnDOMChange() {
        // Capture current DOM snapshot for comparison
        const cards = document.querySelectorAll(CARD_SELECTOR);
        const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
        const shimmer = document.querySelectorAll(THINKING_SHIMMER_SEL).length;

        const currentSnapshot = {
            cardCount: cards.length,
            msgCount: msgs.length,
            shimmerCount: shimmer,
            lastCardLen: cards.length > 0 ? cards[cards.length - 1].textContent.length : 0,
            lastMsgLen: msgs.length > 0 ? msgs[msgs.length - 1].textContent.length : 0,
            lastCardText: cards.length > 0 ? cards[cards.length - 1].textContent.slice(0, 100) : "",
            lastMsgText: msgs.length > 0 ? msgs[msgs.length - 1].textContent.slice(0, 100) : "",
            lastCardBtns: cards.length > 0 ? cards[cards.length - 1].querySelectorAll("button").length : 0,
            timestamp: Date.now(),
        };

        // Skip on first run
        if (lastSnapshot === null) {
            lastSnapshot = currentSnapshot;
            return;
        }

        let significantChange = false;
        let anyChange = false; // For the more sensitive last-change counter

        // Check for new cards or messages
        if (currentSnapshot.cardCount > lastSnapshot.cardCount) {
            dbg(
                "DOM-CHANGE",
                `New card appeared (${lastSnapshot.cardCount} → ${currentSnapshot.cardCount})`,
            );
            significantChange = true;
            anyChange = true;
        }
        if (currentSnapshot.msgCount > lastSnapshot.msgCount) {
            dbg(
                "DOM-CHANGE",
                `New message appeared (${lastSnapshot.msgCount} → ${currentSnapshot.msgCount})`,
            );
            significantChange = true;
            anyChange = true;
        }
        // Any text length change in last card or message = significant (streaming detection)
        if (currentSnapshot.lastCardLen !== lastSnapshot.lastCardLen) {
            dbg("DOM-CHANGE", `Last card length changed (${lastSnapshot.lastCardLen} → ${currentSnapshot.lastCardLen})`);
            significantChange = true;
            anyChange = true;
        }
        if (currentSnapshot.lastMsgLen !== lastSnapshot.lastMsgLen) {
            dbg("DOM-CHANGE", `Last msg length changed (${lastSnapshot.lastMsgLen} → ${currentSnapshot.lastMsgLen})`);
            significantChange = true;
            anyChange = true;
        }
        // Same-length but different text = rewrite in place
        if (
            !significantChange &&
            currentSnapshot.lastCardLen === lastSnapshot.lastCardLen &&
            currentSnapshot.lastCardText !== lastSnapshot.lastCardText
        ) {
            dbg("DOM-CHANGE", "Last card text rewritten (same length)");
            significantChange = true;
            anyChange = true;
        }
        // Button count change in last card
        if (currentSnapshot.lastCardBtns !== lastSnapshot.lastCardBtns) {
            dbg("DOM-CHANGE", `Last card button count changed (${lastSnapshot.lastCardBtns} → ${currentSnapshot.lastCardBtns})`);
            significantChange = true;
            anyChange = true;
        }

        // Shimmer state changes indicate thinking state changes
        if (currentSnapshot.shimmerCount !== lastSnapshot.shimmerCount) {
            dbg(
                "DOM-CHANGE",
                `Shimmer state changed (${lastSnapshot.shimmerCount} → ${currentSnapshot.shimmerCount})`,
            );
            // Don't treat shimmer changes as significant for timer reset - they're handled by checkThinkingState
            anyChange = true; // But do update the last-change counter
        }

        if (significantChange) {
            // Record elapsed idle time before this reset (session analytics)
            sessionManager.recordDomReset((Date.now() - lastDomChangeTime) / 1000);
            // Reset countdown timers on meaningful progress
            resetCountdownTimers();
            recordActivity();
            // Resolve stuck-UI hypothesis on DOM change
            if (stuckUiHypothesisActive) {
                const holdMs = Date.now() - (stuckUiHypothesisFiredAt || Date.now());
                const hypothesisType = stuckUiHypothesisActive;
                // "reload-expected" disproved (DOM changed, no reload needed); "patient-no-reload" confirmed (tool completed)
                const outcome = hypothesisType === "reload-expected" ? "stuck-ui-hypothesis-disproved" : "stuck-ui-hypothesis-confirmed";
                sessionManager.recordEvent(outcome, { hypothesisType, holdMs });
                if (hypothesisType === "reload-expected") {
                    dbg("HYPOTHESIS", `Stuck-UI hypothesis DISPROVED — DOM changed ${holdMs}ms after reload-expected hypothesis`);
                } else {
                    dbg("HYPOTHESIS", `Stuck-UI hypothesis CONFIRMED — tool completed, DOM changed ${holdMs}ms after patient-no-reload hypothesis`);
                }
                delE("hypothesis");
                stuckUiHypothesisActive = null;
                stuckUiHypothesisFiredAt = null;
            }
        }

        // Update last-change counter on ANY detected change
        if (anyChange) {
            lastDomChangeTime = Date.now();
        }

        lastSnapshot = currentSnapshot;
    }

    /**
     * Reset countdown timers when meaningful progress is detected.
     * This prevents stale timers from firing after new content appears.
     */
    function resetCountdownTimers() {
        // Reset thinking timers - new content means we're making progress
        if (thinkingTimers.size > 0) {
            dbg(
                "TIMER-RESET",
                "Clearing thinking timers - new content detected",
            );
            clearAllThinking();
        }

        // Reset stuck timer - if we have new content, we're not stuck
        const cards = document.querySelectorAll(CARD_SELECTOR);
        if (cards.length > 0) {
            const lastCard = cards[cards.length - 1];
            if (stuckTimers.has(lastCard)) {
                dbg(
                    "TIMER-RESET",
                    "Clearing stuck timer - new content detected",
                );
                stuckTimers.delete(lastCard);
                delE("stuck");
            }
        }

        // Reset waiting-for-card timer - if cards appeared, we're done waiting
        if (waitingForCardStart !== null && cards.length > 0) {
            dbg("TIMER-RESET", "Stopping wait-card timer - cards detected");
            stopWaitingForCard();
        }

        // Note: We don't reset the generic timer here - it's controlled by start/stop voice mode
    }

    function startGenericTimer() {
        cancelGenericTimer();
        if (isReloading) return;
        genericStartTime = Date.now();
        dbg(
            "GENERIC",
            `Starting ${GENERIC_RELOAD_INTERVAL}s idle reload timer`,
        );
        genericTimer = setTimeout(() => {
            genericTimer = null;
            genericStartTime = null; // clear so priority system sees it as inactive
            stopGenericDisplay();
            delE("generic");
            if (isStartVoiceMode() && !isReloading) {
                dbgWarn(
                    "GENERIC",
                    "90s idle reached while in start-voice mode — scheduling reload",
                );
                // DISABLED: Only DOM change counter triggers reloads now
                dbg(
                    "GENERIC",
                    "Reload disabled - waiting for DOM change counter instead",
                );
            } else {
                checkGenericReload();
            }
        }, GENERIC_RELOAD_INTERVAL * 1000);
        startGenericDisplay();
    }

    function cancelGenericTimer() {
        if (genericTimer) {
            clearTimeout(genericTimer);
            genericTimer = null;
        }
        genericStartTime = null; // clear so getActiveTimersRemaining doesn't report phantom timer
        stopGenericDisplay();
        delE("generic");
    }

    function startGenericDisplay() {
        stopGenericDisplay();
        genericDisplayInt = timerManager.create(
            "display",
            () => {
                if (!genericStartTime) return;
                const rem = Math.max(
                    0,
                    GENERIC_RELOAD_INTERVAL -
                        (Date.now() - genericStartTime) / 1000,
                );
                setE(
                    "generic",
                    `\u23f1 Reload in ${Math.ceil(rem)}s`,
                    "#64748b",
                );
            },
            1000,
            { repeat: true },
        );
    }

    function stopGenericDisplay() {
        if (genericDisplayInt) {
            timerManager.delete(genericDisplayInt);
            genericDisplayInt = null;
        }
    }

    function checkGenericReload() {
        const now = isStartVoiceMode();
        if (now && !wasInStartVoice) {
            dbg("GENERIC", "Entered start-voice mode — starting timer");
            startGenericTimer();
        }
        if (!now && wasInStartVoice) {
            dbg("GENERIC", "Left start-voice mode — cancelling timer");
            cancelGenericTimer();
        }
        wasInStartVoice = now;
    }

    // ============================
    // LAST DOM CHANGE COUNTER
    // ============================

    // Apply decay gradient to the play button.
    // pct=100 → all amber (fresh), pct=0 → all red (reload imminent).
    function applyTimerDecay(pct) {
        const btn = document.getElementById("tm-overlay-play-btn");
        if (!btn) return;
        const safe = Math.max(0, Math.min(100, pct));
        if (safe >= 100) {
            btn.style.background = "rgba(245,158,11,0.15)";
        } else {
            btn.style.background =
                `linear-gradient(to right, rgba(245,158,11,0.20) ${safe}%, rgba(248,113,113,0.28) ${safe}%)`;
        }
    }

    function clearTimerDecay() {
        const btn = document.getElementById("tm-overlay-play-btn");
        if (!btn) return;
        if (!isPaused) { btn.style.background = "rgba(245,158,11,0.15)"; return; }
        btn.style.background = lastPauseReason === "user-input-required"
            ? "rgba(88,166,255,0.15)" : "rgba(74,222,128,0.15)";
    }

    /**
     * Collect text labels from collapsed tool-call panels in the LAST CARD only.
     * Scoping to the last card prevents old "Access granted" panels from the chat
     * history triggering the hypothesis on every new idle window.
     *
     * Three complementary selectors handle different DOM states:
     *   1. loading-shimmer button  → span.text-start  (active/in-progress call)
     *   2. expand-trigger sibling  → span.text-start  (completed but collapsed)
     *   3. any span.text-start whose parent contains an expand trigger (broadest)
     */
    function getLastCollapsedPanelLabels() {
        const cards = document.querySelectorAll(CARD_SELECTOR);
        if (cards.length === 0) return [];
        const lastCard = cards[cards.length - 1];
        const labels = new Set();

        // 1: shimmer button (active call) — scoped to last card
        lastCard.querySelectorAll("button.loading-shimmer span.text-start").forEach(span => {
            const t = span.textContent.trim().toLowerCase();
            if (t) labels.add(t);
        });
        // 2: expand trigger sibling — scoped to last card (all states, not only closed)
        lastCard.querySelectorAll('button[aria-label*="tool call"]').forEach(btn => {
            const parent = btn.parentElement;
            if (parent) {
                const span = parent.querySelector("span.text-start");
                if (span) { const t = span.textContent.trim().toLowerCase(); if (t) labels.add(t); }
            }
        });
        // 3: broadest fallback — any span.text-start whose parent row has an expand trigger
        lastCard.querySelectorAll("span.text-start").forEach(span => {
            const row = span.parentElement;
            if (row && row.querySelector('button[aria-label*="tool call"]')) {
                const t = span.textContent.trim().toLowerCase();
                if (t) labels.add(t);
            }
        });
        return [...labels];
    }

    function checkStuckUiHypothesis() {
        if (stuckUiHypothesisActive) return; // already fired for this idle run

        const panelLabels = getLastCollapsedPanelLabels();
        let found = null;

        // Prefer specific panel labels over full-card text scan
        for (const label of panelLabels) {
            const rp = STUCK_UI_HYPOTHESIS_PATTERNS.find(p => label.includes(p.toLowerCase()));
            if (rp) { found = { type: "reload-expected", pattern: rp, label }; break; }
            const pp = PATIENT_UI_PATTERNS.find(p => label.includes(p.toLowerCase()));
            if (pp && !found) found = { type: "patient-no-reload", pattern: pp, label };
        }

        // Fallback: search full last-card text
        if (!found) {
            const cards = document.querySelectorAll(CARD_SELECTOR);
            if (cards.length === 0) return;
            const lastCardText = cards[cards.length - 1].textContent.toLowerCase();
            const rp = STUCK_UI_HYPOTHESIS_PATTERNS.find(p => lastCardText.includes(p.toLowerCase()));
            if (rp) found = { type: "reload-expected", pattern: rp, label: rp };
            else {
                const pp = PATIENT_UI_PATTERNS.find(p => lastCardText.includes(p.toLowerCase()));
                if (pp) found = { type: "patient-no-reload", pattern: pp, label: pp };
            }
        }

        if (!found) return;

        stuckUiHypothesisActive = found.type;
        stuckUiHypothesisFiredAt = Date.now();

        if (found.type === "reload-expected") {
            dbgWarn("HYPOTHESIS", `Stuck-UI hypothesis (reload-expected): panel label "${found.label}"`);
            setE("hypothesis", `🔍 Reload expected — last panel: "${found.label}"`, "#a78bfa");
        } else {
            dbg("HYPOTHESIS", `Stuck-UI hypothesis (patient-no-reload): panel label "${found.label}"`);
            setE("hypothesis", `🛠️ Tool executing: "${found.label}" — no reload expected`, "#38bdf8");
        }
        sessionManager.recordEvent("stuck-ui-hypothesis", {
            hypothesisType: found.type, matchedPattern: found.pattern, panelLabel: found.label,
        });
    }

    function startDomChangeCounter() {
        if (domChangeCounterInt) return; // already running

        dbg("DOM-COUNTER", "Starting last change counter");

        domChangeCounterInt = timerManager.create(
            "dom-counter",
            () => {
                const elapsed = (Date.now() - lastDomChangeTime) / 1000;
                const pct = Math.max(0, 100 - (elapsed / NO_CHANGE_RELOAD_SECS) * 100);
                applyTimerDecay(pct);

                // Fire stuck-UI hypothesis once we're past the halfway mark
                if (elapsed >= NO_CHANGE_RELOAD_SECS * 0.5 && !isPaused && !isReloading) {
                    checkStuckUiHypothesis();
                }

                if (elapsed >= NO_CHANGE_RELOAD_SECS && !isPaused && !isReloading) {
                    dbgWarn("DOM-COUNTER", `No changes for ${NO_CHANGE_RELOAD_SECS}s — scheduling reload`);
                    if (stuckUiHypothesisActive) {
                        const hypothesisType = stuckUiHypothesisActive;
                        // "reload-expected" confirmed; "patient-no-reload" disproved
                        const outcome = hypothesisType === "reload-expected" ? "stuck-ui-hypothesis-confirmed" : "stuck-ui-hypothesis-disproved";
                        sessionManager.recordEvent(outcome, { hypothesisType, elapsedSecs: elapsed });
                        if (hypothesisType === "reload-expected") {
                            dbgWarn("HYPOTHESIS", "Stuck-UI hypothesis CONFIRMED — reload triggered as predicted");
                        } else {
                            dbgWarn("HYPOTHESIS", "Stuck-UI hypothesis DISPROVED — reload fired despite patient pattern");
                        }
                        delE("hypothesis");
                        stuckUiHypothesisActive = null;
                        stuckUiHypothesisFiredAt = null;
                    }
                    scheduleReload(`💳 No changes for ${NO_CHANGE_RELOAD_SECS}s`, 3);
                }
            },
            1000,
            { repeat: true },
        );
    }

    function stopDomChangeCounter() {
        if (domChangeCounterInt) {
            timerManager.delete(domChangeCounterInt);
            domChangeCounterInt = null;
        }
        clearTimerDecay();
    }

    // ============================
    // CRITICAL ERROR LISTENER
    // ============================

    function checkGenericCriticalError() {
        if (isReloading) return true;

        const messages = document.querySelectorAll(ASSISTANT_MSG_SEL);
        let hasError = false;
        let errorText = "";
        for (const msg of messages) {
            if (
                msg.textContent.toLowerCase().includes(CRITICAL_ERROR_SUBSTRING)
            ) {
                hasError = true;
                errorText = msg.textContent.trim().slice(0, 100);
                break;
            }
        }

        if (hasError) {
            if (!critErrorTimer) {
                dbgError(
                    "CRIT-ERR",
                    `Critical error detected: "${errorText}..." — starting ${CRIT_ERR_WAIT_SECS}s reload countdown`,
                );
                let secs = CRIT_ERR_WAIT_SECS;
                setE(
                    "crit-err",
                    `\ud83d\udea8 Critical Error! Reloading in ${secs}s...`,
                    "#f87171",
                    true,
                    100,
                    "#f87171",
                    true,
                );

                critErrorTimer = setInterval(() => {
                    secs--;
                    let stillHasError = false;
                    const currentMsgs =
                        document.querySelectorAll(ASSISTANT_MSG_SEL);
                    for (const msg of currentMsgs) {
                        if (
                            msg.textContent
                                .toLowerCase()
                                .includes(CRITICAL_ERROR_SUBSTRING)
                        ) {
                            stillHasError = true;
                            break;
                        }
                    }

                    if (!stillHasError) {
                        dbg(
                            "CRIT-ERR",
                            "Critical error cleared — cancelling reload",
                        );
                        clearInterval(critErrorTimer);
                        critErrorTimer = null;
                        delE("crit-err");
                        return;
                    }

                    const pct = (secs / CRIT_ERR_WAIT_SECS) * 100;
                    setE(
                        "crit-err",
                        `\ud83d\udea8 Critical Error! Reloading in ${secs}s...`,
                        "#f87171",
                        true,
                        pct,
                        "#f87171",
                        true,
                    );

                    if (secs <= 0) {
                        clearInterval(critErrorTimer);
                        critErrorTimer = null;
                        // Critical errors always fire — they override other timers
                        dbgError(
                            "CRIT-ERR",
                            "Critical error persisted — forcing reload (overrides other timers)",
                        );
                        // DISABLED: Only DOM change counter triggers reloads now
                        // Critical errors no longer force reload
                        dbgError(
                            "CRIT-ERR",
                            "Critical error persisted but reload disabled - waiting for DOM change counter",
                        );
                    }
                }, 1000);
            }
            return true;
        } else {
            if (critErrorTimer) {
                dbg(
                    "CRIT-ERR",
                    "Critical error no longer present — cleaning up",
                );
                clearInterval(critErrorTimer);
                critErrorTimer = null;
                delE("crit-err");
            }
            return false;
        }
    }

    // ============================
    // THINKING COUNTDOWN
    // ============================

    function checkThinkingState() {
        const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
        if (!msgs.length) {
            clearAllThinking();
            return;
        }

        const last = msgs[msgs.length - 1];
        const shimmer = last.querySelector(THINKING_SHIMMER_SEL);
        // Accept any shimmer presence — o1/o3 show "Reasoning…" or blank, not always "thinking"
        const isThinking = !!shimmer;

        if (isThinking) {
            const mid = last.getAttribute("data-message-id") || "__last__";
            if (!thinkingTimers.has(mid)) {
                dbg(
                    "THINKING",
                    `Detected thinking state for msgId=${mid} — starting ${THINKING_COUNTDOWN_SECS}s countdown`,
                );
                startThinkingTimer(mid);
            }
        } else {
            if (thinkingTimers.size > 0)
                dbg(
                    "THINKING",
                    "Thinking state ended — clearing all thinking timers",
                );
            clearAllThinking();
        }
    }

    function startThinkingTimer(msgId) {
        let secs = THINKING_COUNTDOWN_SECS;
        const eid = "think-" + msgId;
        setE(
            eid,
            `\ud83e\udde0 Thinking\u2026 (${secs}s)`,
            "#fbbf24",
            true,
            100,
            "#fbbf24",
        );

        const intv = setInterval(() => {
            const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
            if (!msgs.length) {
                clearThinking(msgId);
                return;
            }

            const thisEl = document.querySelector(
                `[data-message-id="${msgId}"]`,
            );
            // FIX: Check if element is still connected to prevent orphaned intervals
            if (!thisEl || !thisEl.isConnected) {
                dbg(
                    "THINKING",
                    `Message element ${msgId} disconnected — clearing timer`,
                );
                clearThinking(msgId);
                return;
            }
            const thisShim = thisEl
                ? thisEl.querySelector(THINKING_SHIMMER_SEL)
                : null;
            // Accept any shimmer presence (o1/o3 show "Reasoning…" etc., not always "thinking")
            const thisStill = !!thisShim;

            if (!thisStill) {
                clearThinking(msgId);
                recordActivity();
                return;
            }

            secs--;
            // Update secsLeft for timer priority system
            const entry = thinkingTimers.get(msgId);
            if (entry) entry.secsLeft = secs;

            const urgent = secs <= 10;
            const col = urgent ? "#f87171" : "#fbbf24";
            setE(
                eid,
                `\ud83e\udde0 Thinking\u2026 (${secs}s)`,
                col,
                true,
                (secs / THINKING_COUNTDOWN_SECS) * 100,
                col,
                urgent,
            );

            if (secs <= 0) {
                clearThinking(msgId);
                // Check timer priority — thinking (45s) is longer than wait-card (44s)
                if (shouldFireReload(`thinking:${msgId}`)) {
                    dbgWarn(
                        "THINKING",
                        `Thinking stuck for ${THINKING_COUNTDOWN_SECS}s — scheduling reload`,
                    );
                    // DISABLED: Only DOM change counter triggers reloads now
                    dbg(
                        "THINKING",
                        "Reload disabled - waiting for DOM change counter instead",
                    );
                } else {
                    dbg(
                        "THINKING",
                        "Thinking timer expired but deferring to a longer timer",
                    );
                }
            }
        }, 1000);

        thinkingTimers.set(msgId, { interval: intv, secsLeft: secs });
    }

    function clearThinking(msgId) {
        const t = thinkingTimers.get(msgId);
        if (t) clearInterval(t.interval);
        thinkingTimers.delete(msgId);
        delE("think-" + msgId);
    }

    function isDoneState() {
        // 1. Check for "done" in the last assistant message
        const msgs = document.querySelectorAll(ASSISTANT_MSG_SEL);
        if (!msgs.length) return false;
        const last = msgs[msgs.length - 1];
        const txt = last.textContent.trim().toLowerCase();
        // You can add more sophisticated checks here if needed
        if (txt.includes("done") || txt.match(/conversation.*done/))
            return true;
        // 2. Check for a "done" badge or indicator (customize as needed)
        if (last.querySelector(".text-green-600, .done-indicator")) return true;
        return false;
    }
    function clearAllThinking() {
        for (const [mid] of thinkingTimers) clearThinking(mid);
    }

    // ============================
    // HELPERS
    // ============================

    function randDelay(a = 3000, b = 5000) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    function hasPanel(card, name) {
        if (!card) return false;
        for (const p of card.querySelectorAll(
            ".text-token-text-secondary.text-xs",
        ))
            if (p.textContent.toLowerCase().includes(name)) return true;
        return false;
    }

    function labelMatch(label, list) {
        const l = label.toLowerCase();
        return list.some((s) => l.includes(s));
    }

    function isBtnEnabled(btn) {
        if (!btn) return false;
        if (btn.disabled) return false;
        if (btn.getAttribute("aria-disabled") === "true") return false;
        if (btn.classList.contains("cursor-not-allowed")) return false;
        if (btn.classList.contains("pointer-events-none")) return false;
        return true;
    }

    function findSafeButton(card) {
        if (!card) return null;
        for (const btn of card.querySelectorAll("button")) {
            const t = btn.textContent.trim();
            if (labelMatch(t, WHITELIST) && !labelMatch(t, BLACKLIST))
                return btn;
        }
        return null;
    }

    function findCollapsedToolBtns(container) {
        for (const sel of EXPAND_SELECTORS) {
            try {
                const btns = container.querySelectorAll(sel);
                if (btns.length) return [...btns];
            } catch (_) {
                /* skip bad selector */
            }
        }

        const closed = container.querySelectorAll("details:not([open])");
        const sums = [...closed]
            .map((d) => d.querySelector("summary"))
            .filter(Boolean);
        if (sums.length) return sums;

        const radix = container.querySelectorAll(
            '[data-radix-collapsible-trigger][aria-expanded="false"],' +
                '[data-radix-collapsible-trigger][data-state="closed"]',
        );
        if (radix.length) return [...radix];

        return [];
    }

    // ============================
    // RELOAD SCHEDULER
    // ============================

    function scheduleReload(msg, delay, crit = false) {
        // FIX: Mutex-style locking to prevent race conditions
        if (isReloading) {
            dbgWarn("RELOAD", `Already reloading — ignoring request: "${msg}"`);
            return;
        }
        // Atomic compare-and-set: only proceed if no other timer has claimed the reload
        if (pendingReloadId !== null) {
            dbgWarn(
                "RELOAD",
                `Another reload already scheduled — ignoring: "${msg}"`,
            );
            return;
        }

        // Check if content is actively updating - don't reload if changes are recent
        const timeSinceLastChange = (Date.now() - lastDomChangeTime) / 1000;
        if (!crit && timeSinceLastChange < 20) {
            dbg(
                "RELOAD",
                `Skipping reload - content changed ${timeSinceLastChange.toFixed(1)}s ago (need 20s of inactivity)`,
            );
            pendingReloadId = null; // Reset so other reloads can proceed
            return;
        }

        pendingReloadId = Date.now();

        // Per-URL retry tracking
        let retryCount = getRetryCount();
        const lastRetryTime = getLastRetryTime();
        if (Date.now() - lastRetryTime > 120000) {
            retryCount = 0;
            setRetryCount(0);
        }

        isReloading = true;
        retryCount++;
        setRetryCount(retryCount);

        telemetry.recordReload(msg, delay, retryCount);
        dbgWarn(
            "RELOAD",
            `Scheduled: "${msg}" delay=${delay}s retryCount=${retryCount}/3`,
        );
        dbg(
            "TIMER-PRIORITY",
            `Active timers at reload time: ${JSON.stringify(
                getActiveTimersRemaining(),
            )}`,
        );

        if (retryCount > RAPID_RELOAD_MAX) {
            dbgError(
                "RELOAD",
                `Too many rapid reloads (>${RAPID_RELOAD_MAX}) — pausing 60s to recover`,
            );
            setE(
                "reload",
                "\ud83d\uded1 Too many rapid reloads \u2014 Pausing 60s to recover",
                "#f87171",
                false,
                0,
                "#f87171",
                true,
            );
            isReloading = false;
            pendingReloadId = null; // reset so future scheduleReload calls are not permanently blocked

            setTimeout(() => {
                resetRetryCount();
                delE("reload");
                setE(
                    "main",
                    "\u23f3 Retry count reset. Resuming checks...",
                    "#94a3b8",
                );
                dbg(
                    "RELOAD",
                    "Retry count reset after 60s pause — resuming checks",
                );
                scheduleCheck();
            }, 60000);
            return;
        }

        let rem = delay;
        const tot = delay;
        const tick = () => {
            setE(
                "reload",
                `${msg} (${rem.toFixed(1)}s) [${retryCount}/3]`,
                "#ff4d4d",
                true,
                (rem / tot) * 100,
                "#ff4d4d",
                crit,
            );
            rem -= 0.1;
            if (rem < 0.05) {
                clearInterval(iv);
                dbgWarn("RELOAD", `Executing reload now — reason: "${msg}"`);
                sessionManager.recordReload(msg);
                sessionManager.syncStats();
                location.reload();
            }
        };
        tick();
        const iv = setInterval(tick, 100);
    }

    // ============================
    // CORE LOGIC
    // ============================

    function scheduleCheck() {
        if (isReloading) return;

        // Check for meaningful DOM changes and reset timers if progress detected
        resetTimersOnDOMChange();

        // Immediate check on first mutation (leading edge)
        if (!checkScheduled) {
            checkScheduled = true;
            checkDOM();
        }

        // Debounce subsequent mutations with cooldown
        if (checkDebounceTimer) clearTimeout(checkDebounceTimer);
        checkDebounceTimer = setTimeout(() => {
            checkScheduled = false;
            checkDebounceTimer = null;
        }, 250); // Cooldown period

        dbg("MUTATION-DEBOUNCE", "Check scheduled (debounced)");
    }

    function checkDOM() {
        if (isReloading || isPaused) {
            dbg(
                "CHECK",
                isReloading
                    ? "Skipping check — reload in progress"
                    : "Skipping check — paused",
            );
            return;
        }

        // SPA navigation
        if (location.href !== lastUrl) {
            dbg(
                "NAV",
                `URL changed: ${lastUrl} \u2192 ${location.href} \u2014 resetting state`,
            );
            const prevUrl = lastUrl;
            lastUrl = location.href;
            sessionManager.recordUrlChange(prevUrl, location.href);
            // Note: retryCount is now per-URL, so no need to reset here
            // getRetryCount() will automatically return the correct count for the new URL
            processedButtons = new WeakSet();
            stuckTimers = new Map();
            clickedProlongBtns = new WeakSet();
            clearAllThinking();
            clearAllButtonPolls();
            stopWaitingForCard();
            if (critErrorTimer) {
                clearInterval(critErrorTimer);
                critErrorTimer = null;
            }
            overlayEntries.clear();
            schedRender();
            setE("main", "\u23f3 New conversation detected\u2026", "#94a3b8");
            recordActivity();
            lastSnapshot = null; // Reset DOM snapshot for new conversation
        }

        // Global checks
        checkGenericReload();
        if (checkGenericCriticalError()) {
            dbg("CHECK", "Critical error detected — skipping further checks");
            return;
        }
        checkThinkingState();

        // Prolong buttons (runs independently of card state)
        clickProlongButtons();

        // Cards
        const cards = [...document.querySelectorAll(CARD_SELECTOR)];
        if (!cards.length) {
            setE("main", "\u23f3 Waiting for card\u2026", "#94a3b8");
            startWaitingForCard();
            dbgSnapshot("no-cards");
            return;
        }

        // Cards found — stop the waiting-for-card timer
        if (waitingForCardStart !== null) {
            dbg("WAIT-CARD", "Cards appeared — stopping countdown");
            stopWaitingForCard();
        }

        const card = cards[cards.length - 1];

        // ── STEP 1: EXPAND COLLAPSED PANELS ──────────────────────
        const collapsed = findCollapsedToolBtns(card);
        if (collapsed.length) {
            const lastBtn = collapsed[collapsed.length - 1];
            dbg(
                "EXPAND",
                `Found ${
                    collapsed.length
                } collapsed panel(s) — clicking last one (text: "${lastBtn.textContent
                    .trim()
                    .slice(0, 40)}")`,
            );
            setE("expand", "\u23f3 Expanding collapsed panel\u2026", "#94a3b8");
            lastBtn.click();
            recordActivity();
            telemetry.recordClick("expand", lastBtn.textContent.trim());
            sessionManager.recordEvent("click", { buttonType: "expand", buttonText: lastBtn.textContent.trim() });
            stuckTimers.delete(card);
            if (checkTimeout) clearTimeout(checkTimeout);
            checkTimeout = setTimeout(checkDOM, 1500);
            // Scroll after expanding
            setTimeout(scrollToBottom, 800);
            return;
        }
        delE("expand");
        scrollToBottom();

        // ── STEP 2: SAFE BUTTON ──────────────────────────────────
        const safeBtn = findSafeButton(card);
        if (safeBtn && !processedButtons.has(safeBtn)) {
            if (isBtnEnabled(safeBtn)) {
                processedButtons.add(safeBtn);
                const delay = randDelay(1500, 3000) / 1000;
                dbg(
                    "BTN",
                    `Safe button found: "${safeBtn.textContent
                        .trim()
                        .slice(0, 40)}" — clicking in ${delay.toFixed(1)}s`,
                );
                let rem = delay;
                const iv = setInterval(() => {
                    rem -= 0.1;
                    setE(
                        "btn",
                        `\ud83d\ude80 Safe button \u2014 clicking in ${rem.toFixed(
                            1,
                        )}s`,
                        "#4ade80",
                        true,
                        (rem / delay) * 100,
                        "#4ade80",
                    );
                    if (rem < 0.05) {
                        clearInterval(iv);
                        dbg(
                            "BTN",
                            `Clicked safe button: "${safeBtn.textContent
                                .trim()
                                .slice(0, 40)}"`,
                        );
                        safeBtn.click();
                        recordActivity();
                        telemetry.recordClick("safe", safeBtn.textContent.trim(), delay - rem * 1000);
                        sessionManager.recordEvent("click", { buttonType: "safe", buttonText: safeBtn.textContent.trim() });
                        setE(
                            "btn",
                            "\u2714 Button clicked \u2014 Waiting",
                            "#4ade80",
                        );
                        setTimeout(() => delE("btn"), 2000);
                        // Reset waiting-for-card in case the button advances state
                        stopWaitingForCard();
                        // Scroll after clicking
                        setTimeout(scrollToBottom, 500);
                    }
                }, 100);
                return;
            } else {
                dbg(
                    "BTN",
                    `Safe button found but DISABLED: "${safeBtn.textContent
                        .trim()
                        .slice(
                            0,
                            40,
                        )}" — polling every ${BUTTON_POLL_INTERVAL}s`,
                );
                setE(
                    "btn",
                    `\u23f3 Safe button disabled \u2014 polling every ${BUTTON_POLL_INTERVAL}s`,
                    "#fbbf24",
                );
                const poll = setInterval(() => {
                    if (!safeBtn.isConnected) {
                        dbg(
                            "BTN",
                            "Safe button disconnected from DOM — stopping poll",
                        );
                        clearInterval(poll);
                        buttonPollInts.delete(poll);
                        delE("btn");
                        scheduleCheck();
                        return;
                    }
                    if (isBtnEnabled(safeBtn)) {
                        clearInterval(poll);
                        buttonPollInts.delete(poll);
                        processedButtons.add(safeBtn);
                        const d = randDelay(500, 1500);
                        dbg(
                            "BTN",
                            `Safe button now ENABLED: "${safeBtn.textContent
                                .trim()
                                .slice(0, 40)}" — clicking in ${d}ms`,
                        );
                        setTimeout(() => {
                            safeBtn.click();
                            recordActivity();
                            telemetry.recordClick("safe", safeBtn.textContent.trim(), d);
                            sessionManager.recordEvent("click", { buttonType: "safe", buttonText: safeBtn.textContent.trim() });
                            setE(
                                "btn",
                                "\u2714 Button clicked (now enabled)",
                                "#4ade80",
                            );
                            setTimeout(() => delE("btn"), 2000);
                            // Scroll after clicking
                            setTimeout(scrollToBottom, 500);
                        }, d);
                    } else {
                        dbg(
                            "BTN",
                            `Safe button still disabled — next check in ${BUTTON_POLL_INTERVAL}s`,
                        );
                    }
                }, BUTTON_POLL_INTERVAL * 1000);
                buttonPollInts.add(poll);
                return;
            }
        }

        // ── STEP 3: STUCK / MISSING RESPONSE ─────────────────────
        const hasReq = hasPanel(card, "request");
        const hasRes = hasPanel(card, "response");

        if (hasReq && !hasRes) {
            // FIX: Check if card is still connected before accessing stuckTimers
            if (!card.isConnected) {
                dbg(
                    "STUCK",
                    "Card disconnected from DOM — skipping stuck timer",
                );
                return;
            }
            if (!stuckTimers.has(card)) {
                stuckTimers.set(card, Date.now());
                dbg(
                    "STUCK",
                    `Card has request but no response — starting ${STUCK_THRESHOLD}s stuck timer`,
                );
            }
            const elapsed = (Date.now() - stuckTimers.get(card)) / 1000;
            if (elapsed > STUCK_THRESHOLD) {
                // Check timer priority — stuck (30s) is the shortest, always defers to others
                if (shouldFireReload("stuck")) {
                    dbgWarn(
                        "STUCK",
                        `Missing response for ${Math.round(
                            elapsed,
                        )}s (>${STUCK_THRESHOLD}s) — scheduling reload`,
                    );
                    // DISABLED: Only DOM change counter triggers reloads now
                    dbg(
                        "STUCK",
                        "Reload disabled - waiting for DOM change counter instead",
                    );
                } else {
                    dbg(
                        "STUCK",
                        `Stuck for ${Math.round(
                            elapsed,
                        )}s but deferring to a longer timer`,
                    );
                    setE(
                        "stuck",
                        `\u23f3 Stuck but waiting on longer timer\u2026`,
                        "#38bdf8",
                    );
                }
            } else {
                setE(
                    "stuck",
                    `\u23f3 Waiting for response\u2026 (${Math.ceil(
                        STUCK_THRESHOLD - elapsed,
                    )}s left)`,
                    "#38bdf8",
                );
            }
            dbgSnapshot("stuck-waiting");
            return;
        }
        delE("stuck");

        // ── STEP 4: SUCCESS ──────────────────────────────────────
        if (hasRes) {
            if (getRetryCount() > 0) {
                resetRetryCount();
            }
            setE("main", "\u2714 Response received \u2014 All good", "#4ade80");
            stuckTimers.delete(card);
            recordActivity();
            dbg("CHECK", "Response received — all good");
            dbgSnapshot("success");
            // Scroll to see the response
            scrollToBottom();
            return;
        }

        setE("main", "\u23f3 Waiting for action\u2026", "#94a3b8");
        dbgSnapshot("waiting-action");
    }

    // ============================
    // CLEANUP
    // ============================

    function clearAllButtonPolls() {
        for (const iv of buttonPollInts) clearInterval(iv);
        buttonPollInts.clear();
        delE("btn");
    }

    // ============================
    // REMOTE COMMAND POLLING
    // ============================

    function fillComposer(text) {
        const composer = document.querySelector("#prompt-textarea");
        if (!composer) {
            dbgWarn("REMOTE-CMD", "fillComposer: composer not found");
            return false;
        }
        composer.focus();
        try {
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, "value"
            )?.set;
            if (nativeSetter) {
                nativeSetter.call(composer, text || "");
            } else {
                composer.value = text || "";
            }
        } catch (_) {
            composer.value = text || "";
        }
        composer.dispatchEvent(new Event("input", { bubbles: true }));
        composer.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function executeRemoteCommand(cmd) {
        const { type, text } = cmd;
        const preview = text !== undefined ? ` ("${String(text).slice(0, 40)}")` : "";
        dbg("REMOTE-CMD", `Executing remote command: ${type}${preview}`);
        setE("remote-cmd", `📡 Remote: ${type}`, "#a78bfa");
        setTimeout(() => delE("remote-cmd"), 4000);

        if (type === "pause") {
            setPaused(true, "remote-command");
        } else if (type === "resume") {
            setPaused(false, "remote-command");
        } else if (type === "stop") {
            if (activeSessionId) sessionManager.stopSession(activeSessionId, "manual-stop");
            setPaused(true, "remote-command");
        } else if (type === "delete") {
            if (activeSessionId) sessionManager.deleteSession(activeSessionId, "manual-delete");
            setPaused(true, "remote-command");
        } else if (type === "prompt-draft") {
            if (fillComposer(text || "")) {
                setE("remote-cmd", `📡 Remote: draft filled`, "#4ade80");
                setTimeout(() => delE("remote-cmd"), 4000);
            }
        }
    }

    function startCommandPoller() {
        stopCommandPoller();
        commandPollInt = setInterval(() => {
            if (!activeSessionId || !api.available) return;
            api.consumeCommand(activeSessionId, executeRemoteCommand);
        }, COMMAND_POLL_INTERVAL * 1000);
        dbg("REMOTE-CMD", `Command poller started (interval=${COMMAND_POLL_INTERVAL}s)`);
    }

    function stopCommandPoller() {
        if (commandPollInt) {
            clearInterval(commandPollInt);
            commandPollInt = null;
            dbg("REMOTE-CMD", "Command poller stopped");
        }
    }

    function cleanupAll() {
        dbg("CLEANUP", "Starting full cleanup...");

        // 1. Clear all timers via TimerManager
        timerManager.clearAll();
        userInputReactor.stop();

        // 2. Clear legacy intervals (during migration period)
        clearAllButtonPolls();
        clearAllThinking();
        stopWaitingForCard();
        stopProlongScanner();
        stopAutoScroll();
        cancelGenericTimer();
        stopDomChangeCounter();
        if (critErrorTimer) {
            clearInterval(critErrorTimer);
            critErrorTimer = null;
        }
        if (genericDisplayInt) {
            timerManager.delete(genericDisplayInt);
            genericDisplayInt = null;
        }

        // 3. Clear state collections
        processedButtons = new WeakSet();
        stuckTimers = new WeakMap();
        clickedProlongBtns = new WeakSet();
        thinkingTimers.clear();
        overlayEntries.clear();

        // 4. Reset flags
        isReloading = false;
        pendingReloadId = null;
        waitingForCardStart = null;
        genericStartTime = null;
        wasInStartVoice = false;
        lastSnapshot = null;
        stuckUiHypothesisActive = null;
        stuckUiHypothesisFiredAt = null;
        stopCommandPoller();

        // 5. Cancel pending checks
        if (checkTimeout) {
            clearTimeout(checkTimeout);
            checkTimeout = null;
        }
        if (checkDebounceTimer) {
            clearTimeout(checkDebounceTimer);
            checkDebounceTimer = null;
        }
        checkScheduled = false;

        // 6. Cleanup dashboard
        if (typeof dashboard !== "undefined" && dashboard.visible) {
            dashboard.hide();
        }

        dbg("CLEANUP", "All state cleared");
    }

    // ============================
    // INIT
    // ============================

    function init() {
        dbg("INIT", "=== v9 Enhanced userscript starting (v16.1) ===");
        dbg(
            "INIT",
            `Config: GENERIC_RELOAD=${GENERIC_RELOAD_INTERVAL}s THINKING=${THINKING_COUNTDOWN_SECS}s WAIT-CARD=${WAITING_FOR_CARD_TIMEOUT}s STUCK=${STUCK_THRESHOLD}s`,
        );
        dbg(
            "INIT",
            `Timer priority: longer timer always prevails over shorter ones`,
        );
        dbg(
            "INIT",
            `Auto-scroll: enabled, interval=${SCROLL_INTERVAL}ms, behavior=${SCROLL_BEHAVIOR}`,
        );
        dbg("INIT", `Whitelist: [${WHITELIST.join(", ")}]`);
        dbg("INIT", `Prolong labels: [${PROLONG_LABELS.join(", ")}]`);
        dbg(
            "INIT",
            `New features: TimerManager, Event Telemetry, Observability Dashboard (Alt+D), Precondition Validation, Mutation Debouncing`,
        );

        // Check for reload continuity — resume session if this page load was triggered by the script
        const pendingContinue = sessionManager.checkPendingContinue();
        if (pendingContinue) {
            activeSessionId = pendingContinue.sessionId;
            isPaused = false; // Will be visually applied after createOverlay
            dbg("INIT", `Reload-continue: resuming session ${activeSessionId}`);
            sessionManager.recordEvent("resume", { reason: "reload-continue" });

            // False-positive reload detection:
            // If this reload-continue produces no button click within FALSE_POSITIVE_WINDOW_MS,
            // the reload likely didn't fix anything (UI bug didn't reproduce → false positive).
            const fpSessionId = pendingContinue.sessionId;
            setTimeout(() => {
                if (activeSessionId !== fpSessionId) return; // session changed
                if (isPaused) return; // user manually paused — inconclusive
                const totalClicks = telemetry.stats.clicks.prolong
                    + telemetry.stats.clicks.expand
                    + telemetry.stats.clicks.safe;
                if (totalClicks === 0) {
                    const secs = Math.round(FALSE_POSITIVE_WINDOW_MS / 1000);
                    dbgWarn("INIT", `False-positive reload: no button click in ${secs}s after reload-continue`);
                    sessionManager.recordFalsePositiveReload();
                    setE("fp-reload", `⚠️ Reload may have been a false positive (no action in ${secs}s)`, "#fbbf24");
                    setTimeout(() => delE("fp-reload"), 6000);
                } else {
                    const secs = Math.round(FALSE_POSITIVE_WINDOW_MS / 1000);
                    dbg("INIT", `Reload-continue confirmed useful — ${totalClicks} click(s) in ${secs}s window`);
                }
            }, FALSE_POSITIVE_WINDOW_MS);
        }

        injectStyles();
        createOverlay();
        api.startHealthPolling(); // probe localhost API; retries every 30s
        // If a session was resumed on reload, start polling for commands immediately
        if (activeSessionId) startCommandPoller();
        api.loadConfig((cfg) => {
            if (Array.isArray(cfg.WHITELIST))             WHITELIST             = cfg.WHITELIST;
            if (Array.isArray(cfg.BLACKLIST))             BLACKLIST             = cfg.BLACKLIST;
            if (Array.isArray(cfg.PROLONG_LABELS))        PROLONG_LABELS        = cfg.PROLONG_LABELS;
            if (typeof cfg.GENERIC_RELOAD_INTERVAL === "number") GENERIC_RELOAD_INTERVAL = cfg.GENERIC_RELOAD_INTERVAL;
            if (typeof cfg.THINKING_COUNTDOWN_SECS  === "number") THINKING_COUNTDOWN_SECS  = cfg.THINKING_COUNTDOWN_SECS;
            if (typeof cfg.WAITING_FOR_CARD_TIMEOUT  === "number") WAITING_FOR_CARD_TIMEOUT  = cfg.WAITING_FOR_CARD_TIMEOUT;
            if (typeof cfg.STUCK_THRESHOLD           === "number") STUCK_THRESHOLD           = cfg.STUCK_THRESHOLD;
            if (typeof cfg.NO_CHANGE_RELOAD_SECS     === "number") NO_CHANGE_RELOAD_SECS     = cfg.NO_CHANGE_RELOAD_SECS;
            if (typeof cfg.REQUIRED_STABLE_MS        === "number") REQUIRED_STABLE_MS        = cfg.REQUIRED_STABLE_MS;
            if (typeof cfg.FALSE_POSITIVE_WINDOW_MS  === "number") FALSE_POSITIVE_WINDOW_MS  = cfg.FALSE_POSITIVE_WINDOW_MS;
            if (typeof cfg.RAPID_RELOAD_MAX          === "number") RAPID_RELOAD_MAX          = cfg.RAPID_RELOAD_MAX;
            if (Array.isArray(cfg.STUCK_UI_HYPOTHESIS_PATTERNS)) STUCK_UI_HYPOTHESIS_PATTERNS = cfg.STUCK_UI_HYPOTHESIS_PATTERNS;
            if (Array.isArray(cfg.PATIENT_UI_PATTERNS))           PATIENT_UI_PATTERNS           = cfg.PATIENT_UI_PATTERNS;
            if (typeof cfg.COMMAND_POLL_INTERVAL === "number")    COMMAND_POLL_INTERVAL         = cfg.COMMAND_POLL_INTERVAL;
        });

        // Apply initial play button state (paused by default unless reload-continue)
        if (!isPaused) {
            const pb = document.getElementById("tm-overlay-play-btn");
            if (pb) {
                pb.textContent = "⏸  Pause";
                pb.style.background = "rgba(245,158,11,0.15)";
                pb.style.border = "1px solid rgba(245,158,11,0.35)";
                pb.style.color = "#f59e0b";
            }
        }

        // Register built-in user-input reactions
        userInputReactor.on("required", () => {
            if (isPaused) return;
            const btn = document.getElementById("composer-submit-button");
            const detectedBy = btn?.getAttribute("aria-label") === "Send prompt"
                ? "send-prompt" : "start-voice";
            sessionManager.recordEvent("user-input-required", { detectedBy });
            dbgWarn("INPUT-DETECT", `User input required (${detectedBy}) — querying action`);

            api.fetchUserInputAction(activeSessionId, ({ action, text }) => {
                if (isPaused) return; // paused between query and callback
                dbg("INPUT-DETECT", `user-input-required action: ${action}${text ? ` ("${text}")` : ""}`);
                const actionLabel = text ? `${action}: "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}"` : action;
                if (action === "ignore") {
                    dbg("INPUT-DETECT", "Action=ignore — staying running");
                    setE("user-input", `👤 Input detected — remote action: ${actionLabel}`, "#94a3b8");
                } else if (action === "alert") {
                    setPaused(true, "user-input-required");
                    setE("user-input", `👤 ${text || "Waiting for your input"} — press ▶ to resume`, "#f59e0b");
                } else if (action === "fill-prompt" || action === "fill-prompt-draft") {
                    if (fillComposer(text || "")) {
                        if (action === "fill-prompt") {
                            setTimeout(() => {
                                const sendBtn = document.getElementById("composer-submit-button");
                                if (sendBtn) sendBtn.click();
                            }, 600);
                        }
                        sessionManager.recordEvent("fill-prompt", { action, text });
                        setE("user-input", `⚡ ${actionLabel}`, "#4ade80");
                        dbg("INPUT-DETECT", `Filled composer: "${(text || "").slice(0, 60)}"`);
                    } else {
                        dbgWarn("INPUT-DETECT", "fill-prompt: composer not found, falling back to pause");
                        setPaused(true, "user-input-required");
                        setE("user-input", "👤 Waiting for your input — press ▶ to resume", "#f59e0b");
                    }
                } else {
                    // "pause" (default) or any unknown action
                    setPaused(true, "user-input-required");
                    setE("user-input", `👤 Waiting for your input — remote action: ${actionLabel} — press ▶ to resume`, "#f59e0b");
                }
            });
        });

        const lastRetry = getLastRetryTime();
        if (Date.now() - lastRetry > 120000) {
            resetRetryCount();
        }
        dbg("INIT", `Retry count from session: ${getRetryCount()}`);

        // 1. MutationObserver (Primary driver when tab is active)
        const observer = new MutationObserver((mutations) => {
            if (isReloading || isPaused) return;
            // Log significant DOM mutations for debugging
            if (DBG) {
                let significantChanges = 0;
                for (const m of mutations) {
                    if (m.addedNodes.length > 2 || m.removedNodes.length > 2)
                        significantChanges++;
                }
                if (significantChanges > 0) {
                    dbg(
                        "MUTATION",
                        `${significantChanges} significant mutation(s) detected (${mutations.length} total)`,
                    );
                }
            }
            scheduleCheck();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        dbg("INIT", "MutationObserver attached to document.body");

        // 2. Fallback Interval (Keeps script alive even if DOM freezes in background tabs)
        setInterval(() => {
            if (isReloading || isPaused) return;
            dbg("FALLBACK", "Fallback poll triggered");
            scheduleCheck();
        }, FALLBACK_POLL_INTERVAL);
        dbg("INIT", `Fallback interval set: ${FALLBACK_POLL_INTERVAL}ms`);

        // 3. Visibility Change Handler (pauses display updates when hidden)
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                dbg("VISIBILITY", "Tab visible — resuming, triggering check");
                dbgSnapshot("tab-visible");
                scheduleCheck();
                // Scroll when switching back
                setTimeout(scrollToBottom, 300);
            } else {
                // Pause display updates to save resources
                timerManager.clearByType("display");
                dbg("VISIBILITY", "Tab hidden — paused display timers");
            }
        });

        // 4. Start prolong button scanner (only when active)
        if (!isPaused) startProlongScanner();

        // 5. Start auto-scroll (only when active)
        if (!isPaused) startAutoScroll();

        // 4b. Start user input detector (only when active)
        if (!isPaused) { userInputReactor.reset(); userInputReactor.start(); }

        // 6. Error event listener — catch uncaught errors for debugging
        window.addEventListener("error", (e) => {
            const errorMsg = `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
            dbgError("WINDOW-ERROR", errorMsg);
            telemetry.recordError("window-error", errorMsg);
        });
        window.addEventListener("unhandledrejection", (e) => {
            const rejectMsg = `Unhandled rejection: ${e.reason}`;
            dbgError("PROMISE-REJECT", rejectMsg);
            telemetry.recordError("promise-reject", rejectMsg);
        });

        // 7. Beforeunload handler — cleanup on page exit
        window.addEventListener("beforeunload", () => {
            cleanupAll();
            dbg("CLEANUP", "Before unload: cleanup complete");
        });

        if (!isPaused) {
            setTimeout(() => {
                dbg("INIT", "Running initial checkDOM after 1.5s delay");
                checkDOM();
                scrollToBottom();
            }, 1500);
            recordActivity();
            startDomChangeCounter();
        }

        dbg("INIT", "=== Initialization complete ===");
    }

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init);
})();
