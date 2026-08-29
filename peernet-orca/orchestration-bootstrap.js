import { OrcaOrchestrationEngine } from './orchestration-core.js';

const NODE_ID_KEY = 'orca-orchestrator-node-id';

function storage() {
  return window.localStorage || {
    getItem() { return null; },
    setItem() {},
  };
}

function nodeId() {
  let id = storage().getItem(NODE_ID_KEY);
  if (!id) {
    id = `orca-${Math.random().toString(36).slice(2, 10)}`;
    storage().setItem(NODE_ID_KEY, id);
  }
  return id;
}

function currentName() {
  return (
    window.OrcaLegacyNet?.myName ||
    storage().getItem('orca-name') ||
    `Orca-${nodeId().slice(-4)}`
  );
}

const transport = window.OrcaSharedPeernet?.createTransport?.({
  namespace: 'orca-orchestration-v1',
  hubId: 'orca-orchestration-v1-hub',
  username: currentName(),
  color: '#00f0ff',
  channel: 'orca-orchestration',
  ownsCore: false,
});

const engine = new OrcaOrchestrationEngine({
  nodeId: nodeId(),
  transport: transport || null,
  capabilities: ['peer-discovery', 'session-negotiation', 'task-distribution'],
});

engine.registerTaskHandler('orca:ping', async (payload, context) => ({
  ok: true,
  nodeId: engine.nodeId,
  payload,
  taskId: context.taskId,
  sessionId: engine.activeSessionId || null,
  legacySessionCode: window.OrcaLegacyNet?.sessionCode || null,
}));

engine.on('error', ({ error, phase, event }) => {
  console.warn('[OrcaOrchestrator]', phase || event || 'runtime', error);
});

window.addEventListener('orca:legacy-session', (event) => {
  const detail = event.detail || {};
  const code = String(detail.code || '').trim().toUpperCase();
  const sessionId = code ? `orca:${code}` : '';

  if (detail.name && window.OrcaSharedPeernet?.core?.setIdentity) {
    window.OrcaSharedPeernet.core.setIdentity({ username: detail.name });
  }

  if (detail.phase === 'connected' && sessionId) {
    if (detail.role === 'host') {
      if (engine.activeSessionId && engine.activeSessionId !== sessionId) engine.leaveSession();
      if (engine.getSession(sessionId)?.ownerId !== engine.nodeId) {
        engine.openSession({
          id: sessionId,
          title: `VAPOR·ORCA ${code}`,
          metadata: { legacySessionCode: code, legacyRoom: true },
        });
      }
    } else {
      if (engine.activeSessionId && engine.activeSessionId !== sessionId) engine.leaveSession();
      if (engine.activeSessionId !== sessionId) {
        engine.requestSession(sessionId, {
          title: `VAPOR·ORCA ${code}`,
          metadata: { legacySessionCode: code, legacyRoom: true },
        });
      }
    }
  }

  if (detail.phase === 'disconnected' && engine.activeSessionId) {
    engine.leaveSession();
  }
});

engine.start();
window.OrcaOrchestrator = engine;

window.addEventListener('pagehide', () => {
  engine.stop({ stopTransport: false });
});
