[@restaurant-menu](../../src/concepts/RestaurantMenu/RestaurantMenuConcept.ts)
[@user-taste-preferences](../../src/concepts/RestaurantMenu/RestaurantMenuConcept.ts)

[@implementing-concepts](../background/implementing-concepts.md)

[@concept-design-overview](../background/concept-design-overview.md)

[@concept-specifications](../background/concept-specifications.md)

[@implementing-concepts](../background/implementing-concepts.md)

# okay i want to use the restaurantMenu and UserTastePreferences to make a recommendation. but right now it's not able to get the user from the database. 

# response:

It sounds like the `_getRecommendation` method is failing because it can't find the user in the database. The most common reasons for this are:

1.  **The `user` ID passed to `_getRecommendation` does not exist in your MongoDB `Users` collection.** You might be passing an ID that was never created, or was created in a different context.
2.  **The `Users` collection itself is empty or incorrectly named.**
3.  **The `user` ID being passed is malformed or an unexpected type at runtime.** Although `ID` is specified, runtime issues can still occur.

Let's add some logging to help you pinpoint the exact issue and confirm that the `user` ID is being passed correctly and what `findOne` is returning.

```typescript
// file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant]

  purpose allow users to view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices

  principle when a restaurant adds or removes items, customers can always see the accurate, current menu

  state
   - a set of MenuItems with
     - a restaurantName String
     - an itemName String
     - a description String
     - a price number
*/

const PREFIX = "RestaurantMenu" + ".";

export type MenuItem = ID;

interface MenuItemDocument {
  _id: MenuItem;
  restaurant: string;
  name: string;
  description: string;
  price: number;
}

interface UserDocument {
  _id: ID;
  tastePreferences: Record<string, number>;
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    this.users = this.db.collection("Users");
  }

  /**
   * Add a new menu item for a restaurant.
   * Automatically creates the restaurant entry if it doesn't exist.
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: string;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    try {
      console.log(
        `[RestaurantMenu] Adding menu item: ${name} for restaurant: ${restaurant}`,
      );

      // Check for duplicate items
      const existingMenuItem = await this.menuItems.findOne({
        restaurant,
        name,
      });
      if (existingMenuItem) {
        return {
          error:
            `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
        };
      }

      // Use freshID() to create a new string-based ID as per instructions
      const newId = freshID();

      const newMenuItem: MenuItemDocument = {
        _id: newId,
        restaurant,
        name,
        description,
        price,
      };

      const result = await this.menuItems.insertOne(newMenuItem);

      if (!result.acknowledged) {
        console.error(
          "[RestaurantMenu] Insert failed: Mongo did not acknowledge insert.",
        );
        return { error: "Failed to add menu item. Please try again." };
      }

      console.log(
        `[RestaurantMenu] Successfully added menu item: ${name} (ID: ${newId})`,
      );
      return { menuItem: newMenuItem._id };
    } catch (err) {
      console.error("[RestaurantMenu.addMenuItem] Error:", err);
      return {
        error: (err as Error).message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Update Menu Item
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const update: {
      $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">>;
    } = { $set: {} };

    if (newDescription !== undefined) update.$set.description = newDescription;
    if (newPrice !== undefined) update.$set.price = newPrice;

    if (Object.keys(update.$set).length === 0) {
      const existing = await this.menuItems.findOne({ _id: menuItem });
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    // Query using the string ID directly
    const result = await this.menuItems.findOneAndUpdate(
      { _id: menuItem },
      update,
      { returnDocument: "after" },
    );

    if (!result?.value) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result.value._id };
  }

  /**
   * Remove Menu Item
   */
  async removeMenuItem(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<{ success: boolean } | { error: string }> {
    // Query using the string ID directly
    const result = await this.menuItems.deleteOne({ _id: menuItem });
    if (result.deletedCount === 0) {
      return { error: `No menu item found with ID '${menuItem}' to delete.` };
    }
    return { success: true };
  }

  /**
   * Get all menu items for a restaurant (by name)
   */
  async _getMenuItems(
    { restaurant }: { restaurant: string },
  ): Promise<
    Array<
      { menuItem: string; name: string; description: string; price: number }
    >
  > {
    const items = await this.menuItems
      .find({ restaurant })
      .project({ _id: 1, name: 1, description: 1, price: 1 })
      .toArray();

    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Get details for one menu item
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: string },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem as MenuItem });
    if (!item) return [];
    return [{
      name: item.name,
      description: item.description,
      price: item.price,
    }];
  }

  /**
   * Get a dish recommendation for a user at a specific restaurant
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // --- FIX START ---
      // Runtime validation for the 'restaurant' argument
      if (typeof restaurant !== "string") {
        console.error(
          `[RestaurantMenu._getRecommendation] Invalid 'restaurant' argument: Expected string, got ${typeof restaurant}. Value:`,
          restaurant,
        );
        return [{ error: "Invalid input: 'restaurant' must be a string." }];
      }
      // --- FIX END ---

      // Step 1: Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      console.log(menu);

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId}`,
      ); // Added logging
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { tastePreferences: 1 } },
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData,
      ); // Added logging

      if (!userData) {
        return [{ error: `User with ID '${user}' does not exist.` }];
      }

      const preferences = userData.tastePreferences;
      if (!preferences || Object.keys(preferences).length === 0) {
        return [{ error: `User '${user}' has no defined taste preferences.` }];
      }

      // Step 3: Construct prompt
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

      // Step 4: Call Gemini
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

      // Step 5: Verify dish is on menu
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
}

```

### To debug and resolve the issue, follow these steps:

1.  **Check your console output**: With the added `console.log` statements, when you call `_getRecommendation`, you should see:
    *   `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: <your-user-id>`: This will confirm what `ID` is being passed.
    *   `[RestaurantMenu._getRecommendation] User data fetched: <data-or-null>`: This will show if a user document was found (`{ _id: "...", tastePreferences: {...} }`) or `null`.

2.  **Verify MongoDB `Users` collection**:
    *   Connect to your MongoDB instance (e.g., using Mongo Compass, `mongosh`, or a similar tool).
    *   Navigate to the database your application is using.
    *   Find the `Users` collection.
    *   **Crucially, check if a document with the `_id` matching the `ID` you're trying to fetch (from the console log above) actually exists.**
    *   Ensure that existing user documents have a `tastePreferences` field. If it's missing or `null`, the `if (!preferences || Object.keys(preferences).length === 0)` check will catch it.

3.  **Populate `Users` collection (if empty/missing user)**: If your `Users` collection is empty or doesn't contain the specific user you're testing with, you'll need to add one. Here's an example of how you might add a user, assuming you have a `UserManagementConcept` or a direct way to insert:

    ```typescript
    import { getDb } from "@utils/database.ts";
    import { freshID } from "@utils/database.ts";
    import { ID } from "@utils/types.ts";

    async function setupTestUser() {
      const [db, _client] = await getDb();
      const usersCollection = db.collection<UserDocument>("Users");

      const testUserId: ID = freshID(); // Or use a static ID like "user:testAlice" as ID;
      const existingUser = await usersCollection.findOne({_id: testUserId});

      if (!existingUser) {
          await usersCollection.insertOne({
              _id: testUserId,
              tastePreferences: {
                  spicy: 5,
                  sweet: 3,
                  vegetarian: 4,
                  meat: 2,
                  "sea-food": 1,
                  "comfort-food": 5,
              },
          });
          console.log(`Test user '${testUserId}' created with taste preferences.`);
      } else {
          console.log(`Test user '${testUserId}' already exists.`);
      }
      return testUserId;
    }

    // Call this before testing _getRecommendation
    // const testUser = await setupTestUser();
    // await restaurantMenuConcept._getRecommendation({ restaurant: "Some Restaurant", user: testUser });
    ```
    Make sure the `user` ID you use in your test or API call to `_getRecommendation` matches an `_id` in your `Users` collection.

These steps should help you identify whether the problem is with the input `user` ID, the presence of that user in the database, or an unexpected data structure.

# the user does exist in UserTastePreferences.users. this is the console output: RestaurantMenu._getRecommendation Attempting to fetch user with ID: 019a0280-96e3-7ba2-826b-066b9d543b0e
RestaurantMenu._getRecommendation User data fetched: null
# response:

The console output `User data fetched: null` despite you confirming the user exists in `UserTastePreferences.users` strongly suggests that your `RestaurantMenuConcept` is looking in the wrong MongoDB collection for user data.

Here's the problem:

Your `RestaurantMenuConcept` initializes its user collection like this:
```typescript
export default class RestaurantMenuConcept {
  // ...
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    this.users = this.db.collection("Users"); // <-- Problematic line
  }
  // ...
}
```
It's explicitly looking for a collection named `"Users"`. However, you mentioned the user exists in `UserTastePreferences.users`. This implies that the user data, including taste preferences, is managed by a separate `UserTastePreferences` concept, which likely prefixes its collections.

To fix this, `RestaurantMenuConcept` needs to know the correct name of the collection where user taste preferences are stored. Since concept implementations are designed to be independent and not import other concepts directly, you typically have two ways to handle this:

1.  **Hardcode the expected collection name:** If you know the `UserTastePreferencesConcept` always uses a specific name like `"UserTastePreferences.users"`, you can just use that.
2.  **Inject the collection name:** Pass the correct collection name into the `RestaurantMenuConcept`'s constructor. This is more flexible if the `UserTastePreferencesConcept`'s naming convention could change or be configured.

Given the typical concept structure, the `UserTastePreferencesConcept` would likely define a `PREFIX` for its collections. Let's assume its user collection is named `UserTastePreferences.users`.

**Solution: Update the collection name in `RestaurantMenuConcept`**

You need to change the collection name `RestaurantMenuConcept` is using to match where your `UserTastePreferencesConcept` stores its users.

```typescript
// file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant]

  purpose allow users to view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices

  principle when a restaurant adds or removes items, customers can always see the accurate, current menu

  state
   - a set of MenuItems with
     - a restaurantName String
     - an itemName String
     - a description String
     - a price number
*/

const PREFIX = "RestaurantMenu" + ".";

export type MenuItem = ID;

interface MenuItemDocument {
  _id: MenuItem;
  restaurant: string;
  name: string;
  description: string;
  price: number;
}

interface UserDocument {
  _id: ID;
  tastePreferences: Record<string, number>;
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    // --- FIX START ---
    // Assuming the UserTastePreferencesConcept stores its users in a collection named "UserTastePreferences.users"
    // You must verify this exact collection name in your MongoDB instance.
    this.users = this.db.collection("UserTastePreferences.users"); 
    // If it's just "Users" without the prefix, then the initial code was correct and the user data isn't being inserted into that collection.
    // If it's a different prefix, adjust accordingly (e.g., "UserConcept.users" or "Authentication.users")
    // --- FIX END ---
  }

  /**
   * Add a new menu item for a restaurant.
   * Automatically creates the restaurant entry if it doesn't exist.
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: string;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    try {
      console.log(
        `[RestaurantMenu] Adding menu item: ${name} for restaurant: ${restaurant}`,
      );

      // Check for duplicate items
      const existingMenuItem = await this.menuItems.findOne({
        restaurant,
        name,
      });
      if (existingMenuItem) {
        return {
          error:
            `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
        };
      }

      // Use freshID() to create a new string-based ID as per instructions
      const newId = freshID();

      const newMenuItem: MenuItemDocument = {
        _id: newId,
        restaurant,
        name,
        description,
        price,
      };

      const result = await this.menuItems.insertOne(newMenuItem);

      if (!result.acknowledged) {
        console.error(
          "[RestaurantMenu] Insert failed: Mongo did not acknowledge insert.",
        );
        return { error: "Failed to add menu item. Please try again." };
      }

      console.log(
        `[RestaurantMenu] Successfully added menu item: ${name} (ID: ${newId})`,
      );
      return { menuItem: newMenuItem._id };
    } catch (err) {
      console.error("[RestaurantMenu.addMenuItem] Error:", err);
      return {
        error: (err as Error).message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Update Menu Item
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const update: {
      $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">>;
    } = { $set: {} };

    if (newDescription !== undefined) update.$set.description = newDescription;
    if (newPrice !== undefined) update.$set.price = newPrice;

    if (Object.keys(update.$set).length === 0) {
      const existing = await this.menuItems.findOne({ _id: menuItem });
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    // Query using the string ID directly
    const result = await this.menuItems.findOneAndUpdate(
      { _id: menuItem },
      update,
      { returnDocument: "after" },
    );

    if (!result?.value) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result.value._id };
  }

  /**
   * Remove Menu Item
   */
  async removeMenuItem(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<{ success: boolean } | { error: string }> {
    // Query using the string ID directly
    const result = await this.menuItems.deleteOne({ _id: menuItem });
    if (result.deletedCount === 0) {
      return { error: `No menu item found with ID '${menuItem}' to delete.` };
    }
    return { success: true };
  }

  /**
   * Get all menu items for a restaurant (by name)
   */
  async _getMenuItems(
    { restaurant }: { restaurant: string },
  ): Promise<
    Array<
      { menuItem: string; name: string; description: string; price: number }
    >
  > {
    const items = await this.menuItems
      .find({ restaurant })
      .project({ _id: 1, name: 1, description: 1, price: 1 })
      .toArray();

    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Get details for one menu item
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: string },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem as MenuItem });
    if (!item) return [];
    return [{
      name: item.name,
      description: item.description,
      price: item.price,
    }];
  }

  /**
   * Get a dish recommendation for a user at a specific restaurant
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // --- FIX START ---
      // Runtime validation for the 'restaurant' argument
      if (typeof restaurant !== "string") {
        console.error(
          `[RestaurantMenu._getRecommendation] Invalid 'restaurant' argument: Expected string, got ${typeof restaurant}. Value:`,
          restaurant,
        );
        return [{ error: "Invalid input: 'restaurant' must be a string." }];
      }
      // --- FIX END ---

      // Step 1: Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      console.log(menu);

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId}`,
      ); // Added logging
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { tastePreferences: 1 } },
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData,
      ); // Added logging

      if (!userData) {
        // This error message is now more specific given the context of the fix
        return [{ error: `User with ID '${user}' not found in the UserTastePreferences collection.` }];
      }

      const preferences = userData.tastePreferences;
      if (!preferences || Object.keys(preferences).length === 0) {
        return [{ error: `User '${user}' has no defined taste preferences.` }];
      }

      // Step 3: Construct prompt
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

      // Step 4: Call Gemini
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

      // Step 5: Verify dish is on menu
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
}
```

**Important:**

*   **Verify the exact collection name:** Double-check in your MongoDB instance (e.g., using Mongo Compass or `mongosh`) what the precise name of the collection containing your `UserTastePreferences` data is. If it's something other than `"UserTastePreferences.users"`, you must adjust `this.db.collection("UserTastePreferences.users")` to that exact name.
*   **Data Consistency:** Ensure that the `UserTastePreferencesConcept` (or whatever mechanism you use to create and manage users) inserts user documents into this *exact* collection with the `_id` and `tastePreferences` fields correctly structured.

# okay now i just want it to make any generic recommendation if the user has no saved likes/dislikes
# response:

You're right, the current logic explicitly errors out if a user has no taste preferences. To make it more robust, we can introduce a fallback: if a user has no preferences, we can simply recommend the first available item from the restaurant's menu. This provides a "generic" recommendation without needing an LLM call for that specific case.

Here's the updated `_getRecommendation` method with this change:

```typescript
// file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant]

  purpose allow users to view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices

  principle when a restaurant adds or removes items, customers can always see the accurate, current menu

  state
   - a set of MenuItems with
     - a restaurantName String
     - an itemName String
     - a description String
     - a price number
*/

const PREFIX = "RestaurantMenu" + ".";

export type MenuItem = ID;

interface MenuItemDocument {
  _id: MenuItem;
  restaurant: string;
  name: string;
  description: string;
  price: number;
}

interface UserDocument {
  _id: ID;
  tastePreferences: Record<string, number>;
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    // Assuming the UserTastePreferencesConcept stores its users in a collection named "UserTastePreferences.users"
    this.users = this.db.collection("UserTastePreferences.users");
  }

  /**
   * Add a new menu item for a restaurant.
   * Automatically creates the restaurant entry if it doesn't exist.
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: string;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    try {
      console.log(
        `[RestaurantMenu] Adding menu item: ${name} for restaurant: ${restaurant}`,
      );

      // Check for duplicate items
      const existingMenuItem = await this.menuItems.findOne({
        restaurant,
        name,
      });
      if (existingMenuItem) {
        return {
          error:
            `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
        };
      }

      // Use freshID() to create a new string-based ID as per instructions
      const newId = freshID();

      const newMenuItem: MenuItemDocument = {
        _id: newId,
        restaurant,
        name,
        description,
        price,
      };

      const result = await this.menuItems.insertOne(newMenuItem);

      if (!result.acknowledged) {
        console.error(
          "[RestaurantMenu] Insert failed: Mongo did not acknowledge insert.",
        );
        return { error: "Failed to add menu item. Please try again." };
      }

      console.log(
        `[RestaurantMenu] Successfully added menu item: ${name} (ID: ${newId})`,
      );
      return { menuItem: newMenuItem._id };
    } catch (err) {
      console.error("[RestaurantMenu.addMenuItem] Error:", err);
      return {
        error: (err as Error).message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Update Menu Item
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const update: {
      $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">>;
    } = { $set: {} };

    if (newDescription !== undefined) update.$set.description = newDescription;
    if (newPrice !== undefined) update.$set.price = newPrice;

    if (Object.keys(update.$set).length === 0) {
      const existing = await this.menuItems.findOne({ _id: menuItem });
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    // Query using the string ID directly
    const result = await this.menuItems.findOneAndUpdate(
      { _id: menuItem },
      update,
      { returnDocument: "after" },
    );

    if (!result?.value) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result.value._id };
  }

  /**
   * Remove Menu Item
   */
  async removeMenuItem(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<{ success: boolean } | { error: string }> {
    // Query using the string ID directly
    const result = await this.menuItems.deleteOne({ _id: menuItem });
    if (result.deletedCount === 0) {
      return { error: `No menu item found with ID '${menuItem}' to delete.` };
    }
    return { success: true };
  }

  /**
   * Get all menu items for a restaurant (by name)
   */
  async _getMenuItems(
    { restaurant }: { restaurant: string },
  ): Promise<
    Array<
      { menuItem: string; name: string; description: string; price: number }
    >
  > {
    const items = await this.menuItems
      .find({ restaurant })
      .project({ _id: 1, name: 1, description: 1, price: 1 })
      .toArray();

    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Get details for one menu item
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: string },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem as MenuItem });
    if (!item) return [];
    return [{
      name: item.name,
      description: item.description,
      price: item.price,
    }];
  }

  /**
   * Get a dish recommendation for a user at a specific restaurant
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // Runtime validation for the 'restaurant' argument
      if (typeof restaurant !== "string") {
        console.error(
          `[RestaurantMenu._getRecommendation] Invalid 'restaurant' argument: Expected string, got ${typeof restaurant}. Value:`,
          restaurant,
        );
        return [{ error: "Invalid input: 'restaurant' must be a string." }];
      }

      // Step 1: Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      console.log(
        `[RestaurantMenu._getRecommendation] Menu for '${restaurant}':`,
        menu.map(item => item.name),
      );

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user's taste preferences
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId}`,
      );
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { tastePreferences: 1 } },
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData,
      );

      if (!userData) {
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      const preferences = userData.tastePreferences;

      // --- FIX START ---
      // If user has no preferences, return a generic recommendation (first item on menu)
      if (!preferences || Object.keys(preferences).length === 0) {
        console.log(`[RestaurantMenu._getRecommendation] User '${user}' has no defined taste preferences. Returning first menu item as generic recommendation.`);
        return [{ recommendation: menu[0].name }];
      }
      // --- FIX END ---

      // Step 3: Construct prompt with user preferences
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

      // Step 4: Call Gemini
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return [{ error: "Missing GEMINI_API_KEY environment variable." }];
      }

      const llm = new GeminiLLM({ apiKey });
      console.log(`[RestaurantMenu._getRecommendation] Calling LLM with prompt for user '${user}'...`);
      const llmResponse = await llm.executeLLM(prompt);
      console.log(`[RestaurantMenu._getRecommendation] LLM raw response: ${llmResponse.substring(0, 100)}...`);


      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [{ error: "Failed to parse LLM response as JSON." }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return [{ error: "LLM did not return a valid recommendation." }];
      }

      // Step 5: Verify dish is on menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        return [{
          error: `The recommended dish '${recommendation}' is not on the menu.`,
        }];
      }

      console.log(`[RestaurantMenu._getRecommendation] Recommended dish for user '${user}': ${match.name}`);
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
    }
  }
}
```

**Key Change:**

The block that previously returned an error for users without preferences now checks:

```typescript
      if (!preferences || Object.keys(preferences).length === 0) {
        console.log(`[RestaurantMenu._getRecommendation] User '${user}' has no defined taste preferences. Returning first menu item as generic recommendation.`);
        return [{ recommendation: menu[0].name }];
      }
```

This ensures that:
1. If the user has preferences, the LLM is used as before.
2. If the user does *not* have preferences (or their `tastePreferences` object is empty), the first item from the `menu` array is returned as a generic recommendation. This assumes `menu` is not empty, which is already checked earlier in the method.

This makes the recommendation system more user-friendly by always providing a suggestion if a menu exists.