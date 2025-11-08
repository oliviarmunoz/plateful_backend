---
timestamp: 'Fri Nov 07 2025 15:06:41 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_150641.5e27936d.md]]'
content_id: 94d9b0d52194d8d054d785a2c00ae418cda77e0fa5ab58dcb774e42518a2798a
---

# file: design/brainstorming/getRecommendation.ts

```typescript
import { GeminiLLM } from "@utils/gemini-llm.ts";
import { ID } from "@utils/types.ts";

/**
   * Query: Get a dish recommendation for a user at a specific restaurant
   * @requires a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
   * @effects returns the name of a menu item from the specified restaurant that is recommended for the user
   *          via an LLM, based on their taste preferences and the current menu items.
   *          If no specific preferences are found, a generic recommendation may be provided.
   */
  const getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Fetch the user's taste preferences
      const userId: ID = user;
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { likedDishes: 1, dislikedDishes: 1 } },
      );

      if (!userData) {
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      // Constructing preferences from likedDishes and dislikedDishes (for the LLM prompt)
      const preferences: Record<string, number> = {};
      if (userData.likedDishes) {
        userData.likedDishes.forEach((dish) => {
          preferences[`Likes: ${dish}`] = 5;
        });
      }
      if (userData.dislikedDishes) {
        userData.dislikedDishes.forEach((dish) => {
          preferences[`Dislikes: ${dish}`] = 1;
        });
      }

      if (Object.keys(preferences).length === 0) {
        // return first menu item if no preferences
        return [{ recommendation: menu[0].name }];
      }

      // Construct prompt with user preferences
      const preferencesText = Object.entries(preferences)
        .map(([trait, score]) => `${trait}: ${score}/5`)
        .join("\n");

      const menuText = menu
        .map((dish) => `- ${dish.name}: ${dish.description}`)
        .join("\n");

      const prompt = `
You are a restaurant recommendation assistant.

USER PREFERENCES:
${preferencesText}

MENU ITEMS:
${menuText}

From the above menu, choose ONE dish that best matches the user's preferences.
Respond only in JSON format:
{"recommendation": "<exact dish name>"}
`.trim();
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return [{ error: "Missing GEMINI_API_KEY environment variable." }];
      }

      const llm = new GeminiLLM({ apiKey });
      const llmResponse = await llm.executeLLM(prompt);

      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [{ error: "Failed to parse LLM response as JSON." }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return [{ error: "LLM did not return a valid recommendation." }];
      }

      // VALIDATION

      // Verify dish is on menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        return [{
          error: `The recommended dish '${recommendation}' is not on the menu.`,
        }];
      }
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
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
