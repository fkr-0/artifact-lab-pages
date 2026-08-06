import type { CanvasDocument, CanvasDocumentItem, CanvasRelation } from "./document";

export interface CanvasDocumentLoader {
  load(id: string, signal?: AbortSignal): Promise<CanvasDocument>;
  save(document: CanvasDocument, signal?: AbortSignal): Promise<CanvasDocument>;
}

export interface CanvasCommandContext {
  document: CanvasDocument;
  selection: string[];
}

export type CanvasCommand =
  | { type: "document.load"; id: string }
  | { type: "document.save" }
  | { type: "item.add"; item: CanvasDocumentItem }
  | { type: "item.update"; id: string; patch: Partial<CanvasDocumentItem> }
  | { type: "item.remove"; ids: string[] }
  | { type: "relation.add"; relation: CanvasRelation }
  | { type: "relation.remove"; id: string }
  | { type: "selection.set"; ids: string[] }
  | { type: "media.play-item"; id: string }
  | { type: "media.play-sequence"; ids: string[] }
  | { type: "custom"; name: string; payload?: unknown };

export type CanvasChange =
  | {
      type: "snapshot";
      reason: "store-change" | "hydrate" | "imperative-set-document";
    }
  | {
      type: "command";
      command: CanvasCommand;
      subject: "item" | "relation" | "selection" | "plugin";
      action: "add" | "update" | "remove" | "set" | "delegate";
      itemIds?: string[];
      relationIds?: string[];
      selection?: string[];
    };

export interface CanvasItemRenderProps<TData = unknown> {
  item: CanvasDocumentItem<Record<string, unknown>>;
  data: TData;
  selected: boolean;
}

export type TextEditorMode = "plaintext" | "markdown" | "richtext" | "log";

export interface TextEditorRequest {
  itemId: string;
  mode: TextEditorMode;
  value: string;
  html?: string;
}

export interface TextEditorResult {
  value: string;
  html?: string;
}

export interface TextEditorProvider {
  edit(request: TextEditorRequest): Promise<TextEditorResult | null> | TextEditorResult | null;
}

export type ImageEffectId =
  | "grayscale"
  | "sepia"
  | "old-movie"
  | "high-contrast"
  | "cartoon"
  | "cubist";

export interface ImageEditorRequest {
  itemId: string;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface ImageEditorResult {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface ImageEditorProvider {
  edit(request: ImageEditorRequest): Promise<ImageEditorResult | null> | ImageEditorResult | null;
}

export interface CanvasItemPlugin {
  type: string;
  displayName: string;
  render?: unknown;
  deserialize?: (item: CanvasDocumentItem) => unknown;
  serialize?: (runtimeItem: unknown) => CanvasDocumentItem | null;
  getStats?: (item: CanvasDocumentItem) => Record<string, unknown>;
  commands?: Array<(command: CanvasCommand, context: CanvasCommandContext) => boolean | void>;
}

export interface AudioController {
  play(id: string): Promise<void> | void;
  pause(): Promise<void> | void;
  seek(ms: number): Promise<void> | void;
}

export interface LinkPreviewProvider {
  preview(url: string, signal?: AbortSignal): Promise<Record<string, unknown> | null>;
}

export interface CanvasCapabilities {
  audio?: AudioController;
  textEditor?: TextEditorProvider;
  imageEditor?: ImageEditorProvider;
  linkPreview?: LinkPreviewProvider;
  resolveAsset?: (ref: string) => Promise<string> | string;
}
