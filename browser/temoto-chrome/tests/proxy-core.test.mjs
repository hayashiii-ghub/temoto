import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedProxyPopup, normalizeProxyProfile, proxyConfigFingerprint, proxyProfileToConfig } from "../src/extension/proxy-core.ts";

const fixed = { id: "local", name: " Local proxy ", kind: "fixed", scheme: "http", host: "PROXY.TEST", port: 8080, pacUrl: "" };

test("simple fixed profiles support only the four approved proxy schemes", () => {
  for (const scheme of ["http", "https", "socks4", "socks5"]) {
    const profile = normalizeProxyProfile({ ...fixed, scheme, password: "do not store", routingRules: [{ pattern: "*" }] });
    assert.equal(profile.name, "Local proxy");
    assert.equal(profile.host, "proxy.test");
    assert.deepEqual(Object.keys(profile).sort(), ["host", "id", "kind", "name", "pacUrl", "port", "scheme"]);
    assert.deepEqual(proxyProfileToConfig(profile), { mode: "fixed_servers", rules: { singleProxy: { scheme, host: "proxy.test", port: 8080 } } });
  }
});

test("PAC profiles validate a URL and do not accept inline scripts or embedded credentials", () => {
  const profile = normalizeProxyProfile({ ...fixed, kind: "pac", pacUrl: "https://proxy.test/config.pac" });
  assert.deepEqual(proxyProfileToConfig(profile), { mode: "pac_script", pacScript: { url: profile.pacUrl, mandatory: false } });
  for (const pacUrl of ["function FindProxyForURL(){}", "file:///tmp/proxy.pac", "https://user:password@proxy.test/config.pac", ""]) {
    assert.throws(() => normalizeProxyProfile({ ...fixed, kind: "pac", pacUrl }));
  }
});

test("unknown profiles, unsupported kinds, invalid endpoints and ports fail before use", () => {
  for (const raw of [null, [], {}, { ...fixed, kind: "rules" }, { ...fixed, scheme: "quic" }, { ...fixed, host: "https://proxy.test" }, { ...fixed, host: "proxy.test:8080" }, { ...fixed, port: "8080" }, { ...fixed, port: 0 }, { ...fixed, port: 65536 }]) {
    assert.throws(() => normalizeProxyProfile(raw));
  }
  assert.equal(normalizeProxyProfile({ ...fixed, host: "[2001:DB8::1]" }).host, "[2001:db8::1]");
  assert.throws(() => normalizeProxyProfile({ ...fixed, host: "[::1]/abc]" }), /without a URL or port/);
});

test("fingerprints tolerate Chrome defaults but detect a different endpoint or bypass setting", () => {
  const config = proxyProfileToConfig(normalizeProxyProfile({ ...fixed, port: 80 }));
  const chromeDefault = { rules: { bypassList: [], singleProxy: { host: "proxy.test" } }, mode: "fixed_servers" };
  assert.equal(proxyConfigFingerprint(config), proxyConfigFingerprint(chromeDefault));
  assert.notEqual(proxyConfigFingerprint(config), proxyConfigFingerprint({ ...config, rules: { singleProxy: { scheme: "http", host: "other.test", port: 80 } } }));
  assert.notEqual(proxyConfigFingerprint(config), proxyConfigFingerprint({ ...config, rules: { ...config.rules, bypassList: ["private.test"] } }));
});

test("Proxy state and mutations are restricted to this extension's popup", () => {
  const trusted = { id: "temoto", url: "chrome-extension://temoto/index.html" };
  assert.equal(isTrustedProxyPopup(trusted, "temoto"), true);
  assert.equal(isTrustedProxyPopup({ ...trusted, url: trusted.url + "?preview=1" }, "temoto"), true);
  for (const sender of [{ ...trusted, tab: { id: 1 } }, { ...trusted, id: "other" }, { ...trusted, url: "https://example.com/index.html" }, { ...trusted, url: "chrome-extension://temoto/capture.html" }, { id: "temoto" }, null]) {
    assert.equal(isTrustedProxyPopup(sender, "temoto"), false);
  }
});
