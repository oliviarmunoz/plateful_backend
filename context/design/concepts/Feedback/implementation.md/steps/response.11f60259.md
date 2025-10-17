---
timestamp: 'Wed Oct 15 2025 23:43:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_234346.95f0d208.md]]'
content_id: 11f60259a1dbe73e7c055b30a046ecc4075d02867d3daeb920ea4b8d2be7073d
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Feedback" + ".";

// Generic types of this concept, treated as opaque identifiers (IDs)
type User = ID;
type Item = ID;
type Feedback = ID; // This represents the unique identifier for a specific feedback entry

/**
 * Interface for a Feedback document stored in MongoDB.
 * Corresponds to "A set of Feedbacks with an author User, a target Item, a rating Number".
 * The _id field uniquely identifies this specific feedback entry.
 */
interface FeedbackDocument {
  _id: Feedback;
  author: User;
  target: Item;
  rating: number;
}

/**
 * @concept Feedback [User, Item]
 * @purpose provide quantitative (1-5) feedback about a specific item
 * @principle after a user submits feedback about an item, they can later update, delete, or view the feedback to analyze their opinions
 */
export default class FeedbackConcept {
  private feedbacks: Collection<FeedbackDocument>;

  constructor(private readonly db: Db) {
    // Initialize the MongoDB collection for feedbacks
    this.feedbacks = this.db.collection(PREFIX + "feedbacks");
  }

  /**
   * submitFeedback (author: User, item: Item, rating: Number): (feedback: Feedback)
   * submitFeedback (author: User, item: Item, rating: Number): (error: String)
   *
   * **requires** item doesn't already have feedback from this user, rating is between 1-5
   *
   * **effects** creates a new Feedback document, associating the author, target item, and rating;
   *             returns the ID of the newly created Feedback document.
   *             If requirements are not met, returns an error message.
   */
  async submitFeedback(
    { author, item, rating }: { author: User; item: Item; rating: number },
  ): Promise<{ feedback: Feedback } | { error: string }> {
    // Precondition check: rating is between 1-5
    if (rating < 1 || rating > 5) {
      return { error: "Rating must be an integer between 1 and 5." };
    }

    // Precondition check: item doesn't already have feedback from this user
    const existingFeedback = await this.feedbacks.findOne({ author, target: item });
    if (existingFeedback) {
      return { error: `Feedback for item ${item} from user ${author} already exists.` };
    }

    // Effects: Create a new Feedback document
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
   * updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
   * updateFeedback (author: User, item: Item, newRating: Number): (error: String)
   *
   * **requires** feedback for this item from this user exists, newRating is between 1-5
   *
   * **effects** updates the rating of the specified item feedback to newRating;
   *             returns the ID of the updated Feedback document.
   *             If requirements are not met, returns an error message.
   */
  async updateFeedback(
    { author, item, newRating }: { author: User; item: Item; newRating: number },
  ): Promise<{ feedback: Feedback } | { error: string }> {
    // Precondition check: newRating is between 1-5
    if (newRating < 1 || newRating > 5) {
      return { error: "New rating must be an integer between 1 and 5." };
    }

    // Precondition check: feedback for this item from this user exists
    const existingFeedback = await this.feedbacks.findOne({ author, target: item });
    if (!existingFeedback) {
      return { error: `No feedback found for item ${item} from user ${author} to update.` };
    }

    // Effects: Update the rating of the existing feedback
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
   * deleteFeedback (author: User, item: Item): (successful: Boolean)
   * deleteFeedback (author: User, item: Item): (error: String)
   *
   * **requires** feedback for this item from this user exists
   *
   * **effects** returns `true` if the feedback from this user for this item is successfully removed.
   *             If requirements are not met or deletion fails, returns an error message.
   */
  async deleteFeedback(
    { author, item }: { author: User; item: Item },
  ): Promise<{ successful: boolean } | { error: string }> {
    // Precondition check: feedback for this item from this user exists
    const existingFeedback = await this.feedbacks.findOne({ author, target: item });
    if (!existingFeedback) {
      return { error: `No feedback found for item ${item} from user ${author} to delete.` };
    }

    // Effects: Remove the feedback document
    try {
      const result = await this.feedbacks.deleteOne({ _id: existingFeedback._id });

      if (result.deletedCount === 1) {
        return { successful: true };
      } else {
        // This case indicates an unexpected issue where the document wasn't deleted
        return { error: "Failed to delete feedback; document not found or already removed." };
      }
    } catch (e) {
      console.error("Error deleting feedback:", e);
      return { error: "Failed to delete feedback due to a database error." };
    }
  }

  /**
   * _getFeedback (author: User, item: Item): (feedback: { _id: Feedback, author: User, target: Item, rating: Number })
   * _getFeedback (author: User, item: Item): (error: String)
   *
   * **requires** feedback for this item from this user exists OR feedback for this item from this user does not exist
   *
   * **effects** returns an array containing the feedback document from this user for this item,
   *             or an array containing an error message if no such feedback exists.
   *             Queries always return an array.
   */
  async _getFeedback(
    { author, item }: { author: User; item: Item },
  ): Promise<Array<{ feedback: FeedbackDocument }> | Array<{ error: string }>> {
    try {
      const feedback = await this.feedbacks.findOne({ author, target: item });

      if (feedback) {
        // Queries return an array, and the result should be wrapped in a dictionary
        return [{ feedback }];
      } else {
        // If feedback does not exist, return an error message in the array
        return [{ error: `No feedback found for item ${item} from user ${author}.` }];
      }
    } catch (e) {
      console.error("Error retrieving feedback:", e);
      return [{ error: "Failed to retrieve feedback due to a database error." }];
    }
  }
}
```
