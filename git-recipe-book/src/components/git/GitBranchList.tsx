import React from 'react';
import { useGitStore } from '@/stores/git-store';
import { Badge } from '@/components/ui/badge';
import { GitBranch as BranchIcon, Tag, Star, Globe, Cloud } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { REMOTE_BRANCH_COLOR } from '@/lib/git-types';
import type { GitRemote } from '@/lib/git-types';

export default function GitBranchList() {
  const { gitState } = useGitStore();
  const { branches, tags, remotes, HEAD, trackingBranches } = gitState;

  const currentBranch = HEAD.type === 'branch' ? HEAD.ref : null;

  // Separate local and remote-tracking branches
  const localBranches = Object.values(branches).filter((b) => !b.isRemote);
  const remoteTrackingBranches = Object.values(branches).filter((b) => b.isRemote);

  const remoteEntries = Object.entries(remotes);
  const hasRemotes = remoteEntries.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Local Branches */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BranchIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-xs uppercase tracking-wide">
              Branches
            </h3>
          </div>
          <div className="space-y-1">
            {localBranches.length === 0 ? (
              <p className="text-xs text-muted-foreground">No branches</p>
            ) : (
              localBranches.map((b) => {
                const tracking = trackingBranches[b.name];
                return (
                  <div
                    key={b.name}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      currentBranch === b.name
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="font-mono text-xs truncate">
                      {b.name}
                    </span>
                    {tracking && (
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 ml-auto shrink-0">
                        → {tracking.remote}/{tracking.remoteBranch}
                      </span>
                    )}
                    {currentBranch === b.name && (
                      <Star className="w-3 h-3 text-amber-500 ml-auto shrink-0" />
                    )}
                    {!b.commitId && !tracking && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        (no commits)
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Remotes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-4 h-4 text-cyan-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wide">
              Remotes
            </h3>
          </div>
          <div className="space-y-3">
            {!hasRemotes && !remoteTrackingBranches.length ? (
              <p className="text-xs text-muted-foreground">No remotes configured</p>
            ) : (
              <>
                {/* Remote entries with URLs */}
                {remoteEntries.map(([remoteName, remote]) => (
                  <RemoteSection
                    key={remoteName}
                    remoteName={remoteName}
                    remote={remote}
                  />
                ))}

                {/* Remote-tracking branches that are in the main branches dict but not under a specific remote */}
                {remoteTrackingBranches.length > 0 && (
                  <div className="space-y-1 ml-2">
                    {remoteTrackingBranches.map((b) => (
                      <div
                        key={b.name}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-dashed"
                          style={{ borderColor: REMOTE_BRANCH_COLOR, backgroundColor: 'transparent' }}
                        />
                        <span className="font-mono text-xs truncate text-cyan-600 dark:text-cyan-400">
                          {b.name}
                        </span>
                        <Cloud className="w-3 h-3 text-cyan-500 ml-auto shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wide">
              Tags
            </h3>
          </div>
          <div className="space-y-1">
            {Object.keys(tags).length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags</p>
            ) : (
              Object.values(tags).map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 transition-colors"
                >
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                  >
                    {t.name}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {gitState.commits[t.commitId]?.shortId || '?'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stash */}
        {gitState.stash.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">📦</span>
              <h3 className="font-semibold text-xs uppercase tracking-wide">
                Stash ({gitState.stash.length})
              </h3>
            </div>
            <div className="space-y-1">
              {gitState.stash.map((entry, i) => (
                <div
                  key={entry.id}
                  className="px-2 py-1.5 rounded-md text-xs hover:bg-accent/50 transition-colors"
                >
                  <span className="text-muted-foreground">
                    {`stash@{${i}}`}
                  </span>
                  : {entry.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Remote Section Sub-component ────────────────────────────────────────────

function RemoteSection({ remoteName, remote }: { remoteName: string; remote: GitRemote }) {
  const remoteBranchNames = Object.keys(remote.branches);

  return (
    <div className="border border-border/50 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-accent/30">
        <Globe className="w-3.5 h-3.5 text-cyan-500" />
        <span className="font-mono text-xs font-semibold">{remoteName}</span>
        <span className="text-[10px] text-muted-foreground truncate ml-auto">
          {remote.url}
        </span>
      </div>
      {remoteBranchNames.length > 0 && (
        <div className="space-y-0.5 px-1.5 py-1">
          {remoteBranchNames.map((branchName) => {
            const branch = remote.branches[branchName];
            return (
              <div
                key={branchName}
                className="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-accent/50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 border border-dashed"
                  style={{ borderColor: REMOTE_BRANCH_COLOR, backgroundColor: 'transparent' }}
                />
                <span className="font-mono text-[11px] truncate text-cyan-600 dark:text-cyan-400">
                  {remoteName}/{branchName}
                </span>
                <Cloud className="w-2.5 h-2.5 text-cyan-500 ml-auto shrink-0" />
                {branch.commitId && (
                  <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                    {remote.commits[branch.commitId]?.shortId || ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
