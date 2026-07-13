import { describe, it, expect, beforeEach } from 'vitest';
import { HelpProvider } from '../help/help-provider';
import type { IHelpText, IGlossaryEntry, IConceptExplanation } from '../interfaces';

describe('HelpProvider', () => {
  let provider: HelpProvider;

  beforeEach(() => {
    provider = new HelpProvider();
  });

  // ─── getHelp ─────────────────────────────────────────────────────────────

  describe('getHelp', () => {
    it('finds help by topic', () => {
      const help = provider.getHelp('git init');
      expect(help).toBeDefined();
      expect(help!.topic).toBe('git init');
    });

    it('normalizes git prefix', () => {
      const help1 = provider.getHelp('init');
      const help2 = provider.getHelp('git init');
      expect(help1).toBeDefined();
      expect(help2).toBeDefined();
      // Both should find the same entry
      expect(help1?.id).toBe(help2?.id);
    });

    it('returns undefined for unknown topic', () => {
      const help = provider.getHelp('git nonexistent');
      expect(help).toBeUndefined();
    });
  });

  // ─── searchHelp ──────────────────────────────────────────────────────────

  describe('searchHelp', () => {
    it('finds by title', () => {
      const results = provider.searchHelp('Initialize');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === 'init')).toBe(true);
    });

    it('finds by description', () => {
      const results = provider.searchHelp('stage');
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds by topic', () => {
      const results = provider.searchHelp('commit');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for no match', () => {
      const results = provider.searchHelp('zzzzzznonexistent');
      expect(results.length).toBe(0);
    });
  });

  // ─── getHelpByCategory ───────────────────────────────────────────────────

  describe('getHelpByCategory', () => {
    it('filters by command category', () => {
      const commands = provider.getHelpByCategory('command');
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.every((h) => h.category === 'command')).toBe(true);
    });

    it('returns empty for unknown category', () => {
      const results = provider.getHelpByCategory('nonexistent');
      expect(results).toEqual([]);
    });
  });

  // ─── getGlossary ─────────────────────────────────────────────────────────

  describe('getGlossary', () => {
    it('returns glossary entries', () => {
      const glossary = provider.getGlossary();
      expect(glossary.length).toBeGreaterThan(0);
      expect(glossary.every((g) => g.term)).toBe(true);
      expect(glossary.every((g) => g.shortDefinition)).toBe(true);
    });
  });

  // ─── getConcept ──────────────────────────────────────────────────────────

  describe('getConcept', () => {
    it('returns concept by id', () => {
      const concept = provider.getConcept('three-states');
      expect(concept).toBeDefined();
      expect(concept!.title).toBe('The Three States');
    });

    it('returns undefined for unknown concept', () => {
      const concept = provider.getConcept('nonexistent');
      expect(concept).toBeUndefined();
    });
  });

  // ─── getAllConcepts ──────────────────────────────────────────────────────

  describe('getAllConcepts', () => {
    it('returns all concepts', () => {
      const concepts = provider.getAllConcepts();
      expect(concepts.length).toBeGreaterThan(0);
    });
  });

  // ─── formatHelpText ──────────────────────────────────────────────────────

  describe('formatHelpText', () => {
    it('produces formatted string for known topic', () => {
      const text = provider.formatHelpText('git init');
      expect(text).toContain('Initialize a Repository');
      expect(text).toContain('Examples:');
    });

    it('returns not-found message for unknown topic', () => {
      const text = provider.formatHelpText('nonexistent');
      expect(text).toContain("No help available for 'nonexistent'");
    });
  });

  // ─── formatHelpListing ───────────────────────────────────────────────────

  describe('formatHelpListing', () => {
    it('produces listing of all commands', () => {
      const listing = provider.formatHelpListing();
      expect(listing).toContain('Git Command Reference');
      expect(listing).toContain('git init');
    });
  });

  // ─── registerHelpText ────────────────────────────────────────────────────

  describe('registerHelpText', () => {
    it('adds a new help text entry', () => {
      const newHelp: IHelpText = {
        id: 'custom-cmd',
        topic: 'git custom',
        title: 'Custom Command',
        shortDescription: 'A custom command',
        longDescription: 'Detailed description of custom command',
        examples: [],
        relatedTopics: [],
        category: 'command',
      };

      provider.registerHelpText(newHelp);
      const help = provider.getHelp('git custom');
      expect(help).toBeDefined();
      expect(help!.title).toBe('Custom Command');
    });
  });

  // ─── registerGlossaryEntry ───────────────────────────────────────────────

  describe('registerGlossaryEntry', () => {
    it('adds a glossary entry', () => {
      const entry: IGlossaryEntry = {
        term: 'CustomTerm',
        shortDefinition: 'A custom definition',
        category: 'glossary',
      };

      provider.registerGlossaryEntry(entry);
      const glossary = provider.getGlossary();
      expect(glossary.some((g) => g.term === 'CustomTerm')).toBe(true);
    });
  });

  // ─── registerConcept ─────────────────────────────────────────────────────

  describe('registerConcept', () => {
    it('adds a concept explanation', () => {
      const concept: IConceptExplanation = {
        id: 'custom-concept',
        title: 'Custom Concept',
        analogy: 'Like a custom thing',
        technical: 'Technically speaking...',
        graphEffect: 'Graph changes like this',
        relatedConcepts: [],
      };

      provider.registerConcept(concept);
      expect(provider.getConcept('custom-concept')).toBeDefined();
      expect(provider.getConcept('custom-concept')!.title).toBe('Custom Concept');
    });
  });
});
