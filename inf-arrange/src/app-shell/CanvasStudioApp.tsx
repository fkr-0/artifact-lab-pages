import { CanvasStudio } from "@/canvas-react";
import { ContextMenu } from "@/components/ContextMenu";
import { Toolbar } from "@/components/Toolbar";
import type { Point } from "@/types";
import { AppShell, MantineProvider, createTheme } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import "@/styles.css";

const MediaManager = lazy(() =>
  import("@/components/MediaManager").then((module) => ({ default: module.MediaManager })),
);
const GraphPanel = lazy(() =>
  import("@/components/GraphPanel").then((module) => ({ default: module.GraphPanel })),
);
const KeybindingsDialog = lazy(() =>
  import("@/components/KeybindingsDialog").then((module) => ({
    default: module.KeybindingsDialog,
  })),
);

const theme = createTheme({
  primaryColor: "blue",
  primaryShade: { light: 6, dark: 5 },
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontSizes: { xs: "11px", sm: "13px", md: "14px", lg: "16px", xl: "20px" },
  defaultRadius: "md",
  components: {
    Button: { defaultProps: { size: "sm" } },
    ActionIcon: { defaultProps: { size: "sm" } },
  },
});

export function CanvasStudioApp() {
  const [ctxMenu, setCtxMenu] = useState<{ pos: Point; itemId: string | null } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);

  const onContextMenu = useCallback((pos: Point, itemId: string | null) => {
    setCtxMenu({ pos, itemId });
  }, []);

  // Prevent the browser context menu globally on the app surface.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest(".cs-canvas-surface") || target.closest(".cs-toolbar")) {
        e.preventDefault();
      }
    };
    window.addEventListener("contextmenu", handler);
    return () => window.removeEventListener("contextmenu", handler);
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-right" />
        <AppShell padding={0} header={{ height: 44 }} style={{ background: "var(--cs-bg)" }}>
          <AppShell.Header style={{ padding: 0, border: "none" }}>
            <Toolbar
              onOpenMediaManager={() => setMediaOpen(true)}
              onOpenKeybindings={() => setKbOpen(true)}
              onOpenGraphPanel={() => setGraphOpen(true)}
            />
          </AppShell.Header>

          <AppShell.Main style={{ padding: 0, position: "relative" }}>
            <CanvasStudio onContextMenu={onContextMenu} />

            {/* Hints */}
            <div className="cs-hints">
              <div>
                <b>Wheel</b> zoom · <b>middle-drag</b> pan · <b>drag empty</b> marquee select
              </div>
              <div>
                <kbd>Shift</kbd>+drag = constrain axis · <kbd>Alt</kbd>+drag = duplicate ·{" "}
                <kbd>Ctrl</kbd>+drag = resize · <kbd>Ctrl+Shift</kbd>+drag = crop
              </div>
              <div>
                <kbd>Ctrl</kbd>+<kbd>Z</kbd>/<kbd>Y</kbd> undo/redo · <kbd>F</kbd> fit ·{" "}
                <kbd>Ctrl</kbd>+<kbd>0</kbd> reset · <kbd>Del</kbd> delete · <kbd>Ctrl</kbd>+
                <kbd>D</kbd> duplicate
              </div>
              <div>
                <kbd>Ctrl</kbd>+<kbd>V</kbd> paste latest · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+
                <kbd>V</kbd> clip stack · drop files · double-click text to edit · click{" "}
                <b>⌨ Keybindings</b> to rebind
              </div>
            </div>
          </AppShell.Main>
        </AppShell>

        <ContextMenu
          pos={ctxMenu?.pos ?? null}
          itemId={ctxMenu?.itemId ?? null}
          onClose={() => setCtxMenu(null)}
        />

        <Suspense fallback={null}>
          <MediaManager opened={mediaOpen} onClose={() => setMediaOpen(false)} />
          <GraphPanel opened={graphOpen} onClose={() => setGraphOpen(false)} />
          <KeybindingsDialog opened={kbOpen} onClose={() => setKbOpen(false)} />
        </Suspense>
      </ModalsProvider>
    </MantineProvider>
  );
}
