import AutoLinkTitle from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { Notice } from "obsidian";
import { t } from "./lang/helpers"; 

export interface AutoLinkTitleSettings {
  regex: RegExp;
  lineRegex: RegExp;
  linkRegex: RegExp;
  linkLineRegex: RegExp;
  imageRegex: RegExp;
  shouldPreserveSelectionAsTitle: boolean;
  enhanceDefaultPaste: boolean;
  enhanceDropEvents: boolean;
  websiteBlacklist: string;
  maximumTitleLength: number;
  useNewScraper: boolean;
  linkPreviewApiKey: string;
  useBetterPasteId: boolean;
}

export const DEFAULT_SETTINGS: AutoLinkTitleSettings = {
  regex:
    /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i,
  lineRegex:
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
  linkRegex:
    /^\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)$/i,
  linkLineRegex:
    /\[([^\[\]]*)\]\((https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\)/gi,
  imageRegex: /\.(gif|jpe?g|tiff?|png|webp|bmp|tga|psd|ai)$/i,
  enhanceDefaultPaste: true,
  shouldPreserveSelectionAsTitle: false,
  enhanceDropEvents: true,
  websiteBlacklist: "",
  maximumTitleLength: 0,
  useNewScraper: false,
  linkPreviewApiKey: "",
  useBetterPasteId: false,
};

export class AutoLinkTitleSettingTab extends PluginSettingTab {
  plugin: AutoLinkTitle;

  constructor(app: App, plugin: AutoLinkTitle) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(t("ENHANCE_DEFAULT_PASTE_NAME"))
      .setDesc(t("ENHANCE_DEFAULT_PASTE_DESC"))
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.enhanceDefaultPaste)
          .onChange(async (value) => {
            this.plugin.settings.enhanceDefaultPaste = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("ENHANCE_DROP_EVENTS_NAME"))
      .setDesc(t("ENHANCE_DROP_EVENTS_DESC"))
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.enhanceDropEvents)
          .onChange(async (value) => {
            this.plugin.settings.enhanceDropEvents = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("MAX_TITLE_LENGTH_NAME"))
      .setDesc(t("MAX_TITLE_LENGTH_DESC"))
      .addText((val) =>
        val
          .setValue(this.plugin.settings.maximumTitleLength.toString(10))
          .onChange(async (value) => {
            const titleLength = Number(value);
            this.plugin.settings.maximumTitleLength =
              isNaN(titleLength) || titleLength < 0 ? 0 : titleLength;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("PRESERVE_SELECTION_NAME"))
      .setDesc(t("PRESERVE_SELECTION_DESC"))
      .addToggle((val) =>
        val
          .setValue(this.plugin.settings.shouldPreserveSelectionAsTitle)
          .onChange(async (value) => {
            this.plugin.settings.shouldPreserveSelectionAsTitle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("WEBSITE_BLACKLIST_NAME"))
      .setDesc(t("WEBSITE_BLACKLIST_DESC"))
      .addTextArea((val) =>
        val
          .setValue(this.plugin.settings.websiteBlacklist)
          .setPlaceholder("localhost, tiktok.com")
          .onChange(async (value) => {
            this.plugin.settings.websiteBlacklist = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("LINK_PREVIEW_API_KEY_NAME"))
      .setDesc(t("LINK_PREVIEW_API_KEY_DESC"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.linkPreviewApiKey || "")
          .onChange(async (value) => {
            const trimmedValue = value.trim();
            if (trimmedValue.length > 0 && trimmedValue.length !== 32) {
              new Notice(t("API_KEY_NOTICE"));
              this.plugin.settings.linkPreviewApiKey = "";
            } else {
              this.plugin.settings.linkPreviewApiKey = trimmedValue;
            }
            await this.plugin.saveSettings();
          })
      );
  }
}