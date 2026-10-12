export type UiLocale = "en";

type Replacements = Record<string, string | number>;

export function getUiLocale(): UiLocale {
  return "en";
}

export function t(source: string, replacements: Replacements = {}): string {
  return source.replace(/\{(\w+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(replacements, key) ? String(replacements[key]) : match
  ));
}

export function localizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  return t(message);
}

export function localizeDocument(root: Document = document): void {
  root.documentElement.lang = getUiLocale();
}
