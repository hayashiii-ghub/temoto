export type ProxyScheme = "http" | "https" | "socks4" | "socks5";

export interface ProxyProfile {
  id: string;
  name: string;
  kind: "fixed" | "pac";
  scheme: ProxyScheme;
  host: string;
  port: number;
  pacUrl: string;
}

export interface ProxyState {
  profiles: ProxyProfile[];
  activeProfileId: string | null;
  status: "off" | "active" | "conflict" | "changed" | "error";
  error?: string;
}

export type SimpleProxyConfig =
  | { mode: "fixed_servers"; rules: { singleProxy: { scheme: ProxyScheme; host: string; port: number } } }
  | { mode: "pac_script"; pacScript: { url: string; mandatory: false } };

const schemes = new Set<ProxyScheme>(["http", "https", "socks4", "socks5"]);
const defaultPorts: Record<ProxyScheme, number> = { http: 80, https: 443, socks4: 1080, socks5: 1080 };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function requiredString(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) throw new Error(`${label} must be 1–${maximum} characters`);
  return value.trim();
}

export function normalizeProxyProfile(raw: unknown): ProxyProfile {
  if (!isRecord(raw)) throw new Error("Proxy profile is invalid");
  const id = requiredString(raw.id, "Profile ID", 120);
  const name = requiredString(raw.name, "Profile name", 80);
  if (raw.kind !== "fixed" && raw.kind !== "pac") throw new Error("Choose a fixed proxy or PAC URL");
  if (raw.kind === "pac") {
    const value = requiredString(raw.pacUrl, "PAC URL", 2048);
    let url: URL;
    try { url = new URL(value); } catch { throw new Error("PAC URL must begin with http:// or https://"); }
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
      throw new Error("PAC URL must use HTTP(S) without embedded credentials");
    }
    return { id, name, kind: "pac", scheme: "http", host: "", port: 80, pacUrl: url.href };
  }
  if (typeof raw.scheme !== "string" || !schemes.has(raw.scheme as ProxyScheme)) throw new Error("Choose HTTP, HTTPS, SOCKS4, or SOCKS5");
  let host = requiredString(raw.host, "Proxy host", 253).toLowerCase();
  if (host.startsWith("[")) {
    try {
      const parsed = new URL(`http://${host}/`);
      if (!/^\[[0-9a-f:.]+\]$/.test(host) || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.port || parsed.username || parsed.password) throw new Error();
      host = parsed.hostname;
    } catch { throw new Error("Proxy host must be an ASCII hostname or IP address without a URL or port"); }
  } else if (!/^[a-z0-9._-]+$/.test(host)) {
    throw new Error("Proxy host must be an ASCII hostname or IP address without a URL or port");
  }
  if (typeof raw.port !== "number" || !Number.isInteger(raw.port) || raw.port < 1 || raw.port > 65535) throw new Error("Proxy port must be between 1 and 65535");
  return { id, name, kind: "fixed", scheme: raw.scheme as ProxyScheme, host, port: raw.port, pacUrl: "" };
}

export function proxyProfileToConfig(profile: ProxyProfile): SimpleProxyConfig {
  const normalized = normalizeProxyProfile(profile);
  return normalized.kind === "pac"
    ? { mode: "pac_script", pacScript: { url: normalized.pacUrl, mandatory: false } }
    : { mode: "fixed_servers", rules: { singleProxy: { scheme: normalized.scheme, host: normalized.host, port: normalized.port } } };
}

export function proxyConfigFingerprint(raw: unknown): string {
  let canonical = raw;
  if (isRecord(raw) && raw.mode === "fixed_servers" && isRecord(raw.rules)) {
    const rules: Record<string, unknown> = { ...raw.rules, bypassList: raw.rules.bypassList ?? [] };
    if (isRecord(raw.rules.singleProxy)) {
      const server = raw.rules.singleProxy;
      const scheme = typeof server.scheme === "string" ? server.scheme : "http";
      rules.singleProxy = { ...server, scheme, host: typeof server.host === "string" ? server.host.toLowerCase() : server.host, port: server.port ?? defaultPorts[scheme as ProxyScheme] };
    }
    canonical = { ...raw, rules };
  } else if (isRecord(raw) && raw.mode === "pac_script" && isRecord(raw.pacScript)) {
    canonical = { ...raw, pacScript: { ...raw.pacScript, mandatory: raw.pacScript.mandatory ?? false } };
  }
  return JSON.stringify(canonical, (_key, value: unknown) => isRecord(value)
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]))
    : value) ?? "undefined";
}

export function isTrustedProxyPopup(sender: { id?: string; url?: string; tab?: unknown } | null | undefined, extensionId: string): boolean {
  if (!extensionId || sender?.id !== extensionId || sender.tab !== undefined || typeof sender.url !== "string") return false;
  try {
    const url = new URL(sender.url);
    return url.protocol === "chrome-extension:" && url.hostname === extensionId && url.pathname === "/index.html" && !url.username && !url.password;
  } catch { return false; }
}
