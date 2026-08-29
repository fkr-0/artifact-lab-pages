import { OrcaOrchestrationEngine } from './orchestration-core.js';

const NODE_ID_KEY = 'orca-orchestrator-node-id';

function fallbackStorage() {
  return {
    getItem() { return null; },
    setItem() {},
  };
}

function storage(target) {
  try {
    return target?.localStorage || fallbackStorage();
  } catch (_) {
    return fallbackStorage();
  }
}

function nodeId(store, random) {
  let id = store.getItem(NODE_ID_KEY);
  if (!id) {
    id = `orca-${random().toString(36).slice(2, 10)}`;
    store.setItem(NODE_ID_KEY, id);
  }
  return id;
}

function currentName(target, store, id) {
  return (
    target.OrcaLegacyNet?.myName ||
    store.getItem('orca-name') ||
    `Orca-${id.slice(-4)}`
  );
}

export function bootstrapOrcaOrchestration({
  target = typeof window !== 'undefined' ? window : null,
  Engine = OrcaOrchestrationEngine,
  random = Math.random,
} = {}) {
  if (!target) return null;

  const store = storage(target);
  const resolvedNodeId = nodeId(store, random);
  const transport = target.OrcaSharedPeernet?.createTransport?.({
    namespace: 'orca-orchestration-v1',
    hubId: 'orca-orchestration-v1-hub',
    username: currentName(target, store, resolvedNodeId),
    color: '#00f0ff',
    channel: 'orca-orchestration',
    ownsCore: false,
  });

  const engine = new Engine({
    nodeId: resolvedNodeId,
    transport: transport || null,
    capabilities: ['peer-discovery', 'session-negotiation', 'task-distribution'],
  });

  engine.registerTaskHandler('orca:ping', async (payload, context) => ({
    ok: true,
    nodeId: engine.nodeId,
    payload,
    taskId: context.taskId,
    sessionId: engine.activeSessionId || null,
    legacySessionCode: target.OrcaLegacyNet?.sessionCode || null,
  }));

  engine.on('error', ({ error, phase, event }) => {
    const logger = target.console || globalThis.console;
    logger?.warn?.('[OrcaOrchestrator]', phase || event || 'runtime', error);
  });

  const handleLegacySession = (event) => {
    const detail = event.detail || {};
    const code = String(detail.code || '').trim().toUpperCase();
    const sessionId = code ? `orca:${code}` : '';

    if (detail.name && target.OrcaSharedPeernet?.core?.setIdentity) {
      target.OrcaSharedPeernet.core.setIdentity({ username: detail.name });
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
  };

  const handlePageHide = () => {
    engine.stop({ stopTransport: false });
  };

  target.addEventListener('orca:legacy-session', handleLegacySession);
  target.addEventListener('pagehide', handlePageHide);
  engine.start();
  target.OrcaOrchestrator = engine;

  return {
    engine,
    transport: transport || null,
    dispose({ stopTransport = false } = {}) {
      target.removeEventListener('orca:legacy-session', handleLegacySession);
      target.removeEventListener('pagehide', handlePageHide);
      engine.stop({ stopTransport });
      if (target.OrcaOrchestrator === engine) delete target.OrcaOrchestrator;
    },
  };
}

if (typeof window !== 'undefined') {
  bootstrapOrcaOrchestration();
}
