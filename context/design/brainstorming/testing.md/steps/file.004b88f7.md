---
timestamp: 'Thu Oct 16 2025 23:54:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_235426.d0ee77fd.md]]'
content_id: 004b88f727b8843b8645d64c76797d7471e7b2ce781972bb2047b91c88004e00
---

# file: src/concepts/Feedback/FeedbackConcept.test.ts

```typescript
import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import FeedbackConcept from "./FeedbackConcept.ts";
import { ID } from "@utils/types.ts";

/**
concept Feedback [User, Item]
purpose provide quantitative (0-5) feedback about a specific item
principle after a user submits feedback about an item, they can later update, delete, or view the feedback to analyze their opinions

state
  A set of Feedbacks with
    an author User
    a target Item
    a rating Number

actions
  submitFeedback (author: User, item: Item, rating: Number): (feedback: Feedback)
    requires: item doesn't already have feedback from this user, rating is between 0-5
    effects: creates a new Feedback, associating the author, target, and rating

  updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
    requires: feedback for this item from this user exists, newRating is between 0-5
    effects: updates the rating of the specified item to newRating

  deleteFeedback (author: User, item: Item): (successful: Boolean)
    requires: feedback for this item from this user exists
    effects: returns True if the feedback from this user for this item is removed

  /_getFeedback (author: User, item: Item): (feedback: Feedback)
    requires: feedback for this item from this user exists
    effects: returns the feedback from this user for this item

*/

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
    if ("error" in submitResult) {
      throw new Error(`Submit failed: ${submitResult.error}`);
    }
    assertExists(submitResult.feedback, "Submit should be successful.");

    console.log("Action 2: Viewing submitted feedback...");
    let retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    if ("error" in retrieved[0]) {
      throw new Error(`Failed to retrieve feedback: ${retrieved[0].error}`);
    }
    assertExists(retrieved[0].feedback, "Feedback should exist.");
    assertEquals(
      retrieved[0].feedback.rating,
      3,
      "Initial feedback rating should be 3.",
    );

    console.log("Action 3: Updating feedback to rating 5...");
    const updateResult = await concept.updateFeedback({
      author: testUser,
      item: testItem,
      newRating: 5,
    });
    if ("error" in updateResult) {
      throw new Error(`Update failed: ${updateResult.error}`);
    }
    assertExists(updateResult.feedback, "Update should be successful.");

    console.log("Action 4: Viewing updated feedback...");
    retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    console.log("Retrieved updated feedback:", retrieved);
    if ("error" in retrieved[0]) {
      throw new Error(
        `Failed to retrieve updated feedback: ${retrieved[0].error}`,
      );
    }
    assertEquals(
      retrieved[0].feedback.rating,
      5,
      "Feedback rating should be updated to 5.",
    );

    console.log("Action 5: Deleting feedback...");
    const deleteResult = await concept.deleteFeedback({
      author: testUser,
      item: testItem,
    });
    console.log("Delete result:", deleteResult);
    if ("error" in deleteResult) {
      throw new Error(`Delete failed: ${deleteResult.error}`);
    }
    assertEquals(deleteResult.successful, true, "Delete should be successful.");

    console.log("Action 6: Verifying feedback is deleted...");
    retrieved = await concept._getFeedback({
      author: testUser,
      item: testItem,
    });
    if (!("error" in retrieved[0])) {
      throw new Error("Feedback should have been deleted, but was found.");
    }
    assertExists(
      retrieved[0].error,
      "Feedback should no longer exist after deletion.",
    );
    assert(
      retrieved[0].error.includes("No feedback found"),
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

  if ("error" in result) {
    throw new Error(`Submit failed: ${result.error}`);
  }
  assertExists(result.feedback, "Should return a feedback ID on success.");

  const retrieved = await concept._getFeedback({ author: userA, item: itemX });

  console.log("Retrieved feedback:", retrieved);
  if ("error" in retrieved[0]) {
    throw new Error(`Failed to retrieve feedback: ${retrieved[0].error}`);
  }
  assertEquals(
    retrieved[0].feedback.rating,
    4,
    "Retrieved feedback rating should match submitted rating.",
  );
  assertEquals(
    retrieved[0].feedback.author,
    userA,
    "Retrieved feedback author should match submitted author.",
  );
  assertEquals(
    retrieved[0].feedback.target,
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
    const itemZ = "item:ProductZ" as ID;
    const itemW = "item:ProductW" as ID;

    console.log(
      "Action submitFeedback: Validating rating 0 (should succeed)...",
    );
    const resultValidZero = await concept.submitFeedback({
      author: userA,
      item: itemY,
      rating: 0,
    });
    if ("error" in resultValidZero) {
      throw new Error(`Submit with rating 0 failed: ${resultValidZero.error}`);
    }
    assertExists(
      resultValidZero.feedback,
      "Rating 0 should be successfully submitted.",
    );
    const retrievedZero = await concept._getFeedback({
      author: userA,
      item: itemY,
    });
    if ("error" in retrievedZero[0]) {
      throw new Error(
        `Failed to retrieve feedback for rating 0: ${retrievedZero[0].error}`,
      );
    }
    assertEquals(
      retrievedZero[0].feedback.rating,
      0,
      "Feedback rating 0 should be correctly stored.",
    );
    console.log("Successfully submitted feedback with rating 0.");

    // Test for a truly invalid low rating, e.g., -1
    console.log("Action submitFeedback: Invalid rating -1 (should fail)...");
    const resultTooLow = await concept.submitFeedback({
      author: userA,
      item: itemZ,
      rating: -1,
    });
    if (!("error" in resultTooLow)) {
      throw new Error(
        "Submit with rating -1 should have failed, but succeeded.",
      );
    }
    assertExists(resultTooLow.error, "Should return an error for rating -1.");
    assert(
      resultTooLow.error.includes(
        "Rating must be an integer between 0 and 5.", 
      ),
      "Error message should indicate invalid rating for -1.",
    );
    // Verify no feedback was actually created for -1
    const retrievedInvalidLow = await concept._getFeedback({
      author: userA,
      item: itemZ,
    });
    if (!("error" in retrievedInvalidLow[0])) {
      throw new Error("Feedback was unexpectedly created for rating -1.");
    }
    assertExists(
      retrievedInvalidLow[0].error,
      "No feedback should have been created for rating -1.",
    );
    console.log("Successfully returned error message for rating -1.");

    // Test for a truly invalid high rating, e.g., 6
    console.log("Action submitFeedback: Invalid rating 6 (should fail)...");
    const resultTooHigh = await concept.submitFeedback({
      author: userA,
      item: itemW,
      rating: 6,
    });
    if (!("error" in resultTooHigh)) {
      throw new Error(
        "Submit with rating 6 should have failed, but succeeded.",
      );
    }
    assertExists(resultTooHigh.error, "Should return an error for rating 6.");
    assert(
      resultTooHigh.error.includes(
        "Rating must be an integer between 0 and 5.",
      ),
      "Error message should indicate invalid rating for 6.",
    );
    // Verify no feedback was actually created for 6
    const retrievedInvalidHigh = await concept._getFeedback({
      author: userA,
      item: itemW,
    });
    if (!("error" in retrievedInvalidHigh[0])) {
      throw new Error("Feedback was unexpectedly created for rating 6.");
    }
    assertExists(
      retrievedInvalidHigh[0].error,
      "No feedback should have been created for rating 6.",
    );
    console.log("Successfully returned error message for rating 6.");
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
    const initialSubmitResult = await concept.submitFeedback({
      author: userB,
      item: itemX,
      rating: 5,
    });
    if ("error" in initialSubmitResult) {
      throw new Error(`Initial submit failed: ${initialSubmitResult.error}`);
    }

    const firstSubmission = await concept._getFeedback({
      author: userB,
      item: itemX,
    });
    console.log("Feedback successfully received.");
    if ("error" in firstSubmission[0]) {
      throw new Error(
        `Failed to retrieve first submission: ${firstSubmission[0].error}`,
      );
    }
    assertEquals(
      firstSubmission[0].feedback.rating,
      5,
      "Initial feedback should be 5.",
    );

    // Attempt to submit duplicate feedback
    const duplicateResult = await concept.submitFeedback({
      author: userB,
      item: itemX,
      rating: 3,
    });
    console.log("Submitting second feedback (duplicate)...");
    if (!("error" in duplicateResult)) {
      throw new Error("Duplicate submit should have failed, but succeeded.");
    }
    assertExists(
      duplicateResult.error,
      "Should return an error for duplicate feedback.",
    );
    assert(
      duplicateResult.error.includes("already exists"),
      "Error message should indicate duplicate feedback.",
    );

    // Verify the original feedback was not overwritten
    const retrievedAfterDuplicate = await concept._getFeedback({
      author: userB,
      item: itemX,
    });
    console.log("Successfully returned error message.");
    if ("error" in retrievedAfterDuplicate[0]) {
      throw new Error(
        `Failed to retrieve feedback after duplicate attempt: ${
          retrievedAfterDuplicate[0].error
        }`,
      );
    }
    assertEquals(
      retrievedAfterDuplicate[0].feedback.rating,
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
    const initialSubmitResult = await concept.submitFeedback({
      author: userB,
      item: itemY,
      rating: 2,
    });
    if ("error" in initialSubmitResult) {
      throw new Error(`Initial submit failed: ${initialSubmitResult.error}`);
    }
    let retrieved = await concept._getFeedback({ author: userB, item: itemY });
    if ("error" in retrieved[0]) {
      throw new Error(
        `Failed to retrieve initial feedback: ${retrieved[0].error}`,
      );
    }
    assertEquals(
      retrieved[0].feedback.rating,
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
    if ("error" in updateResult) {
      throw new Error(`Update failed: ${updateResult.error}`);
    }
    assertExists(
      updateResult.feedback,
      "Should return a feedback ID on success.",
    );

    retrieved = await concept._getFeedback({ author: userB, item: itemY });
    if ("error" in retrieved[0]) {
      throw new Error(
        `Failed to retrieve updated feedback: ${retrieved[0].error}`,
      );
    }
    assertEquals(
      retrieved[0].feedback.rating,
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

    console.log("Submitting Feedback for update invalid rating test...");
    const initialSubmitResult = await concept.submitFeedback({
      author: userA,
      item: itemX,
      rating: 3,
    });
    if ("error" in initialSubmitResult) {
      throw new Error(`Initial submit failed: ${initialSubmitResult.error}`);
    }

    console.log("Attempting to update with invalid rating -1...");
    const updateResultInvalidLow = await concept.updateFeedback({
      author: userA,
      item: itemX,
      newRating: -1,
    });
    if (!("error" in updateResultInvalidLow)) {
      throw new Error(
        "Update with rating -1 should have failed, but succeeded.",
      );
    }
    assertExists(
      updateResultInvalidLow.error,
      "Should return an error for invalid newRating -1.",
    );
    assert(
      updateResultInvalidLow.error.includes(
        "New rating must be an integer between 0 and 5.",
      ),
      "Error message should indicate invalid newRating for -1.",
    );

    console.log("Attempting to update with invalid rating 6...");
    const updateResultInvalidHigh = await concept.updateFeedback({
      author: userA,
      item: itemX,
      newRating: 6,
    });
    if (!("error" in updateResultInvalidHigh)) {
      throw new Error(
        "Update with rating 6 should have failed, but succeeded.",
      );
    }
    assertExists(
      updateResultInvalidHigh.error,
      "Should return an error for invalid newRating 6.",
    );
    assert(
      updateResultInvalidHigh.error.includes(
        "New rating must be an integer between 0 and 5.", 
      ),
      "Error message should indicate invalid newRating for 6.",
    );

    // Verify original rating is unchanged
    const retrieved = await concept._getFeedback({
      author: userA,
      item: itemX,
    });
    if ("error" in retrieved[0]) {
      throw new Error(
        `Failed to retrieve feedback after invalid updates: ${
          retrieved[0].error
        }`,
      );
    }
    assertEquals(
      retrieved[0].feedback.rating,
      3,
      "Original feedback rating should remain unchanged after invalid update attempts.",
    );
    console.log(
      "Successfully returned errors for invalid updates, original rating untouched.",
    );

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
    if (!("error" in updateResult)) {
      throw new Error(
        "Update of non-existent feedback should have failed, but succeeded.",
      );
    }
    assertExists(
      updateResult.error,
      "Should return an error for updating non-existent feedback.",
    );
    assert(
      updateResult.error.includes("No feedback found"),
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
    const initialSubmitResult = await concept.submitFeedback({
      author: userA,
      item: itemX,
      rating: 5,
    });
    if ("error" in initialSubmitResult) {
      throw new Error(`Initial submit failed: ${initialSubmitResult.error}`);
    }
    let retrieved = await concept._getFeedback({ author: userA, item: itemX });
    if ("error" in retrieved[0]) {
      throw new Error(
        `Failed to retrieve feedback before deletion: ${retrieved[0].error}`,
      );
    }
    assertExists(
      retrieved[0].feedback,
      "Feedback should exist initially.",
    );

    // Delete the feedback
    const deleteResult = await concept.deleteFeedback({
      author: userA,
      item: itemX,
    });
    if (!("successful" in deleteResult)) { // Added check for potential error return from deleteFeedback
      throw new Error(`Delete failed unexpectedly: ${deleteResult.error}`);
    }
    assertEquals(
      deleteResult.successful,
      true,
      "Should return successful: true.",
    );

    // Verify feedback is no longer present
    retrieved = await concept._getFeedback({ author: userA, item: itemX });
    if (!("error" in retrieved[0])) {
      throw new Error("Feedback was unexpectedly found after deletion.");
    }
    assertExists(
      retrieved[0].error,
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
    if (!("error" in deleteResult)) {
      throw new Error(
        "Delete of non-existent feedback should have failed, but succeeded.",
      );
    }
    assertExists(
      deleteResult.error,
      "Should return an error for deleting non-existent feedback.",
    );
    assert(
      deleteResult.error.includes("No feedback found"),
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
    if (!("error" in retrieved[0])) {
      throw new Error(
        "Expected an error for non-existent feedback, but received feedback.",
      );
    }
    assertExists(
      retrieved[0].error,
      "Should return an error message.",
    );
    assert(
      retrieved[0].error.includes(
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
  const initialSubmitResult = await concept.submitFeedback({
    author: userA,
    item: itemY,
    rating: 3,
  });
  if ("error" in initialSubmitResult) {
    throw new Error(`Initial submit failed: ${initialSubmitResult.error}`);
  }

  const retrieved = await concept._getFeedback({ author: userA, item: itemY });
  assert(
    Array.isArray(retrieved) && retrieved.length > 0,
    "Should return an array with feedback.",
  );
  if ("error" in retrieved[0]) {
    throw new Error(
      `Expected feedback but received an error: ${retrieved[0].error}`,
    );
  }
  assertEquals(
    retrieved[0].feedback.rating,
    3,
    "Retrieved feedback rating should be 3.",
  );
  console.log("Successfully received feedback.");
  await client.close();
});

```
