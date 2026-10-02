import test from "node:test";
import assert from "node:assert/strict";
import { workshopEntryEnabled } from "../explorer/config/workshop-entry.mjs";

test("Workshop entry defaults follow the deployment target, not NODE_ENV", () => {
  assert.equal(workshopEntryEnabled("serve", {}), true);
  assert.equal(workshopEntryEnabled("build", {}), false);
  for (const command of ["serve", "build"]) {
    for (const NODE_ENV of ["development", "production"]) {
      for (const VERCEL_ENV of ["production", "preview", "development", "unknown"]) {
        assert.equal(
          workshopEntryEnabled(command, { VERCEL_ENV, NODE_ENV }),
          ["preview", "development"].includes(VERCEL_ENV),
        );
      }
    }
  }
});

test("explicit true/false override every default; invalid flags fail configuration", () => {
  for (const command of ["serve", "build"]) {
    for (const VERCEL_ENV of [undefined, "production", "preview", "development"]) {
      for (const WORKSHOP_ENTRY_ENABLED of ["true", "false"]) {
        assert.equal(
          workshopEntryEnabled(command, { VERCEL_ENV, WORKSHOP_ENTRY_ENABLED }),
          WORKSHOP_ENTRY_ENABLED === "true",
        );
      }
    }
  }
  assert.equal(workshopEntryEnabled("build", { WORKSHOP_ENTRY_ENABLED: "" }), false);
  for (const WORKSHOP_ENTRY_ENABLED of ["1", "0", "TRUE", " false ", "yes"]) {
    assert.throws(
      () => workshopEntryEnabled("build", { WORKSHOP_ENTRY_ENABLED }),
      /must be "true" or "false"/,
    );
  }
});
