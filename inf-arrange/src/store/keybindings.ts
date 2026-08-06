import {
  DEFAULT_KEYBOARD_BINDINGS,
  DEFAULT_MOUSE_BINDINGS,
  KEYBINDINGS_VERSION,
} from "@/lib/keybindingDefaults";
import type { KeyBinding, MouseBinding } from "@/types/keybindings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KeybindingsState {
  /** Bumped when the default schema changes; mismatch triggers a reset. */
  version: number;
  mouse: MouseBinding[];
  keyboard: KeyBinding[];
  /** When true, the KeybindingsDialog is open. The global shortcut hook checks this. */
  dialogOpen: boolean;
  /** When set, the dialog is in capture mode for the given keyboard binding id. */
  capturingId: string | null;

  setDialogOpen: (open: boolean) => void;
  setCapturing: (id: string | null) => void;

  updateMouseBinding: (id: string, patch: Partial<MouseBinding>) => void;
  updateKeyBinding: (id: string, patch: Partial<KeyBinding>) => void;
  resetMouseToDefaults: () => void;
  resetKeyboardToDefaults: () => void;
  resetAllToDefaults: () => void;
}

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set) => ({
      version: KEYBINDINGS_VERSION,
      mouse: DEFAULT_MOUSE_BINDINGS,
      keyboard: DEFAULT_KEYBOARD_BINDINGS,
      dialogOpen: false,
      capturingId: null,

      setDialogOpen: (open) => set({ dialogOpen: open, capturingId: open ? null : null }),
      setCapturing: (id) => set({ capturingId: id }),

      updateMouseBinding: (id, patch) =>
        set((s) => ({
          mouse: s.mouse.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      updateKeyBinding: (id, patch) =>
        set((s) => ({
          keyboard: s.keyboard.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      resetMouseToDefaults: () => set({ mouse: DEFAULT_MOUSE_BINDINGS }),
      resetKeyboardToDefaults: () => set({ keyboard: DEFAULT_KEYBOARD_BINDINGS }),
      resetAllToDefaults: () =>
        set({
          mouse: DEFAULT_MOUSE_BINDINGS,
          keyboard: DEFAULT_KEYBOARD_BINDINGS,
          version: KEYBINDINGS_VERSION,
        }),
    }),
    {
      name: "canvas-studio:keybindings",
      version: KEYBINDINGS_VERSION,
      // On version mismatch, reset to defaults.
      migrate: () => ({
        version: KEYBINDINGS_VERSION,
        mouse: DEFAULT_MOUSE_BINDINGS,
        keyboard: DEFAULT_KEYBOARD_BINDINGS,
        dialogOpen: false,
        capturingId: null,
      }),
      partialize: (s) => ({
        version: s.version,
        mouse: s.mouse,
        keyboard: s.keyboard,
      }),
    },
  ),
);
