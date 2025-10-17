---
timestamp: 'Thu Oct 16 2025 19:43:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_194307.dddee8a0.md]]'
content_id: 1d7d0a65ef8a1a9076da743df22407ea91640633a7b2a91fdbb083493264c3f4
---

# file: src/concepts/Feedback/FeedbackConcept.test.ts

```typescript
import {
  assert,
  assertEquals,
  assertExists,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import FeedbackConcept from "./FeedbackConcept.ts";
import { ID } from "@utils/types.ts";
// import { privateEncrypt } from "node:crypto"; // This import is unused and can be removed.

Deno.test(
  "principle test: submit, view, update, delete",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const testUser = "user:PrincipleTester" as ID;
    const testItem = "item:PrincipleProduct" as ID;

    console.log("Action 1: Submitting initial feedback of rating 3...");
    const submitResult = await concept.submitFeedback({
      author: testUser,
      item: testItem,
      rating: 3,
    });
    assertExists(
      (submitResult as { feedback: ID }).feedback,
      "Submit should be successful.",
    );

    console.log("Action 2: Viewing submitted feedback...");
    let retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    // FIX START: Changed assertNotEquals to assertExists to check for the presence of feedback data.
    // Original: assertNotEquals((retrieved as Array<{ error: string }>)[0].error, undefined, "Feedback should exist.");
    assertExists(
      (retrieved as Array<{ feedback: any }>)[0].feedback, // Expecting feedback, not an error.
      "Feedback should exist.",
    );
    // FIX END
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Initial feedback rating should be 3.",
    );

    // 3. Update Feedback
    console.log("Action 3: Updating feedback to rating 5...");
    const updateResult = await concept.updateFeedback({
      author: testUser,
      item: testItem,
      newRating: 5,
    });
    assertExists(
      (updateResult as { feedback: ID }).feedback,
      "Update should be successful.",
    );

    // 4. View Updated Feedback
    console.log("Action 4: Viewing updated feedback...");
    retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    console.log("Retrieved updated feedback:", retrieved);
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      5,
      "Feedback rating should be updated to 5.",
    );

    // 5. Delete Feedback
    console.log("Action 5: Deleting feedback...");
    const deleteResult = await concept.deleteFeedback({
      author: testUser,
      item: testItem,
    });
    console.log("Delete result:", deleteResult);
    assertEquals(
      (deleteResult as { successful: boolean }).successful,
      true,
      "Delete should be successful.",
    );

    // 6. Verify Feedback is Deleted
    console.log("Action 6: Verifying feedback is deleted...");
    retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    assertExists(
      (retrieved as Array<{ error: string }>)[0].error,
      "Feedback should no longer exist after deletion.",
    );
    assert(
      (retrieved as Array<{ error: string }>)[0].error.includes(
        "No feedback found",
      ),
      "Error message should confirm no feedback.",
    );
    console.log(
      "Submitted, viewed, updated, and deleted Feedback successfully.",
    );
    await client.close();
  },
);

Deno.test("Action submitFeedback: should successfully submit feedback", async () => {
  const [db, client] = await testDb();
  const concept = new FeedbackConcept(db);

  const userA = "user:Alice" as ID;
  const itemX = "item:ProductX" as ID;

  const result = await concept.submitFeedback({
    author: userA,
    item: itemX,
    rating: 4,
  });
  console.log("Submitting Feedback: ", result);

  assertExists(
    (result as { feedback: ID }).feedback,
    "Should return a feedback ID on success.",
  );

  const retrieved = await concept._getFeedback({ author: userA, item: itemX });

  console.log("Retrieved feedback:", retrieved);
  assertEquals(
    (retrieved as Array<{ feedback: { _id: ID; rating: number } }>)[0].feedback
      .rating,
    4,
    "Retrieved feedback rating should match submitted rating.",
  );
  assertEquals(
    (retrieved as Array<{ feedback: { _id: ID; author: ID } }>)[0].feedback
      .author,
    userA,
    "Retrieved feedback author should match submitted author.",
  );
  assertEquals(
    (retrieved as Array<{ feedback: { _id: ID; target: ID } }>)[0].feedback
      .target,
    itemX,
    "Retrieved feedback item should match submitted item.",
  );
  console.log("Feedback successfully received.");
  await client.close();
});

Deno.test(
  "Action submitFeedback: invalid rating",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;
    const itemY = "item:ProductY" as ID;
    const resultTooLow = await concept.submitFeedback({
      author: userA,
      item: itemY,
      rating: 0,
    });

    console.log("Submitting invalid rating (too low)...");
    assertExists(
      (resultTooLow as { error: string }).error,
      "Should return an error for rating -1.",
    );
    assert(
      (resultTooLow as { error: string }).error.includes("Rating must be"),
      "Error message should indicate invalid rating.",
    );

    const resultTooHigh = await concept.submitFeedback({
      author: userA,
      item: itemY,
      rating: 6,
    });
    console.log("Successfully returned error message.");
    console.log("Submitting invalid rating (too high)...");
    assertExists(
      (resultTooHigh as { error: string }).error,
      "Should return an error for rating 6.",
    );
    assert(
      (resultTooHigh as { error: string }).error.includes("Rating must be"),
      "Error message should indicate invalid rating.",
    );
    // Verify no feedback was actually created
    const retrieved = await concept._getFeedback({
      author: userA,
      item: itemY,
    });
    assertExists(
      (retrieved as Array<{ error: string }>)[0].error,
      "No feedback should have been created.",
    );
    console.log("Successfully returned error message.");
    await client.close();
  },
);

Deno.test(
  "Action submitFeedback: duplicate feedback",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userB = "user:Bob" as ID;
    const itemX = "item:ProductX" as ID;

    console.log("Submitting first feedback...");
    await concept.submitFeedback({ author: userB, item: itemX, rating: 5 });
    const firstSubmission = await concept._getFeedback({
      author: userB,
      item: itemX,
    });
    console.log("Feedback successfully received.");
    assertEquals(
      (firstSubmission as Array<{ feedback: { rating: number } }>)[0].feedback
        .rating,
      5,
      "Initial feedback should be 5.",
    );

    // Attempt to submit duplicate feedback
    const duplicateResult = await concept.submitFeedback({
      author: userB,
      item: itemX,
      rating: 3,
    });
    console.log("Submitting second feedback...");
    assertExists(
      (duplicateResult as { error: string }).error,
      "Should return an error for duplicate feedback.",
    );
    assert(
      (duplicateResult as { error: string }).error.includes("already exists"),
      "Error message should indicate duplicate feedback.",
    );

    // Verify the original feedback was not overwritten
    const retrievedAfterDuplicate = await concept._getFeedback({
      author: userB,
      item: itemX,
    });
    console.log("Successfully returned error message.");
    assertEquals(
      (retrievedAfterDuplicate as Array<{ feedback: { rating: number } }>)[0]
        .feedback.rating,
      5,
      "Original feedback rating should remain unchanged.",
    );
    await client.close();
  },
);

Deno.test(
  "Action updateFeedback: update existing feedback",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userB = "user:Bob" as ID;
    const itemY = "item:ProductY" as ID;

    console.log("Submitting Feedback...");
    await concept.submitFeedback({ author: userB, item: itemY, rating: 2 });
    let retrieved = await concept._getFeedback({ author: userB, item: itemY });
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      2,
      "Initial feedback rating should be 2.",
    );
    console.log("Feedback submitted successfully.");

    console.log("Updating Feedback...");
    const updateResult = await concept.updateFeedback({
      author: userB,
      item: itemY,
      newRating: 4,
    });
    assertExists(
      (updateResult as { feedback: ID }).feedback,
      "Should return a feedback ID on success.",
    );

    retrieved = await concept._getFeedback({ author: userB, item: itemY });
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      4,
      "Feedback rating should be updated to 4.",
    );
    console.log("Feedback updated successfully.");
    await client.close();
  },
);

Deno.test(
  "Action updateFeedback: update feedback with invalid rating",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;
    const itemX = "item:ProductX" as ID;

    console.log("Submitting Feedback...");
    await concept.submitFeedback({ author: userA, item: itemX, rating: 3 });

    const updateResult = await concept.updateFeedback({
      author: userA,
      item: itemX,
      newRating: -1,
    });
    assertExists(
      (updateResult as { error: string }).error,
      "Should return an error for invalid rating.",
    );
    assert(
      (updateResult as { error: string }).error.includes("New rating must be"),
      "Error message should indicate invalid rating.",
    );

    // Verify original rating is unchanged
    const retrieved = await concept._getFeedback({
      author: userA,
      item: itemX,
    });
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Original feedback rating should remain unchanged.",
    );
    console.log("Successfully returned error.");

    await client.close();
  },
);

Deno.test(
  "Action: updateFeedback: non-existent feedback update",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;
    console.log("Updating Feedback...");
    const nonExistentItem = "item:AnotherNonExistent" as ID;
    const updateResult = await concept.updateFeedback({
      author: userA,
      item: nonExistentItem,
      newRating: 5,
    });
    assertExists(
      (updateResult as { error: string }).error,
      "Should return an error for updating non-existent feedback.",
    );
    assert(
      (updateResult as { error: string }).error.includes("No feedback found"),
      "Error message should indicate no feedback to update.",
    );
    console.log("Successfully returned error.");
    await client.close();
  },
);

Deno.test(
  "Action: deleteFeedback: delete existing feedback",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;
    const itemX = "item:ProductX" as ID;

    console.log("Submitting Feedback...");
    await concept.submitFeedback({ author: userA, item: itemX, rating: 5 });
    let retrieved = await concept._getFeedback({ author: userA, item: itemX });
    // FIX START: Changed assertNotEquals to assertExists to check for the presence of feedback data.
    // Original: assertNotEquals((retrieved as Array<{ error: string }>)[0].error, undefined, "Feedback should exist initially.");
    assertExists(
      (retrieved as Array<{ feedback: any }>)[0].feedback, // Expecting feedback, not an error.
      "Feedback should exist initially.",
    );
    // FIX END

    // Delete the feedback
    const deleteResult = await concept.deleteFeedback({
      author: userA,
      item: itemX,
    });
    assertEquals(
      (deleteResult as { successful: boolean }).successful,
      true,
      "Should return successful: true.",
    );

    // Verify feedback is no longer present
    retrieved = await concept._getFeedback({ author: userA, item: itemX });
    assertExists(
      (retrieved as Array<{ error: string }>)[0].error,
      "Feedback should no longer exist.",
    );
    console.log("Successfully deleted Feedback.");
    await client.close();
  },
);

Deno.test(
  "Action: deleteFeedback: non-existent feedback deletion",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;

    console.log("Deleting Feedback...");
    const nonExistentItem = "item:YetAnotherNonExistent" as ID;
    const deleteResult = await concept.deleteFeedback({
      author: userA,
      item: nonExistentItem,
    });
    assertExists(
      (deleteResult as { error: string }).error,
      "Should return an error for deleting non-existent feedback.",
    );
    assert(
      (deleteResult as { error: string }).error.includes("No feedback found"),
      "Error message should indicate no feedback to delete.",
    );
    console.log("Successfully returned error.");

    await client.close();
  },
);

Deno.test(
  "Query _getFeedback: non-existent feedback",
  async () => {
    const [db, client] = await testDb();
    const concept = new FeedbackConcept(db);

    const userA = "user:Alice" as ID;

    const nonExistentItem = "item:NonExistent" as ID;
    const retrieved = await concept._getFeedback({
      author: userA,
      item: nonExistentItem,
    });
    console.log("Retrieved non-existent feedback:", retrieved);

    assert(
      Array.isArray(retrieved) && retrieved.length > 0,
      "Should return an array for error case.",
    );
    assertExists(
      (retrieved as Array<{ error: string }>)[0].error,
      "Should return an error message.",
    );
    assert(
      (retrieved as Array<{ error: string }>)[0].error.includes(
        "No feedback found",
      ),
      "Error message should indicate no feedback.",
    );
    await client.close();
  },
);

Deno.test("Query _getFeedback: retrieve existing feedback", async () => {
  const [db, client] = await testDb();
  const concept = new FeedbackConcept(db);

  const userA = "user:Alice" as ID;
  const itemY = "item:ProductY" as ID;

  console.log("Submitting Feedback...");
  await concept.submitFeedback({ author: userA, item: itemY, rating: 3 });

  const retrieved = await concept._getFeedback({ author: userA, item: itemY });
  assert(
    Array.isArray(retrieved) && retrieved.length > 0,
    "Should return an array with feedback.",
  );
  assertEquals(
    (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
    3,
    "Retrieved feedback rating should be 3.",
  );
  console.log("Successfully received feedback.");
  await client.close();
});

```
