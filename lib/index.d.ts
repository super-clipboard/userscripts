// Type declarations for @ziuchen/super-clipboard-userscripts.

export interface ManifestItem {
  id: string;
  name: string;
  description?: string;
  author?: string;
  homepage?: string;
  version: string;
  tags?: string[];
  preinstall?: boolean;
  downloadURL: string;
  updateURL?: string;
  sha256?: string;
}

export interface Manifest {
  manifestVersion: 1;
  items: ManifestItem[];
}

export interface MirrorPreset {
  label: string;
  /**
   * URL template containing `{pkg}`, `{version}`, `{path}` placeholders.
   */
  template: string;
}

export type MirrorPresetKey = "npmmirror" | "jsdelivr" | "unpkg";

export const mirrorPresets: Readonly<Record<MirrorPresetKey, MirrorPreset>>;

export const DEFAULT_MANIFEST_PATH: string;
export const PACKAGE_NAME: string;

export interface BuildFileURLOptions {
  pkg?: string;
  version: string;
  path: string;
  preset?: MirrorPresetKey;
  /**
   * Custom URL template; takes precedence over `preset` when provided.
   * Same `{pkg}/{version}/{path}` placeholders apply.
   */
  template?: string;
}

export function buildFileURL(options: BuildFileURLOptions): string;

export interface ScriptFileURLOptions {
  preset?: MirrorPresetKey;
  template?: string;
}

export function scriptFileURL(item: ManifestItem, options?: ScriptFileURLOptions): string;

export function validateManifest(value: unknown): Manifest;

export function findScript(manifest: Manifest, id: string): ManifestItem | undefined;

export function parseNpmmirrorURL(
  url: string,
): { pkg: string; version: string; path: string } | null;
