import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

// Declare collection prefix for MongoDB. Uses the concept name.
const PREFIX = "UserTastePreferences" + ".";

// Generic types for this concept, treated as opaque identifiers.
type User = ID;
type Dish = ID;

/**
 * Interface representing the structure of a user document in the MongoDB collection.
 * This corresponds to the concept's state declaration:
 * "a set of Users with a set of likedDishes Dish and a set of dislikedDishes Dish"
 */
interface UserDocument {
  _id: User; // The ID of the user
  likedDishes: Dish[];
  dislikedDishes: Dish[];
}

/**
 * Concept: UserTastePreferences [User, Dish]
 *
 * purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences
 *
 * principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations
 */
export default class UserTastePreferencesConcept {
  private users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    // MongoDB automatically indexes the _id field.
  }

  /**
   * addLikedDish (user: User, dish: Dish): Empty
   *
   * **requires** true
   *
   * **effects** add dish to likedDishes for user. If user record does not exist, create it first with empty lists.
   *            If dish was previously in dislikedDishes, it is removed from there.
   */
  async addLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // MongoDB's $addToSet implicitly handles array creation if it doesn't exist
    // when used with upsert: true, so $setOnInsert for the same field is redundant and causes conflict.
    const result = await this.users.findOneAndUpdate(
      { _id: user },
      {
        $addToSet: { likedDishes: dish }, // Add dish to likedDishes if not already present
        $pull: { dislikedDishes: dish }, // Remove dish from dislikedDishes if present
      },
      { upsert: true, returnDocument: "after" }, // Create document if it doesn't exist
    );

    return {}
  }

  /**
   * removeLikedDish (user: User, dish: Dish): Empty
   *
   * **requires** user exists, dish is in likedDishes for user
   *
   * **effects** remove dish from likedDishes for user
   */
  async removeLikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // Precondition check: user must exist and dish must be in likedDishes
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
        error: "Failed to remove liked dish due to an internal database error.",
      };
    }
  }

  /**
   * addDislikedDish (user: User, dish: Dish): Empty
   *
   * **requires** true
   *
   * **effects** add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists.
   *            If dish was previously in likedDishes, it is removed from there.
   */
  async addDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // MongoDB's $addToSet implicitly handles array creation if it doesn't exist
    // when used with upsert: true, so $setOnInsert for the same field is redundant and causes conflict.
    const result = await this.users.findOneAndUpdate(
      { _id: user },
      {
        $addToSet: { dislikedDishes: dish }, // Add dish to dislikedDishes if not already present
        $pull: { likedDishes: dish }, // Remove dish from likedDishes if present
      },
      { upsert: true, returnDocument: "after" }, // Create document if it doesn't exist
    );

    return {}
  }

  /**
   * removeDislikedDish (user: User, dish: Dish): Empty
   *
   * **requires** user exists, dish is in dislikedDishes for user
   *
   * **effects** remove dish from dislikedDishes for user
   */
  async removeDislikedDish(
    { user, dish }: { user: User; dish: Dish },
  ): Promise<Empty | { error: string }> {
    // Precondition check: user must exist and dish must be in dislikedDishes
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
   * _getLikedDishes (user: User): (dishes: set(Dish))
   *
   * **requires** user exists
   *
   * **effects** returns all dishes liked by the specified user
   */
  async _getLikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | [{ error: string }]> {
    // Precondition check: user must exist
    const existingUser = await this.users.findOne({ _id: user }, {
      projection: { likedDishes: 1 },
    });

    if (!existingUser) {
      return [{ error: `User with ID '${user}' does not exist.` }];
    }

    // Ensure likedDishes is an array, defaulting to empty if not present.
    const likedDishes = existingUser.likedDishes || [];

    // Return an array of dictionaries, where each dictionary has a 'dishes' field
    return likedDishes.map((dish) => ({ dishes: dish }));
  }

  /**
   * _getDislikedDishes (user: User): (dishes: set(Dish))
   *
   * **requires** user exists
   *
   * **effects** returns all dishes disliked by the specified user
   */
  async _getDislikedDishes(
    { user }: { user: User },
  ): Promise<{ dishes: Dish }[] | [{ error: string }]> {
    // Precondition check: user must exist
    const existingUser = await this.users.findOne({ _id: user }, {
      projection: { dislikedDishes: 1 },
    });

    if (!existingUser) {
      return [{ error: `User with ID '${user}' does not exist.` }];
    }

    // Ensure dislikedDishes is an array, defaulting to empty if not present.
    const dislikedDishes = existingUser.dislikedDishes || [];

    // Return an array of dictionaries, where each dictionary has a 'dishes' field
    return dislikedDishes.map((dish) => ({ dishes: dish }));
  }
}
