import { matchKeyBinding } from "@/lib/keybindingMatchers";
import { type CanvasStore, useCanvasStoreApi } from "@/store/canvas";
import { useKeybindingsStore } from "@/store/keybindings";
import type { ActionId } from "@/types/keybindings";
import { useEffect } from "react";
import { isEditableTarget } from "./useGlobalPaste";

/** Dispatch a keyboard action. Returns true if handled. */
function dispatchAction(action: ActionId, canvasStore: CanvasStore): boolean {
  const store = canvasStore.getState();
  const sel = store.selection;

  switch (action) {
    case "undo":
      store.undo();
      return true;
    case "redo":
      store.redo();
      return true;
    case "select-all":
      store.selectAll();
      return true;
    case "clear-selection":
      store.clearSelection();
      // Also exit text editing if active.
      if (store.editingId) store.setEditingId(null);
      return true;
    case "copy":
      if (sel.length > 0) {
        store.copySelection();
        return true;
      }
      return false;
    case "cut":
      if (sel.length > 0) {
        store.cutSelection();
        return true;
      }
      return false;
    case "paste":
      store.paste();
      return true;
    case "paste-history":
      window.dispatchEvent(new Event("cs:clipboard-history"));
      return true;
    case "duplicate":
      if (sel.length > 0) {
        store.duplicateSelection();
        return true;
      }
      return false;
    case "delete":
      if (sel.length > 0) {
        store.removeItems(sel);
        return true;
      }
      return false;
    case "nudge-small":
    case "nudge-large": {
      if (sel.length === 0) return false;
      // Read the actual key from the event for direction (handled by caller).
      return true;
    }
    case "bring-front":
      if (sel.length > 0) {
        store.bringToFront(sel[sel.length - 1]);
        return true;
      }
      return false;
    case "send-back":
      if (sel.length > 0) {
        store.sendToBack(sel[sel.length - 1]);
        return true;
      }
      return false;
    case "bring-forward":
      if (sel.length > 0) {
        store.bringForward(sel[sel.length - 1]);
        return true;
      }
      return false;
    case "send-backward":
      if (sel.length > 0) {
        store.sendBackward(sel[sel.length - 1]);
        return true;
      }
      return false;
    case "zoom-in":
      window.dispatchEvent(new Event("cs:zoom-in"));
      return true;
    case "zoom-out":
      window.dispatchEvent(new Event("cs:zoom-out"));
      return true;
    case "zoom-reset":
      window.dispatchEvent(new Event("cs:zoom-reset"));
      return true;
    case "zoom-fit":
      window.dispatchEvent(new Event("cs:zoom-fit"));
      return true;
    case "edit-text": {
      if (sel.length !== 1) return false;
      const item = store.items.find((it) => it.id === sel[0]);
      if (item?.type === "text") {
        store.setEditingId(item.id);
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

export function useShortcuts() {
  const canvasStore = useCanvasStoreApi();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If the keybindings dialog is open, the dialog handles its own key
      // capture (for rebind). Skip the global dispatcher.
      if (useKeybindingsStore.getState().dialogOpen) return;

      // If a text block is being edited, the contentEditable handles its own
      // keys; only Escape exits edit mode.
      const editingId = canvasStore.getState().editingId;
      if (editingId) {
        if (e.key === "Escape") {
          canvasStore.getState().setEditingId(null);
          e.preventDefault();
        }
        return;
      }

      // Allow text editing in inputs / textareas to take over shortcuts.
      if (isEditableTarget(e.target)) {
        if (e.key === "Escape" && e.target instanceof HTMLElement) {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const bindings = useKeybindingsStore.getState().keyboard;
      const match = matchKeyBinding(bindings, e);
      if (!match) return;

      // Let the real browser paste event run so we can inspect DataTransfer
      // payloads first (images, HTML/text, or our custom Canvas Studio MIME).
      // The paste hook falls back to the internal clipboard if no OS payload is
      // usable. Preventing default here makes Ctrl+V unreliable across browsers.
      if (match.action === "paste") return;

      // Nudge actions need directional info from the key event.
      if (match.action === "nudge-small" || match.action === "nudge-large") {
        const store = canvasStore.getState();
        if (store.selection.length === 0) return;
        e.preventDefault();
        const step = match.action === "nudge-large" ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        store._pushHistory();
        store.updateItems(store.selection, (it) => ({
          x: it.x + dx,
          y: it.y + dy,
        }));
        return;
      }

      e.preventDefault();
      dispatchAction(match.action, canvasStore);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvasStore]);
}
