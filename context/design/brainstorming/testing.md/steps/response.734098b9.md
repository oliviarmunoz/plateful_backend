---
timestamp: 'Thu Oct 16 2025 19:26:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_192652.cc82252c.md]]'
content_id: 734098b940910e6ab17370d1bc4454d1b1b2e7e2a89ee1678b2c19bf5263f708
---

# response:

It appears there are two specific failing assertions in your Deno tests, both related to how you're checking the result of `_getFeedback` when feedback *is expected to exist*.

The core issue lies in this pattern:
`assertNotEquals((retrieved as Array<{ error: string }>)[0].error, undefined, "Feedback should exist.");`

Let's break down why this is failing:

Your `_getFeedback` method, based on your type assertions, seems to return:

* `[{ feedback: { ... } }]` when successful (feedback is found).
* `[{ error: "..." }]` when unsuccessful (feedback is not found).

Therefore:

* If `_getFeedback` successfully finds feedback, the first element of the `retrieved` array will have a `feedback` property, and the `error` property will likely be `undefined` (or not exist).
* If `_getFeedback` *fails* to find feedback, the first element of the `retrieved` array will have an `error` property.

**The failing assertions are incorrectly checking for the *presence* of an `error` when feedback *should exist*.**

Here are the specific failing lines and their corrections:

***

### 1. `principle test: submit, view, update, delete`

**Failing line:**

```typescript
    // Action 2: Viewing submitted feedback...
    let retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    // THIS LINE IS INCORRECT:
    assertNotEquals(
      (retrieved as Array<{ error: string }>)[0].error,
      undefined,
      "Feedback should exist.",
    );
```

**Why it fails:** When feedback *should exist*, `_getFeedback` should return an object with a `feedback` property, not an `error` property. Therefore, `(retrieved as Array<{ error: string }>)[0].error` will be `undefined`. `assertNotEquals(undefined, undefined)` is `false`, so the assertion fails because it *expected* an error when it should expect the feedback itself.

**Correction:**
You should check for the existence of the `feedback` property, not the `error` property.

```typescript
    // Action 2: Viewing submitted feedback...
    let retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    // CORRECTED LINE: Check for the feedback object itself
    assertExists(
      (retrieved as Array<{ feedback: any }>)[0].feedback, // Use 'any' or the specific feedback type
      "Feedback should exist.",
    );
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Initial feedback rating should be 3.",
    );
```

***

### 2. `Action: deleteFeedback: delete existing feedback`

**Failing line:**

```typescript
    console.log("Submitting Feedback...");
    await concept.submitFeedback({ author: userA, item: itemX, rating: 5 });
    let retrieved = await concept._getFeedback({ author: userA, item: itemX });
    // THIS LINE IS INCORRECT:
    assertNotEquals(
      (retrieved as Array<{ error: string }>)[0].error,
      undefined,
      "Feedback should exist initially.",
    );
```

**Why it fails:** Same reason as above. When feedback *should exist initially*, `_getFeedback` should return the feedback object, meaning the `error` property will be `undefined`. The `assertNotEquals(undefined, undefined)` fails.

**Correction:**

```typescript
    console.log("Submitting Feedback...");
    await concept.submitFeedback({ author: userA, item: itemX, rating: 5 });
    let retrieved = await concept._getFeedback({ author: userA, item: itemX });
    // CORRECTED LINE: Check for the feedback object itself
    assertExists(
      (retrieved as Array<{ feedback: any }>)[0].feedback, // Use 'any' or the specific feedback type
      "Feedback should exist initially.",
    );
```

***

### Summary of fixes:

1. **In `principle test: submit, view, update, delete`**, change line 23 from:
   ```typescript
   assertNotEquals(
     (retrieved as Array<{ error: string }>)[0].error,
     undefined,
     "Feedback should exist.",
   );
   ```
   To:
   ```typescript
   assertExists(
     (retrieved as Array<{ feedback: any }>)[0].feedback,
     "Feedback should exist.",
   );
   ```

2. **In `Action: deleteFeedback: delete existing feedback`**, change line 254 from:
   ```typescript
   assertNotEquals(
     (retrieved as Array<{ error: string }>)[0].error,
     undefined,
     "Feedback should exist initially.",
   );
   ```
   To:
   ```typescript
   assertExists(
     (retrieved as Array<{ feedback: any }>)[0].feedback,
     "Feedback should exist initially.",
   );
   ```

With these changes, your tests should pass, assuming the `FeedbackConcept` logic itself is correct.

**Minor observation:**
The import `import { privateEncrypt } from "node:crypto";` is present but unused. You can remove it.
