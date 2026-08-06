import type {
  BindingContext,
  KeyBinding,
  ModifierSet,
  MouseBinding,
  MouseButton,
} from "@/types/keybindings";

/** ctrl/meta are treated identically (Mac uses Cmd). */
function modsMatch(
  mods: ModifierSet,
  e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean },
): boolean {
  const ctrlExpected = mods.ctrl ?? false;
  const ctrlActual = e.ctrlKey || e.metaKey;
  if (ctrlExpected !== ctrlActual) return false;
  if ((mods.shift ?? false) !== e.shiftKey) return false;
  if ((mods.alt ?? false) !== e.altKey) return false;
  return true;
}

const BUTTON_TO_NAME: Record<number, MouseButton> = {
  0: "left",
  1: "middle",
  2: "right",
};

export function buttonName(button: number): MouseButton | undefined {
  return BUTTON_TO_NAME[button];
}

/**
 * Specificity ordering: more specific contexts win. image/text > item > any.
 * Used to pick the winning binding when multiple match.
 */
const CONTEXT_RANK: Record<BindingContext, number> = {
  image: 4,
  text: 4,
  item: 3,
  canvas: 2,
  any: 1,
};

/**
 * Determine the gesture context from where the pointer landed.
 * `isItem` is true if the pointerdown target is inside an item element.
 * `itemType` is "image" or "text" if known.
 */
export function resolveContext(isItem: boolean, itemType?: "image" | "text"): BindingContext {
  if (!isItem) return "canvas";
  return itemType ?? "item";
}

/**
 * Find the best-matching mouse binding for a pointer event.
 * Returns the binding with the highest specificity among matches.
 */
export function matchMouseBinding(
  bindings: MouseBinding[],
  args: {
    button: MouseButton;
    dragType: "click" | "drag";
    context: BindingContext;
    e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean };
  },
): MouseBinding | undefined {
  const matches = bindings.filter(
    (b) =>
      b.button === args.button &&
      b.dragType === args.dragType &&
      modsMatch(b.modifiers, args.e) &&
      (b.context === "any" ||
        b.context === args.context ||
        // item-context bindings also match image/text
        (b.context === "item" && (args.context === "image" || args.context === "text"))),
  );
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => CONTEXT_RANK[b.context] - CONTEXT_RANK[a.context]);
  return matches[0];
}

/** Find the matching keyboard binding for a key event. */
export function matchKeyBinding(bindings: KeyBinding[], e: KeyboardEvent): KeyBinding | undefined {
  return bindings.find(
    (b) => b.key.toLowerCase() === e.key.toLowerCase() && modsMatch(b.modifiers, e),
  );
}

/** Format a modifier set for display. */
export function formatMods(mods: ModifierSet): string {
  const parts: string[] = [];
  if (mods.ctrl) parts.push("Ctrl");
  if (mods.shift) parts.push("Shift");
  if (mods.alt) parts.push("Alt");
  return parts.join("+");
}

/** Format a full key binding for display. */
export function formatKeyBinding(b: KeyBinding): string {
  const mods = formatMods(b.modifiers);
  // Pretty-print some common keys.
  const keyDisplay =
    b.key === " "
      ? "Space"
      : b.key === "ArrowLeft"
        ? "←"
        : b.key === "ArrowRight"
          ? "→"
          : b.key === "ArrowUp"
            ? "↑"
            : b.key === "ArrowDown"
              ? "↓"
              : b.key === "Delete"
                ? "Del"
                : b.key === "Escape"
                  ? "Esc"
                  : b.key === "Enter"
                    ? "↵"
                    : b.key.length === 1
                      ? b.key.toUpperCase()
                      : b.key;
  return mods ? `${mods}+${keyDisplay}` : keyDisplay;
}

/** Format a full mouse binding for display. */
export function formatMouseBinding(b: MouseBinding): string {
  const parts: string[] = [];
  const mods = formatMods(b.modifiers);
  if (mods) parts.push(mods);
  parts.push(b.button === "left" ? "L" : b.button === "middle" ? "M" : "R");
  if (b.dragType === "drag") parts.push("drag");
  if (b.dragType === "wheel") parts.push("wheel");
  if (b.context !== "any" && b.context !== "canvas") parts.push(`on ${b.context}`);
  if (b.context === "canvas") parts.push("on canvas");
  return parts.join(" ");
}

/**
 * Detect conflicts: two mouse bindings that would match the same gesture.
 * Returns pairs of conflicting binding ids.
 */
export function findMouseConflicts(bindings: MouseBinding[]): Array<[string, string]> {
  const conflicts: Array<[string, string]> = [];
  for (let i = 0; i < bindings.length; i++) {
    for (let j = i + 1; j < bindings.length; j++) {
      const a = bindings[i];
      const b = bindings[j];
      if (a.button !== b.button) continue;
      if (a.dragType !== b.dragType) continue;
      // Modifier sets must be exactly equal to conflict.
      const aCtrl = a.modifiers.ctrl ?? false;
      const aShift = a.modifiers.shift ?? false;
      const aAlt = a.modifiers.alt ?? false;
      const bCtrl = b.modifiers.ctrl ?? false;
      const bShift = b.modifiers.shift ?? false;
      const bAlt = b.modifiers.alt ?? false;
      if (aCtrl !== bCtrl || aShift !== bShift || aAlt !== bAlt) continue;
      // Context overlap?
      if (contextsOverlap(a.context, b.context)) {
        conflicts.push([a.id, b.id]);
      }
    }
  }
  return conflicts;
}

function contextsOverlap(a: BindingContext, b: BindingContext): boolean {
  if (a === b) return true;
  if (a === "any" || b === "any") return true;
  // image/text overlap with item
  if (a === "item" && (b === "image" || b === "text")) return true;
  if (b === "item" && (a === "image" || a === "text")) return true;
  return false;
}

/** Detect keyboard binding conflicts (same key + same modifiers). */
export function findKeyConflicts(bindings: KeyBinding[]): Array<[string, string]> {
  const conflicts: Array<[string, string]> = [];
  for (let i = 0; i < bindings.length; i++) {
    for (let j = i + 1; j < bindings.length; j++) {
      const a = bindings[i];
      const b = bindings[j];
      if (a.key.toLowerCase() !== b.key.toLowerCase()) continue;
      const aCtrl = a.modifiers.ctrl ?? false;
      const aShift = a.modifiers.shift ?? false;
      const aAlt = a.modifiers.alt ?? false;
      const bCtrl = b.modifiers.ctrl ?? false;
      const bShift = b.modifiers.shift ?? false;
      const bAlt = b.modifiers.alt ?? false;
      if (aCtrl === bCtrl && aShift === bShift && aAlt === bAlt) {
        conflicts.push([a.id, b.id]);
      }
    }
  }
  return conflicts;
}
