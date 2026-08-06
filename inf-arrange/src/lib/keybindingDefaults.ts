/**
 * Default keybindings, modelled on draw.io conventions:
 *
 * Mouse:
 *   Left click on item          → select
 *   Left click on empty canvas  → clear selection
 *   Left drag on item           → move
 *   Left drag on empty canvas   → marquee select
 *   Shift+Left click            → toggle in selection
 *   Ctrl/Cmd+Left click         → toggle in selection
 *   Shift+Left drag on item     → move constrained to dominant axis (H/V)
 *   Alt+Left drag on item       → duplicate-and-drag (alt+drag clones)
 *   Ctrl+Left drag on item      → resize (free)
 *   Ctrl+Shift+Left drag on item → crop
 *   Middle drag                 → pan canvas
 *   Right click                 → context menu
 *   Wheel                       → zoom (cursor-anchored)
 *
 * Keyboard: standard Ctrl+Z/Y/A/C/X/V/D, Ctrl+Shift+V for clipboard
 * history, arrows to nudge, Ctrl+[ / Ctrl+] for z-order, +/-/0/F for zoom,
 * Ctrl+Enter to edit text.
 */

import type { KeyBinding, MouseBinding } from "@/types/keybindings";

export const DEFAULT_MOUSE_BINDINGS: MouseBinding[] = [
  // ---- Selection ----
  {
    id: "m-click-item",
    action: "select",
    button: "left",
    dragType: "click",
    modifiers: {},
    context: "item",
    category: "Selection",
    label: "Click item",
    description: "Select a single item (replaces current selection)",
  },
  {
    id: "m-click-canvas",
    action: "clear-selection",
    button: "left",
    dragType: "click",
    modifiers: {},
    context: "canvas",
    category: "Selection",
    label: "Click empty canvas",
    description: "Deselect everything",
  },
  {
    id: "m-shift-click",
    action: "toggle-selection",
    button: "left",
    dragType: "click",
    modifiers: { shift: true },
    context: "any",
    category: "Selection",
    label: "Shift+click",
    description: "Add/remove item from selection",
  },
  {
    id: "m-ctrl-click",
    action: "toggle-selection",
    button: "left",
    dragType: "click",
    modifiers: { ctrl: true },
    context: "any",
    category: "Selection",
    label: "Ctrl/Cmd+click",
    description: "Add/remove item from selection",
  },
  {
    id: "m-drag-canvas",
    action: "marquee-select",
    button: "left",
    dragType: "drag",
    modifiers: {},
    context: "canvas",
    category: "Selection",
    label: "Drag on empty canvas",
    description: "Rubber-band select all intersected items",
  },

  // ---- Manipulation ----
  {
    id: "m-drag-item",
    action: "move",
    button: "left",
    dragType: "drag",
    modifiers: {},
    context: "item",
    category: "Manipulation",
    label: "Drag item",
    description: "Move the selected item(s)",
  },
  {
    id: "m-shift-drag-item",
    action: "constrain-axis",
    button: "left",
    dragType: "drag",
    modifiers: { shift: true },
    context: "item",
    category: "Manipulation",
    label: "Shift+drag item",
    description: "Move constrained to horizontal / vertical / 45° axis",
  },
  {
    id: "m-alt-drag-item",
    action: "duplicate-drag",
    button: "left",
    dragType: "drag",
    modifiers: { alt: true },
    context: "item",
    category: "Manipulation",
    label: "Alt+drag item",
    description: "Duplicate the item and drag the copy (draw.io alt+drag)",
  },
  {
    id: "m-ctrl-drag-item",
    action: "resize",
    button: "left",
    dragType: "drag",
    modifiers: { ctrl: true },
    context: "item",
    category: "Manipulation",
    label: "Ctrl+drag item",
    description: "Resize from south-east corner",
  },
  {
    id: "m-ctrl-shift-drag-item",
    action: "crop",
    button: "left",
    dragType: "drag",
    modifiers: { ctrl: true, shift: true },
    context: "image",
    category: "Manipulation",
    label: "Ctrl+Shift+drag image",
    description: "Crop the image to the dragged rectangle",
  },

  // ---- Navigation ----
  {
    id: "m-middle-drag",
    action: "pan",
    button: "middle",
    dragType: "drag",
    modifiers: {},
    context: "any",
    category: "Navigation",
    label: "Middle-drag",
    description: "Pan the canvas",
  },
  {
    id: "m-right-click",
    action: "context-menu",
    button: "right",
    dragType: "click",
    modifiers: {},
    context: "any",
    category: "Navigation",
    label: "Right click",
    description: "Open the context menu",
  },
  {
    id: "m-wheel",
    action: "pan",
    button: "left",
    dragType: "wheel",
    modifiers: {},
    context: "any",
    category: "Navigation",
    label: "Wheel",
    description: "Zoom anchored at cursor (handled by d3-zoom)",
  },
];

export const DEFAULT_KEYBOARD_BINDINGS: KeyBinding[] = [
  // ---- Edit ----
  {
    id: "k-undo",
    action: "undo",
    key: "z",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Undo",
  },
  {
    id: "k-redo",
    action: "redo",
    key: "z",
    modifiers: { ctrl: true, shift: true },
    category: "Edit",
    label: "Redo",
  },
  {
    id: "k-redo-alt",
    action: "redo",
    key: "y",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Redo (alt)",
  },
  {
    id: "k-copy",
    action: "copy",
    key: "c",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Copy",
  },
  {
    id: "k-cut",
    action: "cut",
    key: "x",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Cut",
  },
  {
    id: "k-paste",
    action: "paste",
    key: "v",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Paste latest",
    description:
      "Normal browser-style paste: OS clipboard first, latest internal canvas clip as fallback",
  },
  {
    id: "k-paste-history",
    action: "paste-history",
    key: "v",
    modifiers: { ctrl: true, shift: true },
    category: "Edit",
    label: "Paste from clipboard history",
    description: "Open the Canvas Studio clipboard stack; press A S D F H J K L to paste a clip",
  },
  {
    id: "k-duplicate",
    action: "duplicate",
    key: "d",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Duplicate",
  },
  {
    id: "k-delete",
    action: "delete",
    key: "Delete",
    modifiers: {},
    category: "Edit",
    label: "Delete",
  },
  {
    id: "k-delete-alt",
    action: "delete",
    key: "Backspace",
    modifiers: {},
    category: "Edit",
    label: "Delete (alt)",
  },
  {
    id: "k-edit-text",
    action: "edit-text",
    key: "Enter",
    modifiers: { ctrl: true },
    category: "Edit",
    label: "Edit selected text",
    description: "Starts inline editing when a text block is selected",
  },

  // ---- Selection ----
  {
    id: "k-select-all",
    action: "select-all",
    key: "a",
    modifiers: { ctrl: true },
    category: "Selection",
    label: "Select all",
  },
  {
    id: "k-escape",
    action: "clear-selection",
    key: "Escape",
    modifiers: {},
    category: "Selection",
    label: "Clear selection",
  },

  // ---- Nudge ----
  {
    id: "k-nudge-left",
    action: "nudge-small",
    key: "ArrowLeft",
    modifiers: {},
    category: "Nudge",
    label: "Nudge left (1 px)",
  },
  {
    id: "k-nudge-right",
    action: "nudge-small",
    key: "ArrowRight",
    modifiers: {},
    category: "Nudge",
    label: "Nudge right (1 px)",
  },
  {
    id: "k-nudge-up",
    action: "nudge-small",
    key: "ArrowUp",
    modifiers: {},
    category: "Nudge",
    label: "Nudge up (1 px)",
  },
  {
    id: "k-nudge-down",
    action: "nudge-small",
    key: "ArrowDown",
    modifiers: {},
    category: "Nudge",
    label: "Nudge down (1 px)",
  },
  {
    id: "k-nudge-left-large",
    action: "nudge-large",
    key: "ArrowLeft",
    modifiers: { shift: true },
    category: "Nudge",
    label: "Nudge left (10 px)",
  },
  {
    id: "k-nudge-right-large",
    action: "nudge-large",
    key: "ArrowRight",
    modifiers: { shift: true },
    category: "Nudge",
    label: "Nudge right (10 px)",
  },
  {
    id: "k-nudge-up-large",
    action: "nudge-large",
    key: "ArrowUp",
    modifiers: { shift: true },
    category: "Nudge",
    label: "Nudge up (10 px)",
  },
  {
    id: "k-nudge-down-large",
    action: "nudge-large",
    key: "ArrowDown",
    modifiers: { shift: true },
    category: "Nudge",
    label: "Nudge down (10 px)",
  },

  // ---- Z-Order ----
  {
    id: "k-bring-forward",
    action: "bring-forward",
    key: "]",
    modifiers: { ctrl: true },
    category: "Z-Order",
    label: "Bring forward",
    description: "Move selection one layer forward",
  },
  {
    id: "k-send-backward",
    action: "send-backward",
    key: "[",
    modifiers: { ctrl: true },
    category: "Z-Order",
    label: "Send backward",
    description: "Move selection one layer backward",
  },
  {
    id: "k-bring-front",
    action: "bring-front",
    key: "]",
    modifiers: { ctrl: true, shift: true },
    category: "Z-Order",
    label: "Bring to front",
    description: "Move selection above everything else",
  },
  {
    id: "k-send-back",
    action: "send-back",
    key: "[",
    modifiers: { ctrl: true, shift: true },
    category: "Z-Order",
    label: "Send to back",
    description: "Move selection behind everything else",
  },

  // ---- View ----
  {
    id: "k-zoom-in",
    action: "zoom-in",
    key: "=",
    modifiers: {},
    category: "View",
    label: "Zoom in",
  },
  {
    id: "k-zoom-in-alt",
    action: "zoom-in",
    key: "+",
    modifiers: {},
    category: "View",
    label: "Zoom in (alt)",
  },
  {
    id: "k-zoom-in-ctrl",
    action: "zoom-in",
    key: "=",
    modifiers: { ctrl: true },
    category: "View",
    label: "Zoom in (Ctrl)",
    description: "Browser/editor-style zoom-in shortcut",
  },
  {
    id: "k-zoom-out",
    action: "zoom-out",
    key: "-",
    modifiers: {},
    category: "View",
    label: "Zoom out",
  },
  {
    id: "k-zoom-out-ctrl",
    action: "zoom-out",
    key: "-",
    modifiers: { ctrl: true },
    category: "View",
    label: "Zoom out (Ctrl)",
    description: "Browser/editor-style zoom-out shortcut",
  },
  {
    id: "k-zoom-reset",
    action: "zoom-reset",
    key: "0",
    modifiers: { ctrl: true },
    category: "View",
    label: "Reset zoom",
  },
  {
    id: "k-zoom-fit",
    action: "zoom-fit",
    key: "f",
    modifiers: {},
    category: "View",
    label: "Zoom to fit",
  },
];

export const KEYBINDINGS_VERSION = 2;
