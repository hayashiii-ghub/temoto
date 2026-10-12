export interface PageIdentity {
  origin?: unknown;
}

export function isValidHttpOrigin(value: unknown): boolean {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

const PAGE_DEPENDENT_TOOLS = new Set(["screenshot", "speed", "inspect"]);

export function isPageToolAvailable(tool: string, page?: PageIdentity | null): boolean {
  return !PAGE_DEPENDENT_TOOLS.has(tool) || isValidHttpOrigin(page?.origin);
}
