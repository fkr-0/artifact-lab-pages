// ─── Help Provider Interface ─────────────────────────────────────────────────
//
// Extensible help text system. Every git command, concept, and term
// can have rich help documentation including examples and visual hints.
//

// ─── Help Text ───────────────────────────────────────────────────────────────

export interface IHelpText {
  /** Unique identifier */
  id: string;
  /** The command or concept this help text covers */
  topic: string;
  /** Display title */
  title: string;
  /** One-line description */
  shortDescription: string;
  /** Full description with markdown support */
  longDescription: string;
  /** Command examples */
  examples: IHelpExample[];
  /** Related concepts / commands */
  relatedTopics: string[];
  /** Visual hint: e.g., a diagram key or animation cue */
  visualHint?: string;
  /** Category for grouping */
  category: HelpCategory;
  /** Common mistakes users make with this command */
  commonMistakes?: string[];
  /** Pro tip for power users */
  proTip?: string;
}

export interface IHelpExample {
  /** The command to show */
  command: string;
  /** What this example does */
  description: string;
  /** Expected output (abbreviated) */
  expectedOutput?: string;
}

export type HelpCategory =
  | 'command'
  | 'concept'
  | 'workflow'
  | 'glossary'
  | string;

// ─── Glossary Entry ──────────────────────────────────────────────────────────

export interface IGlossaryEntry {
  term: string;
  shortDefinition: string;
  longDefinition?: string;
  seeAlso?: string[];
  category: HelpCategory;
}

// ─── Concept Explanation ─────────────────────────────────────────────────────

export interface IConceptExplanation {
  id: string;
  title: string;
  /** The "recipe book" analogy */
  analogy: string;
  /** Technical explanation */
  technical: string;
  /** Visual description of what happens in the graph */
  graphEffect: string;
  /** Common pitfalls */
  pitfalls?: string[];
  /** Related concepts */
  relatedConcepts: string[];
}

// ─── Help Provider ───────────────────────────────────────────────────────────

export interface IHelpProvider {
  /** Get help for a specific command or topic */
  getHelp(topic: string): IHelpText | undefined;

  /** Search help texts */
  searchHelp(query: string): IHelpText[];

  /** Get all help texts for a category */
  getHelpByCategory(category: HelpCategory): IHelpText[];

  /** Get glossary entries */
  getGlossary(): IGlossaryEntry[];

  /** Get a concept explanation */
  getConcept(id: string): IConceptExplanation | undefined;

  /** Get all concepts */
  getAllConcepts(): IConceptExplanation[];

  /** Generate help output for the terminal */
  formatHelpText(topic: string): string;

  /** Generate the main help listing */
  formatHelpListing(): string;
}

// ─── Help Registry (for extensibility) ───────────────────────────────────────

export interface IHelpRegistry extends IHelpProvider {
  /** Register a help text */
  registerHelpText(helpText: IHelpText): void;

  /** Register a glossary entry */
  registerGlossaryEntry(entry: IGlossaryEntry): void;

  /** Register a concept explanation */
  registerConcept(concept: IConceptExplanation): void;

  /** Remove a help text */
  unregisterHelpText(id: string): void;
}
