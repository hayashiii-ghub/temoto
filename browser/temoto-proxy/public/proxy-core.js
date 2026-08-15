export const PROFILE_SCHEMA_VERSION = 1;
export const PRODUCT_ID = "temoto-proxy";
export const PROXY_SCHEMES = ["http", "https", "socks4", "socks5"];
export const DEFAULT_DIAGNOSTIC_URL = "https://example.com/";
export const CONTROL_LEVELS = [
  "not_controllable",
  "controlled_by_other_extensions",
  "controllable_by_this_extension",
  "controlled_by_this_extension",
];

const DEFAULT_PORTS = { http: 8080, https: 443, socks4: 1080, socks5: 1080 };
const MAX_NAME_LENGTH = 80;
const MAX_RULES = 200;
const MAX_BYPASS_ENTRIES = 200;
const MAX_PAC_LENGTH = 200_000;
const MAX_URL_LENGTH = 4_096;
const MAX_IMPORT_LENGTH = 50_000_000;

function parseIPv4(hostname) {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const bytes = parts.map(Number);
  return bytes.every((byte) => byte >= 0 && byte <= 255) ? bytes : null;
}

function parseIPv6(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host.includes(":")) return null;
  const halves = host.split("::");
  if (halves.length > 2) return null;
  const parseHalf = (value) => {
    if (!value) return [];
    const groups = [];
    for (const part of value.split(":")) {
      if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
      groups.push(Number.parseInt(part, 16));
    }
    return groups;
  };
  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] || "");
  if (!left || !right) return null;
  const omitted = halves.length === 2 ? 8 - left.length - right.length : 0;
  if (omitted < 0 || (halves.length === 1 && left.length !== 8)) return null;
  const groups = [...left, ...Array(omitted).fill(0), ...right];
  if (groups.length !== 8) return null;
  return groups.flatMap((group) => [group >>> 8, group & 0xff]);
}

function isPrivateIPv4(bytes) {
  if (!bytes) return false;
  const [a, b] = bytes;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224;
}

function isPrivateIPv6(bytes) {
  if (!bytes) return false;
  const allZero = bytes.every((byte) => byte === 0);
  const loopback = bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1;
  const uniqueLocal = (bytes[0] & 0xfe) === 0xfc;
  const linkOrSiteLocal = bytes[0] === 0xfe && (bytes[1] & 0xc0) >= 0x80;
  const multicast = bytes[0] === 0xff;
  const ipv4Mapped = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  return allZero || loopback || uniqueLocal || linkOrSiteLocal || multicast || (ipv4Mapped && isPrivateIPv4(bytes.slice(12)));
}

function assertPublicDiagnosticDestination(url) {
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  const localName = hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".lan")
    || hostname.endsWith(".home.arpa")
    || !hostname.includes(".") && !hostname.includes(":");
  assertion(
    !localName && !isPrivateIPv4(parseIPv4(hostname)) && !isPrivateIPv6(parseIPv6(hostname)),
    "Diagnostic URL must use a public network destination",
  );
}

function assertion(condition, message) {
  if (!condition) throw new Error(message);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createProfile(overrides = {}) {
  const id = overrides.id || globalThis.crypto?.randomUUID?.() || `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    name: "Local proxy",
    color: "#9974F8",
    kind: "fixed",
    endpointMode: "single",
    endpoints: {
      single: { scheme: "http", host: "127.0.0.1", port: 8080 },
      http: { scheme: "http", host: "127.0.0.1", port: 8080 },
      https: { scheme: "http", host: "127.0.0.1", port: 8080 },
      fallback: { scheme: "socks5", host: "127.0.0.1", port: 1080 },
    },
    bypassList: ["<local>", "localhost", "127.0.0.1"],
    routingRules: [],
    defaultAction: "proxy",
    pac: { source: "inline", value: "function FindProxyForURL(url, host) { return 'DIRECT'; }", mandatory: false },
    auth: { enabled: false, username: "", allowedHosts: [] },
    diagnosticUrl: DEFAULT_DIAGNOSTIC_URL,
    ...overrides,
    endpoints: {
      single: { scheme: "http", host: "127.0.0.1", port: 8080 },
      http: { scheme: "http", host: "127.0.0.1", port: 8080 },
      https: { scheme: "http", host: "127.0.0.1", port: 8080 },
      fallback: { scheme: "socks5", host: "127.0.0.1", port: 1080 },
      ...(overrides.endpoints || {}),
    },
    pac: {
      source: "inline",
      value: "function FindProxyForURL(url, host) { return 'DIRECT'; }",
      mandatory: false,
      ...(overrides.pac || {}),
    },
    auth: { enabled: false, username: "", allowedHosts: [], ...(overrides.auth || {}) },
  };
}

export function normalizeEndpoint(raw, label = "Proxy") {
  assertion(raw && typeof raw === "object", `${label} is required`);
  const scheme = cleanString(raw.scheme).toLowerCase();
  assertion(PROXY_SCHEMES.includes(scheme), `${label} scheme is unsupported`);
  const host = cleanString(raw.host).toLowerCase();
  assertion(host, `${label} host is required`);
  assertion(host.length <= 253, `${label} host is too long`);
  assertion(!/[:/\s]/.test(host.replace(/^\[[0-9a-f:]+\]$/i, "")), `${label} host must not include a URL or port`);
  assertion(/^\[[0-9a-f:]+\]$/i.test(host) || /^[a-z0-9._-]+$/.test(host), `${label} host must use ASCII hostname or IP characters`);
  const numericPort = raw.port === "" || raw.port == null ? DEFAULT_PORTS[scheme] : Number(raw.port);
  assertion(Number.isInteger(numericPort) && numericPort >= 1 && numericPort <= 65535, `${label} port must be between 1 and 65535`);
  return { scheme, host, port: numericPort };
}

function normalizeBypassList(raw) {
  const values = Array.isArray(raw) ? raw : [];
  assertion(values.length <= MAX_BYPASS_ENTRIES, `Bypass list supports up to ${MAX_BYPASS_ENTRIES} entries`);
  return [...new Set(values.map(cleanString).filter(Boolean))].map((entry) => {
    assertion(entry.length <= 256 && !/[\n\r]/.test(entry), "Bypass entries must be single-line Chrome host patterns");
    return entry;
  });
}

function normalizeRule(raw, index) {
  const pattern = cleanString(raw?.pattern);
  assertion(pattern && pattern.length <= 500 && !/[\n\r]/.test(pattern), `Routing rule ${index + 1} needs a valid pattern`);
  const action = cleanString(raw?.action).toLowerCase();
  assertion(["proxy", "direct"].includes(action), `Routing rule ${index + 1} action must be proxy or direct`);
  const id = cleanString(raw.id) || `rule-${index + 1}`;
  assertion(id.length <= 120, `Routing rule ${index + 1} id is too long`);
  return { id, pattern, action };
}

function normalizePac(raw) {
  const source = raw?.source === "url" ? "url" : "inline";
  const value = cleanString(raw?.value);
  assertion(value, "PAC source is required");
  assertion(value.length <= MAX_PAC_LENGTH, "PAC source is too large");
  if (source === "url") {
    assertion(value.length <= MAX_URL_LENGTH, "PAC URL is too long");
    const url = new URL(value);
    assertion(["http:", "https:"].includes(url.protocol), "PAC URL must begin with http:// or https://");
    assertion(!url.username && !url.password, "PAC URL must not contain embedded credentials");
  } else {
    assertion(/\bfunction\s+FindProxyForURL\s*\(/.test(value), "PAC script must define FindProxyForURL");
  }
  return { source, value, mandatory: Boolean(raw?.mandatory) };
}

export function normalizeProfile(raw) {
  assertion(raw && typeof raw === "object", "Profile must be an object");
  const id = cleanString(raw.id);
  const name = cleanString(raw.name);
  assertion(id && id.length <= 120, "Profile id is required");
  assertion(name && name.length <= MAX_NAME_LENGTH, `Profile name must be 1-${MAX_NAME_LENGTH} characters`);
  const kind = ["fixed", "rules", "pac"].includes(raw.kind) ? raw.kind : "fixed";
  const endpointMode = raw.endpointMode === "perProtocol" ? "perProtocol" : "single";
  const endpoints = {};
  if (kind !== "pac") {
    if (endpointMode === "single" || kind === "rules") {
      endpoints.single = normalizeEndpoint(raw.endpoints?.single, "Default proxy");
    } else {
      for (const key of ["http", "https", "fallback"]) {
        const endpoint = raw.endpoints?.[key];
        if (endpoint?.host) endpoints[key] = normalizeEndpoint(endpoint, `${key.toUpperCase()} proxy`);
      }
      assertion(Object.keys(endpoints).length > 0, "At least one protocol proxy is required");
    }
  }
  const bypassList = normalizeBypassList(raw.bypassList);
  const rules = Array.isArray(raw.routingRules) ? raw.routingRules : [];
  assertion(rules.length <= MAX_RULES, `Routing profiles support up to ${MAX_RULES} rules`);
  const routingRules = kind === "rules" ? rules.map(normalizeRule) : [];
  const defaultAction = raw.defaultAction === "direct" ? "direct" : "proxy";
  const pac = kind === "pac" ? normalizePac(raw.pac) : { source: "inline", value: "", mandatory: false };
  const auth = {
    enabled: Boolean(raw.auth?.enabled),
    username: cleanString(raw.auth?.username),
    allowedHosts: [...new Set((Array.isArray(raw.auth?.allowedHosts) ? raw.auth.allowedHosts : [])
      .map(cleanString)
      .map((host) => host.toLowerCase())
      .filter(Boolean))],
  };
  assertion(auth.username.length <= 200, "Proxy username is too long");
  assertion(auth.allowedHosts.length <= 20, "Authentication supports up to 20 proxy hosts");
  auth.allowedHosts.forEach((host) => {
    assertion(host.length <= 253, "Authentication host is too long");
    assertion(/^\[[0-9a-f:]+\]$/i.test(host) || /^[a-z0-9._-]+$/.test(host), "Authentication hosts must be ASCII hostnames or IP addresses");
  });
  const diagnosticUrl = cleanString(raw.diagnosticUrl) || DEFAULT_DIAGNOSTIC_URL;
  assertion(diagnosticUrl.length <= MAX_URL_LENGTH, "Diagnostic URL is too long");
  const diagnostic = new URL(diagnosticUrl);
  assertion(["http:", "https:"].includes(diagnostic.protocol), "Diagnostic URL must begin with http:// or https://");
  assertion(!diagnostic.username && !diagnostic.password, "Diagnostic URL must not contain embedded credentials");
  assertPublicDiagnosticDestination(diagnostic);
  const color = /^#[0-9a-f]{6}$/i.test(raw.color || "") ? raw.color.toUpperCase() : "#9974F8";
  return {
    id,
    name,
    color,
    kind,
    endpointMode,
    endpoints,
    bypassList,
    routingRules,
    defaultAction,
    pac,
    auth,
    diagnosticUrl: diagnostic.toString(),
  };
}

function pacProxyToken(endpoint) {
  const normalized = normalizeEndpoint(endpoint);
  const keyword = {
    http: "PROXY",
    https: "HTTPS",
    socks4: "SOCKS",
    socks5: "SOCKS5",
  }[normalized.scheme];
  return `${keyword} ${normalized.host}:${normalized.port}`;
}

function pacMatcher(pattern) {
  const normalized = cleanString(pattern);
  if (normalized === "<local>") return "isPlainHostName(host)";
  if (/^https?:\/\//i.test(normalized)) {
    return `shExpMatch(url, ${JSON.stringify(normalized)})`;
  }
  if (/^[^/]+:\d+$/.test(normalized)) return `shExpMatch(url, ${JSON.stringify(`*://${normalized}/*`)})`;
  if (normalized.startsWith("*.")) {
    const domain = normalized.slice(2);
    return `(host === ${JSON.stringify(domain)} || dnsDomainIs(host, ${JSON.stringify(`.${domain}`)}))`;
  }
  if (normalized.includes("*")) return `shExpMatch(host, ${JSON.stringify(normalized)})`;
  if (/^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/.test(normalized)) return `isInNet(host, ${JSON.stringify(normalized.split("/")[0])}, ${JSON.stringify(cidrMask(Number(normalized.split("/")[1])) )})`;
  if (normalized.startsWith(".")) {
    const domain = normalized.slice(1);
    return `(host === ${JSON.stringify(domain)} || dnsDomainIs(host, ${JSON.stringify(normalized)}))`;
  }
  return `host === ${JSON.stringify(normalized)}`;
}

function cidrMask(bits) {
  assertion(Number.isInteger(bits) && bits >= 0 && bits <= 32, "CIDR rules must use an IPv4 prefix between 0 and 32");
  const value = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

export function generatePacScript(profile) {
  const normalized = normalizeProfile({ ...profile, kind: "rules" });
  const proxy = pacProxyToken(normalized.endpoints.single);
  const lines = ["function FindProxyForURL(url, host) {"];
  for (const bypass of normalized.bypassList) {
    lines.push(`  if (${pacMatcher(bypass)}) return \"DIRECT\";`);
  }
  for (const rule of normalized.routingRules) {
    lines.push(`  if (${pacMatcher(rule.pattern)}) return ${JSON.stringify(rule.action === "proxy" ? proxy : "DIRECT")};`);
  }
  lines.push(`  return ${JSON.stringify(normalized.defaultAction === "proxy" ? proxy : "DIRECT")};`);
  lines.push("}");
  return lines.join("\n");
}

export function profileToProxyConfig(profile) {
  const normalized = normalizeProfile(profile);
  if (normalized.kind === "pac") {
    return {
      mode: "pac_script",
      pacScript: normalized.pac.source === "url"
        ? { url: normalized.pac.value, mandatory: normalized.pac.mandatory }
        : { data: normalized.pac.value, mandatory: normalized.pac.mandatory },
    };
  }
  if (normalized.kind === "rules") {
    return { mode: "pac_script", pacScript: { data: generatePacScript(normalized), mandatory: false } };
  }
  const rules = { bypassList: normalized.bypassList };
  if (normalized.endpointMode === "single") {
    rules.singleProxy = normalized.endpoints.single;
  } else {
    if (normalized.endpoints.http) rules.proxyForHttp = normalized.endpoints.http;
    if (normalized.endpoints.https) rules.proxyForHttps = normalized.endpoints.https;
    if (normalized.endpoints.fallback) rules.fallbackProxy = normalized.endpoints.fallback;
  }
  return { mode: "fixed_servers", rules };
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function configFingerprint(config) {
  let hash = 2166136261;
  const text = stableStringify(config);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function proxyControlMatches(setting, expectedFingerprint) {
  return Boolean(
    expectedFingerprint
    && setting?.levelOfControl === "controlled_by_this_extension"
    && setting.value
    && configFingerprint(setting.value) === expectedFingerprint,
  );
}

export function sanitizeProfileForSharing(profile) {
  const normalized = normalizeProfile(profile);
  return {
    ...normalized,
    auth: { enabled: normalized.auth.enabled, username: "", allowedHosts: normalized.auth.allowedHosts },
  };
}

export function createExportBundle(profiles, exportedAt = new Date().toISOString()) {
  assertion(Array.isArray(profiles), "Profiles must be an array");
  return {
    product: PRODUCT_ID,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    exportedAt,
    profiles: profiles.map(sanitizeProfileForSharing),
  };
}

export function parseImportBundle(input) {
  if (typeof input === "string") assertion(input.length <= MAX_IMPORT_LENGTH, "Profile export is too large");
  const bundle = typeof input === "string" ? JSON.parse(input) : input;
  assertion(bundle?.product === PRODUCT_ID, "This is not a temoto Proxy export");
  assertion(bundle.schemaVersion === PROFILE_SCHEMA_VERSION, "This profile export uses an unsupported schema version");
  assertion(Array.isArray(bundle.profiles) && bundle.profiles.length <= 200, "Export must contain up to 200 profiles");
  return bundle.profiles.map((profile) => normalizeProfile({ ...profile, diagnosticUrl: DEFAULT_DIAGNOSTIC_URL }));
}

export function statusFromEffectiveState({ activeProfileId, regular, expectedFingerprint }) {
  const level = regular?.levelOfControl || "not_controllable";
  if (!CONTROL_LEVELS.includes(level)) return { tone: "error", code: "unknown", label: "Unknown state" };
  if (level === "controlled_by_other_extensions") return { tone: "error", code: "conflict", label: "Controlled by another extension" };
  if (level === "not_controllable") return { tone: "error", code: "policy", label: "Controlled by browser policy" };
  if (!activeProfileId) {
    if (level === "controlled_by_this_extension") return { tone: "warning", code: "orphaned", label: "Unrecognized temoto setting" };
    return { tone: "neutral", code: "off", label: "Proxy off" };
  }
  if (level !== "controlled_by_this_extension") return { tone: "warning", code: "inactive", label: "Profile not applied" };
  if (expectedFingerprint && configFingerprint(regular.value) !== expectedFingerprint) {
    return { tone: "warning", code: "changed", label: "Proxy settings changed" };
  }
  return { tone: "active", code: "active", label: "Proxy active" };
}

export function credentialsForProxyChallenge(details, profile, credentials, attempts = 0) {
  if (!details?.isProxy || !profile?.auth?.enabled || attempts >= 2) return null;
  if (!credentials || typeof credentials.password !== "string" || !credentials.password) return null;
  const challengerHost = cleanString(details.challenger?.host).toLowerCase();
  const allowedHosts = Array.isArray(profile.auth.allowedHosts) ? profile.auth.allowedHosts.map((host) => cleanString(host).toLowerCase()) : [];
  if (!challengerHost || !allowedHosts.includes(challengerHost)) return null;
  return { username: String(credentials.username || ""), password: credentials.password };
}
