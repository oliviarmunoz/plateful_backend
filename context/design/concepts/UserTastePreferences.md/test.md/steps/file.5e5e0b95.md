---
timestamp: 'Thu Oct 16 2025 23:28:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_232800.cdc82530.md]]'
content_id: 5e5e0b95626e7afe399a22cbe9520f4cefbe59b51ccae7e6842719127b8ff807
---

# file: src/concepts/UserTastePreferencesConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts"; // Not used for external IDs, but good practice to include

// Declare collection prefix, use concept name
const PREFIX = "UserTastePreferences" + ".";

// Generic types of this concept
type User = ID;
type Dish = ID;

/**
 * Interface representing a user's taste preferences within this concept.
 * Corresponds to "a set of Users with a set of likedDishes Dish and a set of dislikedDishes Dish"
 */
interface UserPreferencesDocument {
  _id: User; // The ID of the user, acting as the document identifier
  likedDishes: Dish[];
  dislikedDishes: Dish[];
}

/**
 * Concept: UserTastePreferences [User, Dish]
 * Purpose: enable users to mark dishes as liked or disliked to build a profile of their taste preferences
 * Principle: when a user adds a dish to their liked list, that preference is recorded,
 *            influencing future recommendations
 */
export default class UserTastePreferencesConcept {
  private users: Collection<UserPreferencesDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Helper to ensure a user document exists or create a new one with empty lists.
   *
   * @param userId The ID of the user.
   * @returns The existing or newly created UserPreferencesDocument, or null if an error occurred.
   */
  private async ensureUserDocument(
    userId: User,
  ): Promise<UserPreferencesDocument | null> {
    const existingUser = await this.users.findOne({ _id: userId });
    if (existingUser) {
      return existingUser;
    }

    const newUserDocument: UserPreferencesDocument = {
      _id: userId,
      likedDishes: [],
      dislikedDishes: [],
    };
    try {
      // Use upsert: true to handle potential race conditions if multiple concurrent calls try to create.
      // This ensures we always get a document.
      await this.users.updateOne(
        { _id: userId },
        { $setOnInsert: newUserDocument },
        { upsert: true },
      );
      return newUserDocument; // Return the new document, or find the one just inserted by another op.
    } catch (e) {
      console.error(
        `Error creating user document for ${userId} in UserTastePreferences:`,
        e,
      );
      return null;
    }
  }

  /**
   * addLikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**: user exists (ID is valid), dish exists (ID is valid)
   *
   * **effects**: add dish to likedDishes for user. If user record does not exist,
   *            create it first with empty lists. If dish was previously in dislikedDishes, it is removed from there.
   */
  async addLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const userDoc = await this.ensureUserDocument(user);
    if (!userDoc) {
      return { error: `Failed to retrieve or create user document for ${user}` };
    }

    // This operation adds to likedDishes and removes from dislikedDishes.
    // If dish is already in likedDishes, $addToSet is a no-op for that part.
    // If dish is not in dislikedDishes, $pull is a no-op for that part.
    const result = await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { likedDishes: dish },
        $pull: { dislikedDishes: dish },
      },
    );

    // Minimal error check: if we couldn't match the user document (shouldn't happen after ensureUserDocument),
    // or if the update command itself failed (e.g., connection issue).
    if (result.matchedCount === 0 && result.upsertedId === null) {
      console.error(`Internal error: No document matched for user ${user} during addLikedDish.`);
      return { error: `Internal error: Failed to update preferences for user ${user}.` };
    }

    return {};
  }

  /**
   * removeLikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**: user exists (record in this concept), dish exists (ID is valid),
   *             dish is in likedDishes for user
   *
   * **effects**: remove dish from likedDishes for user
   */
  async removeLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    if (!userDoc.likedDishes.includes(dish)) {
      return { error: `Dish ${dish} is not in liked dishes for user ${user}` };
    }

    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { likedDishes: dish } },
    );

    if (result.modifiedCount === 0) {
      console.error(`Internal error: No document modified when removing liked dish ${dish} for user ${user}.`);
      return { error: `Internal error: Failed to remove liked dish ${dish} for user ${user}.` };
    }

    return {};
  }

  /**
   * addDislikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**: user exists (ID is valid), dish exists (ID is valid)
   *
   * **effects**: add dish to dislikedDishes for user. If user record does not exist,
   *            create it first with empty lists. If dish was previously in likedDishes, it is removed from there.
   */
  async addDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const userDoc = await this.ensureUserDocument(user);
    if (!userDoc) {
      return { error: `Failed to retrieve or create user document for ${user}` };
    }

    const result = await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish },
        $pull: { likedDishes: dish },
      },
    );

    if (result.matchedCount === 0 && result.upsertedId === null) {
      console.error(`Internal error: No document matched for user ${user} during addDislikedDish.`);
      return { error: `Internal error: Failed to update preferences for user ${user}.` };
    }

    return {};
  }

  /**
   * removeDislikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**: user exists (record in this concept), dish exists (ID is valid),
   *             dish is in dislikedDishes for user
   *
   * **effects**: remove dish from dislikedDishes for user
   */
  async removeDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    if (!userDoc.dislikedDishes.includes(dish)) {
      return { error: `Dish ${dish} is not in disliked dishes for user ${user}` };
    }

    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { dislikedDishes: dish } },
    );

    if (result.modifiedCount === 0) {
      console.error(`Internal error: No document modified when removing disliked dish ${dish} for user ${user}.`);
      return { error: `Internal error: Failed to remove disliked dish ${dish} for user ${user}.` };
    }

    return {};
  }

  /**
   * _getLikedDishes (user: User): { dish: Dish }[] | { error: string }
   *
   * **requires**: user exists (record in this concept)
   *
   * **effects**: returns all dishes liked by the specified user as an array of objects
   *            each with a 'dish' field.
   */
  async _getLikedDishes(
    { user }: { user: User },
  ): Promise<Array<{ dish: Dish }> | { error: string }> {
    const userDoc = await this.users.findOne({ _id: user });

    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    return userDoc.likedDishes.map((d) => ({ dish: d }));
  }

  /**
   * _getDislikedDishes (user: User): { dish: Dish }[] | { error: string }
   *
   * **requires**: user exists (record in this concept)
   *
   * **effects**: returns all dishes disliked by the specified user as an array of objects
   *            each with a 'dish' field.
   */
  async _getDislikedDishes(
    { user }: { user: User },
  ): Promise<Array<{ dish: Dish }> | { error: string }> {
    const userDoc = await this.users.findOne({ _id: user });

    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    return userDoc.dislikedDishes.map((d) => ({ dish: d }));
  }
}
```

***
