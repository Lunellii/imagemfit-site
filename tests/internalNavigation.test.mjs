import assert from "node:assert/strict";
import test from "node:test";
import { internalNavigationPath } from "../src/lib/internalNavigation.js";

const origin = "https://imagemfit.com.br";

test("preserves internal legacy destinations", () => {
  assert.equal(internalNavigationPath("/portfolio/categoria/123?ref=old", origin), "/portfolio/categoria/123?ref=old");
  assert.equal(internalNavigationPath("/admingustavoif", origin), "/admingustavoif");
});

test("rejects external and ambiguous destinations", () => {
  for (const value of [
    "//example.com",
    "/\\example.com",
    "/%5cexample.com",
    "/%2fexample.com",
    "/portfolio%0d%0aLocation:example.com",
    "https://example.com",
    "/%broken"
  ]) {
    assert.equal(internalNavigationPath(value, origin), null, value);
  }
});
