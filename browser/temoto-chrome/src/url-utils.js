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
