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
// Since @concepts has top-level await, we need to explicitly wait for it to be ready
console.log("[Main] Verifying concepts are ready...");
console.log("[Main] Concepts module:", concepts);
console.log("[Main] Concepts available:", {
  Feedback: !!concepts.Feedback,
  Requesting: !!concepts.Requesting,
  UserAuthentication: !!concepts.UserAuthentication,
  UserTastePreferences: !!concepts.UserTastePreferences,
  db: !!concepts.db,
});

// Force concepts to be fully evaluated by accessing all exports
// This ensures the top-level await in concepts.ts has completed
const _feedback = concepts.Feedback;
const _requesting = concepts.Requesting;
const _userAuth = concepts.UserAuthentication;
const _tastePrefs = concepts.UserTastePreferences;
const _db = concepts.db;
const _engine = concepts.Engine;

console.log(
  "[Main] Concepts accessed - Feedback:",
  typeof _feedback,
  !!_feedback,
);
console.log(
  "[Main] Concepts accessed - Requesting:",
  typeof _requesting,
  !!_requesting,
);
console.log("[Main] Engine:", typeof _engine, !!_engine);

// Ensure concepts module is fully resolved by importing it again
// This forces any pending module evaluation to complete
await import("@concepts");

// Small delay to ensure any async module evaluation completes
await new Promise((resolve) => setTimeout(resolve, 100));

// Dynamic import to ensure @concepts is fully initialized before loading syncs
// This prevents circular dependency issues where syncs.ts imports @concepts
console.log("[Main] About to dynamically import syncs...");
let syncs;
try {
  // Use import map alias - this should work better with Deno's module resolution
  console.log("[Main] Importing syncs using @syncs alias...");
  const syncsModule = await import("@syncs");
  console.log(
    "[Main] Syncs module imported. Has default:",
    "default" in syncsModule,
  );
  console.log("[Main] Syncs module keys:", Object.keys(syncsModule));
  const getSyncs = syncsModule.default;
  console.log("[Main] Syncs default type:", typeof getSyncs);
  console.log("[Main] Syncs default value:", getSyncs);

  // If it's a function, call it to get the syncs
  if (typeof getSyncs === "function") {
    console.log("[Main] Calling getSyncs() to retrieve syncs...");
    try {
      syncs = getSyncs();
      console.log(
        "[Main] getSyncs() returned syncs with",
        Object.keys(syncs).length,
        "keys",
      );
    } catch (error) {
      console.error("[Main] Error calling getSyncs():", error);
      throw error;
    }
  } else if (getSyncs && typeof getSyncs === "object") {
    // If it's already an object (old cached version)
    console.warn(
      "[Main] WARNING: Got object instead of function - module might be cached!",
    );
    console.warn("[Main] Object keys:", Object.keys(getSyncs));
    syncs = getSyncs;

    // If syncs is empty, this is definitely a caching issue
    if (Object.keys(syncs).length === 0) {
      console.error(
        "[Main] ERROR: Module returned empty object! This indicates a caching issue.",
      );
      console.error(
        "[Main] The syncs.ts module was likely cached from a previous failed evaluation.",
      );
      console.error(
        "[Main] On Render, try:",
      );
      console.error("  1. Clear the build cache in Render dashboard");
      console.error("  2. Or redeploy the service");
      console.error("  3. Or ensure --reload flag is working");
      throw new Error(
        "Syncs module returned empty object - likely a caching issue. Please redeploy or clear cache.",
      );
    }
  } else {
    console.error(
      "[Main] ERROR: Unexpected syncs default type:",
      typeof getSyncs,
    );
    throw new Error(
      `Unexpected syncs module default export type: ${typeof getSyncs}`,
    );
  }

  console.log("[Main] Final syncs count:", Object.keys(syncs).length);
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
