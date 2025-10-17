---
timestamp: 'Thu Oct 16 2025 23:12:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231222.b65550d5.md]]'
content_id: 437756a62402f5baf8afa9457bca32ba5593b6839b7612869023404703c85e11
---

# response:

The TypeScript error `'updateResult' is possibly 'null'` (or more accurately, `updateResult.value` is possibly `null`) occurs because, even with `upsert: true` and `returnDocument: "after"`, the `value` property of the `FindAndModifyResult` can still be `null` in some edge cases or according to the strict typing of the MongoDB driver.

While it's highly improbable for `value` to be `null` under these specific options if the database operation itself succeeds, TypeScript forces us to handle this possibility for robust code.

The fix involves adding a null check for `currentUserData` (which is `updateResult.value`) immediately after its assignment in both `addLikedDish` and `addDislikedDish` actions. This ensures that we proceed only if a valid user document was found or created, satisfying TypeScript's strict null checks.

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

/**
concept UserTastePreferences [User, Dish]

purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences

principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations

state
  a set of Users with
    a set of likedDishes Dish
    a set of dislikedDishes Dish

actions
  addLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in dislikedDishes for user
    effects: add dish to likedDishes for user

  removeLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in likedDishes for user
    effects: remove dish from likedDishes for user

  addDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in likedDishes for user
    effects: add dish to dislikedDishes for user

  removeDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in dislikedDishes for user
    effects: remove dish from dislikedDishes for user

queries
  _getLikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns all dishes liked by the specified user

  _getDislikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns all dishes disliked by the specified user
*/

const PREFIX = "UserTastePreferences" + ".";

type User = ID;
type Dish = ID;

/**
 * state
    a set of Users with
    a set of likedDishes Dish
    a set of dislikedDishes Dish
 */
interface UserDocument {
  _id: User;
  likedDishes: Dish[];
  dislikedDishes: Dish[];
}

export default class UserTastePreferencesConcept {
  private users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Action: add Liked Dish
   *
   * @requires user exists, dish exists, dish is not currently in the `dislikedDishes` for the user.
   *
   * @effects Adds the dish to the likedDishes list for the user. If the `dish` was previously in
   *          dislikedDishes, it is removed to ensure mutual exclusivity.
   */
  async addLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // Find or create the user's taste preference document.
    const updateResult = await this.users.findOneAndUpdate(
      { _id: user },
      { $setOnInsert: { likedDishes: [], dislikedDishes: [] } },
      { upsert: true, returnDocument: "after" },
    );

    const currentUserData = updateResult.value;

    // Fix: Add a null check for currentUserData
    if (!currentUserData) {
      return { error: `Failed to retrieve or create user preferences for '${user}'.` };
    }

    // Check dish is not in dislikedDishes for user
    if (currentUserData.dislikedDishes.includes(dish)) {
      return {
        error:
          `Dish '${dish}' is currently in disliked dishes for user '${user}'. Cannot like.`,
      };
    }

    // add dish to likedDishes, and remove from dislikedDishes if present
    await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { likedDishes: dish },
        $pull: { dislikedDishes: dish },
      },
    );

    return {};
  }

  /**
   * Action: remove liked dish
   *
   * @requires user exists, dish exists, dish is currently in the likedDishes list for the user.
   *
   * @effects Removes the `dish` from the `likedDishes` list for the `user`
   */
  async removeLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check precondition: user exists in this concept's state
    if (!existingUser) {
      return {
        error:
          `User '${user}' taste preferences not found. Cannot remove liked dish.`,
      };
    }

    // Check dish is in likedDishes for user
    if (!existingUser.likedDishes.includes(dish)) {
      return {
        error: `Dish '${dish}' is not currently liked by user '${user}'.`,
      };
    }

    // remove dish from likedDishes for user
    await this.users.updateOne(
      { _id: user },
      { $pull: { likedDishes: dish } },
    );

    return {};
  }

  /**
   * Action: add disliked dish
   *
   * @requires user exists, dish exists, dish is not currently in the likedDishes list for the user.
   *
   * @effects adds the dish to the dislikedDishes list for the user. If the dish was previously in likedDishes,
   *          it is removed to ensure mutual exclusivity.
   */
  async addDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const updateResult = await this.users.findOneAndUpdate(
      { _id: user },
      { $setOnInsert: { likedDishes: [], dislikedDishes: [] } },
      { upsert: true, returnDocument: "after" },
    );

    const currentUserData = updateResult.value;

    // Fix: Add a null check for currentUserData
    if (!currentUserData) {
      return { error: `Failed to retrieve or create user preferences for '${user}'.` };
    }

    // Check dish is not in likedDishes for user
    if (currentUserData.likedDishes.includes(dish)) {
      return {
        error:
          `Dish '${dish}' is currently in liked dishes for user '${user}'. Cannot dislike.`,
      };
    }

    // add dish to dislikedDishes, and remove from likedDishes if present.
    await this.users.updateOne(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish },
        $pull: { likedDishes: dish },
      },
    );

    return {};
  }

  /**
   * Action: remove Disliked Dish
   *
   * @requires user exists, dish exists, dish is currently in the dislikedDishes for the user.
   *
   * @effects Removes the dish from the dislikedDishes list for the user.
   */
  async removeDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check user exists in this concept's state
    if (!existingUser) {
      return {
        error:
          `User '${user}' taste preferences not found. Cannot remove disliked dish.`,
      };
    }

    // Check dish is in dislikedDishes for user
    if (!existingUser.dislikedDishes.includes(dish)) {
      return {
        error: `Dish '${dish}' is not currently disliked by user '${user}'.`,
      };
    }

    // remove dish from dislikedDishes for user
    await this.users.updateOne(
      { _id: user },
      { $pull: { dislikedDishes: dish } },
    );

    return {};
  }

  /**
   * Query: get Liked Dishes
   *
   * @requires user exists
   *
   * @effects dishes that the specified user has liked
   */
  async _getLikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | { error: string }[]> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check user exists
    if (!existingUser) {
      return [{
        error:
          `User '${user}' taste preferences not found. Cannot retrieve liked dishes.`,
      }];
    }

    return existingUser.likedDishes.map((dish) => ({ dishes: dish }));
  }

  /**
   * Query: get Disliked Dishes
   *
   * @requires user exists
   *
   * @effects dishes that the specified user has liked
   */
  async _getDislikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | { error: string }[]> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check user exists
    if (!existingUser) {
      return [{
        error:
          `User '${user}' taste preferences not found. Cannot retrieve disliked dishes.`,
      }];
    }

    return existingUser.dislikedDishes.map((dish) => ({ dishes: dish }));
  }
}
```
