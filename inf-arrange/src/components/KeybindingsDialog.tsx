import {
  findKeyConflicts,
  findMouseConflicts,
  formatKeyBinding,
  formatMouseBinding,
} from "@/lib/keybindingMatchers";
import { useKeybindingsStore } from "@/store/keybindings";
import {
  ACTION_LABELS,
  ALL_ACTIONS,
  type BindingContext,
  type KeyBinding,
  type MouseBinding,
  type MouseButton,
} from "@/types/keybindings";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const MOUSE_CATEGORIES = ["Selection", "Manipulation", "Navigation"];
const KEY_CATEGORIES = ["Edit", "Selection", "Nudge", "Z-Order", "View"];

const ACTION_OPTIONS = ALL_ACTIONS.filter((a) => a !== "none").map((a) => ({
  value: a,
  label: ACTION_LABELS[a],
}));

const BUTTON_OPTIONS: Array<{ value: MouseButton; label: string }> = [
  { value: "left", label: "Left" },
  { value: "middle", label: "Middle" },
  { value: "right", label: "Right" },
];

const CONTEXT_OPTIONS: Array<{ value: BindingContext; label: string }> = [
  { value: "any", label: "Any" },
  { value: "canvas", label: "Empty canvas" },
  { value: "item", label: "Any item" },
  { value: "image", label: "Image" },
  { value: "text", label: "Text block" },
];

function bindingMatchesQuery(binding: MouseBinding | KeyBinding, query: string): boolean {
  if (!query) return true;
  const rendered = "button" in binding ? formatMouseBinding(binding) : formatKeyBinding(binding);
  const haystack = [
    binding.label,
    binding.description ?? "",
    ACTION_LABELS[binding.action],
    binding.category,
    rendered,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function KeybindingsDialog({ opened, onClose }: Props) {
  const mouse = useKeybindingsStore((s) => s.mouse);
  const keyboard = useKeybindingsStore((s) => s.keyboard);
  const updateMouse = useKeybindingsStore((s) => s.updateMouseBinding);
  const updateKey = useKeybindingsStore((s) => s.updateKeyBinding);
  const resetAll = useKeybindingsStore((s) => s.resetAllToDefaults);
  const resetMouse = useKeybindingsStore((s) => s.resetMouseToDefaults);
  const resetKeyboard = useKeybindingsStore((s) => s.resetKeyboardToDefaults);
  const setDialogOpen = useKeybindingsStore((s) => s.setDialogOpen);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  // Keep the store's dialogOpen flag in sync with the actual modal state.
  useEffect(() => {
    setDialogOpen(opened);
  }, [opened, setDialogOpen]);

  const mouseConflicts = findMouseConflicts(mouse);
  const keyConflicts = findKeyConflicts(keyboard);
  const conflictSet = new Set<string>();
  for (const [a, b] of [...mouseConflicts, ...keyConflicts]) {
    conflictSet.add(a);
    conflictSet.add(b);
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600}>Keybindings</Text>
          {conflictSet.size > 0 && (
            <Badge color="red" variant="light">
              {conflictSet.size} conflicts
            </Badge>
          )}
        </Group>
      }
      size="xl"
      centered
      styles={{ body: { padding: 0 } }}
    >
      <Box p="sm" style={{ borderBottom: "1px solid var(--cs-border)" }}>
        <Stack gap={8}>
          <Text size="xs" c="dimmed">
            Mouse gestures are differentiated by where the pointer lands (empty canvas vs. image vs.
            text). Defaults follow draw.io: Shift+drag constrains to axis, Alt+drag duplicates,
            Ctrl+drag resizes, Ctrl+Shift+drag crops.
          </Text>
          <TextInput
            size="xs"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Filter by action, shortcut, context, or description…"
            leftSection="⌕"
          />
          {conflictSet.size > 0 && (
            <Text size="xs" c="red">
              Resolve highlighted conflicts before relying on the affected shortcut. More specific
              mouse contexts win at runtime, but duplicate keyboard shortcuts remain ambiguous.
            </Text>
          )}
        </Stack>
      </Box>

      <Tabs defaultValue="mouse" style={{ padding: "8px 12px" }}>
        <Tabs.List>
          <Tabs.Tab value="mouse">Mouse gestures</Tabs.Tab>
          <Tabs.Tab value="keyboard">Keyboard shortcuts</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="mouse" pt="sm">
          <Stack gap="md">
            {MOUSE_CATEGORIES.map((cat) => (
              <MouseCategory
                key={cat}
                category={cat}
                bindings={mouse.filter(
                  (b) => b.category === cat && bindingMatchesQuery(b, normalizedQuery),
                )}
                conflictSet={conflictSet}
                onUpdate={updateMouse}
              />
            ))}
            <Group justify="flex-end">
              <Button size="xs" variant="default" onClick={resetMouse}>
                Reset mouse to defaults
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="keyboard" pt="sm">
          <Stack gap="md">
            {KEY_CATEGORIES.map((cat) => (
              <KeyboardCategory
                key={cat}
                category={cat}
                bindings={keyboard.filter(
                  (b) => b.category === cat && bindingMatchesQuery(b, normalizedQuery),
                )}
                conflictSet={conflictSet}
                onUpdate={updateKey}
              />
            ))}
            <Group justify="flex-end">
              <Button size="xs" variant="default" onClick={resetKeyboard}>
                Reset keyboard to defaults
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Box p="sm" style={{ borderTop: "1px solid var(--cs-border)" }}>
        <Group justify="space-between">
          <Button size="xs" variant="subtle" color="red" onClick={resetAll}>
            Reset all to defaults
          </Button>
          <Button size="xs" variant="default" onClick={onClose}>
            Done
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}

// -------------------- Mouse category --------------------

function MouseCategory({
  category,
  bindings,
  conflictSet,
  onUpdate,
}: {
  category: string;
  bindings: MouseBinding[];
  conflictSet: Set<string>;
  onUpdate: (id: string, patch: Partial<MouseBinding>) => void;
}) {
  return (
    <Box>
      <Text fw={600} size="sm" mb={4}>
        {category}
      </Text>
      {bindings.length === 0 && (
        <Text size="xs" c="dimmed" mb={4}>
          No bindings match the current filter.
        </Text>
      )}
      <Table striped={false} withTableBorder={false}>
        <Table.Tbody>
          {bindings.map((b) => (
            <MouseBindingRow
              key={b.id}
              binding={b}
              conflict={conflictSet.has(b.id)}
              onUpdate={onUpdate}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

function MouseBindingRow({
  binding,
  conflict,
  onUpdate,
}: {
  binding: MouseBinding;
  conflict: boolean;
  onUpdate: (id: string, patch: Partial<MouseBinding>) => void;
}) {
  return (
    <Table.Tr style={{ background: conflict ? "rgba(255,107,107,0.08)" : undefined }}>
      <Table.Td style={{ width: 200 }}>
        <Stack gap={0}>
          <Text size="sm" fw={500}>
            {binding.label}
          </Text>
          {binding.description && (
            <Text size="xs" c="dimmed">
              {binding.description}
            </Text>
          )}
          <Text size="xs" c={conflict ? "red" : "blue"} ff="monospace">
            {formatMouseBinding(binding)}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td style={{ width: 180 }}>
        <Select
          size="xs"
          value={binding.action}
          onChange={(v) => v && onUpdate(binding.id, { action: v as MouseBinding["action"] })}
          data={ACTION_OPTIONS}
          searchable
        />
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Select
            size="xs"
            value={binding.button}
            onChange={(v) => v && onUpdate(binding.id, { button: v as MouseButton })}
            data={BUTTON_OPTIONS}
            style={{ width: 90 }}
          />
          <Select
            size="xs"
            value={binding.context}
            onChange={(v) => v && onUpdate(binding.id, { context: v as BindingContext })}
            data={CONTEXT_OPTIONS}
            style={{ width: 130 }}
          />
          <Group gap={4}>
            <SwitchButton
              label="Ctrl"
              checked={!!binding.modifiers.ctrl}
              onChange={(v) =>
                onUpdate(binding.id, { modifiers: { ...binding.modifiers, ctrl: v } })
              }
            />
            <SwitchButton
              label="Shift"
              checked={!!binding.modifiers.shift}
              onChange={(v) =>
                onUpdate(binding.id, { modifiers: { ...binding.modifiers, shift: v } })
              }
            />
            <SwitchButton
              label="Alt"
              checked={!!binding.modifiers.alt}
              onChange={(v) =>
                onUpdate(binding.id, { modifiers: { ...binding.modifiers, alt: v } })
              }
            />
          </Group>
        </Group>
      </Table.Td>
      <Table.Td style={{ width: 50 }}>
        {conflict && (
          <Tooltip label="This binding conflicts with another">
            <Badge color="red" size="xs">
              !
            </Badge>
          </Tooltip>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

function SwitchButton({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Tooltip label={`${label}: ${checked ? "on" : "off"}`}>
      <ActionIcon
        size="sm"
        variant={checked ? "filled" : "light"}
        color={checked ? "blue" : "gray"}
        onClick={() => onChange(!checked)}
      >
        {label[0]}
      </ActionIcon>
    </Tooltip>
  );
}

// -------------------- Keyboard category --------------------

function KeyboardCategory({
  category,
  bindings,
  conflictSet,
  onUpdate,
}: {
  category: string;
  bindings: KeyBinding[];
  conflictSet: Set<string>;
  onUpdate: (id: string, patch: Partial<KeyBinding>) => void;
}) {
  return (
    <Box>
      <Text fw={600} size="sm" mb={4}>
        {category}
      </Text>
      {bindings.length === 0 && (
        <Text size="xs" c="dimmed" mb={4}>
          No bindings match the current filter.
        </Text>
      )}
      <Table>
        <Table.Tbody>
          {bindings.map((b) => (
            <KeyboardBindingRow
              key={b.id}
              binding={b}
              conflict={conflictSet.has(b.id)}
              onUpdate={onUpdate}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}

function KeyboardBindingRow({
  binding,
  conflict,
  onUpdate,
}: {
  binding: KeyBinding;
  conflict: boolean;
  onUpdate: (id: string, patch: Partial<KeyBinding>) => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const setCapturingId = useKeybindingsStore((s) => s.setCapturing);

  useEffect(() => {
    if (!capturing) return;
    setCapturingId(binding.id);
    const handler = (e: KeyboardEvent) => {
      // Allow Escape to cancel.
      if (e.key === "Escape") {
        setCapturing(false);
        setCapturingId(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      // Capture modifiers + key. Treat Ctrl/Cmd identically.
      const mods = {
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      };
      // Ignore bare modifier presses — wait for the actual key.
      if (["Control", "Meta", "Shift", "Alt"].includes(e.key)) return;
      onUpdate(binding.id, {
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
        modifiers: mods,
      });
      setCapturing(false);
      setCapturingId(null);
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => {
      window.removeEventListener("keydown", handler, { capture: true } as EventListenerOptions);
      setCapturingId(null);
    };
  }, [capturing, binding.id, onUpdate, setCapturingId]);

  return (
    <Table.Tr style={{ background: conflict ? "rgba(255,107,107,0.08)" : undefined }}>
      <Table.Td style={{ width: 200 }}>
        <Stack gap={0}>
          <Text size="sm" fw={500}>
            {binding.label}
          </Text>
          {binding.description && (
            <Text size="xs" c="dimmed">
              {binding.description}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Box
            style={{
              padding: "4px 10px",
              background: capturing ? "rgba(77,171,247,0.18)" : "#0b0d12",
              border: "1px solid var(--cs-border)",
              borderRadius: 4,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              minWidth: 100,
              textAlign: "center",
              color: capturing ? "#4dabf7" : "var(--cs-fg)",
            }}
          >
            {capturing ? "Press keys…" : formatKeyBinding(binding)}
          </Box>
          <Button size="xs" variant="default" onClick={() => setCapturing((v) => !v)}>
            {capturing ? "Cancel" : "Rebind"}
          </Button>
          {conflict && (
            <Tooltip label="Conflicts with another binding">
              <Badge color="red" size="xs">
                !
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
