[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: Feedback
# response:

# file: src/Feedback/FeedbackConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import FeedbackConcept from "./FeedbackConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("FeedbackConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new FeedbackConcept(db);

  // Define some common IDs for testing
  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID;
  const itemX = "item:ProductX" as ID;
  const itemY = "item:ProductY" as ID;

  // --- Test cases for submitFeedback ---
  await t.step("submitFeedback: should successfully submit feedback", async () => {
    console.log("\n--- submitFeedback: successful submission ---");
    const result = await concept.submitFeedback({ author: userA, item: itemX, rating: 4 });
    console.log("Submit result:", result);

    assertExists((result as { feedback: ID }).feedback, "Should return a feedback ID on success.");
    const feedbackId = (result as { feedback: ID }).feedback;

    const retrieved = await concept._getFeedback({ author: userA, item: itemX });
    console.log("Retrieved feedback:", retrieved);
    assertEquals(
      (retrieved as Array<{ feedback: { _id: ID; rating: number } }>)[0].feedback.rating,
      4,
      "Retrieved feedback rating should match submitted rating.",
    );
    assertEquals(
      (retrieved as Array<{ feedback: { _id: ID; author: ID } }>)[0].feedback.author,
      userA,
      "Retrieved feedback author should match submitted author.",
    );
    assertEquals(
      (retrieved as Array<{ feedback: { _id: ID; target: ID } }>)[0].feedback.target,
      itemX,
      "Retrieved feedback item should match submitted item.",
    );

    // Clean up for subsequent tests if necessary, or rely on testDb's cleanup
  });

  await t.step("submitFeedback: should not allow submitting feedback with invalid rating", async () => {
    console.log("\n--- submitFeedback: invalid rating ---");
    const resultTooLow = await concept.submitFeedback({ author: userA, item: itemY, rating: 0 });
    console.log("Submit result (rating 0):", resultTooLow);
    assertExists((resultTooLow as { error: string }).error, "Should return an error for rating 0.");
    assert((resultTooLow as { error: string }).error.includes("Rating must be"), "Error message should indicate invalid rating.");

    const resultTooHigh = await concept.submitFeedback({ author: userA, item: itemY, rating: 6 });
    console.log("Submit result (rating 6):", resultTooHigh);
    assertExists((resultTooHigh as { error: string }).error, "Should return an error for rating 6.");
    assert((resultTooHigh as { error: string }).error.includes("Rating must be"), "Error message should indicate invalid rating.");

    // Verify no feedback was actually created
    const retrieved = await concept._getFeedback({ author: userA, item: itemY });
    console.log("Retrieved feedback after invalid submission:", retrieved);
    assertExists((retrieved as Array<{ error: string }>)[0].error, "No feedback should have been created.");
  });

  await t.step("submitFeedback: should not allow submitting duplicate feedback", async () => {
    console.log("\n--- submitFeedback: duplicate feedback ---");
    // First, submit valid feedback
    await concept.submitFeedback({ author: userB, item: itemX, rating: 5 });
    const firstSubmission = await concept._getFeedback({ author: userB, item: itemX });
    console.log("First submission retrieved:", firstSubmission);
    assertEquals(
      (firstSubmission as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      5,
      "Initial feedback should be 5.",
    );

    // Attempt to submit duplicate feedback
    const duplicateResult = await concept.submitFeedback({ author: userB, item: itemX, rating: 3 });
    console.log("Duplicate submission result:", duplicateResult);
    assertExists(
      (duplicateResult as { error: string }).error,
      "Should return an error for duplicate feedback.",
    );
    assert(
      (duplicateResult as { error: string }).error.includes("already exists"),
      "Error message should indicate duplicate feedback.",
    );

    // Verify the original feedback was not overwritten
    const retrievedAfterDuplicate = await concept._getFeedback({ author: userB, item: itemX });
    console.log("Feedback after duplicate attempt:", retrievedAfterDuplicate);
    assertEquals(
      (retrievedAfterDuplicate as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      5,
      "Original feedback rating should remain unchanged.",
    );
  });

  // --- Test cases for _getFeedback ---
  await t.step("_getFeedback: should retrieve existing feedback", async () => {
    console.log("\n--- _getFeedback: retrieve existing ---");
    // Ensure feedback exists from previous tests or create new
    await concept.submitFeedback({ author: userA, item: itemY, rating: 3 });

    const retrieved = await concept._getFeedback({ author: userA, item: itemY });
    console.log("Retrieved feedback:", retrieved);

    assert(Array.isArray(retrieved) && retrieved.length > 0, "Should return an array with feedback.");
    assertExists((retrieved as Array<{ feedback: ID }>)[0].feedback, "Should contain feedback object.");
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Retrieved feedback rating should be 3.",
    );
  });

  await t.step("_getFeedback: should return error for non-existent feedback", async () => {
    console.log("\n--- _getFeedback: non-existent feedback ---");
    const nonExistentItem = "item:NonExistent" as ID;
    const retrieved = await concept._getFeedback({ author: userA, item: nonExistentItem });
    console.log("Retrieved non-existent feedback:", retrieved);

    assert(Array.isArray(retrieved) && retrieved.length > 0, "Should return an array for error case.");
    assertExists((retrieved as Array<{ error: string }>)[0].error, "Should return an error message.");
    assert((retrieved as Array<{ error: string }>)[0].error.includes("No feedback found"), "Error message should indicate no feedback.");
  });

  // --- Test cases for updateFeedback ---
  await t.step("updateFeedback: should successfully update existing feedback", async () => {
    console.log("\n--- updateFeedback: successful update ---");
    // First, submit valid feedback
    await concept.submitFeedback({ author: userB, item: itemY, rating: 2 });
    let retrieved = await concept._getFeedback({ author: userB, item: itemY });
    console.log("Initial feedback retrieved:", retrieved);
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      2,
      "Initial feedback rating should be 2.",
    );

    // Update the feedback
    const updateResult = await concept.updateFeedback({ author: userB, item: itemY, newRating: 4 });
    console.log("Update result:", updateResult);
    assertExists((updateResult as { feedback: ID }).feedback, "Should return a feedback ID on success.");

    // Verify the rating was updated
    retrieved = await concept._getFeedback({ author: userB, item: itemY });
    console.log("Feedback after update:", retrieved);
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      4,
      "Feedback rating should be updated to 4.",
    );
  });

  await t.step("updateFeedback: should not allow updating feedback with invalid rating", async () => {
    console.log("\n--- updateFeedback: invalid rating ---");
    // Ensure feedback exists
    await concept.submitFeedback({ author: userA, item: itemX, rating: 3 });

    const updateResult = await concept.updateFeedback({ author: userA, item: itemX, newRating: 0 });
    console.log("Update result (rating 0):", updateResult);
    assertExists((updateResult as { error: string }).error, "Should return an error for invalid rating.");
    assert((updateResult as { error: string }).error.includes("New rating must be"), "Error message should indicate invalid rating.");

    // Verify original rating is unchanged
    const retrieved = await concept._getFeedback({ author: userA, item: itemX });
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Original feedback rating should remain unchanged.",
    );
  });

  await t.step("updateFeedback: should return error for non-existent feedback update", async () => {
    console.log("\n--- updateFeedback: non-existent feedback ---");
    const nonExistentItem = "item:AnotherNonExistent" as ID;
    const updateResult = await concept.updateFeedback({
      author: userA,
      item: nonExistentItem,
      newRating: 5,
    });
    console.log("Update result for non-existent feedback:", updateResult);
    assertExists(
      (updateResult as { error: string }).error,
      "Should return an error for updating non-existent feedback.",
    );
    assert(
      (updateResult as { error: string }).error.includes("No feedback found"),
      "Error message should indicate no feedback to update.",
    );
  });

  // --- Test cases for deleteFeedback ---
  await t.step("deleteFeedback: should successfully delete existing feedback", async () => {
    console.log("\n--- deleteFeedback: successful deletion ---");
    // First, submit valid feedback
    await concept.submitFeedback({ author: userA, item: itemX, rating: 5 });
    let retrieved = await concept._getFeedback({ author: userA, item: itemX });
    assertNotEquals((retrieved as Array<{ error: string }>)[0].error, undefined, "Feedback should exist initially.");

    // Delete the feedback
    const deleteResult = await concept.deleteFeedback({ author: userA, item: itemX });
    console.log("Delete result:", deleteResult);
    assertEquals((deleteResult as { successful: boolean }).successful, true, "Should return successful: true.");

    // Verify feedback is no longer present
    retrieved = await concept._getFeedback({ author: userA, item: itemX });
    console.log("Feedback after deletion:", retrieved);
    assertExists((retrieved as Array<{ error: string }>)[0].error, "Feedback should no longer exist.");
  });

  await t.step("deleteFeedback: should return error for non-existent feedback deletion", async () => {
    console.log("\n--- deleteFeedback: non-existent feedback ---");
    const nonExistentItem = "item:YetAnotherNonExistent" as ID;
    const deleteResult = await concept.deleteFeedback({
      author: userA,
      item: nonExistentItem,
    });
    console.log("Delete result for non-existent feedback:", deleteResult);
    assertExists(
      (deleteResult as { error: string }).error,
      "Should return an error for deleting non-existent feedback.",
    );
    assert(
      (deleteResult as { error: string }).error.includes("No feedback found"),
      "Error message should indicate no feedback to delete.",
    );
  });

  // --- Principle Test ---
  await t.step("principle: should model the feedback lifecycle (submit, view, update, delete)", async () => {
    console.log("\n--- Principle Test: Feedback Lifecycle ---");
    const testUser = "user:PrincipleTester" as ID;
    const testItem = "item:PrincipleProduct" as ID;

    // 1. Submit Feedback
    console.log("Step 1: Submitting initial feedback (rating 3).");
    const submitResult = await concept.submitFeedback({ author: testUser, item: testItem, rating: 3 });
    assertExists((submitResult as { feedback: ID }).feedback, "Submit should be successful.");

    // 2. View Feedback
    console.log("Step 2: Viewing submitted feedback.");
    let retrieved = await concept._getFeedback({ author: testUser, item: testItem });
    console.log("Retrieved feedback:", retrieved);
    assertNotEquals((retrieved as Array<{ error: string }>)[0].error, undefined, "Feedback should exist.");
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Initial feedback rating should be 3.",
    );

    // 3. Update Feedback
    console.log("Step 3: Updating feedback to rating 5.");
    const updateResult = await concept.updateFeedback({ author: testUser, item: testItem, newRating: 5 });
    assertExists((updateResult as { feedback: ID }).feedback, "Update should be successful.");

    // 4. View Updated Feedback
    console.log("Step 4: Viewing updated feedback.");
    retrieved = await concept._getFeedback({ author: testUser, item: testItem });
    console.log("Retrieved updated feedback:", retrieved);
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      5,
      "Feedback rating should be updated to 5.",
    );

    // 5. Delete Feedback
    console.log("Step 5: Deleting feedback.");
    const deleteResult = await concept.deleteFeedback({ author: testUser, item: testItem });
    console.log("Delete result:", deleteResult);
    assertEquals((deleteResult as { successful: boolean }).successful, true, "Delete should be successful.");

    // 6. Verify Feedback is Deleted
    console.log("Step 6: Verifying feedback is deleted.");
    retrieved = await concept._getFeedback({ author: testUser, item: testItem });
    console.log("Retrieved feedback after deletion:", retrieved);
    assertExists((retrieved as Array<{ error: string }>)[0].error, "Feedback should no longer exist after deletion.");
    assert(
      (retrieved as Array<{ error: string }>)[0].error.includes("No feedback found"),
      "Error message should confirm no feedback.",
    );
    console.log("Principle fulfilled: user submitted, viewed, updated, and deleted feedback successfully.");
  });

  await client.close();
});
```