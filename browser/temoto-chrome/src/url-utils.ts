export interface PageIdentity {
  origin?: unknown;
}

export function replaceOrigin(currentUrl: string | URL, targetOrigin: string | URL): string {
  const current = new URL(currentUrl);
  const target = new URL(targetOrigin);
  current.protocol = target.protocol;
  current.hostname = target.hostname;
  current.port = target.port;
  return current.toString();
}

export function isValidHttpOrigin(value: unknown): boolean {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

const PAGE_DEPENDENT_TOOLS = new Set(["screenshot", "speed", "environment", "reset", "inspect"]);

export function isPageToolAvailable(tool: string, page?: PageIdentity | null): boolean {
  return !PAGE_DEPENDENT_TOOLS.has(tool) || isValidHttpOrigin(page?.origin);
}
