---
timestamp: 'Thu Oct 16 2025 23:28:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_232800.cdc82530.md]]'
content_id: 5d7b4205540750f7dcf5ff8571a0bb653d812f96c4d1fc49d4a0baabdadf791f
---

# file: src/utils/database.ts

```typescript
// Assume this file provides getDb and freshID as described.
// For the purpose of this exercise, we'll provide minimal mock implementations
// if they aren't fully detailed in the prompt.
import { MongoClient, Db } from "npm:mongodb";
import { ID } from "./types.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

export function freshID(): ID {
  return `id:${crypto.randomUUID()}` as ID;
}

let _db: Db | null = null;
let _client: MongoClient | null = null;

export async function getDb(): Promise<[Db, MongoClient]> {
  if (_db && _client) {
    return [_db, _client];
  }

  const MONGODB_URI = Deno.env.get("MONGODB_URI") || "mongodb://localhost:27017/concept_db";
  console.log(`Connecting to MongoDB at ${MONGODB_URI}`);

  _client = new MongoClient(MONGODB_URI);
  await _client.connect();
  _db = _client.db();
  console.log("Connected to MongoDB");

  // Ensure unique indexes for key fields
  // In a real app, this might be handled by migration scripts,
  // but for development, it's convenient to do it on connect.
  // For UserTastePreferences, we need a unique index on _id for the users collection
  // (which MongoDB provides by default for _id)
  // No other unique indexes seem directly necessary from the spec for this concept.

  return [_db, _client];
}

export async function closeDb() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
    console.log("MongoDB connection closed.");
  }
}

// Added testDb for consistent test environment setup
export async function testDb(): Promise<[Db, MongoClient]> {
    const [db, client] = await getDb();
    // Drop all collections in the test database before each test suite
    // (Deno.test.beforeAll handles dropping it before the entire file,
    // but for isolated `Deno.test` calls, we want to ensure clean state.)
    // Note: The prompt says "The database is already automatically dropped before every test file using the Deno.test.beforeAll hook: do not include any additional manipulation of the database for this purpose."
    // This implies that `testDb` itself might be called within a `Deno.test.beforeEach` or similar setup,
    // or that `Deno.test` as a top-level function runs isolated with a fresh db.
    // For safety and adhering to `testDb` being distinct from `getDb` for testing,
    // a database wipe for testing is usually good. Assuming a unique test DB name for each run or a shared but wiped one.
    // Given the prompt, I'll rely on the external test runner's `beforeAll` for cleanup, so `testDb` can just return `getDb`.
    return [db, client];
}
```

***
