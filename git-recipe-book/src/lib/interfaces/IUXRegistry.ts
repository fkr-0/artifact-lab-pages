// ─── UX Registry Interface ───────────────────────────────────────────────────
//
// Extensible UX system for customizing UI flows, component overrides,
// and interaction patterns. This allows lessons and plugins to influence
// the UI without directly modifying components.
//

import { ComponentType } from 'react';

// ─── UX Flow ─────────────────────────────────────────────────────────────────

export type UXTrigger = 'lesson-start' | 'lesson-step' | 'command-success' | 'command-error' | 'graph-click' | 'custom';

export interface IUXFlow {
  id: string;
  name: string;
  trigger: UXTrigger;
  steps: IUXStep[];
}

export interface IUXStep {
  id: string;
  /** CSS selector or data attribute to highlight */
  targetSelector?: string;
  /** Tooltip content to show */
  tooltip?: string;
  /** Position of tooltip relative to target */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Action to perform on the target */
  action?: 'click' | 'focus' | 'scroll-to' | 'pulse' | 'none';
  /** Whether to wait for user interaction before proceeding */
  waitForInteraction?: boolean;
  /** Optional delay before this step activates (ms) */
  delayMs?: number;
}

// ─── Component Override ──────────────────────────────────────────────────────

export type ComponentSlot =
  | 'sidebar-header'
  | 'sidebar-footer'
  | 'graph-overlay'
  | 'terminal-header'
  | 'terminal-welcome'
  | 'detail-panel'
  | 'top-bar-center'
  | 'top-bar-right'
  | string;

export interface IComponentOverride {
  slot: ComponentSlot;
  component: ComponentType<Record<string, unknown>>;
  /** Priority (higher = shown first when multiple overrides exist) */
  priority: number;
  /** Condition for this override to be active */
  condition?: (state: Record<string, unknown>) => boolean;
}

// ─── UX Action ───────────────────────────────────────────────────────────────

export type UXActionType =
  | 'show-toast'
  | 'highlight-element'
  | 'set-terminal-input'
  | 'focus-terminal'
  | 'scroll-graph-to'
  | 'show-help'
  | 'custom';

export interface IUXAction {
  type: UXActionType;
  payload: Record<string, unknown>;
}

// ─── UX Registry ─────────────────────────────────────────────────────────────

export interface IUXRegistry {
  /** Register a UX flow */
  registerFlow(flow: IUXFlow): void;

  /** Unregister a UX flow */
  unregisterFlow(id: string): void;

  /** Get all flows for a trigger */
  getFlowsForTrigger(trigger: UXTrigger): IUXFlow[];

  /** Register a component override */
  registerOverride(override: IComponentOverride): void;

  /** Unregister a component override */
  unregisterOverride(slot: ComponentSlot, componentId: string): void;

  /** Get the active override for a slot */
  getOverrideForSlot(slot: ComponentSlot, state: Record<string, unknown>): IComponentOverride | undefined;

  /** Dispatch a UX action */
  dispatch(action: IUXAction): void;

  /** Subscribe to UX actions */
  onAction(callback: (action: IUXAction) => void): () => void;
}
