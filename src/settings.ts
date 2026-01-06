import { App, Notice, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type ParaManagerPlugin from "./main";
import { isNestedPath } from "./utils";

export interface ParaManagerSettings {
  projectsPath: string;
  areasPath: string;
  resourcesPath: string;
  archivePath: string;
  focusAfterArchive: boolean;
  confirmBeforeArchive: boolean;
}

export const DEFAULT_SETTINGS: ParaManagerSettings = {
  projectsPath: "Projects",
  areasPath: "Areas",
  resourcesPath: "Resources",
  archivePath: "Archive",
  focusAfterArchive: true,
  confirmBeforeArchive: false,
};

/** PARA folder field names for validation */
type ParaFolderField = "projectsPath" | "areasPath" | "resourcesPath" | "archivePath";

/** Human-readable names for PARA folders */
const FOLDER_NAMES: Record<ParaFolderField, string> = {
  projectsPath: "Projects",
  areasPath: "Areas",
  resourcesPath: "Resources",
  archivePath: "Archive",
};

/** Default values for each folder field */
const FOLDER_DEFAULTS: Record<ParaFolderField, string> = {
  projectsPath: "Projects",
  areasPath: "Areas",
  resourcesPath: "Resources",
  archivePath: "Archive",
};

/**
 * Validate a PARA folder path against all other PARA paths.
 * Checks for equality and nesting conflicts.
 *
 * @param newPath - The normalized new path value
 * @param field - Which field is being changed
 * @param settings - Current settings to validate against
 * @returns Error message if invalid, null if valid
 */
function validateParaFolderPath(
  newPath: string,
  field: ParaFolderField,
  settings: ParaManagerSettings
): string | null {
  const allFields: ParaFolderField[] = ["projectsPath", "areasPath", "resourcesPath", "archivePath"];
  const otherFields = allFields.filter((f) => f !== field);

  for (const otherField of otherFields) {
    const otherPath = settings[otherField];
    const otherName = FOLDER_NAMES[otherField];
    const thisName = FOLDER_NAMES[field];

    // Check equality
    if (newPath === otherPath) {
      return `${thisName} folder cannot be the same as ${otherName} folder`;
    }

    // Check nesting
    if (isNestedPath(newPath, otherPath)) {
      return `${thisName} folder cannot be nested with ${otherName} folder`;
    }
  }

  return null;
}

/** CSS class for invalid input styling */
const INVALID_INPUT_CLASS = "para-manager-invalid-input";

/**
 * Set up a folder path text input with blur-based validation.
 * Validates on blur (not on every keystroke) and shows visual feedback for errors.
 */
function setupFolderPathInput(
  text: TextComponent,
  field: ParaFolderField,
  plugin: ParaManagerPlugin
): void {
  const inputEl = text.inputEl;

  text
    .setPlaceholder(FOLDER_DEFAULTS[field])
    .setValue(plugin.settings[field]);

  // Validate and save on blur (when user leaves the field)
  inputEl.addEventListener("blur", async () => {
    const value = text.getValue();
    const normalized = value.trim().replace(/\/+$/, "") || FOLDER_DEFAULTS[field];

    const error = validateParaFolderPath(normalized, field, plugin.settings);

    if (error) {
      // Show error state
      inputEl.classList.add(INVALID_INPUT_CLASS);
      inputEl.style.borderColor = "var(--text-error)";
      inputEl.style.backgroundColor = "rgba(var(--color-red-rgb), 0.1)";
      new Notice(error);
      // Revert to last valid value
      text.setValue(plugin.settings[field]);
      // Clear error styling after reverting
      setTimeout(() => {
        inputEl.classList.remove(INVALID_INPUT_CLASS);
        inputEl.style.borderColor = "";
        inputEl.style.backgroundColor = "";
      }, 100);
    } else {
      // Clear any error state and save
      inputEl.classList.remove(INVALID_INPUT_CLASS);
      inputEl.style.borderColor = "";
      inputEl.style.backgroundColor = "";
      plugin.settings[field] = normalized;
      await plugin.saveSettings();
    }
  });
}

export class ParaManagerSettingTab extends PluginSettingTab {
  plugin: ParaManagerPlugin;

  constructor(app: App, plugin: ParaManagerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Projects folder")
      .setDesc("Path to your Projects folder (top-level project folders live here)")
      .addText((text) => setupFolderPathInput(text, "projectsPath", this.plugin));

    new Setting(containerEl)
      .setName("Areas folder")
      .setDesc("Path to your Areas folder (top-level area folders live here)")
      .addText((text) => setupFolderPathInput(text, "areasPath", this.plugin));

    new Setting(containerEl)
      .setName("Resources folder")
      .setDesc("Path to your Resources folder (top-level resource folders live here)")
      .addText((text) => setupFolderPathInput(text, "resourcesPath", this.plugin));

    new Setting(containerEl)
      .setName("Archive folder")
      .setDesc("Path where archived items will be moved")
      .addText((text) => setupFolderPathInput(text, "archivePath", this.plugin));

    new Setting(containerEl)
      .setName("Focus source folder after archive")
      .setDesc("Return focus to the source folder (Projects, Areas, or Resources) after archiving")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.focusAfterArchive)
          .onChange(async (value) => {
            this.plugin.settings.focusAfterArchive = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Confirm before archiving")
      .setDesc("Show a confirmation dialog before archiving a project")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.confirmBeforeArchive)
          .onChange(async (value) => {
            this.plugin.settings.confirmBeforeArchive = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
