console.log("[Test] Starting import test...");
try {
  const syncs = await import("./src/syncs/syncs.ts");
  console.log("[Test] Import successful. Type:", typeof syncs);
  console.log("[Test] Has default:", "default" in syncs);
  console.log("[Test] Default type:", typeof syncs.default);
  console.log("[Test] Default keys:", Object.keys(syncs.default || {}).length);
  if (syncs.default && Object.keys(syncs.default).length > 0) {
    console.log("[Test] First 5 keys:", Object.keys(syncs.default).slice(0, 5));
  }
} catch (e) {
  console.error("[Test] Import error:", e);
}
