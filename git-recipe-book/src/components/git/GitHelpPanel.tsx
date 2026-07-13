import React, { useState } from 'react'
import { useGitStore, helpProvider } from '@/stores/git-store'
import { Dialog } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  HelpCircle,
  Search,
  BookOpen,
  GitBranch,
  Terminal,
  BookMarked,
  X,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'

export default function GitHelpPanel() {
  const { helpPanelOpen, setHelpPanel } = useGitStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<'commands' | 'glossary' | 'concepts'>('commands')

  const allHelpTexts = helpProvider.getHelpByCategory('command')
  const allGlossary = helpProvider.getGlossary()
  const allConcepts = helpProvider.getAllConcepts()

  const filteredHelp = searchQuery
    ? helpProvider.searchHelp(searchQuery)
    : allHelpTexts

  const filteredGlossary = searchQuery
    ? allGlossary.filter(
        (g) =>
          g.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allGlossary

  const filteredConcepts = searchQuery
    ? allConcepts.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.analogy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allConcepts

  return (
    <Dialog open={helpPanelOpen} onOpenChange={(open) => setHelpPanel(open)}>
      <div className='max-w-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <HelpCircle className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-bold'>Git Help & Reference</h2>
          </div>
          <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => setHelpPanel(false)}>
            <X className='w-4 h-4' />
          </Button>
        </div>

        {/* Search */}
        <div className='p-4 border-b border-border'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search commands, terms, concepts...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-border'>
          {[
            { key: 'commands' as const, label: 'Commands', icon: Terminal },
            { key: 'glossary' as const, label: 'Glossary', icon: BookMarked },
            { key: 'concepts' as const, label: 'Concepts', icon: Lightbulb },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                activeSection === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveSection(key)}
            >
              <Icon className='w-3.5 h-3.5' />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className='max-h-[60vh] p-4'>
          {activeSection === 'commands' && (
            <div className='space-y-3'>
              {filteredHelp.map((ht) => (
                <div key={ht.id} className='border rounded-lg p-3 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <code className='text-sm font-mono font-bold text-primary'>{ht.topic}</code>
                    <Badge variant='secondary' className='text-[10px]'>{ht.category}</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>{ht.longDescription}</p>
                  {ht.examples.length > 0 && (
                    <div className='space-y-1.5'>
                      <p className='text-xs font-semibold'>Examples:</p>
                      {ht.examples.map((ex, i) => (
                        <div key={i} className='bg-muted rounded-md p-2 space-y-1'>
                          <code className='text-xs font-mono text-primary'>$ {ex.command}</code>
                          <p className='text-xs text-muted-foreground'>{ex.description}</p>
                          {ex.expectedOutput && (
                            <p className='text-xs text-muted-foreground font-mono'>→ {ex.expectedOutput}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {ht.relatedTopics.length > 0 && (
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='text-xs text-muted-foreground'>Related:</span>
                      {ht.relatedTopics.map((rt) => (
                        <Badge key={rt} variant='outline' className='text-[10px]'>
                          {rt}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {filteredHelp.length === 0 && (
                <p className='text-sm text-muted-foreground text-center py-8'>No commands found</p>
              )}
            </div>
          )}

          {activeSection === 'glossary' && (
            <div className='space-y-3'>
              {filteredGlossary.map((g) => (
                <div key={g.term} className='border rounded-lg p-3 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-semibold text-sm'>{g.term}</h4>
                    <Badge variant='outline' className='text-[10px]'>{g.category}</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>{g.shortDefinition}</p>
                  {g.longDefinition && (
                    <p className='text-xs text-muted-foreground'>{g.longDefinition}</p>
                  )}
                  {g.seeAlso && g.seeAlso.length > 0 && (
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='text-xs text-muted-foreground'>See also:</span>
                      {g.seeAlso.map((s) => (
                        <Badge key={s} variant='outline' className='text-[10px]'>{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p className='text-sm text-muted-foreground text-center py-8'>No terms found</p>
              )}
            </div>
          )}

          {activeSection === 'concepts' && (
            <div className='space-y-3'>
              {filteredConcepts.map((c) => (
                <div key={c.id} className='border rounded-lg p-3 space-y-2'>
                  <h4 className='font-semibold text-sm'>{c.title}</h4>
                  <div className='space-y-1.5'>
                    <div>
                      <span className='text-xs font-medium text-amber-600 dark:text-amber-400'>🍳 Analogy:</span>
                      <p className='text-sm text-muted-foreground'>{c.analogy}</p>
                    </div>
                    <div>
                      <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>🔧 Technical:</span>
                      <p className='text-sm text-muted-foreground'>{c.technical}</p>
                    </div>
                    <div>
                      <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>📊 Graph Effect:</span>
                      <p className='text-sm text-muted-foreground'>{c.graphEffect}</p>
                    </div>
                  </div>
                  {c.pitfalls && c.pitfalls.length > 0 && (
                    <div>
                      <span className='text-xs font-medium text-red-600 dark:text-red-400'>⚠️ Pitfalls:</span>
                      <ul className='list-disc list-inside text-xs text-muted-foreground space-y-0.5'>
                        {c.pitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.relatedConcepts.length > 0 && (
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='text-xs text-muted-foreground'>Related:</span>
                      {c.relatedConcepts.map((rc) => (
                        <Badge key={rc} variant='outline' className='text-[10px]'>{rc}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {filteredConcepts.length === 0 && (
                <p className='text-sm text-muted-foreground text-center py-8'>No concepts found</p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </Dialog>
  )
}
