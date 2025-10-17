---
timestamp: 'Thu Oct 16 2025 23:14:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231437.b5eef090.md]]'
content_id: 1c48e836ca262d7675dc758572c09c03de6e7d123dc3d37bdd94a8807674b4b9
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
```
