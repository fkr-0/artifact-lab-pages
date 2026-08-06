/**
 * Keybinding schema for Canvas Studio.
 *
 * Bindings are split into two kinds:
 *   - KeyBinding  : a keyboard shortcut (e.g. Ctrl+D → duplicate)
 *   - MouseBinding: a mouse gesture (e.g. Alt+Left-drag on item → duplicate-drag)
 *
 * Mouse bindings carry a `context` that distinguishes whether the gesture
 * starts on an item (image or text) or on empty canvas. The match logic
 * prefers the most specific context: `image`/`text` beats `item` beats `any`.
 */

export type MouseButton = "left" | "middle" | "right";
export type DragType = "click" | "drag" | "wheel";
export type BindingContext = "any" | "canvas" | "item" | "image" | "text";

export interface ModifierSet {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type ActionId =
  | "select"
  | "toggle-selection"
  | "clear-selection"
  | "marquee-select"
  | "move"
  | "resize"
  | "crop"
  | "duplicate-drag"
  | "constrain-axis"
  | "pan"
  | "context-menu"
  | "delete"
  | "duplicate"
  | "copy"
  | "cut"
  | "paste"
  | "paste-history"
  | "undo"
  | "redo"
  | "select-all"
  | "nudge-small"
  | "nudge-large"
  | "bring-front"
  | "send-back"
  | "bring-forward"
  | "send-backward"
  | "zoom-in"
  | "zoom-out"
  | "zoom-fit"
  | "zoom-reset"
  | "edit-text"
  | "none";

export interface KeyBinding {
  id: string;
  action: ActionId;
  /** KeyboardEvent.key value, e.g. "d", "Escape", "ArrowLeft". */
  key: string;
  modifiers: ModifierSet;
  category: string;
  label: string;
  description?: string;
}

export interface MouseBinding {
  id: string;
  action: ActionId;
  button: MouseButton;
  dragType: DragType;
  modifiers: ModifierSet;
  context: BindingContext;
  category: string;
  label: string;
  description?: string;
}

export const ACTION_LABELS: Record<ActionId, string> = {
  select: "Select",
  "toggle-selection": "Toggle in selection",
  "clear-selection": "Clear selection",
  "marquee-select": "Marquee select",
  move: "Move",
  resize: "Resize",
  crop: "Crop",
  "duplicate-drag": "Duplicate & drag",
  "constrain-axis": "Move (axis constrained)",
  pan: "Pan canvas",
  "context-menu": "Context menu",
  delete: "Delete",
  duplicate: "Duplicate",
  copy: "Copy",
  cut: "Cut",
  paste: "Paste",
  "paste-history": "Paste from history",
  undo: "Undo",
  redo: "Redo",
  "select-all": "Select all",
  "nudge-small": "Nudge (1 px)",
  "nudge-large": "Nudge (10 px)",
  "bring-front": "Bring to front",
  "send-back": "Send to back",
  "bring-forward": "Bring forward",
  "send-backward": "Send backward",
  "zoom-in": "Zoom in",
  "zoom-out": "Zoom out",
  "zoom-fit": "Zoom to fit",
  "zoom-reset": "Reset zoom",
  "edit-text": "Edit selected text",
  none: "— (no action)",
};

export const ALL_ACTIONS: ActionId[] = Object.keys(ACTION_LABELS) as ActionId[];

export const CONTEXT_LABELS: Record<BindingContext, string> = {
  any: "Any",
  canvas: "Empty canvas",
  item: "Any item",
  image: "Image",
  text: "Text block",
};
