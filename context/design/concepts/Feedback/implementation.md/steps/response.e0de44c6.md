---
timestamp: 'Wed Oct 15 2025 23:58:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_235839.2bb0beb4.md]]'
content_id: e0de44c6eb12b6f27dee2f0bd99ba71fb7750ff5c65485e7cac1a815df097f65
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
concept Feedback [User, Item]
purpose provide quantitative (1-5) feedback about a specific item
principle after a user submits feedback about an item, they can later update, delete, or view the feedback to analyze their opinions

state
  A set of Feedbacks with
    an author User
    a target Item
    a rating Number

actions
  submitFeedback (author: User, item: Item, rating: Number): (feedback: Feedback)
    requires: item doesn't already have feedback from this user, rating is between 1-5
    effects: creates a new Feedback, associating the author, target, and rating

  updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
    requires: feedback for this item from this user exists, newRating is between 1-5
    effects: updates the message of the specified item to newRating

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
   * @requires item doesn't already have feedback from this user, rating is between 1-5
   *
   * @effects creates and returns a new Feedback, associating the author, item, and rating
   *          If requirements are not met, returns an error message
   */
  async submitFeedback(
    { author, item, rating }: { author: User; item: Item; rating: number },
  ): Promise<{ feedback: Feedback } | { error: string }> {
    // rating is between 1-5
    if (rating < 1 || rating > 5) {
      return { error: "Rating must be an integer between 1 and 5." };
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
   * @requires feedback for this item from this user exists, newRating is between 1-5
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
    // newRating is between 1-5
    if (newRating < 1 || newRating > 5) {
      return { error: "New rating must be an integer between 1 and 5." };
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
