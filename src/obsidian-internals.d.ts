import { View, WorkspaceLeaf, TFolder, TAbstractFile } from 'obsidian';

export interface FileExplorerView extends View {
  getSortedFolderItems(folder: TFolder): TAbstractFile[];
  requestSort(): void;
  sortOrder: string;
}

export interface FileExplorerLeaf extends WorkspaceLeaf {
  view: FileExplorerView;
}
