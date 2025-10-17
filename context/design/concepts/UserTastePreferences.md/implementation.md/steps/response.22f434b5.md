---
timestamp: 'Thu Oct 16 2025 22:56:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225659.f128c77f.md]]'
content_id: 22f434b5c254a2bfb7bc8757066530379355de7cfc955daca1e3ecfa613b2429
---

# response:

```typescript
// file: src/UserTastePreferences/UserTastePreferencesConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
// The 'freshID' utility is not directly used here as User and Dish IDs are external
// and passed into this concept.

const PREFIX = "UserTastePreferences" + ".";

/**
 * Type parameters for the concept:
 * User: The ID of an external User entity (e.g., from a UserAuthentication concept).
 * Dish: The ID of an external Dish entity (e.g., from a RestaurantMenu concept).
 */
type User = ID;
type Dish = ID;

/**
 * Represents the state for a single user's taste preferences within this concept.
 * Each document in the 'users' collection corresponds to a User.
 * `_id`: The unique identifier for the User entity.
 * `likedDishes`: A set (implemented as an array) of Dishes that the user has marked as liked.
 * `dislikedDishes`: A set (implemented as an array) of Dishes that the user has marked as disliked.
 */
interface UserDocument {
  _id: User;
  likedDishes: Dish[];
  dislikedDishes: Dish[];
}

/**
 * concept UserTastePreferences [User, Dish]
 *
 * purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences
 *
 * principle when a user adds a dish to their liked list, that preference is recorded,
 *           influencing future recommendations.
 */
export default class UserTastePreferencesConcept {
  // MongoDB collection to store user preference documents
  private users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * addLikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference).
   *   - dish exists (the provided `dish` ID is a valid external Dish entity reference).
   *   - dish is not currently in the `dislikedDishes` list for the user.
   *   If no preference profile exists for the user in this concept's state, a new
   *   empty profile will be implicitly created.
   *
   * **effects**
   *   Adds the `dish` to the `likedDishes` list for the `user`.
   *   If the `dish` was previously in `dislikedDishes`, it is removed to ensure mutual exclusivity.
   */
  async addLikedDish({ user, dish }: { user: User; dish: Dish }): Promise<Empty | { error: string }> {
    // Find or create the user's taste preference document.
    // The 'user exists' precondition for the *User* entity itself is assumed to be validated externally.
    // Here, we ensure the user has an entry in *this concept's state*.
    const updateResult = await this.users.findOneAndUpdate(
      { _id: user },
      { $setOnInsert: { likedDishes: [], dislikedDishes: [] } },
      { upsert: true, returnDocument: 'after' } // Ensure the document exists and return its current state
    );

    const currentUserData = updateResult.value;

    // Check precondition: dish is not in dislikedDishes for user
    if (currentUserData?.dislikedDishes.includes(dish)) {
      return { error: `Dish '${dish}' is currently in disliked dishes for user '${user}'. Cannot like.` };
    }

    // Apply effects: add dish to likedDishes, and remove from dislikedDishes if present.
    // $addToSet ensures the dish is added only if it's not already in likedDishes.
    // $pull ensures it's removed from dislikedDishes if it was there (maintaining mutual exclusivity).
    await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { likedDishes: dish },
        $pull: { dislikedDishes: dish },
      }
    );

    return {};
  }

  /**
   * removeLikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference,
   *     AND a preference profile for this user exists in this concept's state).
   *   - dish exists (the provided `dish` ID is a valid external Dish entity reference).
   *   - dish is currently in the `likedDishes` list for the user.
   *
   * **effects**
   *   Removes the `dish` from the `likedDishes` list for the `user`.
   */
  async removeLikedDish({ user, dish }: { user: User; dish: Dish }): Promise<Empty | { error: string }> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check precondition: user exists in this concept's state
    if (!existingUser) {
      return { error: `User '${user}' taste preferences not found. Cannot remove liked dish.` };
    }

    // Check precondition: dish is in likedDishes for user
    if (!existingUser.likedDishes.includes(dish)) {
      return { error: `Dish '${dish}' is not currently liked by user '${user}'.` };
    }

    // Apply effects: remove dish from likedDishes for user
    await this.users.updateOne(
      { _id: user },
      { $pull: { likedDishes: dish } }
    );

    return {};
  }

  /**
   * addDislikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference).
   *   - dish exists (the provided `dish` ID is a valid external Dish entity reference).
   *   - dish is not currently in the `likedDishes` list for the user.
   *   If no preference profile exists for the user in this concept's state, a new
   *   empty profile will be implicitly created.
   *
   * **effects**
   *   Adds the `dish` to the `dislikedDishes` list for the `user`.
   *   If the `dish` was previously in `likedDishes`, it is removed to ensure mutual exclusivity.
   */
  async addDislikedDish({ user, dish }: { user: User; dish: Dish }): Promise<Empty | { error: string }> {
    // Find or create the user's taste preference document.
    // The 'user exists' precondition for the *User* entity itself is assumed to be validated externally.
    // Here, we ensure the user has an entry in *this concept's state*.
    const updateResult = await this.users.findOneAndUpdate(
      { _id: user },
      { $setOnInsert: { likedDishes: [], dislikedDishes: [] } },
      { upsert: true, returnDocument: 'after' }
    );

    const currentUserData = updateResult.value;

    // Check precondition: dish is not in likedDishes for user
    if (currentUserData?.likedDishes.includes(dish)) {
      return { error: `Dish '${dish}' is currently in liked dishes for user '${user}'. Cannot dislike.` };
    }

    // Apply effects: add dish to dislikedDishes, and remove from likedDishes if present.
    // $addToSet ensures the dish is added only if it's not already in dislikedDishes.
    // $pull ensures it's removed from likedDishes if it was there (maintaining mutual exclusivity).
    await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish },
        $pull: { likedDishes: dish },
      }
    );

    return {};
  }

  /**
   * removeDislikedDish (user: User, dish: Dish): Empty | { error: string }
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference,
   *     AND a preference profile for this user exists in this concept's state).
   *   - dish exists (the provided `dish` ID is a valid external Dish entity reference).
   *   - dish is currently in the `dislikedDishes` list for the user.
   *
   * **effects**
   *   Removes the `dish` from the `dislikedDishes` list for the `user`.
   */
  async removeDislikedDish({ user, dish }: { user: User; dish: Dish }): Promise<Empty | { error: string }> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check precondition: user exists in this concept's state
    if (!existingUser) {
      return { error: `User '${user}' taste preferences not found. Cannot remove disliked dish.` };
    }

    // Check precondition: dish is in dislikedDishes for user
    if (!existingUser.dislikedDishes.includes(dish)) {
      return { error: `Dish '${dish}' is not currently disliked by user '${user}'.` };
    }

    // Apply effects: remove dish from dislikedDishes for user
    await this.users.updateOne(
      { _id: user },
      { $pull: { dislikedDishes: dish } }
    );

    return {};
  }

  /**
   * _getLikedDishes (user: User): { dishes: Dish }[] | { error: string }[]
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference,
   *     AND a preference profile for this user exists in this concept's state).
   *
   * **effects**
   *   Returns an array of dictionaries, where each dictionary has a `dishes` field
   *   containing a `Dish` ID that the specified user has liked.
   */
  async _getLikedDishes({ user }: { user: User }): Promise<{ dishes: Dish }[] | { error: string }[]> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check precondition: user exists in this concept's state
    if (!existingUser) {
      return [{ error: `User '${user}' taste preferences not found. Cannot retrieve liked dishes.` }];
    }

    // Queries must return an array of dictionaries, structured as per the specification.
    return existingUser.likedDishes.map(dish => ({ dishes: dish }));
  }

  /**
   * _getDislikedDishes (user: User): { dishes: Dish }[] | { error: string }[]
   *
   * **requires**
   *   - user exists (the provided `user` ID is a valid external User entity reference,
   *     AND a preference profile for this user exists in this concept's state).
   *
   * **effects**
   *   Returns an array of dictionaries, where each dictionary has a `dishes` field
   *   containing a `Dish` ID that the specified user has disliked.
   */
  async _getDislikedDishes({ user }: { user: User }): Promise<{ dishes: Dish }[] | { error: string }[]> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check precondition: user exists in this concept's state
    if (!existingUser) {
      return [{ error: `User '${user}' taste preferences not found. Cannot retrieve disliked dishes.` }];
    }

    // Queries must return an array of dictionaries, structured as per the specification.
    return existingUser.dislikedDishes.map(dish => ({ dishes: dish }));
  }
}
```
