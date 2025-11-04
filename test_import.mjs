const concepts = await import('./src/concepts/concepts.ts');
console.log('[Test] Concepts loaded');
const syncs = await import('./src/syncs/syncs.ts');
console.log('[Test] Syncs loaded, count:', Object.keys(syncs.default || {}).length);
