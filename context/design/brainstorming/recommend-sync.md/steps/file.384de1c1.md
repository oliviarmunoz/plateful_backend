---
timestamp: 'Fri Nov 07 2025 15:06:41 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_150641.5e27936d.md]]'
content_id: 384de1c12066a51f2d3052cbe3e731a39d94d145ce7b9322350ec02440acec6b
---

# file: src/concepts/UserTastePreferences/UserTastePreferencesConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

/**
 * concept UserTastePreferences [User, Dish]

  purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences

  principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations

  state
    a set of Users with
      a set of likedDishes Dish
      a set of dislikedDishes Dish

  actions
    addLikedDish (user: User, dish: Dish)
      requires:
      effects: add dish to likedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in dislikedDishes, it is removed from there.

    removeLikedDish (user: User, dish: Dish)
      requires: user exists, dish is in likedDishes for user
      effects: remove dish from likedDishes for user

    addDislikedDish (user: User, dish: Dish)
      requires:
      effects: add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in likedDishes, it is removed from there.

    removeDislikedDish (user: User, dish: Dish)
      requires: user exists, dish exists, dish is in dislikedDishes for user
      effects: remove dish from dislikedDishes for user

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
   * @requires
   *
   * @effects add dish to likedDishes for user. If user record does not exist, create it first with empty lists.
   *            If dish was previously in dislikedDishes, it is removed from there.
   */
  async addLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const _result = await this.users.findOneAndUpdate(
      { _id: user },
      {
        $addToSet: { likedDishes: dish },
        $pull: { dislikedDishes: dish }, // Remove dish from dislikedDishes if present
      },
      { upsert: true, returnDocument: "after" },
    );

    return {};
  }

  /**
   * Action: remove Liked Dish
   *
   * @requires user exists, dish is in likedDishes for user
   *
   * @effects remove dish from likedDishes for user
   */
  async removeLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // check user must exist and dish must be in likedDishes
    const existingUser = await this.users.findOne({ _id: user });

    if (!existingUser) {
      return { error: `User with ID '${user}' does not exist.` };
    }

    if (!existingUser.likedDishes || !existingUser.likedDishes.includes(dish)) {
      return {
        error: `Dish '${dish}' is not in the liked dishes for user '${user}'.`,
      };
    }

    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { likedDishes: dish } }, // Remove the dish from the likedDishes array
    );

    if (result.acknowledged) {
      return {};
    } else {
      return {
        error: "Failed to remove liked dish.",
      };
    }
  }

  /**
   * Action: add Disliked Dish
   *
   * @requires
   *
   * @effects add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists.
   *            If dish was previously in likedDishes, it is removed from there.
   */
  async addDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    const _result = await this.users.findOneAndUpdate(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish },
        $pull: { likedDishes: dish }, // Remove dish from likedDishes if present
      },
      { upsert: true, returnDocument: "after" },
    );

    return {};
  }

  /**
   * Action: remove Disliked Dish
   *
   * @requires user exists, dish is in dislikedDishes for user
   *
   * @effects remove dish from dislikedDishes for user
   */
  async removeDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // check user must exist and dish must be in dislikedDishes
    const existingUser = await this.users.findOne({ _id: user });

    if (!existingUser) {
      return { error: `User with ID '${user}' does not exist.` };
    }

    if (
      !existingUser.dislikedDishes ||
      !existingUser.dislikedDishes.includes(dish)
    ) {
      return {
        error:
          `Dish '${dish}' is not in the disliked dishes for user '${user}'.`,
      };
    }

    const result = await this.users.updateOne(
      { _id: user },
      { $pull: { dislikedDishes: dish } }, // Remove the dish from the dislikedDishes array
    );

    if (result.acknowledged) {
      return {};
    } else {
      return {
        error:
          "Failed to remove disliked dish due to an internal database error.",
      };
    }
  }

  /**
   * Query: _getLikedDishes
   *
   * @requires user exists
   *
   * @effects returns all dishes liked by the specified user
   *          If the user does not exist yet, it initializes a
   *          new user record with empty preferences.
   */
  async _getLikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | [{ error: string }]> {
    const existingUser = await this.users.findOne(
      { _id: user },
      { projection: { likedDishes: 1 } },
    );
    if (!existingUser) {
      await this.users.insertOne({
        _id: user,
        likedDishes: [],
        dislikedDishes: [],
      });

      return [];
    }

    const likedDishes = existingUser.likedDishes || [];
    return likedDishes.map((dish) => ({ dishes: dish }));
  }

  /**
   * Query: _getDislikedDishes (user: User): (dishes: set(Dish))
   *
   * @requires user exists
   *
   * @effects returns all dishes disliked by the specified user
   */
  async _getDislikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | [{ error: string }]> {
    // check user must exist
    const existingUser = await this.users.findOne({ _id: user }, {
      projection: { dislikedDishes: 1 },
    });
    if (!existingUser) {
      return [{ error: `User with ID '${user}' does not exist.` }];
    }

    const dislikedDishes = existingUser.dislikedDishes || [];
    return dislikedDishes.map((dish) => ({ dishes: dish }));
  }
}

```
