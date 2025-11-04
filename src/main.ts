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

// Ensure @concepts is fully initialized before loading syncs
// Access the concepts to ensure they're ready
console.log("[Main] Verifying concepts are ready...");
console.log("[Main] Concepts available:", {
  Feedback: !!concepts.Feedback,
  Requesting: !!concepts.Requesting,
  UserAuthentication: !!concepts.UserAuthentication,
  UserTastePreferences: !!concepts.UserTastePreferences,
});

// Small delay to ensure module evaluation completes
await new Promise((resolve) => setTimeout(resolve, 100));

// Dynamic import to ensure @concepts is fully initialized before loading syncs
// This prevents circular dependency issues where syncs.ts imports @concepts
console.log("[Main] About to dynamically import syncs...");
let syncs;
try {
  // Use import with cache busting via reload flag won't work in runtime
  // Instead, we'll import and check if it's properly populated
  const syncsModule = await import("@syncs");
  console.log(
    "[Main] Syncs module imported. Has default:",
    "default" in syncsModule,
  );
  console.log("[Main] Syncs module keys:", Object.keys(syncsModule));
  syncs = syncsModule.default;
  console.log("[Main] Syncs default type:", typeof syncs);
  console.log("[Main] Syncs default:", syncs);

  // If syncs is empty, try forcing a fresh import
  if (!syncs || Object.keys(syncs).length === 0) {
    console.warn(
      "[Main] Syncs is empty! This might be a module caching issue.",
    );
    console.warn(
      "[Main] Try running with: deno run --reload --allow-net --allow-write --allow-read --allow-sys --allow-env src/main.ts",
    );
  }
} catch (error) {
  console.error("[Main] Error importing syncs:", error);
  console.error(
    "[Main] Error stack:",
    error instanceof Error ? error.stack : String(error),
  );
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
