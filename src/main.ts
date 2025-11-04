/**
 * Entry point for an application built with concepts + synchronizations.
 * Requires the Requesting concept as a bootstrap concept.
 * Please run "deno run import" or "generate_imports.ts" to prepare "@concepts".
 */
import * as concepts from "@concepts";

// Use the following line instead to run against the test database, which resets each time.
// import * as concepts from "@test-concepts";

const { Engine } = concepts;
import { Logging } from "@engine";
import { startRequestingServer } from "@concepts/Requesting/RequestingConcept.ts";

// Dynamic import to ensure @concepts is fully initialized before loading syncs
// This prevents circular dependency issues where syncs.ts imports @concepts
console.log("[Main] About to dynamically import syncs...");
let syncs;
try {
  const syncsModule = await import("@syncs");
  console.log(
    "[Main] Syncs module imported. Has default:",
    "default" in syncsModule,
  );
  console.log("[Main] Syncs module keys:", Object.keys(syncsModule));
  syncs = syncsModule.default;
  console.log("[Main] Syncs default type:", typeof syncs);
  console.log("[Main] Syncs default:", syncs);
} catch (error) {
  console.error("[Main] Error importing syncs:", error);
  throw error;
}

console.log(
  `[Main] Imported syncs:`,
  Object.keys(syncs).length,
  "syncs:",
  Object.keys(syncs),
);

/**
 * Available logging levels:
 *   Logging.OFF
 *   Logging.TRACE - display a trace of the actions.
 *   Logging.VERBOSE - display full record of synchronization.
 */
Engine.logging = Logging.TRACE;

// Register synchronizations
Engine.register(syncs);

// Start a server to provide the Requesting concept with external/system actions.
startRequestingServer(concepts);
