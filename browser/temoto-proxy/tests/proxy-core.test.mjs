import assert from "node:assert/strict";
import test from "node:test";
import {
  configFingerprint,
  credentialsForProxyChallenge,
  createExportBundle,
  createProfile,
  generatePacScript,
  normalizeEndpoint,
  normalizeProfile,
  parseImportBundle,
  profileToProxyConfig,
  proxyControlMatches,
  statusFromEffectiveState,
} from "../public/proxy-core.js";

test("fixed profiles compile to a single Chrome proxy without mutating input", () => {
  const profile = createProfile({ name: "Charles", bypassList: ["<local>", "*.internal.test"] });
  const snapshot = structuredClone(profile);
  assert.deepEqual(profileToProxyConfig(profile), {
    mode: "fixed_servers",
    rules: {
      singleProxy: { scheme: "http", host: "127.0.0.1", port: 8080 },
      bypassList: ["<local>", "*.internal.test"],
    },
  });
  assert.deepEqual(profile, snapshot);
});

test("per-protocol profiles preserve independent endpoints", () => {
  const profile = createProfile({
    endpointMode: "perProtocol",
    endpoints: {
      http: { scheme: "http", host: "proxy.test", port: 8080 },
      https: { scheme: "https", host: "secure.test", port: 443 },
      fallback: { scheme: "socks5", host: "socks.test", port: 1080 },
    },
  });
  const config = profileToProxyConfig(profile);
  assert.equal(config.rules.proxyForHttp.host, "proxy.test");
  assert.equal(config.rules.proxyForHttps.scheme, "https");
  assert.equal(config.rules.fallbackProxy.scheme, "socks5");
});

test("routing profiles generate deterministic PAC rules with a safe fallback", () => {
  const profile = createProfile({
    kind: "rules",
    bypassList: ["<local>", "localhost"],
    routingRules: [
      { id: "one", pattern: "*.staging.test", action: "proxy" },
      { id: "two", pattern: "assets.staging.test", action: "direct" },
    ],
    defaultAction: "direct",
  });
  const script = generatePacScript(profile);
  assert.match(script, /isPlainHostName\(host\)/);
  assert.match(script, /dnsDomainIs\(host, "\.staging\.test"\)/);
  assert.match(script, /return "PROXY 127\.0\.0\.1:8080"/);
  assert.match(script, /return "DIRECT";\n}/);
  assert.deepEqual(profileToProxyConfig(profile), {
    mode: "pac_script",
    pacScript: { data: script, mandatory: false },
  });
});

test("PAC profiles support inline scripts and remote PAC URLs", () => {
  const inline = createProfile({ kind: "pac" });
  assert.equal(profileToProxyConfig(inline).pacScript.data, inline.pac.value);
  const remote = createProfile({ kind: "pac", pac: { source: "url", value: "https://proxy.test/config.pac", mandatory: true } });
  assert.deepEqual(profileToProxyConfig(remote).pacScript, { url: "https://proxy.test/config.pac", mandatory: true });
});

test("invalid proxy endpoints and PAC sources fail before Chrome is changed", () => {
  assert.throws(() => normalizeEndpoint({ scheme: "http", host: "http://proxy.test", port: 8080 }), /must not include/);
  assert.throws(() => normalizeEndpoint({ scheme: "ftp", host: "proxy.test", port: 21 }), /unsupported/);
  assert.throws(() => normalizeEndpoint({ scheme: "http", host: "proxy.test", port: 70000 }), /between 1 and 65535/);
  assert.throws(() => normalizeProfile(createProfile({ kind: "pac", pac: { source: "inline", value: "return DIRECT" } })), /FindProxyForURL/);
  assert.throws(() => normalizeProfile(createProfile({ kind: "pac", pac: { source: "url", value: "https://user:secret@proxy.test/config.pac" } })), /credentials/);
  assert.throws(() => normalizeProfile(createProfile({ diagnosticUrl: "https://user:secret@health.test/" })), /credentials/);
  for (const diagnosticUrl of [
    "http://localhost/status",
    "http://localhost./status",
    "http://service.local/status",
    "http://127.0.0.1/status",
    "http://2130706433/status",
    "http://10.0.0.1/status",
    "http://169.254.169.254/latest/meta-data/",
    "http://192.168.1.1/status",
    "http://[::1]/status",
    "http://[::ffff:127.0.0.1]/status",
    "http://[fc00::1]/status",
    "http://[fe80::1]/status",
  ]) {
    assert.throws(() => normalizeProfile(createProfile({ diagnosticUrl })), /public network destination/);
  }
  assert.throws(() => normalizeProfile(createProfile({ auth: { enabled: true, username: "dev", allowedHosts: [`${"a".repeat(254)}.test`] } })), /too long/);
  assert.throws(() => normalizeProfile(createProfile({ kind: "rules", routingRules: [{ id: "x".repeat(121), pattern: "example.test", action: "proxy" }] })), /id is too long/);
});

test("exports validate profiles and remove usernames and every credential-like field", () => {
  const profile = createProfile({ auth: { enabled: true, username: "developer", password: "secret", allowedHosts: ["proxy.test"] } });
  const bundle = createExportBundle([profile], "2026-08-14T00:00:00.000Z");
  assert.equal(bundle.profiles[0].auth.enabled, true);
  assert.equal(bundle.profiles[0].auth.username, "");
  assert.deepEqual(bundle.profiles[0].auth.allowedHosts, ["proxy.test"]);
  assert.equal("password" in bundle.profiles[0].auth, false);
  assert.deepEqual(parseImportBundle(JSON.stringify(bundle)), bundle.profiles);
});

test("imports reset diagnostic destinations instead of trusting shared network targets", () => {
  const profile = createProfile({ diagnosticUrl: "https://attacker.example/redirect" });
  const bundle = createExportBundle([profile], "2026-08-14T00:00:00.000Z");
  const [imported] = parseImportBundle(JSON.stringify(bundle));
  assert.equal(imported.diagnosticUrl, "https://example.com/");
});

test("effective state exposes conflicts, unmanaged settings, and verified activation", () => {
  const profile = createProfile();
  const config = profileToProxyConfig(profile);
  assert.equal(statusFromEffectiveState({ activeProfileId: null, regular: { levelOfControl: "controllable_by_this_extension" } }).code, "off");
  assert.equal(statusFromEffectiveState({ activeProfileId: profile.id, regular: { levelOfControl: "controlled_by_other_extensions" } }).code, "conflict");
  assert.equal(statusFromEffectiveState({ activeProfileId: profile.id, regular: { levelOfControl: "not_controllable" } }).code, "policy");
  assert.equal(statusFromEffectiveState({ activeProfileId: profile.id, expectedFingerprint: configFingerprint(config), regular: { levelOfControl: "controlled_by_this_extension", value: config } }).code, "active");
});

test("configuration fingerprints are stable across property order", () => {
  assert.equal(configFingerprint({ mode: "direct", extra: { b: 2, a: 1 } }), configFingerprint({ extra: { a: 1, b: 2 }, mode: "direct" }));
});

test("authentication answers only bounded proxy challenges from explicit hosts", () => {
  const profile = createProfile({ auth: { enabled: true, username: "dev", allowedHosts: ["proxy.test"] } });
  const credentials = { username: "dev", password: "session-secret" };
  const challenge = { isProxy: true, challenger: { host: "PROXY.TEST", port: 8080 } };
  assert.deepEqual(credentialsForProxyChallenge(challenge, profile, credentials, 0), credentials);
  assert.equal(credentialsForProxyChallenge({ ...challenge, isProxy: false }, profile, credentials, 0), null);
  assert.equal(credentialsForProxyChallenge({ isProxy: true, challenger: { host: "evil.test" } }, profile, credentials, 0), null);
  assert.equal(credentialsForProxyChallenge(challenge, profile, credentials, 2), null);
  assert.equal(credentialsForProxyChallenge(challenge, profile, { username: "dev", password: "" }, 0), null);
});

test("proxy authentication requires temoto to own the unchanged effective setting", () => {
  const profile = createProfile();
  const config = profileToProxyConfig(profile);
  const fingerprint = configFingerprint(config);
  assert.equal(proxyControlMatches({ levelOfControl: "controlled_by_this_extension", value: config }, fingerprint), true);
  assert.equal(proxyControlMatches({ levelOfControl: "controlled_by_other_extensions", value: config }, fingerprint), false);
  assert.equal(proxyControlMatches({ levelOfControl: "not_controllable", value: config }, fingerprint), false);
  assert.equal(proxyControlMatches({ levelOfControl: "controlled_by_this_extension", value: { mode: "direct" } }, fingerprint), false);
  assert.equal(proxyControlMatches({ levelOfControl: "controlled_by_this_extension", value: config }, null), false);
});
