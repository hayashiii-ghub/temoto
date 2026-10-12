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

export function localizeError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : fallback;
  return t(message || fallback);
}

export function applyDocumentLocale(): void {
  document.documentElement.lang = getUiLocale();
}
