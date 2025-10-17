---
timestamp: 'Thu Oct 16 2025 23:14:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231437.b5eef090.md]]'
content_id: 12a2ddc5c271adf6d9397165df28edc51056dbd39f55075f527eb36e21ba5b2f
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
      await this.users.insertOne(newUserDocument);
      return newUserDocument;
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
   * **requires**: user exists (ID is valid), dish exists (ID is valid),
   *             dish is not in dislikedDishes for user
   *
   * **effects**: add dish to likedDishes for user. If user record does not exist,
   *            create it first with empty lists.
   */
  async addLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // 1. Ensure user document exists (or create it if not)
    const userDoc = await this.ensureUserDocument(user);
    if (!userDoc) {
      return { error: `Failed to retrieve or create user document for ${user}` };
    }

    // 2. Check precondition: dish is not in dislikedDishes for user
    if (userDoc.dislikedDishes.includes(dish)) {
      return { error: `Dish ${dish} is in disliked dishes for user ${user}` };
    }

    // 3. Add dish to likedDishes (using $addToSet for uniqueness)
    const result = await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { likedDishes: dish },
        $pull: { dislikedDishes: dish }, // Ensure it's not in disliked if it was there (e.g. user changed mind)
      },
    );

    if (result.modifiedCount === 0 && !userDoc.likedDishes.includes(dish)) {
      // If no document was modified, and the dish wasn't already liked, something went wrong.
      // Or if it was already liked, that's fine, no real change.
      // This check is a bit nuanced with $addToSet, which doesn't modify if already present.
      // We assume if it's already present, it's a successful no-op for the 'add' effect.
      // If it wasn't present and no modification, it's an issue.
      const updatedUserDoc = await this.users.findOne({ _id: user });
      if (!updatedUserDoc || !updatedUserDoc.likedDishes.includes(dish)) {
         return { error: `Failed to add dish ${dish} to liked dishes for user ${user}` };
      }
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
    // 1. Check precondition: user exists (in this concept's state)
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    // 2. Check precondition: dish is in likedDishes for user
    if (!userDoc.likedDishes.includes(dish)) {
      return { error: `Dish ${dish} is not in liked dishes for user ${user}` };
    }

    // 3. Remove dish from likedDishes
    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { likedDishes: dish } },
    );

    if (result.modifiedCount === 0) {
      // Should not happen if preconditions are met.
      return { error: `Failed to remove dish ${dish} from liked dishes for user ${user}` };
    }

    return {};
  }

  /**
   * addDislikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**: user exists (ID is valid), dish exists (ID is valid),
   *             dish is not in likedDishes for user
   *
   * **effects**: add dish to dislikedDishes for user. If user record does not exist,
   *            create it first with empty lists.
   */
  async addDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // 1. Ensure user document exists (or create it if not)
    const userDoc = await this.ensureUserDocument(user);
    if (!userDoc) {
      return { error: `Failed to retrieve or create user document for ${user}` };
    }

    // 2. Check precondition: dish is not in likedDishes for user
    if (userDoc.likedDishes.includes(dish)) {
      return { error: `Dish ${dish} is in liked dishes for user ${user}` };
    }

    // 3. Add dish to dislikedDishes (using $addToSet for uniqueness)
    const result = await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish },
        $pull: { likedDishes: dish }, // Ensure it's not in liked if it was there
      },
    );

    if (result.modifiedCount === 0 && !userDoc.dislikedDishes.includes(dish)) {
       const updatedUserDoc = await this.users.findOne({ _id: user });
      if (!updatedUserDoc || !updatedUserDoc.dislikedDishes.includes(dish)) {
         return { error: `Failed to add dish ${dish} to disliked dishes for user ${user}` };
      }
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
    // 1. Check precondition: user exists (in this concept's state)
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    // 2. Check precondition: dish is in dislikedDishes for user
    if (!userDoc.dislikedDishes.includes(dish)) {
      return { error: `Dish ${dish} is not in disliked dishes for user ${user}` };
    }

    // 3. Remove dish from dislikedDishes
    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { dislikedDishes: dish } },
    );

    if (result.modifiedCount === 0) {
      // Should not happen if preconditions are met.
      return { error: `Failed to remove dish ${dish} from disliked dishes for user ${user}` };
    }

    return {};
  }

  /**
   * _getLikedDishes (user: User): { dishes: Dish[] }[] | { error: string }
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

    // Check precondition: user exists
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    // Queries return an array of dictionaries.
    // If the spec said (dishes: set(Dish)), it implies a list of dishes directly.
    // The implementation format requires an array of dictionaries, so each dish is wrapped.
    return userDoc.likedDishes.map((d) => ({ dish: d }));
  }

  /**
   * _getDislikedDishes (user: User): { dishes: Dish[] }[] | { error: string }
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

    // Check precondition: user exists
    if (!userDoc) {
      return { error: `User ${user} not found in taste preferences` };
    }

    // Queries return an array of dictionaries.
    return userDoc.dislikedDishes.map((d) => ({ dish: d }));
  }
}
```
