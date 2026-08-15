export function normalizeResetOrigin(value: string): string {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isOriginOnly = url.pathname === "/" && !url.search && !url.hash;
    if (!isHttp || !isOriginOnly || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new Error("Site Reset is unavailable on this page");
  }
}
