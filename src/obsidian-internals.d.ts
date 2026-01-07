import { View, WorkspaceLeaf, TFolder, TAbstractFile } from 'obsidian';

/**
 * Wrapper object for items displayed in the file explorer UI.
 * The actual file or folder is accessible via the .file property.
 * This is an undocumented Obsidian internal type.
 */
export interface FileExplorerItem {
  file: TAbstractFile;
}

export interface FileExplorerView extends View {
  getSortedFolderItems(folder: TFolder): TAbstractFile[];
  requestSort(): void;
  sortOrder: string;
}

export interface FileExplorerLeaf extends WorkspaceLeaf {
  view: FileExplorerView;
}
