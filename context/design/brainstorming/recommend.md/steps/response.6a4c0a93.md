---
timestamp: 'Tue Oct 21 2025 20:10:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_201050.4db76d47.md]]'
content_id: 6a4c0a9382249abdfd903833365b498d7574c544e0b874a1ffa055ae576ce293
---

# response:

You've identified the core problem! The `UserDocument` interface and the logic in `_getRecommendation` are expecting a `tastePreferences` field, but your database document explicitly shows `likedDishes` and `dislikedDishes`.

This means the current `RestaurantMenuConcept` needs to be updated to:

1. **Reflect the actual `UserDocument` structure**: Change the `UserDocument` interface to include `likedDishes` and `dislikedDishes`.
2. **Derive `tastePreferences`**: Within the `_getRecommendation` method, dynamically construct the `preferences` object from the `likedDishes` and `dislikedDishes` retrieved from the user document.

Here's the updated code with these changes. I've also added some default scoring for liked/disliked items to feed into the LLM prompt.

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

// 🐛 FIX: Updated UserDocument interface to reflect the actual database schema
interface UserDocument {
  _id: ID;
  likedDishes?: string[]; // Assuming these are arrays of dish names (strings)
  dislikedDishes?: string[]; // Assuming these are arrays of dish names (strings)
  // The 'tastePreferences' field is NOT present in the DB, so we remove it here.
  // It will be constructed on the fly for the LLM.
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
        menu.map((item) => item.name),
      );

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user's taste preferences (now from liked/disliked dishes)
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId} from collection '${this.users.collectionName}'`,
      );
      // 🐛 FIX: Projecting likedDishes and dislikedDishes
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { likedDishes: 1, dislikedDishes: 1 } },
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData, // This will show null if not found
      );

      if (!userData) {
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      // 🐛 FIX: Constructing preferences from likedDishes and dislikedDishes
      const preferences: Record<string, number> = {};
      if (userData.likedDishes) {
        userData.likedDishes.forEach((dish) => {
          preferences[`Likes: ${dish}`] = 5; // Assign a high score for liked dishes
        });
      }
      if (userData.dislikedDishes) {
        userData.dislikedDishes.forEach((dish) => {
          preferences[`Dislikes: ${dish}`] = 1; // Assign a low score for disliked dishes
        });
      }

      // --- Original FIX START (now adapted for the new preferences structure) ---
      if (Object.keys(preferences).length === 0) {
        console.log(
          `[RestaurantMenu._getRecommendation] User '${user}' has no defined liked/disliked dishes. Returning first menu item as generic recommendation.`,
        );
        return [{ recommendation: menu[0].name }];
      }
      // --- Original FIX END ---

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
      console.log(
        `[RestaurantMenu._getRecommendation] Calling LLM with prompt for user '${user}'...`,
      );
      const llmResponse = await llm.executeLLM(prompt);
      console.log(
        `[RestaurantMenu._getRecommendation] LLM raw response: ${
          llmResponse.substring(0, 100)
        }...`,
      );

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

      console.log(
        `[RestaurantMenu._getRecommendation] Recommended dish for user '${user}': ${match.name}`,
      );
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
    }
  }
}
```

### Key Changes:

1. **`UserDocument` Interface Update**:
   ```typescript
   interface UserDocument {
     _id: ID;
     likedDishes?: string[];
     dislikedDishes?: string[];
   }
   ```
   This now correctly models your database schema.

2. **`findOne` Projection Update**:
   ```typescript
   const userData = await this.users.findOne(
     { _id: userId },
     { projection: { likedDishes: 1, dislikedDishes: 1 } }, // 🐛 FIX: Projecting the correct fields
   );
   ```
   We now explicitly project `likedDishes` and `dislikedDishes` when fetching the user data.

3. **Constructing `preferences`**:
   ```typescript
   const preferences: Record<string, number> = {};
   if (userData.likedDishes) {
     userData.likedDishes.forEach((dish) => {
       preferences[`Likes: ${dish}`] = 5; // Assign a high score for liked dishes
     });
   }
   if (userData.dislikedDishes) {
     userData.dislikedDishes.forEach((dish) => {
       preferences[`Dislikes: ${dish}`] = 1; // Assign a low score for disliked dishes
     });
   }
   ```
   This block iterates over the `likedDishes` and `dislikedDishes` arrays from `userData` and creates a `preferences` object in the format the LLM expects (e.g., `{"Likes: Spicy Noodles": 5, "Dislikes: Broccoli": 1}`). I've prefixed them with "Likes: " and "Dislikes: " to give the LLM clear context on the sentiment.

Now, when `_getRecommendation` runs, it will correctly fetch the `likedDishes` and `dislikedDishes` from the user's database entry and use them to inform the LLM prompt, rather than looking for a non-existent `tastePreferences` field.
