import React, { useState } from 'react';
import { useGitStore } from '@/stores/git-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FileNode {
  name: string;
  path: string;
  content?: string;
  children?: FileNode[];
  isFolder: boolean;
}

function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = [];

  const sortedPaths = Object.keys(files).sort();
  for (const filePath of sortedPaths) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((n) => n.name === part);

      if (existingNode) {
        currentLevel = existingNode.children!;
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFolder: !isFile,
          ...(isFile ? { content: files[filePath] } : { children: [] }),
        };
        currentLevel.push(newNode);
        if (!isFile) {
          currentLevel = newNode.children!;
        }
      }
    }
  }

  return root;
}

function FileTreeNode({
  node,
  depth,
  onEdit,
}: {
  node: FileNode;
  depth: number;
  onEdit: (path: string, content: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-accent/50 rounded text-sm transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <Folder className="w-4 h-4 text-amber-500" />
          <span className="font-medium">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      className="group flex items-center justify-between px-2 py-1 hover:bg-accent/50 rounded text-sm cursor-pointer transition-colors"
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => setSelectedFile(node.path)}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-0.5 hover:bg-accent rounded"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node.path, node.content || '');
          }}
        >
          <Edit3 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* File preview dialog */}
      <Dialog
        open={selectedFile === node.path}
        onOpenChange={(open) => !open && setSelectedFile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{node.name}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64 whitespace-pre-wrap">
            {node.content || '(empty file)'}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FileEditor({
  path,
  initialContent,
  onSave,
}: {
  path: string;
  initialContent: string;
  onSave: (path: string, content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-mono text-xs min-h-48"
        placeholder="File content..."
      />
      <Button
        size="sm"
        onClick={() => onSave(path, content)}
        className="w-full"
      >
        Save Changes
      </Button>
    </div>
  );
}

export default function GitFileExplorer() {
  const { gitState, executeCommand } = useGitStore();
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [editFile, setEditFile] = useState<{ path: string; content: string } | null>(null);

  const tree = buildFileTree(gitState.working);
  const fileCount = Object.keys(gitState.working).length;

  const handleEdit = (path: string, content: string) => {
    setEditFile({ path, content });
  };

  const handleSaveEdit = () => {
    if (editFile) {
      executeCommand(`edit ${editFile.path} ${editFile.content}`);
      setEditFile(null);
    }
  };

  const handleNewFile = () => {
    if (newFilePath) {
      executeCommand(`edit ${newFilePath} ${newFileContent}`);
      setNewFileOpen(false);
      setNewFilePath('');
      setNewFileContent('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Files</h3>
          <Badge variant="secondary" className="text-[10px]">
            {fileCount}
          </Badge>
        </div>
        <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="e.g. recipes/cake.md"
                className="text-sm"
              />
              <Textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="File content..."
                className="font-mono text-xs min-h-32"
              />
              <Button size="sm" onClick={handleNewFile} className="w-full">
                Create File
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No files yet. Run git init to start!
            </div>
          ) : (
            tree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit dialog */}
      <Dialog open={editFile !== null} onOpenChange={(open) => !open && setEditFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit: {editFile?.path}</DialogTitle>
          </DialogHeader>
          <FileEditor
            path={editFile?.path || ''}
            initialContent={editFile?.content || ''}
            onSave={() => handleSaveEdit()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
