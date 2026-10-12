import test from "node:test";
import assert from "node:assert/strict";
import { isValidHttpOrigin } from "../src/url-utils.ts";

test("isValidHttpOrigin accepts origins and rejects paths", () => {
  assert.equal(isValidHttpOrigin("http://localhost:3000"), true);
  assert.equal(isValidHttpOrigin("https://staging.example.com"), true);
  assert.equal(isValidHttpOrigin("https://example.com/path"), false);
  assert.equal(isValidHttpOrigin("javascript:alert(1)"), false);
});
