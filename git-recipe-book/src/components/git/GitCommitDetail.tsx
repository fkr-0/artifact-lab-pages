import React from 'react';
import { useGitStore } from '@/stores/git-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  GitCommitHorizontal,
  User,
  Clock,
  GitBranch as BranchIcon,
  Tag,
  FileText,
} from 'lucide-react';

export default function GitCommitDetail() {
  const { gitState, selectedCommitId, selectCommit } = useGitStore();

  const commit = selectedCommitId
    ? gitState.commits[selectedCommitId]
    : null;

  if (!commit) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <GitCommitHorizontal className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No commit selected</p>
          <p className="text-xs mt-1">Click a node in the graph to inspect it</p>
        </div>
      </div>
    );
  }

  // Find which branches point to this commit
  const pointingBranches = Object.entries(gitState.branches)
    .filter(([, b]) => b.commitId === commit.id)
    .map(([name, b]) => ({ name, color: b.color }));

  // Find tags pointing to this commit
  const pointingTags = Object.entries(gitState.tags)
    .filter(([, t]) => t.commitId === commit.id)
    .map(([name]) => name);

  // Find parent commits
  const parents = commit.parentIds
    .map((pid) => gitState.commits[pid])
    .filter(Boolean);

  // Find children commits
  const children = Object.values(gitState.commits).filter((c) =>
    c.parentIds.includes(commit.id)
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Commit Hash */}
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="w-4 h-4 text-primary" />
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            {commit.id.slice(0, 12)}
          </code>
        </div>

        {/* Message */}
        <div>
          <h3 className="font-bold text-sm leading-snug">{commit.message}</h3>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>{commit.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(commit.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Branches */}
        {pointingBranches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <BranchIcon className="w-3.5 h-3.5" />
              Branches
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pointingBranches.map((b) => (
                <Badge
                  key={b.name}
                  className="text-[10px] text-white"
                  style={{ backgroundColor: b.color }}
                >
                  {b.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {pointingTags.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pointingTags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Parent Commits */}
        {parents.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium">Parents</div>
            {parents.map((p) => (
              <button
                key={p.id}
                onClick={() => selectCommit(p.id)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <GitCommitHorizontal className="w-3 h-3" />
                <code className="font-mono">{p.shortId}</code>
                <span className="truncate max-w-40">{p.message}</span>
              </button>
            ))}
          </div>
        )}

        {/* Children Commits */}
        {children.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium">Children</div>
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCommit(c.id)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <GitCommitHorizontal className="w-3 h-3" />
                <code className="font-mono">{c.shortId}</code>
                <span className="truncate max-w-40">{c.message}</span>
              </button>
            ))}
          </div>
        )}

        {/* File Snapshot */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <FileText className="w-3.5 h-3.5" />
            Files in this commit ({Object.keys(commit.tree).length})
          </div>
          <div className="bg-muted/50 rounded-md p-2 space-y-1 max-h-48 overflow-y-auto">
            {Object.keys(commit.tree).sort().map((fp) => (
              <div key={fp} className="flex items-center gap-1.5 text-xs">
                <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">{fp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
