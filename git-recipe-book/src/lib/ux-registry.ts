import type { IUXRegistry, IUXFlow, IUXAction, IComponentOverride, ComponentSlot, UXTrigger } from './interfaces';

// ─── UX Registry Implementation ──────────────────────────────────────────────

export class UXRegistry implements IUXRegistry {
  private flows: Map<string, IUXFlow> = new Map();
  private overrides: Map<ComponentSlot, IComponentOverride[]> = new Map();
  private actionListeners: Set<(action: IUXAction) => void> = new Set();

  registerFlow(flow: IUXFlow): void {
    this.flows.set(flow.id, flow);
  }

  unregisterFlow(id: string): void {
    this.flows.delete(id);
  }

  getFlowsForTrigger(trigger: UXTrigger): IUXFlow[] {
    return Array.from(this.flows.values()).filter((f) => f.trigger === trigger);
  }

  registerOverride(override: IComponentOverride): void {
    const slot = override.slot;
    if (!this.overrides.has(slot)) {
      this.overrides.set(slot, []);
    }
    const existing = this.overrides.get(slot)!;
    // Replace if same slot+component type exists
    const idx = existing.findIndex((o) => o.component === override.component);
    if (idx >= 0) {
      existing[idx] = override;
    } else {
      existing.push(override);
    }
    // Sort by priority (highest first)
    existing.sort((a, b) => b.priority - a.priority);
  }

  unregisterOverride(slot: ComponentSlot, _componentId: string): void {
    const list = this.overrides.get(slot);
    if (list) {
      this.overrides.set(slot, list.filter((o) => o.slot !== slot));
    }
  }

  getOverrideForSlot(slot: ComponentSlot, state: Record<string, unknown>): IComponentOverride | undefined {
    const list = this.overrides.get(slot);
    if (!list || list.length === 0) return undefined;
    // Return the highest-priority override whose condition is met
    return list.find((o) => !o.condition || o.condition(state));
  }

  dispatch(action: IUXAction): void {
    for (const cb of this.actionListeners) {
      cb(action);
    }
  }

  onAction(callback: (action: IUXAction) => void): () => void {
    this.actionListeners.add(callback);
    return () => this.actionListeners.delete(callback);
  }
}
