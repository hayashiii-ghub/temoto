import test from "node:test";
import assert from "node:assert/strict";
import { isValidHttpOrigin, replaceOrigin } from "../src/url-utils.ts";

test("replaceOrigin preserves path, query and hash", () => {
  assert.equal(
    replaceOrigin("http://localhost:3000/products/12?preview=1#details", "https://staging.example.com"),
    "https://staging.example.com/products/12?preview=1#details",
  );
});

test("isValidHttpOrigin accepts origins and rejects paths", () => {
  assert.equal(isValidHttpOrigin("http://localhost:3000"), true);
  assert.equal(isValidHttpOrigin("https://staging.example.com"), true);
  assert.equal(isValidHttpOrigin("https://example.com/path"), false);
  assert.equal(isValidHttpOrigin("javascript:alert(1)"), false);
});
