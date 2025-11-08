---
timestamp: 'Fri Nov 07 2025 14:16:07 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_141607.2450fe92.md]]'
content_id: 54284d9d758bdd7c226e207f2228d61acd3ef76fbc55f921b436f7b667e4f556
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

/\*\*
concept Feedback \[User, Item]
purpose provide quantitative (0-5) feedback about a specific item
principle after a user submits feedback about an item, they can later update, delete, or view the feedback to analyze their opinions

state
A set of Feedbacks with
an author User
a target Item
a rating Number

actions
submitFeedback (author: User, item: Item, rating: Number): (feedback: Feedback)
requires: rating is between 0-5
effects: creates a new Feedback, associating the author, target, and rating

updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
requires: feedback for this item from this user exists, newRating is between 0-5
effects: updates the rating of the specified item to newRating

deleteFeedback (author: User, item: Item): (successful: Boolean)
requires: feedback for this item from this user exists
effects: returns True if the feedback from this user for this item is removed

/\_getFeedback (author: User, item: Item): (feedback: Feedback)
requires:
effects: returns the feedback from this user for this item

/\_getAllUserRatings (author: User): (feedbacks: set(Feedback))
requires:
effects: returns all feedback documents from this user
\*/

/\*\*
concept RestaurantMenu \[Restaurant, User]

purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes to inform their choices and receive personalized recommendations

principle when a restaurant owner adds new dishes or removes unavailable ones, customers can always view an up-to-date menu to get a dish recommendation tailored to their preferences.

state
a set of MenuItems with
a restaurant Restaurant
a name String
a description String
a price Number

actions
addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
requires: menu item with the given name does not already exist for this restaurant
effects: returns a newly created menu item with this restaurant, name, description, and price

```
updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
  requires: a menu item with the given ID exists
  effects: updates the description and/or price of the existing menu item and returns the updated menu item

removeMenuItem (menuItem: MenuItem): (success: Boolean)
  requires: menu item with the given ID exists
  effects: returns true and deletes the menu item

/_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
  requires: true
  effects: returns a set of all menu items associated with the given restaurant, including their name, description, and price

/_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
  requires: menuItem with the given ID exists
  effects: returns the name, description, and price of the specified menu item

/_getRecommendation (restaurant: Restaurant, user: User): (recommendation: String)
  requires: a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
  effects: returns the name of a menu item from the specified restaurant that is recommended for the user via an LLM, based on their taste preferences and the current menu items. If no specific preferences are found, a generic recommendation may be provided.
```

\*/

/\*\*

concept UserAuthentication \[User]
purpose limit access to known users
principle if a user registers with a unique username and password, they can later log in using those
same credentials to prove their identity and gain access.

state
a set of Credentials with
a username String
a password String

actions
register (username: String, password: String): (user: User)
requires: no User exists with the given username
effects: creates and returns a new User and associates it with the provided username and password

```
  authenticate (username: String, password: String): (user: User)
      requires: a User exists with the given username, and the password matches the stored password for that User
      effects: returns the User associated with the credentials

  _getUsername (user: User) : (username: String)
      requires: user exists
      effects: returns username of user
```

\*/

/\*\*
concept UserTastePreferences \[User, Dish]

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

```
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
```

\*/

/\*\*
concept: Sessioning \[User]
purpose: maintain a user's logged-in state across multiple requests without re-sending credentials.
principle:  if a session is created for a user, then that user's identity can be consistently retrieved via the session in subsequent interactions, until the session is deleted.
state
a set of Sessions with
a user User

actions
create (user: User): (session: Session)
effects: a new session is created; the session is associated with the given user; returns the session created

  delete (session: Session)
requires: the given session exists
effects: the session is removed

\_getUser (session: Session): (user: User)
requires: the given session exists
effects: returns the user associated with the session.
\*/
