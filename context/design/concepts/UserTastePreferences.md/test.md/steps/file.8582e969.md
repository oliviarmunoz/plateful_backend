---
timestamp: 'Thu Oct 16 2025 23:17:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231753.c694b450.md]]'
content_id: 8582e969d0ca365ac5c122768c0c3a13cf793d8db8369be893922b013ba0589c
---

# file: src/utils/types.ts

```typescript
export type ID = string & { __brand: "ID" };
export type Empty = Record<PropertyKey, never>;
```
