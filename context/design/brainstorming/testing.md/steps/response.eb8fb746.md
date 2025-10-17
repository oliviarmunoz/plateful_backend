---
timestamp: 'Thu Oct 16 2025 19:49:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_194957.193f593c.md]]'
content_id: eb8fb7463e3ee1ec6445b66305b99c56a0039fe21e9846f443ae35f29ca330ca
---

# response:

The issue lies in an inconsistency between the concept's stated rating range (0-5) and the error message in the code (`1-5`), which caused a test for `rating: 0` to incorrectly expect an error. Additionally, the `console.log('here?')` line in `submitFeedback` is unnecessary and should be removed.

The primary fix will be:

1. **Update error messages in `FeedbackConcept.ts`** to reflect the `0-5` rating range.
2. **Modify the `submitFeedback: invalid rating` test** to correctly treat `rating: 0` as a valid submission (expecting success) and add a separate test for a truly invalid low rating like `-1`.
3. **Update the `updateFeedback: update feedback with invalid rating` test** to reflect the new error message for invalid ratings.
4. **Remove unused import** in `FeedbackConcept.test.ts`.
5. **Remove `console.log('here?')`** from `FeedbackConcept.ts`.

Here are the changes:

**1. Modify `src/concepts/Feedback/FeedbackConcept.ts`**

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

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

  /_getFeedback (author: User, item: Item): (error: String)
    requires: feedback for this item from this user does not exist
    effects: returns an error message indicating that feedback for this item from this user does not exist
 */

const PREFIX = "Feedback" + ".";

// Generic Types
type User = ID;
type Item = ID;

// Internal entity types
type Feedback = ID;

/**
 * state
    A set of Feedbacks with
      an author User
      a target Item
      a rating Number
 */
interface FeedbackDocument {
  _id: Feedback;
  author: User;
  target: Item;
  rating: number;
}

export default class FeedbackConcept {
  private feedbacks: Collection<FeedbackDocument>;

  constructor(private readonly db: Db) {
    this.feedbacks = this.db.collection(PREFIX + "feedbacks");
  }

  /**
   * Action: submit Feedback for a given item from a given author
   *
   * @requires item doesn't already have feedback from this user, rating is between 0-5
   *
   * @effects creates and returns a new Feedback, associating the author, item, and rating
   *          If requirements are not met, returns an error message
   */
  async submitFeedback(
    { author, item, rating }: { author: User; item: Item; rating: number },
  ): Promise<{ feedback: Feedback } | { error: string }> {
    // rating is between 0-5 (inclusive)
    if (rating < 0 || rating > 5) {
      // Removed `console.log('here?')`
      return { error: "Rating must be an integer between 0 and 5." }; // Changed from 1 to 0
    }

    // item doesn't already have feedback from this user
    const existingFeedback = await this.feedbacks.findOne({
      author,
      target: item,
    });
    if (existingFeedback) {
      return {
        error: `Feedback for item ${item} from user ${author} already exists.`,
      };
    }

    // Create a new Feedback
    const newFeedbackId: Feedback = freshID();
    const newFeedback: FeedbackDocument = {
      _id: newFeedbackId,
      author,
      target: item,
      rating,
    };

    try {
      await this.feedbacks.insertOne(newFeedback);
      return { feedback: newFeedbackId };
    } catch (e) {
      console.error("Error submitting feedback:", e);
      return { error: "Failed to submit feedback due to a database error." };
    }
  }

  /**
   * Action: update Feedback for a given item from a given author
   *
   * @requires feedback for this item from this user exists, newRating is between 0-5
   *
   * @effects updates the rating of the specified item feedback to newRating, returns
   *          new Feedback. If requirements are not met, returns an error message.
   */
  async updateFeedback(
    { author, item, newRating }: {
      author: User;
      item: Item;
      newRating: number;
    },
  ): Promise<{ feedback: Feedback } | { error: string }> {
    // newRating is between 0-5 (inclusive)
    if (newRating < 0 || newRating > 5) {
      return { error: "New rating must be an integer between 0 and 5." }; // Changed from 1 to 0
    }

    // feedback for this item from this user exists
    const existingFeedback = await this.feedbacks.findOne({
      author,
      target: item,
    });
    if (!existingFeedback) {
      return {
        error:
          `No feedback found for item ${item} from user ${author} to update.`,
      };
    }

    // Update the rating of the existing feedback
    try {
      await this.feedbacks.updateOne(
        { _id: existingFeedback._id },
        { $set: { rating: newRating } },
      );
      return { feedback: existingFeedback._id };
    } catch (e) {
      console.error("Error updating feedback:", e);
      return { error: "Failed to update feedback due to a database error." };
    }
  }

  /**
   * Action: delete Feedback for a given item from a given author
   *
   * @requires feedback for this item from this user exists
   *
   * @effects returns `true` if the feedback from this user for this item is successfully removed.
   */
  async deleteFeedback(
    { author, item }: { author: User; item: Item },
  ): Promise<{ successful: boolean } | { error: string }> {
    // feedback for this item from this user exists
    const existingFeedback = await this.feedbacks.findOne({
      author,
      target: item,
    });
    if (!existingFeedback) {
      return {
        error:
          `No feedback found for item ${item} from user ${author} to delete.`,
      };
    }

    // Remove the feedback
    const result = await this.feedbacks.deleteOne({
      _id: existingFeedback._id,
    });

    if (result.deletedCount === 1) {
      return { successful: true };
    } else {
      return { successful: false };
    }
  }

  /**
   * Query: get Feedback for a given item from a given author
   *
   * @requires
   * @effects returns an array containing the feedback document from this user for this item,
   *          or an array containing an error message if no such feedback exists.
   */
  async _getFeedback(
    { author, item }: { author: User; item: Item },
  ): Promise<Array<{ feedback: FeedbackDocument }> | Array<{ error: string }>> {
    try {
      const feedback = await this.feedbacks.findOne({ author, target: item });

      if (feedback) {
        return [{ feedback }];
      } else {
        // If feedback does not exist, return an error message in the array
        return [{
          error: `No feedback found for item ${item} from user ${author}.`,
        }];
      }
    } catch (e) {
      console.error("Error retrieving feedback:", e);
      return [{
        error: "Failed to retrieve feedback due to a database error.",
      }];
    }
  }
}
```

**2. Modify `src/concepts/Feedback/FeedbackConcept.test.ts`**

```typescript
import {
  assert,
  assertEquals,
  assertExists,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import FeedbackConcept from "./FeedbackConcept.ts";
import { ID } from "@utils/types.ts";
// import { privateEncrypt } from "node:crypto"; // This import is unused and can be removed. <-- REMOVED

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
    const itemY = "item:ProductY" as ID; // Used for valid rating 0
    const itemZ = "item:ProductZ" as ID; // Used for invalid rating -1
    const itemW = "item:ProductW" as ID; // Used for invalid rating 6


    // Test for rating 0 (should be VALID based on 0-5 range in concept description)
    console.log("Action submitFeedback: Validating rating 0 (should succeed)...");
    const resultValidZero = await concept.submitFeedback({
      author: userA,
      item: itemY,
      rating: 0,
    });
    assertExists(
      (resultValidZero as { feedback: ID }).feedback,
      "Rating 0 should be successfully submitted.",
    );
    let retrievedZero = await concept._getFeedback({ author: userA, item: itemY });
    assertEquals(
      (retrievedZero as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
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
    assertExists(
      (resultTooLow as { error: string }).error,
      "Should return an error for rating -1.",
    );
    assert(
      (resultTooLow as { error: string }).error.includes("Rating must be an integer between 0 and 5."),
      "Error message should indicate invalid rating for -1.",
    );
    // Verify no feedback was actually created for -1
    const retrievedInvalidLow = await concept._getFeedback({
      author: userA,
      item: itemZ,
    });
    assertExists(
      (retrievedInvalidLow as Array<{ error: string }>)[0].error,
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
    assertExists(
      (resultTooHigh as { error: string }).error,
      "Should return an error for rating 6.",
    );
    assert(
      (resultTooHigh as { error: string }).error.includes("Rating must be an integer between 0 and 5."),
      "Error message should indicate invalid rating for 6.",
    );
    // Verify no feedback was actually created for 6
    const retrievedInvalidHigh = await concept._getFeedback({
        author: userA,
        item: itemW,
    });
    assertExists(
        (retrievedInvalidHigh as Array<{ error: string }>)[0].error,
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
    console.log("Submitting second feedback (duplicate)...");
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

    console.log("Submitting Feedback for update invalid rating test...");
    await concept.submitFeedback({ author: userA, item: itemX, rating: 3 });

    console.log("Attempting to update with invalid rating -1...");
    const updateResultInvalidLow = await concept.updateFeedback({
      author: userA,
      item: itemX,
      newRating: -1,
    });
    assertExists(
      (updateResultInvalidLow as { error: string }).error,
      "Should return an error for invalid newRating -1.",
    );
    assert(
      (updateResultInvalidLow as { error: string }).error.includes("New rating must be an integer between 0 and 5."), // Updated check
      "Error message should indicate invalid newRating for -1.",
    );

    console.log("Attempting to update with invalid rating 6...");
    const updateResultInvalidHigh = await concept.updateFeedback({
        author: userA,
        item: itemX,
        newRating: 6,
    });
    assertExists(
        (updateResultInvalidHigh as { error: string }).error,
        "Should return an error for invalid newRating 6.",
    );
    assert(
        (updateResultInvalidHigh as { error: string }).error.includes("New rating must be an integer between 0 and 5."), // Updated check
        "Error message should indicate invalid newRating for 6.",
    );

    // Verify original rating is unchanged
    const retrieved = await concept._getFeedback({
      author: userA,
      item: itemX,
    });
    assertEquals(
      (retrieved as Array<{ feedback: { rating: number } }>)[0].feedback.rating,
      3,
      "Original feedback rating should remain unchanged after invalid update attempts.",
    );
    console.log("Successfully returned errors for invalid updates, original rating untouched.");

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
