export function replaceOrigin(currentUrl, targetOrigin) {
  const current = new URL(currentUrl);
  const target = new URL(targetOrigin);
  current.protocol = target.protocol;
  current.hostname = target.hostname;
  current.port = target.port;
  return current.toString();
}

export function isValidHttpOrigin(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

const PAGE_DEPENDENT_TOOLS = new Set(["screenshot", "speed", "environment", "reset", "inspect"]);

export function isPageToolAvailable(tool, page) {
  return !PAGE_DEPENDENT_TOOLS.has(tool) || isValidHttpOrigin(page?.origin);
}
